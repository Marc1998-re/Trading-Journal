import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const page = readFileSync(new URL('../apps/web/src/pages/HomePage.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../apps/web/src/landing.css', import.meta.url), 'utf8');

test('each product view has actual desktop and mobile assets in both themes', () => {
  const ids = [...page.matchAll(/\{ id: '(overview|analysis|review)'/g)].map(match => match[1]);
  assert.deepEqual(ids, ['overview', 'analysis', 'review']);
  for (const id of ids) for (const theme of ['light', 'dark']) for (const device of ['desktop', 'mobile']) {
    const path = new URL(`../apps/web/public/assets/product-${id}-${theme}-${device}.webp`, import.meta.url);
    const buffer = readFileSync(path);
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
    assert.ok(statSync(path).size > 5000, `${id}/${theme}/${device} should not be an empty placeholder`);
  }
  assert.match(page, /<source media="\(max-width: 767px\)"/);
  assert.match(css, /aspect-ratio: 390 \/ 844/);
  assert.doesNotMatch(page, /journal-preview\.webp|journal-analysis\.webp|journal-review\.webp/);
});

test('preview appearance is local state and does not change the saved journal theme', () => {
  assert.match(page, /\[previewTheme, setPreviewTheme\] = useState\('light'\)/);
  assert.match(page, /aria-pressed=\{previewTheme === value\}/);
  assert.doesNotMatch(page, /useTheme|localStorage|setTheme\(/);
  assert.match(page, /aria-label="Farbschema der Produktvorschau"/);
});

test('landing copy describes current features and their limits without claiming imports', () => {
  for (const phrase of ['Euro oder Prozent', '20 oder 50 Trades', 'Lern-Tags', 'CSV exportieren', 'Nach dem Einstiegsdatum', 'Dateiimport ist noch nicht verfügbar', 'Ein- und Auszahlungen', 'Fiktive Demodaten']) assert.ok(page.includes(phrase), phrase);
  for (const route of ['/demo', '/demo/analysis', '/demo/review']) assert.ok(page.includes(`path: '${route}'`));
  assert.match(page, /<DeskSculpture appearance="light"/);
});

test('landing section links stay within the router history used by the review guard', () => {
  const header = readFileSync(new URL('../apps/web/src/components/Header.jsx', import.meta.url), 'utf8');
  const scroll = readFileSync(new URL('../apps/web/src/components/ScrollToTop.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page + header, /href="#(?:journal|methode|fragen)"/);
  for (const section of ['journal', 'methode', 'fragen']) assert.ok(header.includes(`to="#${section}"`));
  assert.match(page, /<Link to="#journal" className="hero-scroll"/);
  assert.match(scroll, /getElementById\(hash.slice\(1\)\)\?\.scrollIntoView\(\)/);
});
