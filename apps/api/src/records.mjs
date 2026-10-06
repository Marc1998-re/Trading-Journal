import { ApiError, parse } from './errors.mjs';
import { newId, publicRecord, transaction } from './database.mjs';
import { collectionSchemas, id, listSchema, validateRecord } from './validation.mjs';

const columns = Object.fromEntries(Object.entries(collectionSchemas).map(([name, schema]) => [name, new Set(['id', 'created', 'updated', ...Object.keys(schema.shape).filter(key => !['date', 'time', 'instrument'].includes(key))])]));

function table(name) {
  if (!columns[name]) throw new ApiError(404, 'Nicht gefunden.');
  return '`' + name + '`';
}

function dbValue(key, value) {
  if (key === 'reviewTags') return JSON.stringify(value);
  if (key === 'reviewCompletedAt') return value ? value.replace('T', ' ').replace(/Z$/, '') : null;
  return value;
}

export async function findRecord(db, name, recordId, userId, lock = false) {
  parse(id, recordId);
  const [[row]] = await db.execute(`SELECT * FROM ${table(name)} WHERE id = ? AND userId = ?${lock ? ' FOR UPDATE' : ''}`, [recordId, userId]);
  if (!row) throw new ApiError(404, 'Nicht gefunden.');
  return publicRecord(row);
}

export async function listRecords(db, name, userId, query) {
  const options = parse(listSchema, query);
  if (options.userId && options.userId !== userId) throw new ApiError(403, 'Fremde Daten duerfen nicht gelesen werden.');
  const filters = ['userId = ?'], params = [userId];
  if (options.accountId) {
    if (name !== 'trades') throw new ApiError(400, 'Dieser Filter ist hier nicht verfuegbar.');
    filters.push('accountId = ?'); params.push(options.accountId);
  }
  if (options.from || options.to) {
    if (name !== 'trades') throw new ApiError(400, 'Dieser Filter ist hier nicht verfuegbar.');
    if (options.from) { filters.push('entryDate >= ?'); params.push(options.from); }
    if (options.to) { filters.push('entryDate <= ?'); params.push(options.to); }
  }
  const parts = options.sort.split(',').map(part => part.trim());
  const order = parts.map(part => {
    const field = part.startsWith('-') ? part.slice(1) : part;
    if (!columns[name]?.has(field) || ['notes', 'reviewTags', 'contextUrl', 'entryUrl', 'validationUrl', 'reviewLesson', 'reviewAction'].includes(field)) throw new ApiError(400, 'Ungueltige Sortierung.');
    return '`' + field + '` ' + (part.startsWith('-') ? 'DESC' : 'ASC');
  });
  if (!parts.some(part => part === 'id' || part === '-id')) order.push('id ASC');
  const where = filters.join(' AND ');
  const [[count]] = await db.execute(`SELECT COUNT(*) AS total FROM ${table(name)} WHERE ${where}`, params);
  // LIMIT/OFFSET are bounded integers from the schema, not raw request strings.
  const offset = (options.page - 1) * options.perPage;
  const [rows] = await db.execute(`SELECT * FROM ${table(name)} WHERE ${where} ORDER BY ${order.join(', ')} LIMIT ${options.perPage} OFFSET ${offset}`, params);
  return { page: options.page, perPage: options.perPage, totalItems: Number(count.total), totalPages: Math.ceil(Number(count.total) / options.perPage), items: rows.map(publicRecord) };
}

export async function insertRecord(db, name, userId, input, extras = {}) {
  const recordId = extras.id || newId();
  const value = validateRecord(name, input, userId);
  if (name === 'trades') await findRecord(db, 'tradingAccounts', value.accountId, userId, true);
  const record = { id: recordId, ...value, ...(extras.importFingerprint ? { importFingerprint: extras.importFingerprint } : {}) };
  const fields = Object.keys(record);
  await db.execute(`INSERT INTO ${table(name)} (${fields.map(field => '`' + field + '`').join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, fields.map(field => dbValue(field, record[field])));
  return findRecord(db, name, recordId, userId);
}

export const createRecord = (pool, name, userId, input) => transaction(pool, db => insertRecord(db, name, userId, input));

export const updateRecord = (pool, name, userId, recordId, input) => transaction(pool, async db => {
  const previous = await findRecord(db, name, recordId, userId, true);
  const value = validateRecord(name, input, userId, previous);
  if (name === 'trades') await findRecord(db, 'tradingAccounts', value.accountId, userId, true);
  const fields = Object.keys(value);
  await db.execute(`UPDATE ${table(name)} SET ${fields.map(field => '`' + field + '` = ?').join(', ')} WHERE id = ? AND userId = ?`, [...fields.map(field => dbValue(field, value[field])), recordId, userId]);
  return findRecord(db, name, recordId, userId);
});

export const deleteRecord = (pool, name, userId, recordId) => transaction(pool, async db => {
  await findRecord(db, name, recordId, userId, true);
  if (name === 'tradingAccounts') {
    const [[row]] = await db.execute('SELECT COUNT(*) AS total FROM trades WHERE accountId = ? AND userId = ?', [recordId, userId]);
    if (row.total) throw new ApiError(409, 'Weise die Trades zuerst einem anderen Konto zu.');
  }
  await db.execute(`DELETE FROM ${table(name)} WHERE id = ? AND userId = ?`, [recordId, userId]);
});

export const moveAndDeleteAccount = (pool, userId, source, target) => transaction(pool, async db => {
  parse(id, source); parse(id, target);
  if (source === target) throw new ApiError(400, 'Waehle ein anderes Zielkonto.');
  // Consistent lock order prevents simultaneous account moves from deadlocking.
  for (const accountId of [source, target].sort()) await findRecord(db, 'tradingAccounts', accountId, userId, true);
  await db.execute('UPDATE trades SET accountId = ? WHERE accountId = ? AND userId = ?', [target, source, userId]);
  await db.execute('DELETE FROM tradingAccounts WHERE id = ? AND userId = ?', [source, userId]);
});
