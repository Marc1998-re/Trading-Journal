import test from 'node:test';
import assert from 'node:assert/strict';
import { getTradeRiskBasis, getTradeRiskAmount, buildProcessedTrades, calculateAdvancedStats } from '../apps/web/src/lib/tradeCalculations.js';
import { buildRDistribution, buildRollingExpectancy, buildReviewComparison, summarizeRiskSources } from '../apps/web/src/lib/riskAnalysis.js';
import { tradesToCsv } from '../apps/web/src/lib/tradeExport.js';
import { selectPeriodTrades } from '../apps/web/src/lib/journalPeriod.js';

const trade = (profitLoss, extra = {}) => ({ profitLoss, riskAmount: 100, entryDate: '2026-08-01', entryTime: '12:00', ...extra });
const mixed = [
  trade(200, { fees: 4, commissionPercentage: 10 }),
  trade(-100, { riskAmount: 0, rrSecured: -1 }),
  trade(50, { riskAmount: null, accountId: 'a', stopLoss: 1 }),
  trade(10, { riskAmount: null }),
];
const processed = () => buildProcessedTrades(mixed, { a: 10000 });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test('risk provenance follows stored, reconstructed, estimated, missing priority', () => {
  assert.deepEqual(getTradeRiskBasis(trade(500, { rrSecured: 2, stopLoss: 1, accountId: 'a' }), { a: 20000 }), { amount: 100, source: 'stored' });
  assert.deepEqual(getTradeRiskBasis(trade(-300, { riskAmount: 0, rrSecured: -2, accountId: 'a', stopLoss: 1 }), { a: 20000 }), { amount: 150, source: 'reconstructed' });
  assert.deepEqual(getTradeRiskBasis(trade(0, { riskAmount: null, stopLoss: 1, accountId: 'a' }), { a: 20000 }), { amount: 200, source: 'estimated' });
  assert.deepEqual(getTradeRiskBasis(trade(0, { riskAmount: null })), { amount: null, source: 'missing' });
  assert.deepEqual(getTradeRiskBasis(null), { amount: null, source: 'missing' });
  assert.equal(getTradeRiskAmount(trade(10, { riskAmount: '125' })), 125);
  assert.equal(getTradeRiskBasis(trade(200, { riskAmount: null, riskRewardRatio: 2 })).source, 'reconstructed');
});

test('invalid risk values and non-finite reconstructions never become valid data', () => {
  for (const value of [null, undefined, '', ' ', false, true, -100, 0, NaN, Infinity, 'bad']) {
    assert.equal(getTradeRiskBasis(trade(0, { riskAmount: value })).source, 'missing');
  }
  for (const extra of [{ profitLoss: Infinity, rrSecured: 1 }, { profitLoss: 100, rrSecured: Infinity }, { profitLoss: 100, rrSecured: -1 }, { profitLoss: 1e308, rrSecured: 1e-308 }]) {
    assert.equal(getTradeRiskBasis({ riskAmount: null, ...extra }).source, 'missing');
  }
  assert.equal(getTradeRiskBasis({ accountId: 'a', stopLoss: -1 }, { a: -10000 }).source, 'missing');
  assert.equal(getTradeRiskBasis({ accountId: 'a', stopLoss: Infinity }, { a: 10000 }).source, 'missing');
  assert.equal(buildProcessedTrades([trade(1e308, { riskAmount: 1e-308 })])[0].netR, null);
});

test('risk amount average excludes missing values and exposes its denominator', () => {
  const stats = calculateAdvancedStats([trade(50), trade(20, { riskAmount: null })]);
  assert.equal(stats.avgStopLossAmount, 100);
  assert.equal(stats.riskSampleSize, 1);
  assert.equal(stats.expectancyR, 0.5);
  for (const rows of [[], [trade(10, { riskAmount: 0 })]]) {
    assert.equal(calculateAdvancedStats(rows).avgStopLossAmount, null);
    assert.equal(calculateAdvancedStats(rows).riskSampleSize, 0);
  }
});

test('R scopes apply consistently without dropping cash PnL or treating missing as zero', () => {
  const items = processed();
  assert.deepEqual(summarizeRiskSources(items), { stored: 1, reconstructed: 1, estimated: 1, missing: 1 });
  const all = buildRDistribution(items), derived = buildRDistribution(items, 'derived'), stored = buildRDistribution(items, 'stored');
  assert.equal(all.count, 3); assert.equal(all.excluded, 1); close(all.mean, 1.26 / 3);
  assert.equal(derived.count, 2); assert.equal(derived.excluded, 2); close(derived.mean, 0.38);
  assert.equal(stored.count, 1); assert.equal(stored.excluded, 3); close(stored.mean, 1.76);
  assert.equal(items.reduce((sum, item) => sum + item.netProfit, 0), 136);
});

test('histogram boundaries cover each observation once including zero and outliers', () => {
  const values = [-100, -2, -1.001, -1, -0.001, 0, 0.001, 0.99, 1, 1.99, 2, 2.99, 3, 100];
  const result = buildRDistribution(buildProcessedTrades(values.map(r => trade(r * 100))));
  assert.deepEqual(result.bins.map(bin => bin.count), [1, 2, 2, 1, 2, 2, 2, 2]);
  assert.equal(result.bins.reduce((sum, bin) => sum + bin.count, 0), values.length);
  assert.equal(result.median, 0.4955);
});

test('R median and interpolated quartiles are correct for even, odd and singleton sets', () => {
  const dist = values => buildRDistribution(buildProcessedTrades(values.map(r => trade(r * 100))));
  assert.equal(dist([0, 1, 2, 3]).q1, 0.75);
  assert.equal(dist([0, 1, 2, 3]).q3, 2.25);
  assert.equal(dist([0, 1, 2, 3]).median, 1.5);
  assert.equal(dist([9, -1, 1]).median, 1);
  assert.equal(dist([-1]).q1, -1);
  assert.equal(dist([-1]).q3, -1);
  for (const rows of [[], buildProcessedTrades([trade(1, { riskAmount: 0 })])]) {
    assert.equal(buildRDistribution(rows).mean, null);
    assert.equal(buildRDistribution(rows).median, null);
    assert.equal(buildRDistribution(rows).q1, null);
  }
});

const sequence = count => Array.from({ length: count }, (_, i) => trade((i + 1) * 100, { entryDate: `2026-08-${String(Math.floor(i / 3) + 1).padStart(2, '0')}`, entryTime: `${String(9 + i % 3).padStart(2, '0')}:00` }));
test('rolling windows include exactly the last k dated trades, never backfill missing risk', () => {
  const trades = sequence(21);
  trades[0].profitLoss = 100000;
  trades[20].riskAmount = null;
  const result = buildRollingExpectancy(buildProcessedTrades(trades));
  assert.ok(result.points.slice(0, 19).every(point => point.mean === null && !point.complete));
  assert.equal(result.latest.windowCount, 20);
  assert.equal(result.latest.rCount, 19);
  assert.equal(result.latest.excluded, 1);
  close(result.latest.mean, 11);
});
test('rolling source filters, invalid dates, 50-trade window and no-risk windows', () => {
  const trades = sequence(50);
  trades[49] = trade(100, { ...trades[49], riskAmount: null, rrSecured: 50 });
  const result = buildRollingExpectancy(buildProcessedTrades([...trades, trade(100, { entryDate: 'invalid' })]), 50, 'stored');
  assert.equal(result.excludedDates, 1); assert.equal(result.latest.rCount, 49); assert.equal(result.latest.mean, 25);
  const reversed = buildRollingExpectancy([...buildProcessedTrades(trades)].reverse(), 50, 'stored');
  assert.deepEqual(reversed.points, result.points);
  assert.equal(buildRollingExpectancy([], 20).latest, null);
  assert.ok(buildRollingExpectancy(buildProcessedTrades(sequence(25).map(t => ({ ...t, riskAmount: null })))).points.every(p => p.mean === null));
  assert.throws(() => buildRollingExpectancy([], 0));
});
test('review comparisons use completed reviews only and keep unanswered separate', () => {
  const trades = [
    trade(100, { reviewStatus: 'completed', reviewSetup: 'yes', reviewRisk: 'no' }),
    trade(50, { reviewStatus: 'completed', reviewSetup: 'yes', riskAmount: null }),
    trade(-100, { reviewStatus: 'completed', reviewSetup: 'no', reviewRisk: 'yes' }),
    trade(20, { reviewStatus: 'completed' }),
    trade(0, { reviewStatus: 'completed', reviewSetup: 'na' }),
    trade(999, { reviewStatus: 'draft', reviewSetup: 'yes' }), trade(999),
  ];
  const result = buildReviewComparison(buildProcessedTrades(trades));
  assert.equal(result.completed, 5); assert.equal(result.excluded, 2);
  assert.deepEqual(result.groups.map(g => g.trades), [2, 1, 1, 1]);
  assert.equal(result.groups[0].netPnL, 150); assert.equal(result.groups[0].rCount, 1);
  assert.equal(result.groups[0].mean, 1); assert.equal(result.groups[0].median, 1);
  assert.equal(result.groups.reduce((sum, g) => sum + g.netPnL, 0), 70);
  assert.deepEqual(buildReviewComparison(buildProcessedTrades(trades), 'reviewRisk').groups.map(g => g.trades), [1, 1, 3, 0]);
});
test('review R filtering does not filter monetary group results and empty means stay null', () => {
  const items = buildProcessedTrades(mixed.map(t => ({ ...t, reviewStatus: 'completed', reviewSetup: 'yes' })), { a: 10000 });
  for (const [scope, count] of [['all', 3], ['derived', 2], ['stored', 1]]) {
    const group = buildReviewComparison(items, 'reviewSetup', scope).groups[0];
    assert.equal(group.rCount, count); assert.equal(group.trades, 4); assert.equal(group.netPnL, 136);
  }
  assert.ok(buildReviewComparison([]).groups.every(g => g.mean === null && g.median === null && !g.trades));
  assert.throws(() => buildReviewComparison([], 'notes'));
});
test('a finished review becomes eligible and reopening removes it from the comparison', () => {
  const row = trade(100, { reviewSetup: 'yes', reviewLesson: 'lesson', reviewAction: 'action' });
  assert.equal(buildReviewComparison(buildProcessedTrades([row])).completed, 0);
  assert.equal(buildReviewComparison(buildProcessedTrades([{ ...row, reviewStatus: 'completed' }])).completed, 1);
  assert.equal(buildReviewComparison(buildProcessedTrades([{ ...row, reviewStatus: 'draft' }])).completed, 0);
});
test('new analyses only use trades supplied by the selected period', () => {
  const trades = [...sequence(21), trade(90000, { entryDate: '2026-07-01' })];
  const selected = selectPeriodTrades(trades, { range: 'month', month: new Date(2026, 7, 1) }, 10000, {});
  const items = buildProcessedTrades(selected.trades);
  assert.equal(items.length, 21);
  close(buildRDistribution(items).mean, 11);
  close(buildRollingExpectancy(items).latest.mean, 11.5);
});
test('CSV appends risk provenance without implying missing risk is zero', () => {
  const csv = tradesToCsv(mixed, { a: 10000 });
  assert.ok(csv.split('\r\n')[0].endsWith('"Risikobasis"'));
  assert.deepEqual(csv.split('\r\n').slice(1).map(row => row.split(';').at(-1)), ['"Gespeichert"', '"Rekonstruiert"', '"Geschätzt"', '"Fehlend"']);
  assert.equal(csv.split('\r\n')[4].split(';')[8], '""');
});
