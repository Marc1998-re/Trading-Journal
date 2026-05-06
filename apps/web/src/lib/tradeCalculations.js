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
      profitFactor: 0,
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      avgRiskPct: 0,
      avgStopLossAmount: 0,
      endingBalance: Number(startingBalance) || 0,
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
  const equitySeries = buildEquitySeries(trades, startingBalance, originalBalances, currentBalances);
  const maxDrawdown = Math.max(...equitySeries.map((point) => point.drawdown), 0);
  const maxDrawdownPct = Math.max(...equitySeries.map((point) => point.drawdownPct), 0);
  const totalRiskAmount = processedTrades.reduce((sum, item) => sum + item.stopLossAmount, 0);
  const avgStopLossAmount = totalRiskAmount / totalTrades;
  const avgRiskPct = processedTrades.reduce((sum, item) => sum + item.stopLoss, 0) / totalTrades;

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
    avgWin: winners.length > 0 ? grossProfit / winners.length : 0,
    avgLoss: losers.length > 0 ? losers.reduce((sum, item) => sum + item.netProfit, 0) / losers.length : 0,
    avgR: totalR / totalTrades,
    totalR,
    expectancy: netPnL / totalTrades,
    expectancyR: totalR / totalTrades,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0),
    maxDrawdown,
    maxDrawdownPct,
    avgRiskPct,
    avgStopLossAmount,
    endingBalance: (Number(startingBalance) || 0) + netPnL,
  };
};
