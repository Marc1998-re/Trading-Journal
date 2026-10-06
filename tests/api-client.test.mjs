import test from 'node:test';
import assert from 'node:assert/strict';
import { createJournalApiClient } from '../apps/web/src/lib/journalApiClient.js';

test('API client uses cookie credentials and never persists an authentication token', async () => {
  let captured;
  const client = createJournalApiClient('/api', async (url, options) => { captured = { url, options }; return Response.json({ record: { id: 'user', verified: true } }); });
  const notifications = [];
  const unsubscribe = client.authStore.onChange((_token, record) => notifications.push(record));
  await client.collection('users').authWithPassword('user@example.com', 'password');
  assert.equal(captured.options.credentials, 'same-origin');
  assert.equal(captured.options.headers.Authorization, undefined);
  assert.equal(client.authStore.token, '');
  assert.equal(client.authStore.isValid, true);
  assert.equal(captured.url, '/api/auth/login');
  client.authStore.clear(); unsubscribe();
  assert.equal(notifications.length, 2);
});

test('full-list loading fetches all pages, including more than 500 trades', async () => {
  const pages = [];
  const client = createJournalApiClient('/api', async url => {
    const params = new URL(url, 'http://localhost').searchParams;
    const page = Number(params.get('page'));
    pages.push(page);
    assert.equal(params.get('userId'), 'owner');
    return Response.json({ totalPages: 3, items: Array.from({ length: page === 3 ? 150 : 200 }, (_, index) => ({ id: (page - 1) * 200 + index })) });
  });
  assert.equal((await client.collection('trades').getFullList({ filter: { userId: 'owner' } })).length, 550);
  assert.deepEqual(pages, [1, 2, 3]);
  await assert.rejects(client.collection('trades').getList(1, 20, { filter: 'raw SQL' }));
});

test('failed logout keeps local user until the server acknowledges revocation', async () => {
  const client = createJournalApiClient('/api', async () => Response.json({ message: 'Unavailable' }, { status: 503 }));
  client.authStore.save('', { id: 'user' });
  await assert.rejects(client.logout(), error => error.status === 503);
  assert.equal(client.authStore.isValid, true);
});

test('HTML gateway errors retain HTTP status without rendering raw server output', async () => {
  const client = createJournalApiClient('/api', async () => new Response('<html>private gateway detail</html>', { status: 502 }));
  await assert.rejects(client.collection('users').authRefresh(), error => error.status === 502 && !error.message.includes('private'));
});

test('account reassignment and user deletion each use one server-side operation', async () => {
  const calls = [];
  const client = createJournalApiClient('/api', async (url, options) => { calls.push({ url, options }); return new Response(null, { status: 204 }); });
  await client.moveAndDeleteAccount('source', 'target');
  await client.deleteUser('my password');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, '/api/accounts/source/move-and-delete');
  assert.equal(calls[1].url, '/api/users/me');
});
