import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAdvancedStats } from '../apps/web/src/lib/tradeCalculations.js';
import { sessionOf, holdingMinutes, formatDuration, buildProBreakdowns, calculateExecutionStats, calculateDisciplineStats, summarizeMissedTrades } from '../apps/web/src/lib/proJournal.js';
import { evaluateAccountRules, hasRules } from '../apps/web/src/lib/accountRules.js';
import { validateRecord } from '../apps/api/src/validation.mjs';

const trade = (p, extra = {}) => ({ accountId: 'a', profitLoss: p, riskAmount: 100, entryDate: '2026-08-03', entryTime: '10:00', fees: 0, ...extra });

test('SQN, R spread and Kelly follow their definitions', () => {
  const s = calculateAdvancedStats([trade(200), trade(-100, { entryTime: '11:00' }), trade(200, { entryTime: '12:00' }), trade(-100, { entryTime: '13:00' })]);
  // R values 2, -1, 2, -1: mean 0.5, sample sd = sqrt(3) ≈ 1.732
  assert.ok(Math.abs(s.rStdDev - Math.sqrt(3)) < 1e-9);
  assert.ok(Math.abs(s.sqn - 2 * 0.5 / Math.sqrt(3)) < 1e-9);
  // Win rate 50 %, payoff 2 → 0.5 − 0.5 / 2 = 25 %
  assert.ok(Math.abs(s.kelly - 25) < 1e-9);
  assert.equal(s.tradingDays, 1);
  assert.equal(s.avgTradesPerDay, 4);
  assert.equal(calculateAdvancedStats([]).sqn, null);
});

test('sessions and holding time use local entry and exit', () => {
  assert.equal(sessionOf('08:59').key, 'asia');
  assert.equal(sessionOf('09:00').key, 'london');
  assert.equal(sessionOf('15:30').key, 'newyork');
  assert.equal(sessionOf(''), null);
  assert.equal(holdingMinutes(trade(1, { exitDate: '2026-08-03', exitTime: '11:30' })), 90);
  assert.equal(holdingMinutes(trade(1, { exitDate: '2026-08-04', exitTime: '10:00' })), 1440);
  assert.equal(holdingMinutes(trade(1, { exitDate: '2026-08-03', exitTime: '09:00' })), null);
  assert.equal(holdingMinutes(trade(1)), null);
  assert.equal(formatDuration(90), '1 Std. 30 Min.');
});

test('breakdowns group by grade, side and emotion without inventing missing values', () => {
  const b = buildProBreakdowns([trade(200, { grade: 'A', side: 'long', emotion: 'calm' }), trade(-100, { grade: 'C', side: 'Short', emotion: 'fomo' }), trade(50)]);
  assert.deepEqual(b.grade.map(g => g.key), ['A', 'C']);
  assert.deepEqual(b.side.map(g => g.key), ['Long', 'Short']);
  assert.equal(b.emotion.find(g => g.key === 'fomo').avgR, -1);
  assert.equal(b.grade.reduce((s, g) => s + g.trades, 0), 2);
});

test('execution stats measure capture and give-back from MFE', () => {
  const e = calculateExecutionStats([trade(200, { mfe: 4, plannedRR: 2 }), trade(-100, { mfe: 1.5, mae: 1 }), trade(100, { plannedRR: 3 })]);
  assert.equal(e.captureRatio, 0.5);
  assert.equal(e.gaveBack, 1);
  assert.equal(e.stoppedFull, 1);
  assert.equal(e.targetHitRate, 50);
});

test('discipline ignores unrated reviews', () => {
  const d = calculateDisciplineStats([{ reviewStatus: 'completed', reviewSetup: 'yes', reviewRisk: 'na' }, { reviewStatus: 'completed', reviewSetup: 'no' }, { reviewStatus: 'draft', reviewSetup: 'no' }]);
  assert.equal(d.setupAdherence, 50);
  assert.equal(d.riskAdherence, null);
  assert.ok(Math.abs(d.reviewRate - 200 / 3) < 1e-9);
});

test('missed trades separate disciplined skips from costly misses', () => {
  const s = summarizeMissedTrades([
    { decision: 'valid', reason: 'rules', potentialR: -1 }, { decision: 'valid', reason: 'news', potentialR: 2 },
    { decision: 'missed', reason: 'hesitation', potentialR: 3 }, { decision: 'missed', reason: 'fear', potentialR: null },
  ]);
  assert.equal(s.total, 4);
  assert.equal(s.disciplineRate, 50);
  assert.equal(s.opportunityR, 3);
  assert.equal(s.opportunityCount, 1);
  assert.equal(s.avoidedR, 1);
  assert.equal(s.validWouldWinR, 2);
});

test('prop rules: static floor, daily limit and target', () => {
  const account = { id: 'a', startingBalance: 10000, accountType: 'prop', dailyLossLimit: 500, maxLoss: 1000, profitTarget: 1000 };
  const r = evaluateAccountRules(account, [trade(-300, { entryDate: '2026-08-03' }), trade(-250, { entryDate: '2026-08-03', entryTime: '11:00' }), trade(400, { entryDate: '2026-08-04' })], new Date(2026, 7, 4, 15));
  assert.equal(r.balance, 9850);
  assert.equal(r.drawdown.floor, 9000);
  assert.equal(r.drawdown.distance, 850);
  assert.equal(r.drawdown.closest, 450);
  assert.equal(r.daily.breaches, 1);
  assert.equal(r.daily.today, 400);
  assert.equal(r.daily.remaining, 500);
  assert.equal(r.target.reached, false);
  assert.equal(hasRules({ startingBalance: 1 }), false);
});

test('trailing drawdown follows the peak and stops at the starting balance', () => {
  const account = { id: 'a', startingBalance: 10000, maxLoss: 500, drawdownMode: 'trailing' };
  const r = evaluateAccountRules(account, [trade(300), trade(900, { entryTime: '11:00' }), trade(-200, { entryTime: '12:00' })]);
  assert.equal(r.drawdown.floor, 10000);
  assert.equal(r.drawdown.distance, 1000);
  const small = evaluateAccountRules(account, [trade(300), trade(-700, { entryTime: '11:00' })]);
  assert.equal(small.drawdown.floor, 9800);
  assert.equal(small.drawdown.breached, true);
});

test('private accounts track risk per trade and trades per day', () => {
  const r = evaluateAccountRules({ id: 'a', startingBalance: 10000, maxRiskPerTrade: 1, maxTradesPerDay: 2 }, [trade(10, { riskAmount: 150 }), trade(10, { entryTime: '11:00' }), trade(10, { entryTime: '12:00' })]);
  assert.equal(r.risk.breaches, 1);
  assert.equal(r.activity.breaches, 1);
  assert.equal(r.daily, null);
});

test('API validates professional fields, missed trades and account rules', () => {
  const base = { accountId: 'a1', symbol: 'eurusd', entryDate: '2026-10-05', entryTime: '09:30', riskAmount: 100, profitLoss: 50 };
  assert.equal(validateRecord('trades', { ...base, exitDate: '', exitTime: '' }, 'u').exitDate, null);
  for (const patch of [{ exitDate: '2026-10-04' }, { exitDate: '2026-10-05', exitTime: '09:00' }, { grade: 'D' }, { emotion: 'angry' }, { confidence: 6 }, { mfe: -1 }]) {
    assert.throws(() => validateRecord('trades', { ...base, ...patch }, 'u'), undefined, JSON.stringify(patch));
  }
  const missed = validateRecord('missedTrades', { accountId: 'a1', symbol: 'nq', entryDate: '2026-10-05', entryTime: '15:30', reason: 'news', decision: 'valid', potentialR: -1 }, 'u');
  assert.equal(missed.symbol, 'NQ');
  assert.throws(() => validateRecord('missedTrades', { accountId: 'a1', symbol: 'nq', entryDate: '2026-10-05', entryTime: '15:30', reason: 'luck' }, 'u'));
  const account = validateRecord('tradingAccounts', { accountName: 'FTMO', startingBalance: 100000, accountType: 'prop', dailyLossLimit: 5000, maxLoss: 10000, drawdownMode: 'trailing' }, 'u');
  assert.equal(account.accountType, 'prop');
  assert.equal(validateRecord('tradingAccounts', { accountName: 'Privat', startingBalance: 5000 }, 'u').accountType, 'private');
  assert.throws(() => validateRecord('tradingAccounts', { accountName: 'X', startingBalance: 1, maxRiskPerTrade: 0 }, 'u'));
});
