import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { metricHelp, metricHelpKeys } from '../apps/web/src/lib/metricHelp.js';
import { buildProcessedTrades, calculateAdvancedStats, calculateReturnPercentage, getTradeRiskBasis } from '../apps/web/src/lib/tradeCalculations.js';
import { buildRDistribution } from '../apps/web/src/lib/riskAnalysis.js';

test('every help entry includes a concise meaning, calculation and interpretation', () => {
  for (const [key, help] of Object.entries(metricHelp)) {
    for (const field of ['title', 'meaning', 'calculation', 'reading']) {
      assert.ok(typeof help[field] === 'string' && help[field].trim().length > 5, `${key}.${field}`);
    }
    assert.ok(Object.values(help).join(' ').split(/\s+/).length <= 135, `${key} is too long for a tooltip`);
    assert.notEqual(help.calculation, help.title);
  }
});

test('all journal metric labels and literal help keys resolve to an explanation', () => {
  const dirs = ['pages', 'components/journal'].map(dir => new URL(`../apps/web/src/${dir}/`, import.meta.url));
  const sources = dirs.flatMap(dir => readdirSync(dir).filter(name => name.endsWith('.jsx')).map(name => readFileSync(new URL(name, dir), 'utf8')));
  for (const source of sources) {
    for (const [, label] of source.matchAll(/<Metric\s+label="([^"]+)"/g)) {
      assert.ok(metricHelp[metricHelpKeys[label]], `Missing explanation for ${label}`);
    }
    for (const [, key] of source.matchAll(/helpKey="([^"]+)"/g)) assert.ok(metricHelp[key], `Missing help key ${key}`);
  }
  for (const key of Object.values(metricHelpKeys)) assert.ok(metricHelp[key]);
  for (const source of ['stored', 'reconstructed', 'estimated', 'missing']) assert.ok(metricHelp[`risk_${source}`]);
});

const trade = (profitLoss, extra = {}) => ({ profitLoss, riskAmount: 100, entryDate: '2026-08-01', ...extra });
test('published R, median, return and reconstructed-risk examples match actual calculations', () => {
  const distribution = buildRDistribution(buildProcessedTrades([-100, 50, 500].map(value => trade(value))));
  assert.equal(distribution.median, 0.5);
  assert.equal(distribution.mean, 1.5);
  assert.equal(buildProcessedTrades([trade(150)])[0].netR, 1.5);
  assert.equal(calculateReturnPercentage(500, 10000), 5);
  assert.equal(getTradeRiskBasis(trade(200, { riskAmount: null, rrSecured: 2 })).amount, 100);
  const stats = calculateAdvancedStats([trade(150), trade(-100)]);
  assert.equal(stats.profitFactor, 1.5);
  assert.equal(stats.expectancy, 25);
});

test('explanations distinguish missing risk, historical estimates and sample coverage', () => {
  assert.match(metricHelp.expectancyR.calculation, /nicht als 0 R/);
  assert.match(metricHelp.totalR.reading, /nicht 10 %/);
  assert.match(metricHelp.returnPct.reading, /Ohne positives Startkapital/);
  assert.match(metricHelp.totalCoverage.calculation, /Filter|Analysefilter/);
  assert.match(metricHelp.rolling.reading, /nicht durch ältere Trades ersetzt/);
  assert.match(metricHelp.wilson.calculation, /1,96/);
  assert.match(metricHelp.wilson.calculation, /√/);
});

test('metric unit switching also switches the explanation', () => {
  const source = readFileSync(new URL('../apps/web/src/components/journal/JournalUI.jsx', import.meta.url), 'utf8');
  assert.match(source, /helpKey=\{percentage\?'returnPct':'netPnl'\}/);
  assert.doesNotMatch(source, /title=\{`Berechnung:/);
});
