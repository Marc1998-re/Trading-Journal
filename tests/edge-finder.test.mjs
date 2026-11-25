import test from 'node:test';
import assert from 'node:assert/strict';
import { findEdges } from '../apps/web/src/lib/edgeFinder.js';
import { simulateChallenge } from '../apps/web/src/lib/challengeSim.js';
import { evaluateAccountRules } from '../apps/web/src/lib/accountRules.js';
import { demoTrades, demoAccounts } from '../apps/web/src/lib/demoData.js';

const trade = (id, day, time, r, extra = {}) => ({ id, accountId: 'a', symbol: 'NQ', entryDate: `2026-10-${String(day).padStart(2, '0')}`, entryTime: time, riskAmount: 100, profitLoss: r * 100, fees: 0, commissionPercentage: 0, setup: 'ORB', ...extra });

test('edge finder quantifies overtrading and trades right after a loss', () => {
  const trades = [];
  for (let day = 1; day <= 10; day++) {
    trades.push(trade(`${day}a`, day, '09:30', 2), trade(`${day}b`, day, '10:30', -1), trade(`${day}c`, day, '15:30', -1));
  }
  const edges = findEdges(trades, { a: 10000 });
  assert.equal(edges.total.netPnL, 0);
  const late = edges.leaks.find(leak => leak.kind === 'overtrading');
  assert.equal(late.title, 'Ab dem 2. Trade am Tag');
  assert.equal(late.trades, 20);
  assert.equal(late.netPnL, -2000);
  assert.equal(late.withoutPnL, 2000);
  assert.equal(late.totalR, -20);
  assert.equal(late.advice, 'Nach 1 Trades am Tag aufhören.');
  const afterLoss = edges.leaks.find(leak => leak.kind === 'afterLoss');
  assert.equal(afterLoss.trades, 10, 'only the third trade follows a loss');
  assert.equal(afterLoss.netPnL, -1000);
  assert.equal(edges.leaks[0].kind, 'overtrading', 'largest loss first');
});

test('edge finder ignores small groups and reports strengths above the average', () => {
  const trades = [];
  for (let i = 0; i < 12; i++) trades.push(trade('g' + i, i + 1, '09:30', 2, { setup: 'Gut', symbol: 'ES' }));
  for (let i = 0; i < 12; i++) trades.push(trade('s' + i, i + 1, '15:30', -0.5, { setup: 'Schwach', symbol: 'ES' }));
  for (let i = 0; i < 3; i++) trades.push(trade('x' + i, 20 + i, '09:30', -5, { setup: 'Selten', symbol: 'ES' }));
  const edges = findEdges(trades, { a: 10000 });
  assert.equal(edges.leaks.some(leak => leak.key === 'Selten'), false, 'three trades are below the minimum sample');
  assert.equal(edges.leaks.find(leak => leak.kind === 'setup').key, 'Schwach');
  assert.equal(edges.strengths[0].key, 'Gut');
  assert.equal(edges.strengths[0].sample, 'medium');
  assert.equal(findEdges(trades.slice(0, 4), { a: 10000 }).enough, false);
  assert.ok(findEdges(demoTrades, { 'demo-account': 10000 }).leaks.length > 0, 'the demo shows at least one finding');
});

test('challenge simulation is deterministic and reacts to risk the right way', () => {
  const base = { winRate: 45, reward: 2, riskPct: 1, tradesPerDay: 2, runs: 1500 };
  const a = simulateChallenge(base), b = simulateChallenge(base);
  assert.deepEqual(a, b);
  assert.ok(Math.abs(a.passRate + a.failDailyRate + a.failMaxRate + a.openRate - 100) < 1e-9);
  assert.equal(a.expectancyR.toFixed(2), '0.35');
  assert.equal(a.lossesToDailyLimit, 5);
  assert.equal(a.lossesToMaxLoss, 10);
  assert.ok(a.passRate > 60, 'a positive edge with 1 % risk usually passes');
  assert.ok(simulateChallenge({ ...base, riskPct: 3 }).passRate < a.passRate, 'higher risk lowers the pass rate');
  assert.ok(simulateChallenge({ ...base, winRate: 25 }).passRate < 15, 'a negative edge rarely passes');
  assert.equal(simulateChallenge({ ...base, winRate: 100 }).passRate, 100);
  assert.equal(simulateChallenge({ ...base, winRate: 0 }).passRate, 0);
});

test('account rules report losses left, consistency and pace to the target', () => {
  const account = { id: 'a', startingBalance: 10000, accountType: 'prop', dailyLossLimit: 500, maxLoss: 1000, profitTarget: 1000 };
  const trades = [trade('1', 1, '09:30', 3), trade('2', 2, '09:30', 1), trade('3', 3, '09:30', -1)];
  const r = evaluateAccountRules(account, trades, new Date(2026, 9, 3, 18));
  assert.equal(r.typicalRisk, 100);
  assert.equal(r.daily.remaining, 400);
  assert.equal(r.daily.lossesLeft, 4);
  assert.equal(r.drawdown.lossesLeft, 13);
  assert.equal(r.consistency.share, 100, 'best day 300 of 300 profit');
  assert.equal(r.target.daysLeft, 7, '700 left at 100 per trading day');
  assert.equal(evaluateAccountRules(demoAccounts[0], demoTrades).consistency.share < 50, true);
  assert.equal(evaluateAccountRules(account, []).consistency, null);
});
