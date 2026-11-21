// Account rule monitoring for prop-firm evaluations and self-imposed limits on private capital.
import { buildProcessedTrades, dayKey } from './tradeCalculations.js';

const positive = value => value !== null && value !== undefined && value !== '' && Number(value) > 0 ? Number(value) : null;

export const accountTypeLabels = { private: 'Privatkapital', prop: 'Prop-Firm' };

export function hasRules(account) {
  return Boolean(account && (positive(account.dailyLossLimit) || positive(account.maxLoss) || positive(account.profitTarget) || positive(account.maxRiskPerTrade) || positive(account.maxTradesPerDay)));
}

/**
 * Evaluates all recorded trades of one account against its limits.
 * Uses realized results ordered by entry; open positions and intraday equity are not known.
 */
export function evaluateAccountRules(account, trades, today = new Date()) {
  const start = Number(account.startingBalance) || 0;
  const balances = { [account.id]: start };
  const items = buildProcessedTrades(trades.filter(t => t.accountId === account.id), balances, balances).filter(item => item.date);
  let balance = start, peak = start;
  let lowestFloorDistance = Infinity;
  const maxLoss = positive(account.maxLoss), daily = positive(account.dailyLossLimit), target = positive(account.profitTarget);
  const trailing = account.drawdownMode === 'trailing';
  let floor = maxLoss === null ? null : start - maxLoss;
  const days = new Map();
  for (const item of items) {
    balance += item.netProfit;
    peak = Math.max(peak, balance);
    // Most trailing drawdowns stop trailing once the floor reaches the starting balance.
    if (trailing && maxLoss !== null) floor = Math.max(floor, Math.min(start, peak - maxLoss));
    if (floor !== null) lowestFloorDistance = Math.min(lowestFloorDistance, balance - floor);
    const key = dayKey(item.date);
    const day = days.get(key) || { key, net: 0, trades: 0, maxRiskPct: 0 };
    day.net += item.netProfit; day.trades += 1;
    if (item.stopLossAmount && start > 0) day.maxRiskPct = Math.max(day.maxRiskPct, item.stopLossAmount / start * 100);
    days.set(key, day);
  }
  const dayList = [...days.values()];
  const todayRow = days.get(dayKey(today)) || { key: dayKey(today), net: 0, trades: 0 };
  const worstDay = dayList.reduce((worst, d) => !worst || d.net < worst.net ? d : worst, null);
  const riskLimit = positive(account.maxRiskPerTrade), tradesLimit = positive(account.maxTradesPerDay);
  const riskBreaches = riskLimit === null ? 0 : items.filter(item => item.stopLossAmount && start > 0 && item.stopLossAmount / start * 100 > riskLimit + 1e-9).length;
  const tradeBreaches = tradesLimit === null ? 0 : dayList.filter(d => d.trades > tradesLimit).length;
  const dailyBreaches = daily === null ? 0 : dayList.filter(d => -d.net >= daily).length;
  const profit = balance - start;
  return {
    start, balance, peak, profit, trailing,
    daily: daily === null ? null : { limit: daily, today: todayRow.net, used: Math.max(0, -todayRow.net), remaining: daily + Math.min(0, todayRow.net), worst: worstDay?.net ?? 0, breaches: dailyBreaches, todayTrades: todayRow.trades },
    drawdown: maxLoss === null ? null : { limit: maxLoss, floor, distance: balance - floor, used: Math.max(0, maxLoss - (balance - floor)), closest: Number.isFinite(lowestFloorDistance) ? lowestFloorDistance : maxLoss, breached: Number.isFinite(lowestFloorDistance) && lowestFloorDistance <= 0 },
    target: target === null ? null : { goal: target, progress: profit / target * 100, remaining: Math.max(0, target - profit), reached: profit >= target },
    risk: riskLimit === null ? null : { limit: riskLimit, breaches: riskBreaches, trades: items.length },
    activity: tradesLimit === null ? null : { limit: tradesLimit, breaches: tradeBreaches, today: todayRow.trades, days: dayList.length },
  };
}

// Traffic light for a limit utilisation in percent: green < 50, amber < 80, red otherwise.
export const usageTone = pct => pct >= 80 ? 'destructive' : pct >= 50 ? 'warning' : 'success';
