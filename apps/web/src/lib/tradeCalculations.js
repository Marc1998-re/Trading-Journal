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