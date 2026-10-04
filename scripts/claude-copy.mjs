import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parseArgs, parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildCopyRequest, reviewCopy, DEFAULT_MODEL } from './lib/claude-copy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const { values } = parseArgs({ options: {
    'dry-run': { type: 'boolean' }, send: { type: 'boolean' },
    section: { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help || (!values['dry-run'] && !values.send)) {
    console.log('npm run copy:preview [-- --section=dashboard]  Vorschau ohne API-Aufruf\nnpm run copy:review [-- --section=dashboard]   Ein kostenpflichtiger Claude-Aufruf\nBereiche: landing, dashboard, analysis, charts, trades, review, login, signup, settings');
  } else {
    if (values['dry-run'] && values.send) throw new Error('Bitte entweder --dry-run oder --send verwenden.');
    const catalog = JSON.parse(await readFile(resolve(root, 'content/copy-review.de.json'), 'utf8'));
    const entries = values.section ? catalog.filter(e => e.id.split('.')[0] === values.section) : catalog;
    let local = {};
    try { local = parseEnv(await readFile(resolve(root, '.env.claude.local'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw new Error('Die lokale Claude-Konfiguration ist nicht lesbar.'); }
    const model = process.env.CLAUDE_MODEL || local.CLAUDE_MODEL || DEFAULT_MODEL;
    const request = buildCopyRequest(entries, model);
    for (const entry of entries) {
      const file = resolve(root, entry.file || '');
      if (!file.startsWith(resolve(root, 'apps/web/src') + sep) || !file.endsWith('.jsx')) throw new Error('Die Textquelle liegt ausserhalb der freigegebenen Oberflaeche.');
      const source = await readFile(file, 'utf8');
      if (!source.includes(entry.original)) throw new Error(`Text ${entry.id} ist veraltet. Bitte den Textkatalog vor dem API-Aufruf aktualisieren.`);
    }
    if (values['dry-run']) {
      console.log(JSON.stringify({ destination: 'https://api.anthropic.com/v1/messages', networkRequest: false, request }, null, 2));
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY || local.ANTHROPIC_API_KEY;
      if (!apiKey?.trim()) throw new Error('ANTHROPIC_API_KEY fehlt. Bitte lokal in .env.claude.local hinterlegen, nicht im Chat.');
      const output = resolve(root, '.claude-reviews');
      await mkdir(output, { recursive: true, mode: 0o700 });
      console.log(`Sende ${entries.length} freigegebene Oberflaechentexte an ${model}. Ein Aufruf, maximal ${request.max_tokens} Ausgabetokens.`);
      const result = await reviewCopy({ entries, apiKey, model });
      const file = resolve(output, `review-${Date.now()}-${randomUUID().slice(0, 8)}.json`);
      await writeFile(file, JSON.stringify({ createdAt: new Date().toISOString(), applied: false, ...result }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      console.log(`Vorschlaege gespeichert: ${file}\nDie Website wurde nicht veraendert. Vorschlaege vor der Uebernahme fachlich und visuell pruefen.`);
      console.log(`API-Nutzung: ${result.usage.input_tokens ?? '?'} Eingabe- / ${result.usage.output_tokens ?? '?'} Ausgabetokens.`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
