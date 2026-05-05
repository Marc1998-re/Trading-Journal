import React, { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext.jsx';
import EditableStartingBalance from './EditableStartingBalance.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  calculateTotalWins,
  calculateTotalLosses,
  calculateNetPnL,
  calculateTotalCommissionCosts,
  calculateWinRate,
  getTradeGrossProfit,
  calculateNetProfit,
  calculateStopLossInEuro
} from '@/lib/tradeCalculations.js';

const metricDescriptions = {
  "Net P&L": "Total profit or loss after deducting all commissions and fees.",
  "Total Wins (Net)": "Total profit from all winning trades, minus commissions.",
  "Total Losses": "Total amount lost from all losing trades.",
  "Total Commissions": "Total fees paid to the broker for executing trades.",
  "Compounded Balance": "Current account balance including starting capital and Net P&L.",
  "Total Return": "Percentage return on the initial starting balance.",
  "Total Trades": "Total number of trades executed.",
  "Win Rate": "Percentage of trades that resulted in a profit.",
  "Loss Rate": "Percentage of trades that resulted in a loss.",
  "Breakeven Rate": "Percentage of trades that resulted in neither profit nor loss.",
  "R Secured": "Total Risk (R) multiples gained or lost across all trades.",
  "Avg R / Trade": "Average Risk (R) multiple gained or lost per trade.",
  "Risk Per Trade": "Average percentage of account balance risked per trade.",
  "Risk of Ruin": "Probability of losing all trading capital based on current win rate and risk.",
  "Expected Value": "Average expected monetary return per trade based on historical performance.",
  "Profit Factor": "Ratio of gross profit to gross loss. A value above 1 indicates a profitable system.",
  "Avg Win R": "Average Risk (R) multiple gained on winning trades.",
  "Avg Stop Size": "Average monetary amount risked per trade.",
  "Max Drawdown %": "Largest percentage drop from a peak balance to a subsequent trough.",
  "Max Drawdown R": "Largest drop in Risk (R) multiples from a peak to a subsequent trough.",
  "Avg Drawdown $": "Average monetary loss during drawdown periods.",
  "Avg Drawdown R": "Average Risk (R) multiple loss during drawdown periods."
};

const MetricCard = ({ label, value, type = 'neutral' }) => {
  const typeClasses = {
    positive: 'metric-card-positive',
    negative: 'metric-card-negative',
    neutral: 'metric-card-neutral',
  };

  const description = metricDescriptions[label] || "Metric description not available.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`metric-card ${typeClasses[type]} cursor-help transition-all duration-200 hover:shadow-md`}>
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px] text-center">
        <p className="text-sm">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const MetricSection = ({ title, metrics }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold tracking-tight border-b border-border pb-2">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <MetricCard key={i} label={m.label} value={m.value} type={m.type} />
      ))}
    </div>
  </div>
);

const AnalysisDashboard = ({ trades, accounts, originalBalances, selectedAccountId, onUpdateBalance }) => {
  const { filters, isFiltersActive, clearFilters } = useFilters();

  const isAllAccounts = !selectedAccountId;
  const currentBalancesMap = accounts.reduce((acc, a) => { acc[a.id] = a.startingBalance; return acc; }, {});
  const totalCurrentBalance = isAllAccounts
    ? accounts.reduce((sum, a) => sum + (a.startingBalance || 0), 0)
    : (accounts.find(a => a.id === selectedAccountId)?.startingBalance || 10000);

  const getFilterDescription = () => {
    const parts = [];
    if (filters.symbol) parts.push(filters.symbol.toUpperCase());
    if (filters.status !== 'All') parts.push(filters.status);
    
    if (filters.startDate && filters.endDate) {
      parts.push(`${filters.startDate} to ${filters.endDate}`);
    } else if (filters.startDate) {
      parts.push(`From ${filters.startDate}`);
    } else if (filters.endDate) {
      parts.push(`Until ${filters.endDate}`);
    }
    
    return parts.join(' • ');
  };

  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const totalTrades = trades.length;
    
    const winningTrades = trades.filter((t) => t.status === 'Win' || (!t.status && (t.rrSecured || 0) >= 1));
    const losingTrades = trades.filter((t) => t.status === 'Loss' || (!t.status && (t.rrSecured || 0) < 0));
    const breakevenTrades = trades.filter((t) => t.status === 'Breakeven' || (!t.status && (t.rrSecured || 0) >= 0 && (t.rrSecured || 0) < 1));

    const wins = winningTrades.length;
    const losses = losingTrades.length;
    const breakeven = breakevenTrades.length;

    const winRate = calculateWinRate(trades, originalBalances, currentBalancesMap);
    const lossRate = (losses / totalTrades) * 100;
    const breakevenRate = (breakeven / totalTrades) * 100;

    const totalWinsAmount = calculateTotalWins(trades, originalBalances, currentBalancesMap);
    const totalLossesAmount = calculateTotalLosses(trades, originalBalances, currentBalancesMap);
    const netPL = calculateNetPnL(trades, originalBalances, currentBalancesMap);
    const totalCommission = calculateTotalCommissionCosts(trades, originalBalances, currentBalancesMap);

    const totalR = trades.reduce((sum, t) => sum + (t.rrSecured || 0), 0);
    const avgR = totalR / totalTrades;
    
    const totalMonetaryStopLoss = trades.reduce((sum, t) => {
      const currBal = currentBalancesMap[t.accountId] || 10000;
      return sum + calculateStopLossInEuro(currBal, t.stopLoss);
    }, 0);
    const avgStopLoss = totalMonetaryStopLoss / totalTrades;
    const riskPerTradePct = totalCurrentBalance > 0 ? (avgStopLoss / totalCurrentBalance) * 100 : 0;
    
    const winProb = winRate / 100;
    const lossProb = lossRate / 100;
    const edge = winProb - lossProb;
    const capitalUnits = avgStopLoss > 0 ? totalCurrentBalance / avgStopLoss : 0;
    let riskOfRuin = 0;
    if (edge <= 0) {
      riskOfRuin = 100;
    } else if (capitalUnits > 0) {
      riskOfRuin = Math.pow((1 - edge) / (1 + edge), capitalUnits) * 100;
    }

    const avgWinSize = wins > 0 ? totalWinsAmount / wins : 0;
    const avgLossSize = losses > 0 ? totalLossesAmount / losses : 0;
    const expectedValue = (winProb * avgWinSize) - (lossProb * avgLossSize);
    
    const profitFactor = totalLossesAmount > 0 ? totalWinsAmount / totalLossesAmount : (totalWinsAmount > 0 ? Infinity : 0);
    
    const avgWinR = wins > 0 ? winningTrades.reduce((sum, t) => sum + (t.rrSecured || 0), 0) / wins : 0;

    let maxDrawdown = 0;
    let maxDrawdownR = 0;
    let currentDrawdown = 0;
    let currentDrawdownR = 0;
    let peak = totalCurrentBalance;
    let peakR = 0;
    let runningBalance = totalCurrentBalance;
    let runningR = 0;
    let peakForDrawdownPct = totalCurrentBalance;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryDate || a.date) - new Date(b.entryDate || b.date));

    sortedTrades.forEach((trade) => {
      const gross = getTradeGrossProfit(trade, originalBalances, currentBalancesMap);
      const net = calculateNetProfit(gross, trade.commissionPercentage, originalBalances, currentBalancesMap);
      
      runningBalance += net;
      runningR += trade.rrSecured || 0;

      if (runningBalance > peak) {
        peak = runningBalance;
        currentDrawdown = 0;
        peakForDrawdownPct = peak;
      } else {
        currentDrawdown = peak - runningBalance;
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
        }
      }

      if (runningR > peakR) {
        peakR = runningR;
        currentDrawdownR = 0;
      } else {
        currentDrawdownR = peakR - runningR;
        if (currentDrawdownR > maxDrawdownR) {
          maxDrawdownR = currentDrawdownR;
        }
      }
    });

    const maxDrawdownPct = peakForDrawdownPct > 0 ? (maxDrawdown / peakForDrawdownPct) * 100 : 0;
    const avgDrawdown = losses > 0 ? totalLossesAmount / losses : 0;
    const avgDrawdownR = losses > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.rrSecured || 0), 0)) / losses : 0;

    const compoundedBalance = totalCurrentBalance + netPL;

    return {
      totalTrades, winRate, lossRate, breakevenRate,
      totalR, avgR, riskPerTradePct, riskOfRuin,
      expectedValue, profitFactor, avgWinR, avgStopLoss,
      avgDrawdownR, avgDrawdown, maxDrawdownR, maxDrawdownPct, maxDrawdown,
      totalCurrentBalance, compoundedBalance, netPL,
      totalWinsAmount, totalLossesAmount, totalCommission
    };
  }, [trades, currentBalancesMap, originalBalances, totalCurrentBalance]);

  const hasData = stats !== null;

  const balanceMetrics = hasData ? [
    { label: "Net P&L", value: `${stats.netPL >= 0 ? '+' : '-'}$${Math.abs(stats.netPL).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: stats.netPL >= 0 ? "positive" : "negative" },
    { label: "Total Wins (Net)", value: `$${stats.totalWinsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: "positive" },
    { label: "Total Losses", value: `-$${stats.totalLossesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: "negative" },
    { label: "Total Commissions", value: `$${stats.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: "negative" },
    { label: "Compounded Balance", value: `$${stats.compoundedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: stats.compoundedBalance >= stats.totalCurrentBalance ? "positive" : "negative" },
    { label: "Total Return", value: `${((stats.compoundedBalance - stats.totalCurrentBalance) / stats.totalCurrentBalance * 100).toFixed(2)}%`, type: stats.compoundedBalance >= stats.totalCurrentBalance ? "positive" : "negative" },
  ] : [];

  const sections = hasData ? [
    {
      title: "Trade Statistics",
      metrics: [
        { label: "Total Trades", value: stats.totalTrades, type: "neutral" },
        { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, type: stats.winRate >= 50 ? "positive" : "negative" },
        { label: "Loss Rate", value: `${stats.lossRate.toFixed(1)}%`, type: stats.lossRate > 50 ? "negative" : "positive" },
        { label: "Breakeven Rate", value: `${stats.breakevenRate.toFixed(1)}%`, type: "neutral" },
      ]
    },
    {
      title: "Risk Metrics",
      metrics: [
        { label: "R Secured", value: `${stats.totalR > 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`, type: stats.totalR >= 0 ? "positive" : "negative" },
        { label: "Avg R / Trade", value: `${stats.avgR > 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, type: stats.avgR >= 0 ? "positive" : "negative" },
        { label: "Risk Per Trade", value: `${stats.riskPerTradePct.toFixed(2)}%`, type: stats.riskPerTradePct > 2 ? "negative" : "neutral" },
        { label: "Risk of Ruin", value: `${stats.riskOfRuin.toFixed(2)}%`, type: stats.riskOfRuin > 10 ? "negative" : "positive" },
      ]
    },
    {
      title: "Performance Metrics",
      metrics: [
        { label: "Expected Value", value: `$${stats.expectedValue.toFixed(2)}`, type: stats.expectedValue > 0 ? "positive" : "negative" },
        { label: "Profit Factor", value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), type: stats.profitFactor >= 1.5 ? "positive" : (stats.profitFactor >= 1 ? "neutral" : "negative") },
        { label: "Avg Win R", value: `${stats.avgWinR.toFixed(2)}R`, type: stats.avgWinR >= 2 ? "positive" : "neutral" },
        { label: "Avg Stop Size", value: `$${stats.avgStopLoss.toFixed(2)}`, type: "neutral" },
      ]
    },
    {
      title: "Drawdown Metrics",
      metrics: [
        { label: "Max Drawdown %", value: `${stats.maxDrawdownPct.toFixed(2)}%`, type: stats.maxDrawdownPct > 20 ? "negative" : "neutral" },
        { label: "Max Drawdown R", value: `${stats.maxDrawdownR.toFixed(2)}R`, type: stats.maxDrawdownR > 10 ? "negative" : "neutral" },
        { label: "Avg Drawdown $", value: `$${stats.avgDrawdown.toFixed(2)}`, type: "negative" },
        { label: "Avg Drawdown R", value: `${stats.avgDrawdownR.toFixed(2)}R`, type: "negative" },
      ]
    }
  ] : [];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-10">
        {isFiltersActive() && (
          <Alert className="bg-primary/5 text-primary border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <AlertDescription className="font-medium">
                Showing filtered results: <span className="opacity-80 font-normal">{getFilterDescription()}</span>
              </AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 gap-1 shrink-0">
              <X className="w-3 h-3" />
              Clear Filters
            </Button>
          </Alert>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight border-b border-border pb-2">Account Configuration & Balance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <EditableStartingBalance 
              accounts={accounts} 
              selectedAccountId={selectedAccountId} 
              onSave={onUpdateBalance} 
            />
            {hasData && balanceMetrics.map((m, i) => (
              <MetricCard key={i} label={m.label} value={m.value} type={m.type} />
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No trading data yet</h3>
            <p className="text-muted-foreground max-w-md">
              {isFiltersActive() 
                ? "No trades match your current filters. Try adjusting them." 
                : "Your starting balance is set. Log your first trade to unlock comprehensive analytics and performance metrics."}
            </p>
            {isFiltersActive() && (
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          sections.map((section, idx) => (
            <MetricSection key={idx} title={section.title} metrics={section.metrics} />
          ))
        )}
      </div>
    </TooltipProvider>
  );
};

export default AnalysisDashboard;