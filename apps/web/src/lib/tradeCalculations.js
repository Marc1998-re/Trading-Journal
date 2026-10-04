/**
 * Utility functions for trade calculations including commission adjustments.
 * These functions are designed to work safely with both full and filtered trade arrays.
 */

const getBalance = (trade, map, fallback = 10000) => {
  if (!trade || !trade.accountId) return fallback;
  const value = map[trade.accountId];
  return value !== undefined && value !== null && Number.isFinite(Number(value)) ? Number(value) : fallback;
};

export const calculateStopLossInEuro = (accountSize, stopLossPercentage) => {
  const size = Number(accountSize) || 0;
  const pct = Number(stopLossPercentage) || 0;
  return (size * pct) / 100;
};

export const getTradeGrossProfit = (trade, originalBalances = {}, currentBalances = {}) => {
  if (!trade) return 0;
  
  // Historical results, including zero, must not change with the account balance.
  if (trade.profitLoss !== undefined && trade.profitLoss !== null && trade.profitLoss !== '' && Number.isFinite(Number(trade.profitLoss))) {
    return Number(trade.profitLoss);
  }
  
  // Otherwise calculate from stopLoss percentage and rrSecured
  // Legacy records without a result use the best available historical risk basis.
  const monetarySL = getTradeRiskAmount(trade, originalBalances, currentBalances) || 0;
  return monetarySL * Number(trade.rrSecured || 0);
};

export const calculateCommissionAmount = (profit, commissionPercentage, originalBalances = {}, currentBalances = {}) => {
  const p = Number(profit) || 0;
  const c = Math.min(100, Math.max(0, Number(commissionPercentage) || 0));
  
  // Commission is only applied to winning trades (positive profit)
  if (p <= 0 || c <= 0) return 0;
  
  return p * (c / 100);
};

export const calculateNetProfit = (profit, commissionPercentage, originalBalances = {}, currentBalances = {}) => {
  const p = Number(profit) || 0;
  
  if (p > 0) {
    return p - calculateCommissionAmount(p, commissionPercentage, originalBalances, currentBalances);
  }
  
  // Losing trades remain unchanged
  return p;
};

export const calculateTotalWins = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  
  return trades.reduce((sum, trade) => {
    return sum + Math.max(0, getTradeNetProfit(trade, originalBalances, currentBalances));
  }, 0);
};

export const calculateTotalLosses = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  
  return trades.reduce((sum, trade) => {
    return sum + Math.max(0, -getTradeNetProfit(trade, originalBalances, currentBalances));
  }, 0);
};

export const calculateNetPnL = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  return calculateTotalWins(trades, originalBalances, currentBalances) - calculateTotalLosses(trades, originalBalances, currentBalances);
};

export const calculateTotalCommissionCosts = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  
  return trades.reduce((sum, trade) => {
    return sum + getTradeFees(trade, originalBalances, currentBalances);
  }, 0);
};

export const calculateWinRate = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades) || trades.length === 0) return 0;
  
  const wins = trades.filter(t => {
    return getTradeNetProfit(t, originalBalances, currentBalances) > 0;
  }).length;
  
  return (wins / trades.length) * 100;
};

export const calculateReturnPercentage = (totalProfitLoss, totalBalance) => {
  if ([totalProfitLoss, totalBalance].some(value =>
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim()))) return null;
  const pnl = Number(totalProfitLoss);
  const balance = Number(totalBalance);
  if (!Number.isFinite(pnl) || !Number.isFinite(balance) || balance <= 0) return null;
  const result = (pnl / balance) * 100;
  return Number.isFinite(result) ? result : null;
};

export const calculateMonetaryGain = (totalProfitLoss) => {
  // Total profit loss is already accumulated from scaled per-trade calculations
  return Number(totalProfitLoss) || 0;
};

export const getTradeDate = (trade) => {
  if (!trade) return null;
  const rawDate = trade.entryDate || trade.date || trade.created;
  if (!rawDate) return null;

  const parts = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const time = String(trade.entryTime || trade.time || '12:00').match(/^(\d{2}):(\d{2})/);
  const date = parts ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(time?.[1] ?? 12), Number(time?.[2] ?? 0)) : new Date(rawDate);
  if (parts && (date.getFullYear()!==Number(parts[1]) || date.getMonth()!==Number(parts[2])-1 || date.getDate()!==Number(parts[3]))) return null;
  if (time && (Number(time[1])>23 || Number(time[2])>59)) return null;
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTradeSymbol = (trade) => {
  const symbol = trade?.symbol || trade?.instrument || 'Unknown';
  return String(symbol).trim().toUpperCase() || 'Unknown';
};

export const getTradeNetProfit = (trade, originalBalances = {}, currentBalances = {}) => {
  const gross = getTradeGrossProfit(trade, originalBalances, currentBalances);
  return gross - getTradeFees(trade, originalBalances, currentBalances);
};

export const getTradeFees = (trade, original = {}, current = {}) => {
  const fees = Number(trade?.fees) || 0;
  return Math.max(0, fees) + calculateCommissionAmount(getTradeGrossProfit(trade, original, current), trade?.commissionPercentage);
};

const finiteNumber = value => (typeof value === 'number' || (typeof value === 'string' && value.trim())) && Number.isFinite(Number(value)) ? Number(value) : null;

export const getTradeRiskBasis = (trade, original = {}, current = {}) => {
  if (!trade) return { amount: null, source: 'missing' };
  const stored = finiteNumber(trade.riskAmount);
  if (stored > 0) return { amount: stored, source: 'stored' };
  const r = finiteNumber(trade.rrSecured ?? trade.riskRewardRatio);
  const gross = finiteNumber(trade.profitLoss);
  const reconstructed = r !== null && r !== 0 && gross !== null ? gross / r : null;
  if (Number.isFinite(reconstructed) && reconstructed > 0) return { amount: reconstructed, source: 'reconstructed' };
  const balance = getBalance(trade, original, getBalance(trade, current, 0));
  const stop = finiteNumber(trade.stopLoss);
  const estimated = balance > 0 && stop > 0 ? balance * stop / 100 : null;
  return Number.isFinite(estimated) && estimated > 0 ? { amount: estimated, source: 'estimated' } : { amount: null, source: 'missing' };
};

export const getTradeRiskAmount = (trade, original = {}, current = {}) => getTradeRiskBasis(trade, original, current).amount;

export const buildProcessedTrades = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return [];

  return trades
    .map((trade) => {
      const date = getTradeDate(trade);
      const grossProfit = getTradeGrossProfit(trade, originalBalances, currentBalances);
      const netProfit = getTradeNetProfit(trade, originalBalances, currentBalances);
      const rrSecured = Number(trade.rrSecured ?? trade.riskRewardRatio ?? 0) || 0;
      const stopLoss = Number(trade.stopLoss) || 0;
      const { amount: stopLossAmount, source: riskSource } = getTradeRiskBasis(trade, originalBalances, currentBalances);
      const netR = stopLossAmount > 0 ? netProfit / stopLossAmount : null;

      return {
        trade,
        date,
        symbol: getTradeSymbol(trade),
        grossProfit,
        netProfit,
        rrSecured,
        stopLoss,
        stopLossAmount,
        riskSource,
        netR: Number.isFinite(netR) ? netR : null,
        fees: getTradeFees(trade, originalBalances, currentBalances),
        status: netProfit > 0 ? 'Win' : netProfit < 0 ? 'Loss' : 'Breakeven',
      };
    })
    .sort((a, b) => {
      const aTime = a.date ? a.date.getTime() : 0;
      const bTime = b.date ? b.date.getTime() : 0;
      return aTime - bTime;
    });
};

export const buildEquitySeries = (trades, startingBalance = 10000, originalBalances = {}, currentBalances = {}) => {
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  let balance = Number(startingBalance) || 0;
  let cumulativePnL = 0;
  let peakBalance = balance;
  let peakPnL = 0;

  const series = [
    {
      label: 'Start',
      date: null,
      balance,
      cumulativePnL,
      returnPct: calculateReturnPercentage(0, startingBalance),
      drawdown: 0,
      drawdownPct: 0,
      tradeCount: 0,
    },
  ];

  processedTrades.forEach((item, index) => {
    cumulativePnL += item.netProfit;
    balance += item.netProfit;
    peakBalance = Math.max(peakBalance, balance);
    peakPnL = Math.max(peakPnL, cumulativePnL);

    const drawdown = Math.max(0, peakBalance - balance);
    const drawdownPct = peakBalance > 0 ? (drawdown / peakBalance) * 100 : 0;

    series.push({
      label: item.date ? item.date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : `Trade ${index + 1}`,
      date: item.date,
      balance: Number(balance.toFixed(2)),
      cumulativePnL: Number(cumulativePnL.toFixed(2)),
      returnPct: calculateReturnPercentage(cumulativePnL, startingBalance),
      drawdown: Number(drawdown.toFixed(2)),
      drawdownPct: Number(drawdownPct.toFixed(2)),
      peakPnL: Number(peakPnL.toFixed(2)),
      tradeCount: index + 1,
    });
  });

  return series;
};

const getOutcome = (item) => {
  if (item.netProfit > 0) return 'win';
  if (item.netProfit < 0) return 'loss';
  return 'breakeven';
};

export const calculateStreakStats = (trades, originalBalances = {}, currentBalances = {}) => {
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentType = null;
  let currentCount = 0;
  let activeType = null;
  let activeCount = 0;

  processedTrades.forEach((item) => {
    const outcome = getOutcome(item);

    if (outcome === 'breakeven') {
      activeType = null;
      activeCount = 0;
      currentType = 'breakeven';
      currentCount = 0;
      return;
    }

    if (activeType === outcome) {
      activeCount += 1;
    } else {
      activeType = outcome;
      activeCount = 1;
    }

    currentType = activeType;
    currentCount = activeCount;

    if (outcome === 'win') {
      longestWinStreak = Math.max(longestWinStreak, activeCount);
    }

    if (outcome === 'loss') {
      longestLossStreak = Math.max(longestLossStreak, activeCount);
    }
  });

  return {
    longestWinStreak,
    longestLossStreak,
    currentStreakType: currentType || 'none',
    currentStreakCount: currentCount,
  };
};

const buildPerformanceGroups = (processedTrades, getKey, getLabel) => {
  const groups = new Map();

  processedTrades.forEach((item) => {
    const key = getKey(item);
    if (!key) return;

    const existing = groups.get(key) || {
      key,
      label: getLabel(item, key),
      trades: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      netPnL: 0,
      totalR: 0,
      rCount: 0,
      bestTrade: null,
      worstTrade: null,
    };

    const outcome = getOutcome(item);
    existing.trades += 1;
    existing.netPnL += item.netProfit;
    if (item.netR !== null) { existing.totalR += item.netR; existing.rCount += 1; }
    existing.bestTrade = existing.bestTrade === null ? item.netProfit : Math.max(existing.bestTrade, item.netProfit);
    existing.worstTrade = existing.worstTrade === null ? item.netProfit : Math.min(existing.worstTrade, item.netProfit);
    if (outcome === 'win') existing.wins += 1;
    if (outcome === 'loss') existing.losses += 1;
    if (outcome === 'breakeven') existing.breakeven += 1;

    groups.set(key, existing);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    netPnL: Number(group.netPnL.toFixed(2)),
    totalR: Number(group.totalR.toFixed(2)),
    avgR: group.rCount > 0 ? group.totalR / group.rCount : null,
    expectancy: group.trades > 0 ? group.netPnL / group.trades : 0,
    winRate: group.trades > 0 ? Number(((group.wins / group.trades) * 100).toFixed(1)) : 0,
    bestTrade: Number((group.bestTrade || 0).toFixed(2)),
    worstTrade: Number((group.worstTrade || 0).toFixed(2)),
  }));
};

export const buildSymbolPerformance = (trades, originalBalances = {}, currentBalances = {}) => {
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  return buildPerformanceGroups(
    processedTrades,
    (item) => item.symbol,
    (_item, key) => key
  ).sort((a, b) => b.netPnL - a.netPnL);
};

export const buildDayPerformance = (trades, originalBalances = {}, currentBalances = {}) => {
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  return buildPerformanceGroups(
    processedTrades,
    (item) => item.date
      ? `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}-${String(item.date.getDate()).padStart(2, '0')}`
      : null,
    (item, key) => item.date ? item.date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : key
  ).sort((a, b) => b.netPnL - a.netPnL);
};

export const buildWeekdayPerformance = (trades, originalBalances = {}, currentBalances = {}) => {
  const weekdayOrder = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  const groups = buildPerformanceGroups(
    processedTrades,
    (item) => item.date ? weekdayOrder[(item.date.getDay() + 6) % 7] : null,
    (_item, key) => key
  );

  return groups.sort((a, b) => weekdayOrder.indexOf(a.key) - weekdayOrder.indexOf(b.key));
};

export const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const buildSetupPerformance = (trades, original = {}, current = {}) => buildPerformanceGroups(buildProcessedTrades(trades,original,current), item => item.trade.setup || 'Ohne Setup', (_item,key)=>key).sort((a,b)=>b.netPnL-a.netPnL);
export const winRateInterval = (wins, n) => {
  if (!n) return null;
  const p=wins/n, z=1.96, denominator=1+z*z/n;
  const center=(p+z*z/(2*n))/denominator;
  const spread=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/denominator;
  return {lower:Math.max(0,center-spread)*100,upper:Math.min(1,center+spread)*100};
};

export const calculateAdvancedStats = (trades, startingBalance = 10000, originalBalances = {}, currentBalances = {}) => {
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  const totalTrades = processedTrades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      totalFees: 0,
      rSampleSize: 0,
      reviewCount: 0,
      riskEstimatedTrades: 0,
      confidence: null,
      recoveryFactor: null,
      wins: 0,
      losses: 0,
      breakeven: 0,
      winRate: 0,
      lossRate: 0,
      breakevenRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnL: 0,
      returnPct: calculateReturnPercentage(0, startingBalance),
      bestTrade: 0,
      worstTrade: 0,
      avgWin: 0,
      avgLoss: 0,
      avgR: 0,
      totalR: 0,
      expectancy: 0,
      expectancyR: 0,
      payoffRatio: 0,
      avgWinR: 0,
      avgLossR: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      avgRiskPct: 0,
      avgStopLossAmount: null,
      riskSampleSize: 0,
      endingBalance: Number(startingBalance) || 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      currentStreakType: 'none',
      currentStreakCount: 0,
      bestSymbol: null,
      worstSymbol: null,
      bestDay: null,
      worstDay: null,
      bestWeekday: null,
      worstWeekday: null,
    };
  }

  const winners = processedTrades.filter((item) => item.netProfit > 0);
  const losers = processedTrades.filter((item) => item.netProfit < 0);
  const breakeven = processedTrades.filter((item) => item.netProfit === 0);
  const netValues = processedTrades.map((item) => item.netProfit);
  const rValues = processedTrades.filter(item => item.netR !== null).map(item => item.netR);

  const grossProfit = winners.reduce((sum, item) => sum + item.netProfit, 0);
  const grossLoss = Math.abs(losers.reduce((sum, item) => sum + item.netProfit, 0));
  const netPnL = processedTrades.reduce((sum, item) => sum + item.netProfit, 0);
  const totalR = rValues.reduce((sum, value) => sum + value, 0);
  const winnerR = winners.reduce((sum, item) => sum + (item.netR || 0), 0);
  const loserR = losers.reduce((sum, item) => sum + (item.netR || 0), 0);
  const equitySeries = buildEquitySeries(trades, startingBalance, originalBalances, currentBalances);
  const maxDrawdown = Math.max(...equitySeries.map((point) => point.drawdown), 0);
  const maxDrawdownPct = Math.max(...equitySeries.map((point) => point.drawdownPct), 0);
  const riskTrades = processedTrades.filter(item => item.stopLossAmount !== null);
  const totalRiskAmount = riskTrades.reduce((sum, item) => sum + item.stopLossAmount, 0);
  const avgStopLossAmount = riskTrades.length ? totalRiskAmount / riskTrades.length : null;
  const avgRiskPct = processedTrades.reduce((sum, item) => sum + item.stopLoss, 0) / totalTrades;
  const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((sum, item) => sum + item.netProfit, 0) / losers.length : 0;
  const winnerRCount=winners.filter(item=>item.netR!==null).length;
  const loserRCount=losers.filter(item=>item.netR!==null).length;
  const avgWinR = winnerRCount > 0 ? winnerR / winnerRCount : null;
  const avgLossR = loserRCount > 0 ? loserR / loserRCount : null;
  const payoffRatio = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : (avgWin > 0 ? Infinity : 0);
  const streakStats = calculateStreakStats(trades, originalBalances, currentBalances);
  const symbolPerformance = buildSymbolPerformance(trades, originalBalances, currentBalances);
  const dayPerformance = buildDayPerformance(trades, originalBalances, currentBalances);
  const weekdayPerformance = buildWeekdayPerformance(trades, originalBalances, currentBalances);
  const bestWeekdays = [...weekdayPerformance].sort((a, b) => b.netPnL - a.netPnL);

  return {
    totalTrades,
    wins: winners.length,
    losses: losers.length,
    breakeven: breakeven.length,
    winRate: (winners.length / totalTrades) * 100,
    lossRate: (losers.length / totalTrades) * 100,
    breakevenRate: (breakeven.length / totalTrades) * 100,
    grossProfit,
    grossLoss,
    netPnL,
    returnPct: calculateReturnPercentage(netPnL, startingBalance),
    bestTrade: Math.max(...netValues),
    worstTrade: Math.min(...netValues),
    avgWin,
    avgLoss,
    avgR: rValues.length ? totalR / rValues.length : null,
    totalR,
    expectancy: netPnL / totalTrades,
    expectancyR: rValues.length ? totalR / rValues.length : null,
    payoffRatio,
    avgWinR,
    avgLossR,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0),
    maxDrawdown,
    maxDrawdownPct,
    avgRiskPct,
    avgStopLossAmount,
    riskSampleSize: riskTrades.length,
    endingBalance: (Number(startingBalance) || 0) + netPnL,
    totalFees: processedTrades.reduce((sum, item) => sum + item.fees, 0),
    rSampleSize: rValues.length,
    reviewCount: processedTrades.filter(item => String(item.trade.notes || '').trim()).length,
    riskEstimatedTrades: processedTrades.filter(item => !(Number(item.trade.riskAmount) > 0)).length,
    confidence: winRateInterval(winners.length, totalTrades),
    recoveryFactor: maxDrawdown > 0 ? netPnL / maxDrawdown : null,
    ...streakStats,
    bestSymbol: symbolPerformance[0] || null,
    worstSymbol: symbolPerformance[symbolPerformance.length - 1] || null,
    bestDay: dayPerformance[0] || null,
    worstDay: dayPerformance[dayPerformance.length - 1] || null,
    bestWeekday: bestWeekdays[0] || null,
    worstWeekday: bestWeekdays[bestWeekdays.length - 1] || null,
  };
};
