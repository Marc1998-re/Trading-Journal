// Read-only access for AI assistants and scripts via personal API keys.
// Keys are shown once, stored only as SHA-256 hashes and can be revoked at any time.
import express from 'express';
import { z } from 'zod';
import { ApiError, parse } from './errors.mjs';
import { newId, publicRecord } from './database.mjs';
import { hashToken, limit, secretToken } from './security.mjs';
import { findRecord, insertRecord, listRecords, updateRecord } from './records.mjs';
import { collectionSchemas, id, validateRecord } from './validation.mjs';
import { transaction } from './database.mjs';
import { buildProcessedTrades, calculateAdvancedStats, getTradeNetProfit, getTradeRiskBasis, getTradeFees } from '../../web/src/lib/tradeCalculations.js';
import { findEdges } from '../../web/src/lib/edgeFinder.js';
import { buildProBreakdowns, calculateDisciplineStats, calculateExecutionStats, holdingMinutes, sessionOf, summarizeMissedTrades } from '../../web/src/lib/proJournal.js';
import { evaluateAccountRules } from '../../web/src/lib/accountRules.js';

export const MAX_KEYS_PER_USER = 10;
const KEY_PATTERN = /^tdj_[a-f0-9]{64}$/;
const SCREENSHOT_FIELDS = [['entryUrl', 'Einstieg'], ['validationUrl', 'Validierung'], ['contextUrl', 'Chart / Kontext']];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const utc = value => value ? String(value).replace(' ', 'T') + 'Z' : null;
const keyRecord = row => ({ id: row.id, name: row.name, prefix: row.prefix, scope: row.scope, lastUsedAt: utc(row.lastUsedAt), expiresAt: utc(row.expiresAt), created: utc(row.created) });

// ---------------------------------------------------------------- key management (session cookie)

export async function listApiKeys(pool, userId) {
  const [rows] = await pool.execute('SELECT id, name, prefix, scope, lastUsedAt, expiresAt, created FROM apiKeys WHERE userId = ? ORDER BY created DESC', [userId]);
  return { items: rows.map(keyRecord) };
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Bitte gib dem Schlüssel einen Namen.').max(80),
  expiresInDays: z.union([z.literal(30), z.literal(90), z.literal(365), z.null()]).default(90),
  scope: z.enum(['read', 'write']).default('read'),
}).strict();

export async function createApiKey(pool, userId, input) {
  const data = parse(createSchema, input);
  const [[count]] = await pool.execute('SELECT COUNT(*) AS total FROM apiKeys WHERE userId = ? AND (expiresAt IS NULL OR expiresAt > UTC_TIMESTAMP(3))', [userId]);
  if (Number(count.total) >= MAX_KEYS_PER_USER) throw new ApiError(409, `Du kannst höchstens ${MAX_KEYS_PER_USER} aktive Schlüssel haben. Widerrufe zuerst einen alten.`);
  const key = 'tdj_' + secretToken();
  const keyId = newId();
  if (data.expiresInDays === null) await pool.execute('INSERT INTO apiKeys (id, userId, name, prefix, tokenHash, scope) VALUES (?, ?, ?, ?, ?, ?)', [keyId, userId, data.name, key.slice(0, 12), hashToken(key), data.scope]);
  else await pool.execute('INSERT INTO apiKeys (id, userId, name, prefix, tokenHash, scope, expiresAt) VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? DAY))', [keyId, userId, data.name, key.slice(0, 12), hashToken(key), data.scope, data.expiresInDays]);
  const [[row]] = await pool.execute('SELECT id, name, prefix, scope, lastUsedAt, expiresAt, created FROM apiKeys WHERE id = ?', [keyId]);
  return { key, record: keyRecord(row) };
}

export async function revokeApiKey(pool, userId, keyId) {
  parse(id, keyId);
  const [result] = await pool.execute('DELETE FROM apiKeys WHERE id = ? AND userId = ?', [keyId, userId]);
  if (!result.affectedRows) throw new ApiError(404, 'Nicht gefunden.');
}

// ---------------------------------------------------------------- data shaping

/** Direct image address for a screenshot link, if one can be derived without fetching. */
export function screenshotImageUrl(url) {
  if (!url) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const tradingView = /^(?:[a-z]+\.)?tradingview\.com$/i.test(parsed.hostname) && /^\/x\/([A-Za-z0-9]{4,32})\/?$/.exec(parsed.pathname);
  if (tradingView) return `https://s3.tradingview.com/snapshots/${tradingView[1][0].toLowerCase()}/${tradingView[1]}.png`;
  if (/\.(png|jpe?g|gif|webp)$/i.test(parsed.pathname)) return parsed.href;
  return null;
}

export function screenshotsOf(trade, path = 'trades') {
  return SCREENSHOT_FIELDS.filter(([field]) => trade[field]).map(([field, label], index) => {
    const imageUrl = screenshotImageUrl(trade[field]);
    return { index, field, label, url: trade[field], imageUrl, proxyPath: trade.id && imageUrl && isProxyable(imageUrl) ? `/api/v1/${path}/${trade.id}/screenshots/${index}` : null };
  });
}

const isProxyable = url => { try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 's3.tradingview.com'; } catch { return false; } };

function cleanRecord(row) {
  const record = publicRecord(row);
  delete record.userId; delete record.date; delete record.time;
  return record;
}

export function aiTrade(row, balances = {}) {
  const trade = cleanRecord(row);
  const netProfit = getTradeNetProfit(trade, balances, balances);
  const risk = getTradeRiskBasis(trade, balances, balances);
  const netR = risk.amount > 0 ? netProfit / risk.amount : null;
  return {
    ...trade,
    computed: {
      netProfit, fees: getTradeFees(trade, balances, balances),
      riskAmount: risk.amount, riskSource: risk.source,
      netR: Number.isFinite(netR) ? netR : null,
      result: netProfit > 0 ? 'win' : netProfit < 0 ? 'loss' : 'breakeven',
      session: sessionOf(trade.entryTime)?.key || null,
      holdingMinutes: holdingMinutes(trade),
    },
    screenshots: screenshotsOf(trade),
  };
}

const finite = value => typeof value === 'number' && !Number.isFinite(value) ? null : value;
const jsonSafe = value => JSON.parse(JSON.stringify(value, (_key, v) => finite(v)));

async function balancesOf(pool, userId) {
  const [rows] = await pool.execute('SELECT id, accountName, startingBalance FROM tradingAccounts WHERE userId = ?', [userId]);
  return { accounts: rows, balances: Object.fromEntries(rows.map(row => [row.id, Number(row.startingBalance)])) };
}

async function selectAll(pool, table, userId, { accountId, from, to }, cap = 20000) {
  const filters = ['userId = ?'], params = [userId];
  if (accountId) { filters.push('accountId = ?'); params.push(accountId); }
  if (from) { filters.push('entryDate >= ?'); params.push(from); }
  if (to) { filters.push('entryDate <= ?'); params.push(to); }
  const [rows] = await pool.execute(`SELECT * FROM \`${table}\` WHERE ${filters.join(' AND ')} ORDER BY entryDate ASC, entryTime ASC, id ASC LIMIT ${cap + 1}`, params);
  if (rows.length > cap) throw new ApiError(413, `Zu viele Einträge für eine Zusammenfassung. Bitte grenze den Zeitraum ein (max. ${cap}).`);
  return rows.map(cleanRecord);
}

// ---------------------------------------------------------------- writing (keys with scope "write")

export const MAX_BATCH = 200;
const writeQuerySchema = z.object({
  dryRun: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),
  allowDuplicates: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),
}).strict();
const fieldHelp = {
  accountId: 'ID des Handelskontos (GET /accounts).', symbol: 'Instrument, z. B. NQ, EURUSD.', entryDate: 'Einstiegsdatum YYYY-MM-DD (lokale Zeit des Traders).', entryTime: 'Einstiegszeit HH:MM (lokal).',
  exitDate: 'Ausstiegsdatum YYYY-MM-DD.', exitTime: 'Ausstiegszeit HH:MM.', side: 'long oder short.', setup: 'Name des Setups.',
  riskAmount: 'Geplantes Risiko in EUR (Abstand Einstieg–Stop × Größe). Basis für R.', profitLoss: 'Bruttoergebnis in EUR (vor Gebühren), Verlust negativ.', fees: 'Gebühren/Kommission in EUR.',
  plannedRR: 'Geplantes Ziel in R.', mae: 'Maximaler Gegenlauf in R (positiv).', mfe: 'Maximaler Lauf in Gewinnrichtung in R.', grade: 'Setup-Qualität A/B/C.', emotion: 'calm, confident, fomo, fearful, greedy, frustrated, bored.', confidence: 'Überzeugung 1–5.',
  notes: 'Freitext-Notizen.', entryUrl: 'Screenshot-Link Einstieg (z. B. TradingView).', validationUrl: 'Screenshot-Link Bestätigung.', contextUrl: 'Chart-/Kontext-Link.',
  decision: 'valid = bewusst ausgelassen, missed = verpasst.', reason: 'Grund: rules, risk_limit, news, hesitation, fear, absent, execution, conditions, other.', potentialR: 'Hypothetisches Ergebnis in R.',
  reviewStatus: 'draft oder completed (completed braucht reviewLesson und reviewAction).',
};
const hiddenFields = ['userId', 'date', 'time', 'instrument', 'reviewCompletedAt', 'stopLoss', 'stopLossPips', 'rrSecured', 'riskRewardRatio', 'commissionPercentage', 'status'];

export function writeSchemas() {
  const build = name => {
    const schema = z.toJSONSchema(collectionSchemas[name], { io: 'input', unrepresentable: 'any' });
    for (const key of hiddenFields) delete schema.properties[key];
    for (const [key, text] of Object.entries(fieldHelp)) if (schema.properties[key]) schema.properties[key].description = text;
    delete schema.$schema;
    return schema;
  };
  return { trades: build('trades'), missedTrades: build('missedTrades') };
}

async function shape(pool, table, userId, items) {
  if (table !== 'trades') return items.map(item => { const record = { ...item, screenshots: screenshotsOf(item, 'missed-trades') }; delete record.userId; delete record.date; delete record.time; return record; });
  const { balances } = await balancesOf(pool, userId);
  return items.map(item => aiTrade(item, balances));
}

const entryLabel = (index, total) => total > 1 ? `Eintrag ${index + 1}: ` : '';

export async function createEntries(pool, table, userId, body, { dryRun = false, allowDuplicates = false } = {}) {
  const list = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : body && typeof body === 'object' ? [body] : [];
  if (!list.length) throw new ApiError(400, 'Bitte sende einen Eintrag oder { "items": [...] }.');
  if (list.length > MAX_BATCH) throw new ApiError(400, `Höchstens ${MAX_BATCH} Einträge pro Anfrage.`);
  const seen = new Set();
  const created = await transaction(pool, async db => {
    const results = [];
    for (const [index, input] of list.entries()) {
      try {
        const value = validateRecord(table, input, userId);
        await findRecord(db, 'tradingAccounts', value.accountId, userId, true);
        const fingerprint = [value.accountId, value.symbol, value.entryDate, value.entryTime, value.side].join('|');
        if (!allowDuplicates) {
          const [[existing]] = await db.execute(`SELECT id FROM \`${table}\` WHERE userId = ? AND accountId = ? AND symbol = ? AND entryDate = ? AND entryTime = ? AND side = ? LIMIT 1`, [userId, value.accountId, value.symbol, value.entryDate, value.entryTime, value.side]);
          if (existing || seen.has(fingerprint)) throw new ApiError(409, 'Ein Eintrag mit gleichem Konto, Symbol, Richtung und Einstiegszeit existiert bereits. Mit ?allowDuplicates=true trotzdem anlegen.', { existingId: existing?.id || null });
        }
        seen.add(fingerprint);
        results.push(dryRun ? { id: null, ...value } : await insertRecord(db, table, userId, input));
      } catch (error) {
        if (error instanceof ApiError) throw new ApiError(error.status, entryLabel(index, list.length) + error.message, { index, ...error.data });
        throw error;
      }
    }
    return results;
  });
  return { dryRun, created: dryRun ? 0 : created.length, items: await shape(pool, table, userId, created) };
}

// ---------------------------------------------------------------- OpenAPI description

export function openApiSpec(origin) {
  const page = [{ name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } }, { name: 'perPage', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 100 } }];
  const filters = [{ name: 'accountId', in: 'query', schema: { type: 'string' }, description: 'Nur dieses Handelskonto.' }, { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Einstiegsdatum ab (inklusive).' }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Einstiegsdatum bis (inklusive).' }];
  const json = description => ({ description, content: { 'application/json': { schema: { type: 'object' } } } });
  const get = (operationId, summary, description, parameters = []) => ({ get: { operationId, summary, description, parameters, responses: { 200: json('OK'), 401: json('Schlüssel fehlt, ist ungültig, abgelaufen oder widerrufen.'), 429: json('Zu viele Anfragen.') } } });
  const spec = {
    openapi: '3.1.0',
    info: { title: 'The Trading Desk – KI-Zugriff', version: '1.0.0', description: 'Zugriff auf ein Trading-Journal. Lesen mit jedem Schlüssel; Trades und nicht genommene Trades anlegen oder korrigieren nur mit einem Schlüssel mit Schreibrecht (kein Löschen). Vor dem Anlegen immer den Nutzer bestätigen lassen und erst mit ?dryRun=true prüfen. Beträge in Kontowährung (EUR). Datum/Uhrzeit sind lokale Zeit des Traders (Europe/Berlin). R = Ergebnis geteilt durch das geplante Risiko. Screenshots sind Links; `imageUrl` ist die direkte Bilddatei, `proxyPath` liefert das Bild mit demselben Schlüssel.' },
    servers: [{ url: origin + '/api/v1' }],
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', description: 'Persönlicher API-Schlüssel (beginnt mit tdj_).' } } },
    security: [{ bearer: [] }],
    paths: {
      '/me': get('getProfile', 'Profil und Überblick', 'Name des Traders, Schlüsselname und Anzahl der Einträge.'),
      '/accounts': get('listAccounts', 'Handelskonten', 'Alle Konten mit Startkapital, Kontotyp (private/prop) und hinterlegten Limits.'),
      '/summary': get('getSummary', 'Kennzahlen', 'Berechnete Kennzahlen wie im Journal: Win-Rate, Profit-Faktor, Erwartungswert in R, SQN, Drawdown, Aufschlüsselungen nach Setup, Session, Grade, Emotion; Ausführung, Disziplin, nicht genommene Trades und Kontoregeln.', filters),
      '/trades': get('listTrades', 'Trades', 'Trades sortiert nach Einstieg, inklusive berechneter Werte (netProfit, netR, Session, Haltedauer) und Screenshot-Links.', [...filters, ...page, { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }]),
      '/trades/{id}': get('getTrade', 'Einzelner Trade', 'Ein Trade mit Notizen, Review und Screenshots.', [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]),
      '/trades/{id}/screenshots/{index}': { get: { operationId: 'getTradeScreenshot', summary: 'Screenshot-Bild', description: 'Liefert ein TradingView-Snapshot-Bild direkt (PNG).', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'index', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Bild', content: { 'image/*': {} } }, 404: json('Kein abrufbares Bild.') } } },
      '/schema': get('getWriteSchema', 'Felder zum Erfassen', 'JSON-Schemas mit allen Feldern und Erklärungen für POST/PATCH von Trades und nicht genommenen Trades.'),
      '/missed-trades': get('listMissedTrades', 'Nicht genommene Trades', 'Gesehene, aber nicht gehandelte Setups mit Grund (reason), Bewertung (decision: valid = bewusst ausgelassen, missed = verpasst) und potenziellem R.', [...filters, ...page, { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }]),
    },
  };
  const write = (operationId, summary, description, schemaName, parameters = []) => ({ operationId, summary, description, parameters, requestBody: { required: true, content: { 'application/json': { schema: { oneOf: [{ $ref: '#/components/schemas/' + schemaName }, { type: 'object', properties: { items: { type: 'array', maxItems: MAX_BATCH, items: { $ref: '#/components/schemas/' + schemaName } } }, required: ['items'] }] } } } }, responses: { 200: json('Gespeichert'), 201: json('Angelegt'), 400: json('Ungültige Felder (data nennt das Feld).'), 403: json('Schlüssel ohne Schreibrecht.'), 409: json('Doppelter Eintrag.') } });
  const writeParams = [{ name: 'dryRun', in: 'query', schema: { type: 'boolean', default: false }, description: 'Nur prüfen, nichts speichern.' }, { name: 'allowDuplicates', in: 'query', schema: { type: 'boolean', default: false } }];
  const schemas = writeSchemas();
  spec.components.schemas = { TradeInput: schemas.trades, MissedTradeInput: schemas.missedTrades };
  spec.paths['/trades'].post = write('createTrades', 'Trades anlegen', 'Einen Trade oder bis zu 200 auf einmal (alles oder nichts). Braucht Schreibrecht.', 'TradeInput', writeParams);
  spec.paths['/trades/{id}'].patch = write('updateTrade', 'Trade korrigieren', 'Nur die gesendeten Felder werden geändert.', 'TradeInput', [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]);
  spec.paths['/missed-trades'].post = write('createMissedTrades', 'Nicht genommene Trades anlegen', 'Einen oder bis zu 200 Einträge. Braucht Schreibrecht.', 'MissedTradeInput', writeParams);
  spec.paths['/missed-trades/{id}/screenshots/{index}'] = { get: { ...spec.paths['/trades/{id}/screenshots/{index}'].get, operationId: 'getMissedTradeScreenshot', summary: 'Screenshot-Bild eines nicht genommenen Trades' } };
  spec.paths['/missed-trades/{id}'] = { patch: write('updateMissedTrade', 'Nicht genommenen Trade korrigieren', 'Nur die gesendeten Felder werden geändert.', 'MissedTradeInput', [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]) };
  return spec;
}

// ---------------------------------------------------------------- bearer-authenticated router

const pageSchema = z.object({
  accountId: id.optional(), from: z.iso.date().optional(), to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1), perPage: z.coerce.number().int().min(1).max(200).default(100),
  order: z.enum(['asc', 'desc']).default('desc'),
}).strict();
const summarySchema = z.object({ accountId: id.optional(), from: z.iso.date().optional(), to: z.iso.date().optional() }).strict();

function bearerKey(req) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  const value = match ? match[1] : req.get('x-api-key') || '';
  return KEY_PATTERN.test(value) ? value : null;
}

export function aiRouter(pool, config, fetcher = (...args) => fetch(...args)) {
  const router = express.Router();
  router.use((req, res, next) => {
    // Bearer keys are not ambient credentials, so any origin may call the read-only API.
    res.set({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS', 'Access-Control-Max-Age': '600', 'Cross-Origin-Resource-Policy': 'cross-origin' });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    if (!['GET', 'HEAD', 'POST', 'PATCH'].includes(req.method)) throw new ApiError(405, 'Über den KI-Zugriff kann nichts gelöscht werden.');
    next();
  });
  router.use(express.json({ limit: '512kb', strict: true }));
  router.get('/openapi.json', (_req, res) => res.json(openApiSpec(config.origin)));
  router.use(async (req, _res, next) => {
    const key = bearerKey(req);
    const [[row]] = key ? await pool.execute('SELECT apiKeys.id AS keyId, apiKeys.name AS keyName, apiKeys.scope, users.id, users.name, users.verified FROM apiKeys JOIN users ON users.id = apiKeys.userId WHERE apiKeys.tokenHash = ? AND (apiKeys.expiresAt IS NULL OR apiKeys.expiresAt > UTC_TIMESTAMP(3))', [hashToken(key)]) : [[]];
    if (!row) {
      await limit(pool, 'ai-fail:' + req.ip, 30, 600);
      throw new ApiError(401, 'Gültiger API-Schlüssel erforderlich: Header „Authorization: Bearer tdj_…“.');
    }
    if (!row.verified) throw new ApiError(403, 'Die E-Mail-Adresse dieses Kontos ist noch nicht bestätigt.');
    await limit(pool, 'ai:' + row.keyId, 120, 60);
    await pool.execute('UPDATE apiKeys SET lastUsedAt = UTC_TIMESTAMP(3) WHERE id = ? AND (lastUsedAt IS NULL OR lastUsedAt < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 60 SECOND))', [row.keyId]);
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (row.scope !== 'write') throw new ApiError(403, 'Dieser Schlüssel darf nur lesen. Erstelle in den Einstellungen einen Schlüssel mit Schreibrecht.');
      await limit(pool, 'ai-write:' + row.keyId, 60, 60);
    }
    req.apiUser = { id: row.id, name: row.name, keyId: row.keyId, keyName: row.keyName, canWrite: row.scope === 'write' };
    next();
  });
  router.get('/', (_req, res) => res.json({ name: 'The Trading Desk – KI-Zugriff', readOnly: true, openapi: config.origin + '/api/v1/openapi.json', endpoints: Object.keys(openApiSpec(config.origin).paths).map(path => '/api/v1' + path) }));
  router.get('/me', async (req, res) => {
    const [[counts]] = await pool.execute('SELECT (SELECT COUNT(*) FROM tradingAccounts WHERE userId = ?) AS accounts, (SELECT COUNT(*) FROM trades WHERE userId = ?) AS trades, (SELECT COUNT(*) FROM missedTrades WHERE userId = ?) AS missedTrades, (SELECT MIN(entryDate) FROM trades WHERE userId = ?) AS firstTrade, (SELECT MAX(entryDate) FROM trades WHERE userId = ?) AS lastTrade', Array(5).fill(req.apiUser.id));
    res.json({ name: req.apiUser.name, key: req.apiUser.keyName, access: req.apiUser.canWrite ? 'read_write' : 'read', currency: 'EUR', timezone: 'Europe/Berlin', accounts: Number(counts.accounts), trades: Number(counts.trades), missedTrades: Number(counts.missedTrades), firstTrade: counts.firstTrade, lastTrade: counts.lastTrade });
  });
  router.get('/accounts', async (req, res) => {
    const [rows] = await pool.execute('SELECT * FROM tradingAccounts WHERE userId = ? ORDER BY created ASC', [req.apiUser.id]);
    res.json({ items: rows.map(cleanRecord) });
  });
  for (const [path, table] of [['/trades', 'trades'], ['/missed-trades', 'missedTrades']]) {
    router.get(path, async (req, res) => {
      const q = parse(pageSchema, req.query);
      const sort = q.order === 'asc' ? 'entryDate,entryTime' : '-entryDate,-entryTime';
      const result = await listRecords(pool, table, req.apiUser.id, { page: q.page, perPage: q.perPage, sort, ...(q.accountId ? { accountId: q.accountId } : {}), ...(q.from ? { from: q.from } : {}), ...(q.to ? { to: q.to } : {}) });
      result.items = await shape(pool, table, req.apiUser.id, result.items);
      res.json(jsonSafe(result));
    });
  }
  router.get('/trades/:id', async (req, res) => {
    const trade = await findRecord(pool, 'trades', req.params.id, req.apiUser.id);
    const { balances } = await balancesOf(pool, req.apiUser.id);
    res.json(jsonSafe(aiTrade(trade, balances)));
  });
  for (const [path, table] of [['/trades', 'trades'], ['/missed-trades', 'missedTrades']]) router.get(path + '/:id/screenshots/:index', async (req, res) => {
    const record = await findRecord(pool, table, req.params.id, req.apiUser.id);
    const shot = screenshotsOf(record, path.slice(1)).find(item => String(item.index) === req.params.index);
    if (!shot?.proxyPath) throw new ApiError(404, 'Für diesen Link kann kein Bild geladen werden. Nutze die URL direkt.');
    let response;
    try { response = await fetcher(shot.imageUrl, { redirect: 'error', signal: AbortSignal.timeout(10000) }); }
    catch { throw new ApiError(502, 'Das Bild konnte nicht geladen werden.'); }
    const type = response.headers.get('content-type') || '';
    if (!response.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type.split(';')[0].trim())) throw new ApiError(502, 'Das Bild ist nicht mehr verfügbar.');
    const length = Number(response.headers.get('content-length'));
    if (length > MAX_IMAGE_BYTES) throw new ApiError(502, 'Das Bild ist zu groß.');
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > MAX_IMAGE_BYTES) throw new ApiError(502, 'Das Bild ist zu groß.');
    res.set({ 'Content-Type': type.split(';')[0].trim(), 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' }).send(body);
  });
  for (const [path, table] of [['/trades', 'trades'], ['/missed-trades', 'missedTrades']]) {
    router.post(path, async (req, res) => res.status(201).json(jsonSafe(await createEntries(pool, table, req.apiUser.id, req.body, parse(writeQuerySchema, req.query)))));
    router.patch(path + '/:id', async (req, res) => {
      const updated = await updateRecord(pool, table, req.apiUser.id, req.params.id, req.body);
      res.json(jsonSafe(await shape(pool, table, req.apiUser.id, [updated]))[0]);
    });
  }
  router.get('/schema', (_req, res) => res.json(writeSchemas()));
  router.get('/summary', async (req, res) => {
    const q = parse(summarySchema, req.query);
    const { accounts, balances } = await balancesOf(pool, req.apiUser.id);
    if (q.accountId && !balances[q.accountId] && balances[q.accountId] !== 0) throw new ApiError(404, 'Konto nicht gefunden.');
    const trades = await selectAll(pool, 'trades', req.apiUser.id, q);
    const missed = await selectAll(pool, 'missedTrades', req.apiUser.id, q);
    const scoped = q.accountId ? accounts.filter(a => a.id === q.accountId) : accounts;
    const startingBalance = scoped.reduce((sum, a) => sum + Number(a.startingBalance), 0) || 10000;
    const stats = calculateAdvancedStats(trades, startingBalance, balances, balances);
    const breakdowns = buildProBreakdowns(trades, balances);
    const execution = calculateExecutionStats(trades, balances);
    delete execution.scatter;
    let rules = null;
    if (q.accountId && !q.from && !q.to) {
      const [[account]] = await pool.execute('SELECT * FROM tradingAccounts WHERE id = ? AND userId = ?', [q.accountId, req.apiUser.id]);
      rules = evaluateAccountRules(account, trades);
    }
    const processed = buildProcessedTrades(trades, balances, balances);
    res.json(jsonSafe({
      scope: { accountId: q.accountId || null, from: q.from || null, to: q.to || null, accounts: scoped.map(a => a.accountName), startingBalance, currency: 'EUR' },
      counts: { trades: trades.length, missedTrades: missed.length, withRisk: processed.filter(item => item.stopLossAmount > 0).length, withScreenshots: trades.filter(t => t.entryUrl || t.validationUrl || t.contextUrl).length },
      stats, breakdowns, execution, discipline: calculateDisciplineStats(trades), missedTrades: summarizeMissedTrades(missed), accountRules: rules,
      edges: (({ leaks, strengths }) => ({ leaks: leaks.slice(0, 8), strengths: strengths.slice(0, 8), note: 'Muster mit mindestens 5 Trades. Überschneiden sich, nicht addierbar.' }))(findEdges(trades, balances)),
      notes: 'R = Nettoergebnis / geplantes Risiko. Prop-Limits basieren nur auf realisierten Trades. Datum/Uhrzeit: lokale Zeit des Traders.',
    }));
  });
  router.use(() => { throw new ApiError(404, 'Nicht gefunden. Übersicht: /api/v1/openapi.json'); });
  return router;
}
