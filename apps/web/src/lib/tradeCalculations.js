/**
 * Utility functions for trade calculations including commission adjustments.
 * These functions are designed to work safely with both full and filtered trade arrays.
 */

const getBalance = (trade, map, fallback = 10000) => {
  if (!trade || !trade.accountId) return fallback;
  return Number(map[trade.accountId]) || fallback;
};

export const calculateStopLossInEuro = (accountSize, stopLossPercentage) => {
  const size = Number(accountSize) || 0;
  const pct = Number(stopLossPercentage) || 0;
  return (size * pct) / 100;
};

export const getTradeGrossProfit = (trade, originalBalances = {}, currentBalances = {}) => {
  if (!trade) return 0;
  
  const origBal = getBalance(trade, originalBalances, 10000);
  const currBal = getBalance(trade, currentBalances, origBal);
  const ratio = origBal > 0 ? currBal / origBal : 1;

  // If profitLoss is explicitly set and non-zero, use it and scale it
  if (trade.profitLoss !== undefined && trade.profitLoss !== null && trade.profitLoss !== 0) {
    return Number(trade.profitLoss) * ratio;
  }
  
  // Otherwise calculate from stopLoss percentage and rrSecured
  // The stop loss monetary amount scales with the current balance
  const monetarySL = calculateStopLossInEuro(currBal, trade.stopLoss);
  return monetarySL * Number(trade.rrSecured || 0);
};

export const calculateCommissionAmount = (profit, commissionPercentage, originalBalances = {}, currentBalances = {}) => {
  const p = Number(profit) || 0;
  const c = Number(commissionPercentage) || 0;
  
  // Commission is only applied to winning trades (positive profit)
  if (p <= 0 || c <= 0) return 0;
  
  // The profit passed here is already scaled by getTradeGrossProfit, 
  // so commission scales naturally.
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
    const gross = getTradeGrossProfit(trade, originalBalances, currentBalances);
    if (gross > 0) {
      return sum + calculateNetProfit(gross, trade.commissionPercentage, originalBalances, currentBalances);
    }
    return sum;
  }, 0);
};

export const calculateTotalLosses = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  
  return trades.reduce((sum, trade) => {
    const gross = getTradeGrossProfit(trade, originalBalances, currentBalances);
    if (gross < 0) {
      return sum + Math.abs(gross); // Return absolute value for easier subtraction later
    }
    return sum;
  }, 0);
};

export const calculateNetPnL = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  return calculateTotalWins(trades, originalBalances, currentBalances) - calculateTotalLosses(trades, originalBalances, currentBalances);
};

export const calculateTotalCommissionCosts = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return 0;
  
  return trades.reduce((sum, trade) => {
    const gross = getTradeGrossProfit(trade, originalBalances, currentBalances);
    return sum + calculateCommissionAmount(gross, trade.commissionPercentage, originalBalances, currentBalances);
  }, 0);
};

export const calculateWinRate = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades) || trades.length === 0) return 0;
  
  const wins = trades.filter(t => {
    const gross = getTradeGrossProfit(t, originalBalances, currentBalances);
    return gross > 0 || t.status === 'Win' || Number(t.rrSecured || 0) >= 1;
  }).length;
  
  return (wins / trades.length) * 100;
};

export const calculateReturnPercentage = (totalProfitLoss, totalBalance) => {
  const pnl = Number(totalProfitLoss) || 0;
  const balance = Number(totalBalance) || 0;
  if (balance === 0) return 0;
  return (pnl / balance) * 100;
};

export const calculateMonetaryGain = (totalProfitLoss) => {
  // Total profit loss is already accumulated from scaled per-trade calculations
  return Number(totalProfitLoss) || 0;
};

export const getTradeDate = (trade) => {
  if (!trade) return null;
  const rawDate = trade.entryDate || trade.date || trade.created;
  if (!rawDate) return null;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTradeSymbol = (trade) => {
  const symbol = trade?.symbol || trade?.instrument || 'Unknown';
  return String(symbol).trim().toUpperCase() || 'Unknown';
};

export const getTradeNetProfit = (trade, originalBalances = {}, currentBalances = {}) => {
  const gross = getTradeGrossProfit(trade, originalBalances, currentBalances);
  return calculateNetProfit(gross, trade?.commissionPercentage, originalBalances, currentBalances);
};

export const buildProcessedTrades = (trades, originalBalances = {}, currentBalances = {}) => {
  if (!Array.isArray(trades)) return [];

  return trades
    .map((trade) => {
      const date = getTradeDate(trade);
      const grossProfit = getTradeGrossProfit(trade, originalBalances, currentBalances);
      const netProfit = calculateNetProfit(grossProfit, trade.commissionPercentage, originalBalances, currentBalances);
      const rrSecured = Number(trade.rrSecured ?? trade.riskRewardRatio ?? 0) || 0;
      const stopLoss = Number(trade.stopLoss) || 0;
      const accountBalance = getBalance(trade, currentBalances, getBalance(trade, originalBalances, 10000));
      const stopLossAmount = calculateStopLossInEuro(accountBalance, stopLoss);

      return {
        trade,
        date,
        symbol: getTradeSymbol(trade),
        grossProfit,
        netProfit,
        rrSecured,
        stopLoss,
        stopLossAmount,
        status: trade.status,
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
      label: item.date ? item.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : `Trade ${index + 1}`,
      date: item.date,
      balance: Number(balance.toFixed(2)),
      cumulativePnL: Number(cumulativePnL.toFixed(2)),
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
      bestTrade: null,
      worstTrade: null,
    };

    const outcome = getOutcome(item);
    existing.trades += 1;
    existing.netPnL += item.netProfit;
    existing.totalR += item.rrSecured;
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
    avgR: group.trades > 0 ? Number((group.totalR / group.trades).toFixed(2)) : 0,
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
    (item, key) => item.date ? item.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : key
  ).sort((a, b) => b.netPnL - a.netPnL);
};

export const buildWeekdayPerformance = (trades, originalBalances = {}, currentBalances = {}) => {
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  const groups = buildPerformanceGroups(
    processedTrades,
    (item) => item.date ? weekdayOrder[(item.date.getDay() + 6) % 7] : null,
    (_item, key) => key
  );

  return groups.sort((a, b) => weekdayOrder.indexOf(a.key) - weekdayOrder.indexOf(b.key));
};

export const calculateAdvancedStats = (trades, startingBalance = 10000, originalBalances = {}, currentBalances = {}) => {
  const processedTrades = buildProcessedTrades(trades, originalBalances, currentBalances);
  const totalTrades = processedTrades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      winRate: 0,
      lossRate: 0,
      breakevenRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnL: 0,
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
      avgStopLossAmount: 0,
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
  const rValues = processedTrades.map((item) => item.rrSecured);

  const grossProfit = winners.reduce((sum, item) => sum + item.netProfit, 0);
  const grossLoss = Math.abs(losers.reduce((sum, item) => sum + item.netProfit, 0));
  const netPnL = processedTrades.reduce((sum, item) => sum + item.netProfit, 0);
  const totalR = rValues.reduce((sum, value) => sum + value, 0);
  const winnerR = winners.reduce((sum, item) => sum + item.rrSecured, 0);
  const loserR = losers.reduce((sum, item) => sum + item.rrSecured, 0);
  const equitySeries = buildEquitySeries(trades, startingBalance, originalBalances, currentBalances);
  const maxDrawdown = Math.max(...equitySeries.map((point) => point.drawdown), 0);
  const maxDrawdownPct = Math.max(...equitySeries.map((point) => point.drawdownPct), 0);
  const totalRiskAmount = processedTrades.reduce((sum, item) => sum + item.stopLossAmount, 0);
  const avgStopLossAmount = totalRiskAmount / totalTrades;
  const avgRiskPct = processedTrades.reduce((sum, item) => sum + item.stopLoss, 0) / totalTrades;
  const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((sum, item) => sum + item.netProfit, 0) / losers.length : 0;
  const avgWinR = winners.length > 0 ? winnerR / winners.length : 0;
  const avgLossR = losers.length > 0 ? loserR / losers.length : 0;
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
    bestTrade: Math.max(...netValues, 0),
    worstTrade: Math.min(...netValues, 0),
    avgWin,
    avgLoss,
    avgR: totalR / totalTrades,
    totalR,
    expectancy: netPnL / totalTrades,
    expectancyR: totalR / totalTrades,
    payoffRatio,
    avgWinR,
    avgLossR,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0),
    maxDrawdown,
    maxDrawdownPct,
    avgRiskPct,
    avgStopLossAmount,
    endingBalance: (Number(startingBalance) || 0) + netPnL,
    ...streakStats,
    bestSymbol: symbolPerformance[0] || null,
    worstSymbol: symbolPerformance[symbolPerformance.length - 1] || null,
    bestDay: dayPerformance[0] || null,
    worstDay: dayPerformance[dayPerformance.length - 1] || null,
    bestWeekday: bestWeekdays[0] || null,
    worstWeekday: bestWeekdays[bestWeekdays.length - 1] || null,
  };
};
