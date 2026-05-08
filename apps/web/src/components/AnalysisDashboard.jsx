import React, { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext.jsx';
import EditableStartingBalance from './EditableStartingBalance.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  calculateAdvancedStats,
  calculateTotalCommissionCosts,
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
  "Expected Value": "Average expected monetary return per trade based on historical performance.",
  "Expectancy R": "Average expected R multiple per trade. This is one of the cleanest edge metrics.",
  "Payoff Ratio": "Average winning trade divided by the average losing trade.",
  "Profit Factor": "Ratio of gross profit to gross loss. A value above 1 indicates a profitable system.",
  "Avg Win R": "Average Risk (R) multiple gained on winning trades.",
  "Avg Loss R": "Average Risk (R) multiple lost on losing trades.",
  "Avg Stop Size": "Average monetary amount risked per trade.",
  "Max Drawdown %": "Largest percentage drop from a peak balance to a subsequent trough.",
  "Max Drawdown €": "Largest monetary drop from a peak balance to a subsequent trough.",
  "Win Streak": "Longest sequence of profitable trades.",
  "Loss Streak": "Longest sequence of losing trades.",
  "Current Streak": "Current active sequence based on the latest trades.",
  "Best Symbol": "Most profitable symbol in the selected data.",
  "Weakest Symbol": "Least profitable symbol in the selected data.",
  "Best Day": "Most profitable trading day in the selected data.",
  "Weakest Day": "Least profitable trading day in the selected data.",
  "Best Weekday": "Most profitable weekday in the selected data.",
  "Weakest Weekday": "Least profitable weekday in the selected data."
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

const formatEuro = (value) => new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(value) || 0);

const formatRatio = (value) => value === Infinity ? '∞' : Number(value || 0).toFixed(2);

const formatPerformanceLabel = (item) => {
  if (!item) return 'No data';
  const sign = item.netPnL >= 0 ? '+' : '';
  return `${item.label} ${sign}${formatEuro(item.netPnL)}`;
};

const formatStreak = (type, count) => {
  if (!count || type === 'none' || type === 'breakeven') return 'No active streak';
  return `${count} ${type === 'win' ? 'wins' : 'losses'}`;
};

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
    const totalCommission = calculateTotalCommissionCosts(trades, originalBalances, currentBalancesMap);

    return {
      ...calculateAdvancedStats(trades, totalCurrentBalance, originalBalances, currentBalancesMap),
      totalCurrentBalance,
      totalCommission,
    };
  }, [trades, currentBalancesMap, originalBalances, totalCurrentBalance]);

  const hasData = stats !== null;

  const balanceMetrics = hasData ? [
    { label: "Net P&L", value: `${stats.netPnL >= 0 ? '+' : '-'}${formatEuro(Math.abs(stats.netPnL))}`, type: stats.netPnL >= 0 ? "positive" : "negative" },
    { label: "Total Wins (Net)", value: formatEuro(stats.grossProfit), type: "positive" },
    { label: "Total Losses", value: `-${formatEuro(stats.grossLoss)}`, type: "negative" },
    { label: "Total Commissions", value: formatEuro(stats.totalCommission), type: "negative" },
    { label: "Compounded Balance", value: formatEuro(stats.endingBalance), type: stats.endingBalance >= stats.totalCurrentBalance ? "positive" : "negative" },
    { label: "Total Return", value: `${((stats.netPnL / Math.max(stats.totalCurrentBalance, 0.01)) * 100).toFixed(2)}%`, type: stats.netPnL >= 0 ? "positive" : "negative" },
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
      title: "Edge Quality",
      metrics: [
        { label: "Expected Value", value: formatEuro(stats.expectancy), type: stats.expectancy > 0 ? "positive" : "negative" },
        { label: "Expectancy R", value: `${stats.expectancyR > 0 ? '+' : ''}${stats.expectancyR.toFixed(2)}R`, type: stats.expectancyR >= 0 ? "positive" : "negative" },
        { label: "Payoff Ratio", value: formatRatio(stats.payoffRatio), type: stats.payoffRatio >= 1.2 ? "positive" : (stats.payoffRatio >= 1 ? "neutral" : "negative") },
        { label: "Profit Factor", value: formatRatio(stats.profitFactor), type: stats.profitFactor >= 1.5 ? "positive" : (stats.profitFactor >= 1 ? "neutral" : "negative") },
      ]
    },
    {
      title: "Risk Metrics",
      metrics: [
        { label: "R Secured", value: `${stats.totalR > 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`, type: stats.totalR >= 0 ? "positive" : "negative" },
        { label: "Avg R / Trade", value: `${stats.avgR > 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, type: stats.avgR >= 0 ? "positive" : "negative" },
        { label: "Risk Per Trade", value: `${stats.avgRiskPct.toFixed(2)}%`, type: stats.avgRiskPct > 2 ? "negative" : "neutral" },
        { label: "Avg Stop Size", value: formatEuro(stats.avgStopLossAmount), type: "neutral" },
      ]
    },
    {
      title: "R-Multiple Quality",
      metrics: [
        { label: "Avg Win R", value: `${stats.avgWinR.toFixed(2)}R`, type: stats.avgWinR >= 2 ? "positive" : "neutral" },
        { label: "Avg Loss R", value: `${stats.avgLossR.toFixed(2)}R`, type: "negative" },
        { label: "Win Streak", value: `${stats.longestWinStreak}`, type: "positive" },
        { label: "Loss Streak", value: `${stats.longestLossStreak}`, type: stats.longestLossStreak >= 4 ? "negative" : "neutral" },
      ]
    },
    {
      title: "Drawdown Metrics",
      metrics: [
        { label: "Max Drawdown %", value: `${stats.maxDrawdownPct.toFixed(2)}%`, type: stats.maxDrawdownPct > 20 ? "negative" : "neutral" },
        { label: "Max Drawdown €", value: formatEuro(stats.maxDrawdown), type: "negative" },
        { label: "Current Streak", value: formatStreak(stats.currentStreakType, stats.currentStreakCount), type: stats.currentStreakType === "loss" ? "negative" : stats.currentStreakType === "win" ? "positive" : "neutral" },
        { label: "Weakest Day", value: formatPerformanceLabel(stats.worstDay), type: stats.worstDay?.netPnL < 0 ? "negative" : "neutral" },
      ]
    },
    {
      title: "Market & Timing",
      metrics: [
        { label: "Best Symbol", value: formatPerformanceLabel(stats.bestSymbol), type: "positive" },
        { label: "Weakest Symbol", value: formatPerformanceLabel(stats.worstSymbol), type: stats.worstSymbol?.netPnL < 0 ? "negative" : "neutral" },
        { label: "Best Weekday", value: formatPerformanceLabel(stats.bestWeekday), type: "positive" },
        { label: "Weakest Weekday", value: formatPerformanceLabel(stats.worstWeekday), type: stats.worstWeekday?.netPnL < 0 ? "negative" : "neutral" },
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
