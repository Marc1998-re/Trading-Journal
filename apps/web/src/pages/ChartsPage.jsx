import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useAccount } from '@/contexts/AccountContext.jsx';
import { useFilters, buildTradeFilterString } from '@/contexts/FilterContext.jsx';
import pb from '@/lib/pocketbaseClient';
import PieChart from '@/components/charts/PieChart.jsx';
import EquityCurve from '@/components/charts/EquityCurve.jsx';
import BalanceCurve from '@/components/charts/BalanceCurve.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, CalendarDays, Filter, LineChart, PieChart as PieChartIcon, Target, TrendingUp, X, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { getTradeDate, getTradeNetProfit } from '@/lib/tradeCalculations.js';

const formatSignedEuro = (value) => (
  `${value >= 0 ? '+' : '-'}€${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
);

const ChartsPage = () => {
  const { currentUser } = useAuth();
  const { selectedAccountId, accounts, originalBalances } = useAccount();
  const { filters, isFiltersActive, clearFilters } = useFilters();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountName = selectedAccount ? selectedAccount.accountName : 'All Accounts';

  const currentBalancesMap = accounts.reduce((acc, a) => { acc[a.id] = a.startingBalance; return acc; }, {});
  const totalCurrentBalance = !selectedAccountId
    ? accounts.reduce((sum, a) => sum + (a.startingBalance || 0), 0)
    : (accounts.find(a => a.id === selectedAccountId)?.startingBalance || 10000);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const filterString = buildTradeFilterString(currentUser.id, filters, selectedAccountId);

        const tradesResult = await pb.collection('trades').getFullList({
          filter: filterString,
          sort: 'entryDate', // Sort ascending for charts
          $autoCancel: false,
        });

        setTrades(tradesResult);
      } catch (err) {
        toast.error('Failed to load chart data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentUser, filters, selectedAccountId]);

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

  const pieData = useMemo(() => {
    const wins = trades.filter((t) => t.status === 'Win' || (!t.status && (t.rrSecured || 0) >= 1)).length;
    const losses = trades.filter((t) => t.status === 'Loss' || (!t.status && (t.rrSecured || 0) < 0)).length;
    const breakeven = trades.filter((t) => t.status === 'Breakeven' || (!t.status && (t.rrSecured || 0) >= 0 && (t.rrSecured || 0) < 1)).length;
    return { wins, losses, breakeven };
  }, [trades]);

  const monthlyData = useMemo(() => {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const data = months.map(m => ({ name: m, trades: 0, pnl: 0, pnlPct: 0 }));
    
    trades.forEach(t => {
      const d = getTradeDate(t);
      if (d) {
        const monthIdx = d.getMonth();
        const net = getTradeNetProfit(t, originalBalances, currentBalancesMap);
        
        data[monthIdx].trades += 1;
        data[monthIdx].pnl += net;
      }
    });
    
    const safeBalance = Math.max(totalCurrentBalance, 0.01);
    data.forEach(d => {
      d.pnlPct = Number(((d.pnl / safeBalance) * 100).toFixed(2));
      d.pnl = Number(d.pnl.toFixed(2));
    });
    
    return data;
  }, [trades, currentBalancesMap, originalBalances, totalCurrentBalance]);

  const dayOfWeekData = useMemo(() => {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const displayDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const dayDataMap = { 
      'Montag': { trades: 0, pnl: 0 }, 
      'Dienstag': { trades: 0, pnl: 0 }, 
      'Mittwoch': { trades: 0, pnl: 0 }, 
      'Donnerstag': { trades: 0, pnl: 0 }, 
      'Freitag': { trades: 0, pnl: 0 }, 
      'Samstag': { trades: 0, pnl: 0 }, 
      'Sonntag': { trades: 0, pnl: 0 } 
    };

    trades.forEach(t => {
      const d = getTradeDate(t);
      if (d) {
        const dayName = days[d.getDay()];
        const net = getTradeNetProfit(t, originalBalances, currentBalancesMap);
        
        dayDataMap[dayName].trades += 1;
        dayDataMap[dayName].pnl += net;
      }
    });
    
    const safeBalance = Math.max(totalCurrentBalance, 0.01);
    return displayDays.map(d => ({ 
      name: d, 
      trades: dayDataMap[d].trades,
      pnl: Number(dayDataMap[d].pnl.toFixed(2)),
      pnlPct: Number(((dayDataMap[d].pnl / safeBalance) * 100).toFixed(2))
    }));
  }, [trades, currentBalancesMap, originalBalances, totalCurrentBalance]);

  const chartSummary = useMemo(() => {
    const totalTrades = trades.length;
    const totalPnl = monthlyData.reduce((sum, item) => sum + item.pnl, 0);
    const winRate = totalTrades > 0 ? ((pieData.wins || 0) / totalTrades) * 100 : 0;
    const activeWeekdays = dayOfWeekData.filter((item) => item.trades > 0);
    const bestWeekday = activeWeekdays.length > 0
      ? [...activeWeekdays].sort((a, b) => b.pnl - a.pnl)[0]
      : null;
    const activeMonths = monthlyData.filter((item) => item.trades > 0);
    const bestMonth = activeMonths.length > 0
      ? [...activeMonths].sort((a, b) => b.pnl - a.pnl)[0]
      : null;

    return {
      totalTrades,
      totalPnl,
      winRate,
      bestWeekday,
      bestMonth,
    };
  }, [trades.length, monthlyData, pieData, dayOfWeekData]);

  return (
    <>
      <Helmet>
        <title>Charts - Trading Journal</title>
        <meta name="description" content="Visual performance analytics and trading charts" />
      </Helmet>
      <main className="desk-shell market-grid">
        <div className="desk-container">
            <section className="command-panel relative overflow-hidden rounded-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-primary to-info" />
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="border-b border-white/10 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
                  <p className="section-kicker mb-3">Visual analytics</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <h1 className="text-4xl font-black tracking-normal sm:text-6xl">Charts</h1>
                    <Badge className="w-fit border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                      {accountName}
                    </Badge>
                  </div>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Visual representation of equity, balance, distribution and time-based performance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-black/20 p-5 sm:p-7">
                  <ChartTile icon={<LineChart className="h-5 w-5" />} label="Equity" value="Curve" loading={false} />
                  <ChartTile icon={<PieChartIcon className="h-5 w-5" />} label="Outcome" value="Split" loading={false} />
                  <ChartTile icon={<BarChart3 className="h-5 w-5" />} label="Trades" value={trades.length.toString()} loading={loading} />
                  <ChartTile icon={<Activity className="h-5 w-5" />} label="Filters" value={isFiltersActive() ? 'Active' : 'Clear'} loading={false} />
                </div>
              </div>
            </section>

            <Tabs value="/charts" onValueChange={(v) => navigate(v)} className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2 border border-white/10 bg-black/20 p-1">
                <TabsTrigger value="/analysis">Analysis</TabsTrigger>
                <TabsTrigger value="/charts">Charts</TabsTrigger>
              </TabsList>
            </Tabs>

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

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[400px] rounded-lg bg-white/10" />)}
              </div>
            ) : trades.length === 0 ? (
              <div className="glass-panel flex flex-col items-center justify-center py-24 px-4 text-center rounded-lg">
                <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No data available</h3>
                <p className="text-muted-foreground max-w-md">
                  {isFiltersActive()
                    ? "No trades match your current filters. Try adjusting them to see charts."
                    : "Log your first trade to unlock visual analytics and charts."}
                </p>
                {isFiltersActive() && (
                  <Button variant="outline" className="mt-6" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ChartHighlight
                    title="Visual Net P/L"
                    value={formatSignedEuro(chartSummary.totalPnl)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    meta={`${chartSummary.totalTrades} trades`}
                    valueClass={chartSummary.totalPnl >= 0 ? 'text-success' : 'text-destructive'}
                  />
                  <ChartHighlight
                    title="Win Rate"
                    value={`${chartSummary.winRate.toFixed(1)}%`}
                    icon={<Target className="h-5 w-5" />}
                    meta={`${pieData.wins || 0} wins / ${pieData.losses || 0} losses`}
                    valueClass={chartSummary.winRate >= 50 ? 'text-success' : 'text-destructive'}
                  />
                  <ChartHighlight
                    title="Best Weekday"
                    value={chartSummary.bestWeekday ? chartSummary.bestWeekday.name : 'No data'}
                    icon={<CalendarDays className="h-5 w-5" />}
                    meta={chartSummary.bestWeekday ? formatSignedEuro(chartSummary.bestWeekday.pnl) : 'No trades yet'}
                  />
                  <ChartHighlight
                    title="Best Month"
                    value={chartSummary.bestMonth ? chartSummary.bestMonth.name : 'No data'}
                    icon={<BarChart3 className="h-5 w-5" />}
                    meta={chartSummary.bestMonth ? formatSignedEuro(chartSummary.bestMonth.pnl) : 'No trades yet'}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                  <Card className="command-panel overflow-hidden rounded-lg">
                    <CardHeader className="border-b border-white/10 pb-6">
                      <p className="section-kicker mb-2">Outcome split</p>
                      <CardTitle className="text-xl">Win/Loss Distribution</CardTitle>
                      <CardDescription>Breakdown of your trade outcomes</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <PieChart data={pieData} />
                    </CardContent>
                  </Card>

                  <Card className="command-panel overflow-hidden rounded-lg">
                    <CardHeader className="border-b border-white/10 pb-6">
                      <p className="section-kicker mb-2">Timing quality</p>
                      <CardTitle className="text-xl">Day of Week Performance</CardTitle>
                      <CardDescription>Profit and Loss breakdown by day of the week</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <WeekdayPerformanceLanes data={dayOfWeekData} />
                    </CardContent>
                  </Card>
                </div>

                <Card className="command-panel overflow-hidden rounded-lg">
                  <CardHeader className="border-b border-white/10 pb-6">
                    <p className="section-kicker mb-2">Year view</p>
                    <CardTitle className="text-xl">Monthly Performance</CardTitle>
                    <CardDescription>Profit and Loss progression across the year</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    <MonthlyPerformanceGrid data={monthlyData} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <Card className="command-panel overflow-hidden rounded-lg">
                    <CardHeader className="border-b border-white/10 pb-6">
                      <p className="section-kicker mb-2">Equity path</p>
                      <CardTitle className="text-xl">Equity Curve</CardTitle>
                      <CardDescription>Cumulative profit/loss over time</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <EquityCurve
                        trades={trades}
                        startingBalance={totalCurrentBalance}
                        originalBalances={originalBalances}
                        currentBalances={currentBalancesMap}
                      />
                    </CardContent>
                  </Card>

                  <Card className="command-panel overflow-hidden rounded-lg">
                    <CardHeader className="border-b border-white/10 pb-6">
                      <p className="section-kicker mb-2">Balance path</p>
                      <CardTitle className="text-xl">Balance Curve</CardTitle>
                      <CardDescription>Account balance progression over time</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <BalanceCurve
                        trades={trades}
                        startingBalance={totalCurrentBalance}
                        originalBalances={originalBalances}
                        currentBalances={currentBalancesMap}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
        </div>
      </main>
    </>
  );
};

const ChartTile = ({ icon, label, value, loading }) => (
  <div className="rounded-md border border-white/10 bg-card/70 p-4">
    <div className="mb-3 text-primary">{icon}</div>
    <p className="surface-label">{label}</p>
    {loading ? (
      <Skeleton className="mt-2 h-7 w-16 bg-white/10" />
    ) : (
      <p className="mt-2 text-xl font-black">{value}</p>
    )}
  </div>
);

const ChartHighlight = ({ title, value, icon, meta, valueClass = 'text-foreground' }) => (
  <Card className="group relative overflow-hidden rounded-lg border-white/10 bg-black/25 shadow-none transition-colors hover:border-primary/40 hover:bg-primary/5">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-60" />
    <CardContent className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="surface-label mb-2">{title}</p>
        <p className={`truncate text-2xl font-black ${valueClass}`}>{value}</p>
        {meta && <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{meta}</p>}
      </div>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-primary">
        {icon}
      </div>
    </CardContent>
  </Card>
);

const getPerformanceTone = (value) => {
  if (value > 0) {
    return {
      bar: 'bg-success',
      border: 'border-success/20',
      surface: 'bg-[hsl(var(--success)/0.06)]',
      text: 'text-success',
      label: 'Profit',
    };
  }

  if (value < 0) {
    return {
      bar: 'bg-destructive',
      border: 'border-destructive/20',
      surface: 'bg-[hsl(var(--destructive)/0.06)]',
      text: 'text-destructive',
      label: 'Loss',
    };
  }

  return {
    bar: 'bg-muted-foreground',
    border: 'border-white/10',
    surface: 'bg-white/[0.03]',
    text: 'text-muted-foreground',
    label: 'Flat',
  };
};

const WeekdayPerformanceLanes = ({ data }) => {
  const maxAbs = Math.max(...data.map((item) => Math.abs(item.pnl)), 1);
  const activeDays = data.filter((item) => item.trades > 0);
  const strongest = activeDays.length > 0 ? [...activeDays].sort((a, b) => b.pnl - a.pnl)[0] : null;
  const weakest = activeDays.length > 0 ? [...activeDays].sort((a, b) => a.pnl - b.pnl)[0] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PerformanceSummary label="Strongest Day" item={strongest} />
        <PerformanceSummary label="Weakest Day" item={weakest} />
      </div>

      <div className="space-y-2">
        {data.map((item) => {
          const tone = getPerformanceTone(item.pnl);
          const laneWidth = item.pnl === 0 ? 0 : Math.max(8, (Math.abs(item.pnl) / maxAbs) * 50);

          return (
            <div key={item.name} className={`rounded-md border ${tone.border} bg-black/20 p-3`}>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_6.75rem] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.trades} trades</p>
                </div>

                <div className="relative h-8 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
                  <div className="absolute inset-y-1 left-1/2 w-px bg-white/25" />
                  {item.pnl !== 0 && (
                    <div
                      className={`absolute top-2 h-4 rounded-full ${tone.bar}`}
                      style={{
                        width: `${laneWidth}%`,
                        left: item.pnl > 0 ? '50%' : undefined,
                        right: item.pnl < 0 ? '50%' : undefined,
                      }}
                    />
                  )}
                </div>

                <div className="text-right">
                  <p className={`text-sm font-black ${tone.text}`}>{formatSignedEuro(item.pnl)}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {item.pnlPct >= 0 ? '+' : '-'}{Math.abs(item.pnlPct).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthlyPerformanceGrid = ({ data }) => {
  const maxAbs = Math.max(...data.map((item) => Math.abs(item.pnl)), 1);
  const activeMonths = data.filter((item) => item.trades > 0);
  const total = data.reduce((sum, item) => sum + item.pnl, 0);
  const best = activeMonths.length > 0 ? [...activeMonths].sort((a, b) => b.pnl - a.pnl)[0] : null;
  const worst = activeMonths.length > 0 ? [...activeMonths].sort((a, b) => a.pnl - b.pnl)[0] : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <PerformanceSummary label="Year Net" item={{ name: 'Total', pnl: total, trades: data.reduce((sum, item) => sum + item.trades, 0) }} />
        <PerformanceSummary label="Best Month" item={best} />
        <PerformanceSummary label="Weakest Month" item={worst} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {data.map((item) => {
          const tone = getPerformanceTone(item.pnl);
          const fillWidth = item.pnl === 0 ? 0 : Math.max(10, (Math.abs(item.pnl) / maxAbs) * 100);

          return (
            <div key={item.name} className={`relative overflow-hidden rounded-md border ${tone.border} ${tone.surface} p-4`}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">{item.name.slice(0, 3)}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.trades} trades</p>
                </div>
                <Badge className={`border-white/10 bg-black/20 px-2 py-0.5 text-[11px] ${tone.text}`}>
                  {tone.label}
                </Badge>
              </div>

              <p className={`truncate text-lg font-black ${tone.text}`}>{formatSignedEuro(item.pnl)}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {item.pnlPct >= 0 ? '+' : '-'}{Math.abs(item.pnlPct).toFixed(2)}%
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                {item.pnl !== 0 && (
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${fillWidth}%` }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PerformanceSummary = ({ label, item }) => {
  const tone = getPerformanceTone(item?.pnl || 0);

  return (
    <div className={`rounded-md border ${tone.border} ${tone.surface} p-4`}>
      <p className="surface-label mb-2">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-foreground">{item ? item.name : 'No data'}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{item ? `${item.trades} trades` : 'No trades yet'}</p>
        </div>
        <p className={`shrink-0 text-sm font-black ${tone.text}`}>{item ? formatSignedEuro(item.pnl) : '-'}</p>
      </div>
    </div>
  );
};

export default ChartsPage;
