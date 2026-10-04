import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCopyRequest, reviewCopy, validateSuggestions, MAX_TOKENS, DEFAULT_MODEL } from '../scripts/lib/claude-copy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const entries = [{ id: 'dashboard.subtitle', original: 'Deine Trades.', context: 'Untertitel', maxLength: 60, file: 'apps/web/src/pages/DashboardPage.jsx' }];
const suggestion = { summary: 'Klarer benannt.', improvements: [{ id: entries[0].id, suggestion: 'Deine Trades im Überblick.', reason: 'Beschreibt den Inhalt konkret.' }] };
const response = (overrides = {}) => ({ ok: true, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(suggestion) }], usage: { input_tokens: 80, output_tokens: 50 }, ...overrides }) });

test('Claude request contains only reviewed copy fields and a bounded structured response', () => {
  const body = buildCopyRequest([{ ...entries[0], apiKey: 'secret', notes: 'private trade', accountBalance: 123 }]);
  assert.equal(body.model, DEFAULT_MODEL);
  assert.equal(body.max_tokens, MAX_TOKENS);
  assert.equal(body.output_config.format.type, 'json_schema');
  assert.equal(body.messages.length, 1);
  assert.deepEqual(Object.keys(JSON.parse(body.messages[0].content).entries[0]), ['id', 'original', 'context', 'maxLength']);
  assert.doesNotMatch(JSON.stringify(body), /secret|private trade|accountBalance|DashboardPage/);
  assert.equal(body.tools, undefined);
});

test('missing key and invalid input fail before any network request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return response(); };
  await assert.rejects(reviewCopy({ entries, fetchImpl }), /ANTHROPIC_API_KEY fehlt/);
  await assert.rejects(reviewCopy({ entries: [], apiKey: 'test', fetchImpl }), /1 bis 40/);
  assert.equal(calls, 0);
  assert.throws(() => buildCopyRequest([entries[0], entries[0]]), /doppelt/);
  assert.throws(() => buildCopyRequest(entries, 'https://untrusted.example'), /Modell-ID/);
  assert.throws(() => buildCopyRequest(Array.from({ length: 40 }, (_, i) => ({ ...entries[0], id: 'test.' + i, original: 'x'.repeat(1000) }))), /Zu viele Zeichen/);
});

test('API call uses fixed HTTPS destination, private header and refuses redirects', async () => {
  let calls = 0;
  const result = await reviewCopy({ entries, apiKey: ' test-key ', fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers['x-api-key'], 'test-key');
    assert.equal(init.headers['anthropic-version'], '2023-06-01');
    assert.ok(init.signal instanceof AbortSignal);
    assert.doesNotMatch(init.body, /test-key/);
    return response();
  } });
  assert.equal(calls, 1);
  assert.equal(result.improvements[0].original, entries[0].original);
  assert.deepEqual(result.usage, { input_tokens: 80, output_tokens: 50 });
});

test('provider failures never echo credentials or retry automatically', async () => {
  for (const status of [400, 401, 402, 403, 404, 429, 500, 529]) {
    let calls = 0;
    await assert.rejects(reviewCopy({ entries, apiKey: 'private-key', fetchImpl: async () => {
      calls++;
      return { ok: false, status, json: async () => { throw new Error('private-key'); } };
    } }), error => error.message.includes('HTTP ' + status) && !error.message.includes('private-key'));
    assert.equal(calls, 1);
  }
  await assert.rejects(reviewCopy({ entries, apiKey: 'private-key', fetchImpl: async () => { throw new Error('private-key'); } }), error => !error.message.includes('private-key') && error.message.includes('Kein automatischer'));
});

test('incomplete, refused and malformed Claude output is rejected', async () => {
  for (const stop_reason of ['max_tokens', 'refusal', 'tool_use', null]) {
    await assert.rejects(reviewCopy({ entries, apiKey: 'test', fetchImpl: async () => response({ stop_reason }) }), /abgebrochen/);
  }
  await assert.rejects(reviewCopy({ entries, apiKey: 'test', fetchImpl: async () => response({ content: [{ type: 'text', text: 'not JSON' }] }) }), /kein gueltiges JSON/);
  assert.throws(() => validateSuggestions({ ...suggestion, improvements: [] }, entries), /vollstaendige/);
  for (const change of [{ id: 'other.id' }, { suggestion: 'x'.repeat(61) }, { suggestion: '<script>bad</script>' }]) {
    assert.throws(() => validateSuggestions({ ...suggestion, improvements: [{ ...suggestion.improvements[0], ...change }] }, entries));
  }
  assert.throws(() => validateSuggestions({ ...suggestion, improvements: [suggestion.improvements[0], suggestion.improvements[0]] }, [entries[0], { ...entries[0], id: 'other.id' }]));
});

test('insufficient API credits produce a clear error without exposing provider details', async () => {
  let calls = 0;
  await assert.rejects(reviewCopy({ entries, apiKey: 'private-key', fetchImpl: async () => {
    calls++;
    return { ok: false, status: 400, json: async () => ({ error: {
      message: 'Your credit balance is too low to access the Anthropic API. private-key',
    } }) };
  } }), error => error.message.includes('API-Guthaben reicht nicht aus') && !error.message.includes('private-key'));
  assert.equal(calls, 1);
  for (const errorBody of [null, {}, { error: { message: 123 } }, { error: { message: 'private-key' } }]) {
    await assert.rejects(reviewCopy({ entries, apiKey: 'private-key', fetchImpl: async () => ({
      ok: false, status: 400, json: async () => errorBody,
    }) }), error => error.message.includes('Anfrage oder Modellkonfiguration') && !error.message.includes('private-key'));
  }
});

test('catalog originals still exist in source and dry-run exposes no key', () => {
  const catalog = JSON.parse(readFileSync(new URL('../content/copy-review.de.json', import.meta.url), 'utf8'));
  for (const entry of catalog) assert.ok(readFileSync(new URL('../' + entry.file, import.meta.url), 'utf8').includes(entry.original), entry.id);
  const result = spawnSync(process.execPath, ['scripts/claude-copy.mjs', '--dry-run'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: 'never-print-this-test-key' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /never-print-this-test-key/);
  const preview = JSON.parse(result.stdout);
  assert.equal(preview.networkRequest, false);
  assert.equal(JSON.parse(preview.request.messages[0].content).entries.length, catalog.length);
});

test('section selection and safe default CLI do not perform paid calls', () => {
  const run = args => spawnSync(process.execPath, ['scripts/claude-copy.mjs', ...args], { cwd: root, encoding: 'utf8' });
  const preview = run(['--dry-run', '--section=review']);
  assert.equal(preview.status, 0, preview.stderr);
  assert.ok(JSON.parse(JSON.parse(preview.stdout).request.messages[0].content).entries.every(e => e.id.startsWith('review.')));
  assert.notEqual(run(['--dry-run', '--section=unknown']).status, 0);
  assert.notEqual(run(['--dry-run', '--send']).status, 0);
  assert.match(run([]).stdout, /Vorschau ohne API-Aufruf/);
});
