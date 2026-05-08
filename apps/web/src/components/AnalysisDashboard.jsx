import React, { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext.jsx';
import EditableStartingBalance from './EditableStartingBalance.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildDayPerformance,
  buildSymbolPerformance,
  buildWeekdayPerformance,
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
          <p className="metric-value break-words">{value}</p>
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

const RankingBoard = ({ title, description, items }) => (
  <Card className="glass-panel overflow-hidden rounded-lg">
    <CardHeader className="border-b border-white/10">
      <p className="section-kicker mb-2">Ranking board</p>
      <CardTitle className="text-xl font-black">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">No ranking data available.</p>
      ) : (
        <div className="divide-y divide-white/10">
          <div className="grid grid-cols-[1fr_64px_72px_96px] gap-3 bg-black/20 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            <span>Name</span>
            <span>Trades</span>
            <span>Avg R</span>
            <span className="text-right">Net</span>
          </div>
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-[1fr_64px_72px_96px] items-center gap-3 px-4 py-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-black">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.winRate.toFixed(1)}% win rate</p>
              </div>
              <p className="font-semibold">{item.trades}</p>
              <p className={`font-black ${item.avgR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {item.avgR >= 0 ? '+' : ''}{item.avgR.toFixed(2)}R
              </p>
              <p className={`text-right font-black ${item.netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {item.netPnL >= 0 ? '+' : ''}{formatEuro(item.netPnL)}
              </p>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const InsightPanel = ({ stats }) => {
  const insights = [
    { label: 'Best day', value: formatPerformanceLabel(stats.bestDay), type: 'positive' },
    { label: 'Weakest day', value: formatPerformanceLabel(stats.worstDay), type: stats.worstDay?.netPnL < 0 ? 'negative' : 'neutral' },
    { label: 'Best weekday', value: formatPerformanceLabel(stats.bestWeekday), type: 'positive' },
    { label: 'Current streak', value: formatStreak(stats.currentStreakType, stats.currentStreakCount), type: stats.currentStreakType === 'loss' ? 'negative' : stats.currentStreakType === 'win' ? 'positive' : 'neutral' },
  ];

  return (
    <Card className="command-panel rounded-lg">
      <CardHeader className="border-b border-white/10">
        <p className="section-kicker mb-2">Session intelligence</p>
        <CardTitle className="text-xl font-black">Fast Read</CardTitle>
        <CardDescription>The most important timing and discipline signals at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((item) => (
          <div key={item.label} className="rounded-md border border-white/10 bg-black/20 p-4">
            <p className="surface-label">{item.label}</p>
            <p className={`mt-2 text-lg font-black ${item.type === 'positive' ? 'text-success' : item.type === 'negative' ? 'text-destructive' : 'text-foreground'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

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

  const symbolRankings = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return buildSymbolPerformance(trades, originalBalances, currentBalancesMap).slice(0, 6);
  }, [trades, currentBalancesMap, originalBalances]);

  const weekdayRankings = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return [...buildWeekdayPerformance(trades, originalBalances, currentBalancesMap)]
      .filter((item) => item.trades > 0)
      .sort((a, b) => b.netPnL - a.netPnL);
  }, [trades, currentBalancesMap, originalBalances]);

  const dayRankings = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return buildDayPerformance(trades, originalBalances, currentBalancesMap).slice(0, 6);
  }, [trades, currentBalancesMap, originalBalances]);

  const hasData = stats !== null;

  const balanceMetrics = hasData ? [
    { label: "Total Wins (Net)", value: formatEuro(stats.grossProfit), type: "positive" },
    { label: "Total Losses", value: `-${formatEuro(stats.grossLoss)}`, type: "negative" },
    { label: "Total Commissions", value: formatEuro(stats.totalCommission), type: "negative" },
    { label: "Compounded Balance", value: formatEuro(stats.endingBalance), type: stats.endingBalance >= stats.totalCurrentBalance ? "positive" : "negative" },
  ] : [];

  const edgeMetrics = hasData ? [
    { label: "Net P&L", value: `${stats.netPnL >= 0 ? '+' : '-'}${formatEuro(Math.abs(stats.netPnL))}`, type: stats.netPnL >= 0 ? "positive" : "negative" },
    { label: "Total Return", value: `${((stats.netPnL / Math.max(stats.totalCurrentBalance, 0.01)) * 100).toFixed(2)}%`, type: stats.netPnL >= 0 ? "positive" : "negative" },
    { label: "Expectancy R", value: `${stats.expectancyR > 0 ? '+' : ''}${stats.expectancyR.toFixed(2)}R`, type: stats.expectancyR >= 0 ? "positive" : "negative" },
    { label: "Payoff Ratio", value: formatRatio(stats.payoffRatio), type: stats.payoffRatio >= 1.2 ? "positive" : (stats.payoffRatio >= 1 ? "neutral" : "negative") },
    { label: "Profit Factor", value: formatRatio(stats.profitFactor), type: stats.profitFactor >= 1.5 ? "positive" : (stats.profitFactor >= 1 ? "neutral" : "negative") },
    { label: "Max Drawdown %", value: `${stats.maxDrawdownPct.toFixed(2)}%`, type: stats.maxDrawdownPct > 20 ? "negative" : "neutral" },
    { label: "Avg R / Trade", value: `${stats.avgR > 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, type: stats.avgR >= 0 ? "positive" : "negative" },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, type: stats.winRate >= 50 ? "positive" : "negative" },
  ] : [];

  const detailSections = hasData ? [
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
        { label: "Risk Per Trade", value: `${stats.avgRiskPct.toFixed(2)}%`, type: stats.avgRiskPct > 2 ? "negative" : "neutral" },
        { label: "Avg Stop Size", value: formatEuro(stats.avgStopLossAmount), type: "neutral" },
      ]
    },
    {
      title: "Edge & Streak Details",
      metrics: [
        { label: "Expected Value", value: formatEuro(stats.expectancy), type: stats.expectancy > 0 ? "positive" : "negative" },
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
          <>
            <MetricSection title="Edge Overview" metrics={edgeMetrics} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <RankingBoard
                title="Symbol Ranking"
                description="Markets ordered by net performance in the selected data."
                items={symbolRankings}
              />
              <RankingBoard
                title="Weekday Ranking"
                description="Which weekdays contribute most to your results."
                items={weekdayRankings}
              />
              <RankingBoard
                title="Trading Day Ranking"
                description="Best individual trading days by net performance."
                items={dayRankings}
              />
            </div>

            <InsightPanel stats={stats} />

            <div className="space-y-8">
              {detailSections.map((section, idx) => (
                <MetricSection key={idx} title={section.title} metrics={section.metrics} />
              ))}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AnalysisDashboard;
