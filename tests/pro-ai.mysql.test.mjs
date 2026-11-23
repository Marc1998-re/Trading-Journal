import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { readConfig } from '../apps/api/src/config.mjs';
import { createPool } from '../apps/api/src/database.mjs';
import { migrate } from '../apps/api/src/migrate.mjs';
import { createApp } from '../apps/api/src/app.mjs';

test('real MySQL: pro fields, account rules, missed trades and AI keys end to end', { timeout: 120000 }, async () => {
  if (!process.env.MYSQL_TEST_URL) throw new Error('MYSQL_TEST_URL=mysql://USER:PASSWORD@127.0.0.1:PORT required.');
  const url = new URL(process.env.MYSQL_TEST_URL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Local database only.');
  const name = 'td_test_' + randomBytes(6).toString('hex');
  const admin = await mysql.createConnection({ host: url.hostname, port: Number(url.port) || 3306, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) });
  await admin.query('CREATE DATABASE `' + name + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  const config = readConfig({ NODE_ENV: 'test', APP_URL: 'http://127.0.0.1:4189', DB_HOST: url.hostname, DB_PORT: url.port || '3306', DB_NAME: name, DB_USER: decodeURIComponent(url.username), DB_PASSWORD: decodeURIComponent(url.password) });
  const pool = createPool(config);
  let server;
  try {
    await migrate(pool);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    server = createApp({ pool, config, mailer: {}, fetcher: async () => new Response(png, { headers: { 'content-type': 'image/png' } }) }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port + '/api';
    let cookie = '';
    async function call(path, method = 'GET', body, headers = {}) {
      const response = await fetch(base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie && !headers.Authorization ? { Cookie: cookie } : {}), Origin: config.origin, ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return { status: response.status, data: response.status === 204 ? null : response.headers.get('content-type')?.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer()) };
    }
    const password = 'ein-sicheres-passwort-123';
    assert.equal((await call('/auth/signup', 'POST', { email: 'trader@example.test', password, passwordConfirm: password, name: 'Trader' })).status, 201);
    await pool.execute('UPDATE users SET verified = TRUE');
    assert.equal((await call('/auth/login', 'POST', { identity: 'trader@example.test', password })).status, 200);

    // Prop account with rules, then edit rules like the settings form does.
    const account = (await call('/records/tradingAccounts', 'POST', { accountName: 'FTMO 100k', startingBalance: 100000, accountType: 'prop', propFirm: 'FTMO', dailyLossLimit: 5000, maxLoss: 10000, profitTarget: 10000, drawdownMode: 'static' })).data;
    assert.equal(account.accountType, 'prop');
    assert.equal(Number(account.maxLoss), 10000);
    const edited = await call('/records/tradingAccounts/' + account.id, 'PATCH', { drawdownMode: 'trailing', maxRiskPerTrade: 1, maxTradesPerDay: 3, dailyLossLimit: null });
    assert.equal(edited.status, 200);
    assert.equal(edited.data.drawdownMode, 'trailing');
    assert.equal(edited.data.dailyLossLimit, null);
    assert.equal(Number(edited.data.maxRiskPerTrade), 1);
    const privateAccount = (await call('/records/tradingAccounts', 'POST', { accountName: 'Privat', startingBalance: 5000 })).data;
    assert.equal(privateAccount.accountType, 'private');

    // Trade with every pro field round-trips through MySQL.
    const tradeInput = { accountId: account.id, symbol: 'nq', entryDate: '2026-11-18', entryTime: '15:35', exitDate: '2026-11-18', exitTime: '16:05', side: 'long', setup: 'ORB', riskAmount: 1000, profitLoss: 2500, fees: 12, plannedRR: 3, mae: 0.4, mfe: 3.2, grade: 'A', emotion: 'calm', confidence: 4, entryUrl: 'https://www.tradingview.com/x/AbCd1234/', notes: 'Lehrbuch' };
    const trade = (await call('/records/trades', 'POST', tradeInput)).data;
    for (const [key, value] of Object.entries({ exitDate: '2026-11-18', exitTime: '16:05', grade: 'A', emotion: 'calm', confidence: 4 })) assert.equal(trade[key], value, key);
    for (const key of ['plannedRR', 'mae', 'mfe']) assert.equal(Number(trade[key]), tradeInput[key], key);
    assert.equal((await call('/records/trades', 'POST', { ...tradeInput, exitTime: '15:00' })).status, 400, 'exit before entry');
    const cleared = await call('/records/trades/' + trade.id, 'PATCH', { exitDate: '', exitTime: '', grade: '', mfe: null });
    assert.equal(cleared.data.exitDate, null);
    assert.equal(cleared.data.grade, '');
    await call('/records/trades/' + trade.id, 'PATCH', { exitDate: '2026-11-18', exitTime: '16:05', grade: 'A', mfe: 3.2 });

    // Missed trades: create, filter by period, move with account deletion.
    const missed = await call('/records/missedTrades', 'POST', { accountId: privateAccount.id, symbol: 'es', entryDate: '2026-11-19', entryTime: '09:31', reason: 'hesitation', decision: 'missed', potentialR: 2.5, grade: 'A', side: 'short', contextUrl: 'https://www.tradingview.com/x/Ctx11111/', validationUrl: 'https://www.tradingview.com/x/Val22222/', entryUrl: 'https://www.tradingview.com/x/Ent33333/' });
    assert.equal(missed.status, 201);
    assert.deepEqual([missed.data.contextUrl, missed.data.validationUrl, missed.data.entryUrl].map(u => u.slice(-9, -1)), ['Ctx11111', 'Val22222', 'Ent33333'], 'all three chart links are stored');
    assert.equal(missed.data.symbol, 'ES');
    assert.equal((await call('/records/missedTrades?from=2026-11-19&to=2026-11-19')).data.totalItems, 1);
    assert.equal((await call('/records/missedTrades?from=2026-11-20')).data.totalItems, 0);
    assert.equal((await call('/records/tradingAccounts/' + privateAccount.id, 'DELETE')).status, 409, 'missed trades block deleting their account');
    assert.equal((await call('/accounts/' + privateAccount.id + '/move-and-delete', 'POST', { targetAccountId: account.id })).status, 204);
    assert.equal((await call('/records/missedTrades/' + missed.data.id)).data.accountId, account.id);

    // AI keys: session-only management.
    const readKey = (await call('/ai-keys', 'POST', { name: 'ChatGPT', expiresInDays: 30 })).data;
    assert.match(readKey.key, /^tdj_[a-f0-9]{64}$/);
    assert.equal(readKey.record.scope, 'read');
    const writeKey = (await call('/ai-keys', 'POST', { name: 'Claude', expiresInDays: null, scope: 'write' })).data;
    assert.equal(writeKey.record.expiresAt, null);
    const [[stored]] = await pool.execute('SELECT tokenHash FROM apiKeys WHERE id = ?', [readKey.record.id]);
    assert.notEqual(stored.tokenHash, readKey.key, 'only the hash is stored');
    const listed = (await call('/ai-keys')).data.items;
    assert.equal(listed.length, 2);
    assert.equal(JSON.stringify(listed).includes(readKey.key), false);

    const asRead = { Authorization: 'Bearer ' + readKey.key }, asWrite = { Authorization: 'Bearer ' + writeKey.key };
    const me = (await call('/v1/me', 'GET', undefined, asRead)).data;
    assert.deepEqual([me.trades, me.missedTrades, me.accounts, me.access], [1, 1, 1, 'read']);
    const trades = (await call('/v1/trades', 'GET', undefined, asRead)).data;
    assert.equal(trades.items[0].computed.netR, 2.488);
    assert.equal(trades.items[0].computed.session, 'newyork');
    assert.equal(trades.items[0].computed.holdingMinutes, 30);
    assert.equal(trades.items[0].screenshots[0].imageUrl, 'https://s3.tradingview.com/snapshots/a/AbCd1234.png');
    const image = await call('/v1/trades/' + trade.id + '/screenshots/0', 'GET', undefined, asRead);
    assert.equal(image.status, 200);
    assert.deepEqual(image.data, png);
    const summary = (await call('/v1/summary?accountId=' + account.id, 'GET', undefined, asRead)).data;
    assert.equal(summary.counts.trades, 1);
    assert.equal(summary.stats.totalTrades ?? summary.counts.trades, 1);
    assert.equal(summary.accountRules.trailing, true);
    assert.equal(summary.missedTrades.opportunityR, 2.5);
    const missedList = (await call('/v1/missed-trades', 'GET', undefined, asRead)).data;
    assert.deepEqual(missedList.items[0].screenshots.map(shot => shot.field), ['entryUrl', 'validationUrl', 'contextUrl']);
    assert.equal(missedList.items[0].screenshots[0].proxyPath, '/api/v1/missed-trades/' + missed.data.id + '/screenshots/0');
    assert.equal((await call('/v1/missed-trades/' + missed.data.id + '/screenshots/1', 'GET', undefined, asRead)).status, 200);
    const [[used]] = await pool.execute('SELECT lastUsedAt FROM apiKeys WHERE id = ?', [readKey.record.id]);
    assert.ok(used.lastUsedAt, 'last use is recorded');

    // Writing needs the write scope; duplicates and dry runs behave.
    const newTrade = { accountId: account.id, symbol: 'ES', entryDate: '2026-11-20', entryTime: '10:15', side: 'short', riskAmount: 500, profitLoss: -500, fees: 6, grade: 'B' };
    assert.equal((await call('/v1/trades', 'POST', newTrade, asRead)).status, 403);
    assert.equal((await call('/v1/trades?dryRun=true', 'POST', newTrade, asWrite)).status, 201);
    assert.equal((await call('/v1/me', 'GET', undefined, asWrite)).data.trades, 1, 'dry run saved nothing');
    const batch = await call('/v1/trades', 'POST', { items: [newTrade, { ...newTrade, entryTime: '11:00', profitLoss: 750 }] }, asWrite);
    assert.equal(batch.status, 201);
    assert.equal(batch.data.created, 2);
    assert.equal((await call('/v1/trades', 'POST', newTrade, asWrite)).status, 409);
    const failing = await call('/v1/trades', 'POST', { items: [{ ...newTrade, entryTime: '12:00' }, { ...newTrade, entryTime: '13:00', accountId: privateAccount.id }] }, asWrite);
    assert.equal(failing.status, 404);
    assert.equal((await call('/v1/me', 'GET', undefined, asWrite)).data.trades, 3, 'failed batch rolled back');
    const patched = await call('/v1/trades/' + batch.data.items[0].id, 'PATCH', { notes: 'Von KI ergänzt', emotion: 'fomo' }, asWrite);
    assert.equal(patched.data.notes, 'Von KI ergänzt');
    assert.equal(patched.data.computed.netR, -1.012);
    assert.equal((await call('/v1/missed-trades', 'POST', { accountId: account.id, symbol: 'CL', entryDate: '2026-11-20', entryTime: '14:30', reason: 'news', decision: 'valid' }, asWrite)).status, 201);
    assert.equal((await call('/v1/trades/' + trade.id, 'DELETE', undefined, asWrite)).status, 405);
    assert.equal((await call('/records/trades', 'GET', undefined, asWrite)).status, 401, 'keys never act as a session');

    // Revoked keys stop working immediately.
    assert.equal((await call('/ai-keys/' + readKey.record.id, 'DELETE')).status, 204);
    assert.equal((await call('/v1/me', 'GET', undefined, asRead)).status, 401);
    await pool.execute("UPDATE apiKeys SET expiresAt = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE id = ?", [writeKey.record.id]);
    assert.equal((await call('/v1/me', 'GET', undefined, asWrite)).status, 401, 'expired keys are rejected');

    // Deleting the user removes everything, including missed trades and keys.
    assert.equal((await call('/users/me', 'DELETE', { password })).status, 204);
    for (const table of ['users', 'tradingAccounts', 'trades', 'missedTrades', 'apiKeys']) {
      const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM ' + table);
      assert.equal(Number(row.total), 0, table);
    }
  } finally {
    server?.close();
    await pool.end();
    await admin.query('DROP DATABASE `' + name + '`');
    await admin.end();
  }
});
