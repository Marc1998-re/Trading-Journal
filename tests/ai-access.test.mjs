import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/api/src/app.mjs';
import { readConfig } from '../apps/api/src/config.mjs';
import { hashToken } from '../apps/api/src/security.mjs';
import { aiTrade, openApiSpec, screenshotImageUrl, screenshotsOf } from '../apps/api/src/aiAccess.mjs';

const KEY = 'tdj_' + 'a'.repeat(64);
const trade = { id: 't1', userId: 'u1', accountId: 'a1', symbol: 'NQ', entryDate: '2026-10-05', entryTime: '15:40', exitDate: '2026-10-05', exitTime: '16:10', riskAmount: 200, profitLoss: 500, fees: 20, commissionPercentage: 0, entryUrl: 'https://www.tradingview.com/x/AbC123xy/', validationUrl: '', contextUrl: 'https://example.com/chart.png', notes: 'Plan befolgt', created: '2026-10-05 16:12:00.000', updated: '2026-10-05 16:12:00.000', reviewCompletedAt: null, reviewTags: '[]' };

test('screenshot links resolve to direct images; only TradingView is proxied', () => {
  assert.equal(screenshotImageUrl('https://www.tradingview.com/x/AbC123xy/'), 'https://s3.tradingview.com/snapshots/a/AbC123xy.png');
  assert.equal(screenshotImageUrl('https://de.tradingview.com/x/Zz9/'), null);
  assert.equal(screenshotImageUrl('https://example.com/a.JPG'), 'https://example.com/a.JPG');
  assert.equal(screenshotImageUrl('https://example.com/page'), null);
  assert.equal(screenshotImageUrl('javascript:alert(1)'), null);
  const shots = screenshotsOf(trade);
  assert.deepEqual(shots.map(s => s.field), ['entryUrl', 'contextUrl']);
  assert.equal(shots[0].proxyPath, '/api/v1/trades/t1/screenshots/0');
  assert.equal(shots[1].proxyPath, null);
});

test('AI trade view adds computed values and hides the owner', () => {
  const view = aiTrade(trade, { a1: 10000 });
  assert.equal(view.userId, undefined);
  assert.equal(view.computed.netProfit, 480);
  assert.equal(view.computed.netR, 2.4);
  assert.equal(view.computed.session, 'newyork');
  assert.equal(view.computed.holdingMinutes, 30);
  assert.equal(view.computed.result, 'win');
  assert.ok(openApiSpec('https://j.test').paths['/summary']);
});

function fakePool({ verified = true } = {}) {
  const calls = [];
  return {
    calls,
    query: async () => [[{ ok: 1 }]],
    execute: async (sql, params = []) => {
      calls.push(sql);
      if (sql.includes('FROM apiKeys JOIN users')) return [[params[0] === hashToken(KEY) ? { keyId: 'k1', keyName: 'Test', id: 'u1', name: 'Marc', verified } : undefined]];
      if (sql.startsWith('INSERT INTO rateLimits')) return [{}];
      if (sql.startsWith('SELECT hits')) return [[{ hits: 1 }]];
      if (sql.startsWith('UPDATE apiKeys')) return [{}];
      if (sql.startsWith('SELECT id, accountName')) return [[{ id: 'a1', accountName: 'Konto', startingBalance: 10000 }]];
      if (sql.startsWith('SELECT COUNT(*) AS total FROM `trades`')) { assert.equal(params[0], 'u1'); return [[{ total: 1 }]]; }
      if (sql.includes('LIMIT 20001')) return [[sql.includes('`trades`') ? trade : { id: 'm1', userId: 'u1', accountId: 'a1', symbol: 'ES', entryDate: '2026-10-06', entryTime: '15:35', decision: 'missed', reason: 'hesitation', potentialR: 2, created: '2026-10-06 16:00:00.000', updated: '2026-10-06 16:00:00.000' }]];
      if (sql.startsWith('SELECT * FROM tradingAccounts WHERE id = ?')) return [[{ id: 'a1', startingBalance: 10000, accountType: 'prop', dailyLossLimit: 500, maxLoss: 1000, profitTarget: 1000 }]];
      if (sql.startsWith('SELECT * FROM `trades` WHERE id = ?')) return [[params[0] === 't1' && params[1] === 'u1' ? trade : undefined]];
      if (sql.startsWith('SELECT * FROM `trades`')) { assert.ok(sql.includes('ORDER BY `entryDate` DESC')); return [[trade]]; }
      throw new Error('Unexpected SQL: ' + sql);
    },
  };
}

async function serve(pool, fetcher) {
  const config = readConfig({ APP_URL: 'http://127.0.0.1:4189', DB_HOST: '127.0.0.1', DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: '' });
  const server = createApp({ pool, config, mailer: {}, fetcher, staticDir: '/nonexistent' }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  return { server, base: 'http://127.0.0.1:' + server.address().port + '/api/v1' };
}

test('AI API: bearer auth, CORS, read-only, trades and screenshot proxy', async () => {
  const pool = fakePool();
  const fetched = [];
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const { server, base } = await serve(pool, async (url, options) => { fetched.push([url, options.redirect]); return new Response(png, { headers: { 'content-type': 'image/png' } }); });
  const auth = { Authorization: 'Bearer ' + KEY };
  try {
    const spec = await fetch(base + '/openapi.json');
    assert.equal(spec.status, 200);
    assert.equal((await spec.json()).servers[0].url, 'http://127.0.0.1:4189/api/v1');
    assert.equal((await fetch(base + '/trades')).status, 401);
    assert.equal((await fetch(base + '/trades', { headers: { Authorization: 'Bearer tdj_' + 'b'.repeat(64) } })).status, 401);
    const preflight = await fetch(base + '/trades', { method: 'OPTIONS', headers: { Origin: 'https://chat.example' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
    assert.equal((await fetch(base + '/trades', { method: 'POST', headers: auth })).status, 405);
    const list = await fetch(base + '/trades', { headers: auth });
    assert.equal(list.status, 200);
    const body = await list.json();
    assert.equal(body.items[0].computed.netR, 2.4);
    assert.equal(body.items[0].userId, undefined);
    assert.equal((await fetch(base + '/trades', { headers: { 'X-API-Key': KEY } })).status, 200);
    const image = await fetch(base + '/trades/t1/screenshots/0', { headers: auth });
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
    assert.deepEqual(fetched, [['https://s3.tradingview.com/snapshots/a/AbC123xy.png', 'error']]);
    assert.equal((await fetch(base + '/trades/t1/screenshots/1', { headers: auth })).status, 404);
    assert.equal(fetched.length, 1, 'non-TradingView links are never fetched by the server');
    assert.equal((await fetch(base + '/trades/other', { headers: auth })).status, 404);
    const summary = await (await fetch(base + '/summary?accountId=a1', { headers: auth })).json();
    assert.equal(summary.counts.trades, 1);
    assert.equal(summary.counts.withScreenshots, 1);
    assert.equal(summary.missedTrades.opportunityR, 2);
    assert.equal(summary.accountRules.target.remaining, 520);
    assert.equal((await fetch(base + '/summary?accountId=zzz', { headers: auth })).status, 404);
    assert.equal((await fetch(base + '/summary?bogus=1', { headers: auth })).status, 400);
  } finally { server.close(); }
  const unverified = await serve(fakePool({ verified: false }));
  try { assert.equal((await fetch(unverified.base + '/me', { headers: { Authorization: 'Bearer ' + KEY } })).status, 403); }
  finally { unverified.server.close(); }
});

test('key management needs a session and the journal origin', async () => {
  const pool = fakePool();
  const { server, base } = await serve(pool);
  const root = base.replace('/v1', '');
  try {
    assert.equal((await fetch(root + '/ai-keys')).status, 401);
    assert.equal((await fetch(root + '/ai-keys', { method: 'POST', headers: { Origin: 'https://evil.test', 'Content-Type': 'application/json' }, body: '{"name":"x"}' })).status, 403);
    // An API key must never manage keys or reach cookie-only routes.
    assert.equal((await fetch(root + '/ai-keys', { headers: { Authorization: 'Bearer ' + KEY } })).status, 401);
    assert.equal((await fetch(root + '/records/trades', { headers: { Authorization: 'Bearer ' + KEY } })).status, 401);
  } finally { server.close(); }
});
