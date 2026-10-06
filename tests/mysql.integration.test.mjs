import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import net from 'node:net';
import { randomBytes } from 'node:crypto';
import { readConfig } from '../apps/api/src/config.mjs';
import { createPool } from '../apps/api/src/database.mjs';
import { migrate } from '../apps/api/src/migrate.mjs';
import { createApp } from '../apps/api/src/app.mjs';
import { createMailer } from '../apps/api/src/mail.mjs';
import { buildImportPlan, applyImport } from '../apps/api/src/import-csv.mjs';
import { createJournalApiClient } from '../apps/web/src/lib/journalApiClient.js';
import { cleanupExpired } from '../apps/api/src/maintenance.mjs';

test('real MySQL: authentication, SMTP, permissions, reviews, transactions, pagination and idempotent CSV import', { timeout: 120000 }, async t => {
  if (!process.env.MYSQL_TEST_URL) throw new Error('MYSQL_TEST_URL=mysql://USER:PASSWORD@127.0.0.1:PORT required. A fresh test database is created and removed.');
  const url = new URL(process.env.MYSQL_TEST_URL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Integration tests require a local database, never production.');
  const name = 'td_test_' + randomBytes(6).toString('hex');
  const admin = await mysql.createConnection({ host: url.hostname, port: Number(url.port) || 3306, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) });
  await admin.query('CREATE DATABASE `' + name + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  const mails = [];
  const smtp = net.createServer(socket => {
    let buffer = '', data = false, message = '';
    socket.write('220 localhost SMTP\r\n');
    socket.on('data', chunk => {
      buffer += chunk.toString();
      let index;
      while ((index = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
        if (data) {
          if (line === '.') { mails.push(message); data = false; message = ''; socket.write('250 accepted\r\n'); }
          else message += line + '\r\n';
        } else if (/^(EHLO|HELO)/i.test(line)) socket.write('250-localhost\r\n250 SIZE 1000000\r\n');
        else if (/^DATA/i.test(line)) { data = true; socket.write('354 send data\r\n'); }
        else if (/^QUIT/i.test(line)) socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
  const config = readConfig({ NODE_ENV: 'test', APP_URL: 'http://127.0.0.1:4189', DB_HOST: url.hostname, DB_PORT: url.port || '3306', DB_NAME: name, DB_USER: decodeURIComponent(url.username), DB_PASSWORD: decodeURIComponent(url.password), SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.address().port), SMTP_SECURE: 'false', SMTP_FROM: 'journal@example.test' });
  const pool = createPool(config);
  let server;
  try {
    const [[clock]] = await pool.query('SELECT @@session.time_zone AS timezone');
    assert.equal(clock.timezone, '+00:00');
    await migrate(pool); await migrate(pool);
    server = createApp({ pool, config, mailer: createMailer(config) }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port + '/api';
    async function request(path, method = 'GET', body, cookie, origin = config.origin) {
      const response = await fetch(base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, data: response.status === 204 ? null : await response.json(), cookie: response.headers.get('set-cookie'), headers: response.headers };
    }
    function token(index, route) {
      const decoded = mails[index].replace(/=\r\n/g, '').replace(/=([a-f0-9]{2})/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
      assert.ok(decoded.includes('The Trading Desk'));
      assert.ok(decoded.includes('background:#0e1116'));
      const match = decoded.match(new RegExp(route + '\\?token=([a-f0-9]{64})'));
      assert.ok(match, 'Correct frontend route and real one-time token in SMTP mail');
      return match[1];
    }
    const password = 'Test password only 123!';
    const email = 'trader@example.test';
    const signup = await request('/auth/signup', 'POST', { email, name: 'QA Trader', password, passwordConfirm: password });
    assert.equal(signup.status, 201, JSON.stringify(signup.data));
    assert.equal(signup.data.verified, false);
    assert.equal(signup.data.passwordHash, undefined);
    assert.equal((await request('/auth/login', 'POST', { identity: email, password })).status, 403);
    assert.equal((await request('/auth/verify/request', 'POST', { email })).status, 204);
    const verification = token(0, '/verify-pending');
    assert.equal((await request('/auth/verify/confirm', 'POST', { token: verification })).status, 204);
    assert.equal((await request('/auth/verify/confirm', 'POST', { token: verification })).status, 400);
    const login = await request('/auth/login', 'POST', { identity: email, password });
    assert.equal(login.status, 200, JSON.stringify(login.data));
    assert.match(login.cookie, /HttpOnly/); assert.match(login.cookie, /SameSite=Lax/);
    const cookie = login.cookie.split(';')[0];
    const userId = signup.data.id;

    await t.test('anonymous, foreign origin, privilege elevation and SQL injection are rejected', async () => {
      assert.equal((await request('/records/trades')).status, 401);
      assert.equal((await request('/auth/signup', 'POST', { email: 'bad@example.test', name: 'Bad', password, passwordConfirm: password, verified: true })).status, 400);
      assert.equal((await request('/auth/logout', 'POST', undefined, cookie, 'https://evil.test')).status, 403);
      assert.equal((await request('/auth/logout', 'POST', undefined, cookie, null)).status, 403);
      assert.equal((await request('/records/trades?sort=created%3BDROP%20TABLE%20users', 'GET', undefined, cookie)).status, 400);
      assert.equal((await request('/records/trades?userId=another-user', 'GET', undefined, cookie)).status, 403);
      assert.equal((await request('/users/' + userId, 'PATCH', { verified: true }, cookie)).status, 400);
      assert.equal((await request('/records/sessions', 'GET', undefined, cookie)).status, 404);
    });
    const account = await request('/records/tradingAccounts', 'POST', { accountName: 'QA Account', startingBalance: 100000, userId }, cookie);
    assert.equal(account.status, 201, JSON.stringify(account.data));
    const tradeInput = { userId, accountId: account.data.id, symbol: 'EUR/USD', entryDate: '2026-10-05', entryTime: '09:30', riskAmount: 1000, profitLoss: 2000, fees: 10, rrSecured: 2, notes: 'Original note' };
    const trade = await request('/records/trades', 'POST', tradeInput, cookie);
    assert.equal(trade.status, 201, JSON.stringify(trade.data));
    const path = '/records/trades/' + trade.data.id;
    await t.test('partial review updates preserve trades and enforce meaningful completion', async () => {
      assert.equal((await request(path, 'PATCH', { reviewStatus: 'completed', reviewLesson: ' ', reviewAction: 'Next' }, cookie)).status, 400);
      const completed = await request(path, 'PATCH', { reviewStatus: 'completed', reviewLesson: ' Learn ', reviewAction: ' Check risk ', reviewTags: ['plan', 'risk'], reviewCompletedAt: '2000-01-01T00:00:00Z' }, cookie);
      assert.equal(completed.status, 200, JSON.stringify(completed.data));
      assert.equal(completed.data.profitLoss, 2000);
      assert.equal(completed.data.reviewLesson, 'Learn');
      assert.ok(Math.abs(Date.now() - Date.parse(completed.data.reviewCompletedAt)) < 10000);
      const amended = await request(path, 'PATCH', { notes: 'Review updated' }, cookie);
      assert.equal(amended.data.reviewCompletedAt, completed.data.reviewCompletedAt);
      const reopened = await request(path, 'PATCH', { reviewStatus: 'draft' }, cookie);
      assert.equal(reopened.data.reviewCompletedAt, '');
      assert.equal(reopened.data.reviewLesson, 'Learn');
    });
    const otherEmail = 'other@example.test';
    const other = await request('/auth/signup', 'POST', { email: otherEmail, name: 'Other', password, passwordConfirm: password });
    await request('/auth/verify/request', 'POST', { email: otherEmail });
    await request('/auth/verify/confirm', 'POST', { token: token(1, '/verify-pending') });
    const otherLogin = await request('/auth/login', 'POST', { identity: otherEmail, password });
    let otherCookie = otherLogin.cookie.split(';')[0];
    await t.test('cross-user reads, writes and foreign-account attachments are impossible', async () => {
      assert.equal((await request(path, 'GET', undefined, otherCookie)).status, 404);
      assert.equal((await request(path, 'PATCH', { notes: 'Stolen' }, otherCookie)).status, 404);
      assert.equal((await request(path, 'DELETE', undefined, otherCookie)).status, 404);
      assert.equal((await request('/records/trades', 'POST', { ...tradeInput, userId: other.data.id }, otherCookie)).status, 404);
      assert.equal((await request('/records/trades', 'POST', { ...tradeInput, userId: other.data.id }, cookie)).status, 403);
      assert.equal((await request('/records/trades', 'GET', undefined, otherCookie)).data.items.length, 0);
    });
    await t.test('account moves are atomic and retain original risk snapshots', async () => {
      const target = await request('/records/tradingAccounts', 'POST', { accountName: 'Target', startingBalance: 50000 }, cookie);
      assert.equal((await request('/records/tradingAccounts/' + account.data.id, 'DELETE', undefined, cookie)).status, 409);
      assert.equal((await request('/accounts/' + account.data.id + '/move-and-delete', 'POST', { targetAccountId: 'missing' }, cookie)).status, 404);
      assert.equal((await request(path, 'GET', undefined, cookie)).data.accountId, account.data.id);
      assert.equal((await request('/accounts/' + account.data.id + '/move-and-delete', 'POST', { targetAccountId: target.data.id }, cookie)).status, 204);
      const moved = await request(path, 'GET', undefined, cookie);
      assert.equal(moved.data.accountId, target.data.id);
      assert.equal(moved.data.riskAmount, 1000);
      assert.equal((await request('/records/tradingAccounts/' + account.data.id, 'GET', undefined, cookie)).status, 404);
    });
    await t.test('CSV imports are atomic, repeatable and retain unknown commission and fees', async () => {
      const csv = 'Account ID,Symbol,Entry Date,Entry Time,Stop Loss (%),Stop Loss (€),Stop Loss (Pips),Risk/Reward Ratio,Status,Profit/Loss,Commission %,RR Secured,Notes,Context URL,Validation URL,Entry URL\nlegacy-account,EUR/USD,2026-09-05,10:30,1,1000,10,2,Win,2000,,2,Imported,,,\n';
      const plan = buildImportPlan(csv, { accounts: [{ sourceAccountId: 'legacy-account', accountName: 'Future Trading', startingBalance: 100000, currency: 'EUR' }] }, userId);
      assert.deepEqual(await applyImport(pool, plan, userId), { inserted: 1, skipped: 0 });
      assert.deepEqual(await applyImport(pool, plan, userId), { inserted: 0, skipped: 1 });
      const result = await request('/records/trades?accountId=legacy-account', 'GET', undefined, cookie);
      assert.equal(result.data.items[0].commissionPercentage, null);
      assert.equal(result.data.items[0].fees, null);
      assert.equal(result.data.items[0].importFingerprint, undefined);
      // Fresh fingerprints exercise a late failure, after an account and trade were inserted.
      const broken = {
        ...plan,
        accounts: [{ sourceAccountId: 'rolled-back', accountName: 'Rollback', startingBalance: 100000, currency: 'EUR' }],
        trades: [
          { ...plan.trades[0], accountId: 'rolled-back', importFingerprint: randomBytes(32).toString('hex') },
          { ...plan.trades[0], accountId: 'missing', importFingerprint: randomBytes(32).toString('hex') },
        ],
      };
      await assert.rejects(applyImport(pool, broken, userId));
      const [[remaining]] = await pool.execute('SELECT COUNT(*) AS total FROM tradingAccounts WHERE id = ?', ['rolled-back']);
      assert.equal(remaining.total, 0);
      const [[imported]] = await pool.execute('SELECT COUNT(*) AS total FROM trades WHERE userId = ? AND importFingerprint IS NOT NULL', [userId]);
      assert.equal(imported.total, 1);
    });
    await t.test('frontend API client loads more than 500 trades without silent truncation', async () => {
      const [[target]] = await pool.execute('SELECT id FROM tradingAccounts WHERE userId = ? LIMIT 1', [userId]);
      await pool.query('INSERT INTO trades (id, userId, accountId, symbol, entryDate, entryTime, notes, contextUrl, validationUrl, entryUrl, reviewTags, reviewLesson, reviewAction) VALUES ?', [Array.from({ length: 550 }, () => [randomBytes(16).toString('hex'), userId, target.id, 'BULK', '2026-10-05', '12:00', '', '', '', '', '[]', '', ''])]);
      const client = createJournalApiClient(base, (url, options) => fetch(url, { ...options, headers: { ...options.headers, Cookie: cookie, Origin: config.origin } }));
      const items = await client.collection('trades').getFullList({ sort: 'entryDate,entryTime', filter: { userId } });
      assert.equal(items.length, 552);
      assert.equal(new Set(items.map(record => record.id)).size, 552);
    });
    await t.test('mail failures are visible without deleting a registered user', async () => {
      const failingServer = createApp({ pool, config, mailer: { verify: async () => {}, send: async () => { throw new Error('SMTP rejected'); } } }).listen(0, '127.0.0.1');
      await new Promise(resolve => failingServer.once('listening', resolve));
      try {
        const response = await fetch('http://127.0.0.1:' + failingServer.address().port + '/api/auth/reset/request', { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        assert.equal(response.status, 503);
        const [[user]] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        assert.equal(user.id, userId);
      } finally { await new Promise(resolve => failingServer.close(resolve)); }
    });
    await t.test('password reset revokes all sessions and is single-use', async () => {
      await request('/auth/reset/request', 'POST', { email });
      const reset = token(2, '/reset-password');
      const nextPassword = 'New test password 456!';
      assert.equal((await request('/auth/reset/confirm', 'POST', { token: reset, password: nextPassword, passwordConfirm: nextPassword })).status, 204);
      assert.equal((await request('/auth/session', 'GET', undefined, cookie)).status, 401);
      assert.equal((await request('/auth/reset/confirm', 'POST', { token: reset, password: nextPassword, passwordConfirm: nextPassword })).status, 400);
      assert.equal((await request('/auth/login', 'POST', { identity: email, password })).status, 401);
      const nextLogin = await request('/auth/login', 'POST', { identity: email, password: nextPassword });
      const nextCookie = nextLogin.cookie.split(';')[0];
      assert.equal((await request('/users/me', 'DELETE', { password: 'wrong' }, nextCookie)).status, 400);
      assert.equal((await request('/users/me', 'DELETE', { password: nextPassword }, nextCookie)).status, 204);
      assert.equal((await request('/auth/session', 'GET', undefined, nextCookie)).status, 401);
      const [[remaining]] = await pool.execute('SELECT COUNT(*) AS total FROM trades WHERE userId = ?', [userId]);
      assert.equal(remaining.total, 0);
      assert.equal((await request('/auth/session', 'GET', undefined, otherCookie)).status, 200);
    });
    await t.test('unverified users cannot bypass verification through password reset', async () => {
      const address = 'pending@example.test';
      const pending = await request('/auth/signup', 'POST', { email: address, name: 'Pending', password, passwordConfirm: password });
      assert.equal(pending.status, 201);
      const index = mails.length;
      assert.equal((await request('/auth/reset/request', 'POST', { email: address })).status, 204);
      const reset = token(index, '/reset-password');
      const changed = 'Pending new password 789!';
      assert.equal((await request('/auth/reset/confirm', 'POST', { token: reset, password: changed, passwordConfirm: changed })).status, 204);
      assert.equal((await request('/auth/login', 'POST', { identity: address, password: changed })).status, 403);
      const [[row]] = await pool.execute('SELECT verified FROM users WHERE id = ?', [pending.data.id]);
      assert.equal(row.verified, 0);
    });
    await t.test('profile password changes require the old password and revoke other sessions', async () => {
      const path = '/users/' + other.data.id;
      const updatedPassword = 'Profile new password 456!';
      const patch = { oldPassword: 'wrong', password: updatedPassword, passwordConfirm: updatedPassword };
      assert.equal((await request(path, 'PATCH', patch, otherCookie)).status, 400);
      const second = await request('/auth/login', 'POST', { identity: otherEmail, password });
      const secondCookie = second.cookie.split(';')[0];
      const changed = await request(path, 'PATCH', { ...patch, oldPassword: password, name: 'Updated Other' }, otherCookie);
      assert.equal(changed.status, 200);
      assert.equal(changed.data.name, 'Updated Other');
      assert.equal(changed.data.passwordHash, undefined);
      assert.equal((await request('/auth/session', 'GET', undefined, otherCookie)).status, 401);
      assert.equal((await request('/auth/session', 'GET', undefined, secondCookie)).status, 401);
      otherCookie = changed.cookie.split(';')[0];
      assert.equal((await request('/auth/session', 'GET', undefined, otherCookie)).status, 200);
    });
    await t.test('rate limiting works in the database and unknown addresses receive the same response', async () => {
      assert.equal((await request('/auth/reset/request', 'POST', { email: 'unknown@example.test' })).status, 204);
      for (let attempt = 0; attempt < 5; attempt++) await request('/auth/reset/request', 'POST', { email: 'limited@example.test' });
      assert.equal((await request('/auth/reset/request', 'POST', { email: 'limited@example.test' })).status, 429);
    });
    await t.test('maintenance removes expired rows but retains current sessions and users', async () => {
      const expired = 'a'.repeat(64);
      await pool.execute('INSERT INTO sessions (tokenHash, userId, expiresAt) VALUES (?, ?, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY))', [expired, other.data.id]);
      await pool.execute('INSERT INTO actionTokens (tokenHash, userId, purpose, expiresAt) VALUES (?, ?, ?, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY))', [expired, other.data.id, 'reset']);
      await pool.execute('INSERT INTO rateLimits (bucket, hits, expiresAt) VALUES (?, 1, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY))', [expired]);
      const removed = await cleanupExpired(pool);
      assert.ok(removed.sessions >= 1 && removed.actionTokens >= 1 && removed.rateLimits >= 1);
      assert.equal((await request('/auth/session', 'GET', undefined, otherCookie)).status, 200);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => smtp.close(resolve));
    await pool.end();
    await admin.query('DROP DATABASE `' + name + '`');
    await admin.end();
  }
});
