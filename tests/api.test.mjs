import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../apps/api/src/config.mjs';
import { validateRecord, signupSchema } from '../apps/api/src/validation.mjs';
import { publicRecord } from '../apps/api/src/database.mjs';
import { hashPassword, verifyPassword } from '../apps/api/src/security.mjs';
import { buildImportPlan } from '../apps/api/src/import-csv.mjs';
import { cleanupExpired } from '../apps/api/src/maintenance.mjs';
import { createMailer } from '../apps/api/src/mail.mjs';
import { authService } from '../apps/api/src/auth.mjs';

const config = { APP_URL: 'http://127.0.0.1:4189', DB_HOST: 'localhost', DB_USER: 'test', DB_PASSWORD: '', DB_NAME: 'test' };
const trade = { accountId: 'account-one', symbol: 'EUR/USD', entryDate: '2026-10-05', entryTime: '09:30', riskAmount: 100, profitLoss: 200, fees: 4, commissionPercentage: 10 };

test('configuration keeps credentials server-only and requires production HTTPS and SMTP', () => {
  assert.equal(readConfig(config).cookieName, 'td_session');
  assert.throws(() => readConfig({ ...config, APP_URL: 'http://example.com' }));
  assert.throws(() => readConfig({ ...config, APP_URL: 'https://example.com/' }));
  assert.throws(() => readConfig({ ...config, NODE_ENV: 'production', APP_URL: 'https://example.com' }));
  const production = readConfig({ ...config, NODE_ENV: 'production', APP_URL: 'https://example.com', DB_PASSWORD: 'secret', SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'journal@example.com', SMTP_USER: 'user', SMTP_PASSWORD: 'secret' });
  assert.equal(production.cookieName, '__Host-td_session');
  assert.equal(production.db.multipleStatements, false);
});

test('ownership and unexpected fields cannot be submitted by clients', () => {
  assert.throws(() => validateRecord('trades', { ...trade, userId: 'someone-else' }, 'user-one'));
  assert.throws(() => validateRecord('trades', { ...trade, importFingerprint: 'spoof' }, 'user-one'));
  assert.throws(() => validateRecord('users', {}, 'user-one'));
  assert.equal(signupSchema.safeParse({ email: 'a@example.com', name: 'Test', password: '123456789012', passwordConfirm: '123456789012', verified: true }).success, false);
});

test('numbers and calendar dates are validated without changing reported results', () => {
  const result = validateRecord('trades', trade, 'user-one');
  assert.equal(result.profitLoss, 200);
  assert.equal(result.riskAmount, 100);
  for (const patch of [{ entryDate: '0006-03-02' }, { entryDate: '2026-02-30' }, { entryDate: '2026-10-05unexpected' }, { entryTime: '25:00' }, { fees: -1 }, { commissionPercentage: 101 }, { riskAmount: 0 }, { profitLoss: Infinity }, { contextUrl: 'javascript:alert(1)' }]) {
    assert.throws(() => validateRecord('trades', { ...trade, ...patch }, 'user-one'));
  }
  const legacy = validateRecord('trades', { ...trade, riskAmount: null, fees: null, commissionPercentage: null, entryDate: '2026-10-05 12:00:00.000Z' }, 'user-one');
  assert.equal(legacy.entryDate, '2026-10-05');
  assert.equal(legacy.riskAmount, null);
});

test('completed reviews require content and server timestamps; partial edits preserve data', () => {
  const previous = validateRecord('trades', { ...trade, notes: 'Original', reviewStatus: 'completed', reviewLesson: ' Learn ', reviewAction: ' Check ', reviewTags: ['plan', 'plan'] }, 'user-one');
  assert.equal(previous.reviewLesson, 'Learn');
  assert.deepEqual(previous.reviewTags, ['plan']);
  const edited = validateRecord('trades', { notes: 'Updated', reviewCompletedAt: '2000-01-01T00:00:00Z' }, 'user-one', previous);
  assert.equal(edited.reviewCompletedAt, previous.reviewCompletedAt);
  assert.equal(edited.profitLoss, 200);
  const reopened = validateRecord('trades', { reviewStatus: 'draft' }, 'user-one', edited);
  assert.equal(reopened.reviewCompletedAt, null);
  assert.equal(reopened.reviewLesson, 'Learn');
  assert.throws(() => validateRecord('trades', { reviewAction: ' ' }, 'user-one', previous));
});

test('public records omit password hashes and convert JSON and dates consistently', () => {
  const record = publicRecord({ id: 'test', verified: 1, passwordHash: 'never expose', importFingerprint: 'private', created: '2026-10-05 09:00:00.123', entryDate: '2026-10-05', entryTime: '09:00', reviewTags: '["plan"]', reviewCompletedAt: null });
  assert.equal(record.passwordHash, undefined);
  assert.equal(record.importFingerprint, undefined);
  assert.equal(record.verified, true);
  assert.equal(record.created, '2026-10-05T09:00:00.123Z');
  assert.deepEqual(record.reviewTags, ['plan']);
});

test('expiry cleanup is bounded and never targets trading or user data', async () => {
  const calls = [];
  const db = { execute: async sql => { calls.push(sql); return [{ affectedRows: 2 }]; } };
  assert.deepEqual(await cleanupExpired(db, 50), { sessions: 2, actionTokens: 2, rateLimits: 2 });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(sql => /^DELETE FROM (sessions|actionTokens|rateLimits) WHERE expiresAt <= UTC_TIMESTAMP\(3\) LIMIT 50$/.test(sql)));
  await assert.rejects(cleanupExpired(db, '50; DROP TABLE users'));
});

test('missing mail configuration fails visibly without claiming delivery', async () => {
  const mailer = createMailer(readConfig(config));
  await assert.rejects(mailer.verify(), error => error.status === 503);
  await assert.rejects(mailer.send('verify', 'a@example.test', 'token'), error => error.status === 503);
});

test('passwords are salted, not stored in plaintext, and invalid hashes fail closed', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.ok(!hash.includes('correct horse'));
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword('wrong', 'not-a-hash'), false);
});

test('password hashing rejects excess queued work instead of unbounded memory allocation', async () => {
  const attempts = await Promise.allSettled(Array.from({ length: 23 }, () => hashPassword('Disposable queue-test password')));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 22);
  const rejected = attempts.filter(result => result.status === 'rejected');
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.status, 503);
  assert.match(attempts[0].value, /^scrypt\$131072\$8\$1\$/);
});

test('a password reset during login cannot create a session with the old password', async () => {
  const password = 'Disposable race-test password';
  const snapshot = { id: 'user-one', email: 'trader@example.test', passwordHash: await hashPassword(password), verified: 1 };
  let rolledBack = false, released = false;
  const connection = {
    beginTransaction: async () => {}, commit: async () => assert.fail('Stale login must not commit'),
    rollback: async () => { rolledBack = true; }, release: () => { released = true; },
    execute: async sql => {
      assert.match(sql, /^SELECT \* FROM users WHERE id = \? FOR UPDATE$/);
      return [[{ ...snapshot, passwordHash: 'changed during password reset' }]];
    },
  };
  const pool = {
    getConnection: async () => connection,
    execute: async sql => {
      if (sql.startsWith('INSERT INTO rateLimits')) return [{ affectedRows: 1 }];
      if (sql.startsWith('SELECT hits')) return [[{ hits: 1 }]];
      assert.equal(sql, 'SELECT * FROM users WHERE email = ?');
      return [[{ ...snapshot }]];
    },
  };
  const auth = authService(pool, readConfig(config), {});
  await assert.rejects(auth.login({ ip: '127.0.0.1', body: { identity: snapshot.email, password } }, { cookie: () => assert.fail('No cookie for stale credentials') }), error => error.status === 401);
  assert.ok(rolledBack && released);
});

const csvHeader = 'Account ID,Symbol,Entry Date,Entry Time,Stop Loss (%),Stop Loss (€),Stop Loss (Pips),Risk/Reward Ratio,Status,Profit/Loss,Commission %,RR Secured,Notes,Context URL,Validation URL,Entry URL';
const csvRow = 'source-account,EUR/USD,2026-10-05,09:30,1,1000,10,2,Win,2000,,2,"Original, note",https://example.com/chart,,https://example.com/entry';
test('CSV dry-run requires explicit account mapping and retains money, empty costs, links and legitimate duplicates', () => {
  const csv = csvHeader + '\n' + csvRow + '\n' + csvRow;
  assert.throws(() => buildImportPlan(csv, { accounts: [] }, 'user-one'));
  const map = { accounts: [{ sourceAccountId: 'source-account', accountName: 'Future Trading', startingBalance: 100000, currency: 'EUR' }] };
  const plan = buildImportPlan(csv, map, 'user-one');
  assert.equal(plan.trades.length, 2);
  assert.equal(plan.grossProfitLoss, 4000);
  assert.equal(plan.trades[0].riskAmount, 1000);
  assert.equal(plan.trades[0].commissionPercentage, null);
  assert.equal(plan.trades[0].fees, null);
  assert.equal(plan.trades[0].notes, 'Original, note');
  assert.notEqual(plan.trades[0].importFingerprint, plan.trades[1].importFingerprint);
  assert.equal(plan.trades[0].importFingerprint, buildImportPlan(csv, map, 'user-one').trades[0].importFingerprint);
  const compactCsv = csv.replace(csvHeader, csvHeader.replace(/[\s()/]/g, '').replace('€', 'EUR'));
  assert.equal(buildImportPlan(compactCsv, map, 'user-one').trades.length, 2);
  assert.throws(() => buildImportPlan(csv.replace('Profit/Loss', 'Unrelated column'), map, 'user-one'));
});
