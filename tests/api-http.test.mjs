import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../apps/api/src/app.mjs';
import { readConfig } from '../apps/api/src/config.mjs';

test('HTTP boundary: anonymous permissions, Origin, security headers and SPA routing', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'td-http-test-'));
  await writeFile(join(directory, 'index.html'), '<!doctype html><div id="root">Fixture</div>');
  const calls = [];
  const pool = {
    query: async sql => { calls.push(sql); assert.equal(sql, 'SELECT 1'); return [[{ ok: 1 }]]; },
    execute: async () => { throw new Error('Anonymous requests must not query trading data.'); },
  };
  const config = readConfig({ APP_URL: 'http://127.0.0.1:4189', DB_HOST: '127.0.0.1', DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: '' });
  const server = createApp({ pool, config, mailer: {}, staticDir: directory }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const path of ['/api/auth/session', '/api/records/trades', '/api/records/tradingAccounts']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 401);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.ok(response.headers.get('content-security-policy').includes("default-src 'self'"));
      assert.equal(response.headers.get('x-powered-by'), null);
    }
    for (const origin of [null, 'https://foreign.test']) {
      const response = await fetch(base + '/api/auth/logout', { method: 'POST', headers: origin ? { Origin: origin } : {} });
      assert.equal(response.status, 403);
    }
    const malformed = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(malformed.status, 400);
    const logout = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Origin: config.origin } });
    assert.equal(logout.status, 204);
    assert.ok(logout.headers.get('set-cookie').includes('HttpOnly'));
    const health = await fetch(base + '/api/health');
    assert.deepEqual(await health.json(), { ok: true, backend: 'mysql' });
    assert.deepEqual(calls, ['SELECT 1']);
    for (const path of ['/', '/demo/review?trade=fixture', '/verify-pending?token=fixture', '/reset-password']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.ok((await response.text()).includes('Fixture'));
    }
    for (const path of ['/api/unknown', '/assets/missing.js', '/.env', '/database.sql']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404);
      assert.match(response.headers.get('content-type'), /application\/json/);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
