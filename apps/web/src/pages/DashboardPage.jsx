import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  DollarSign, 
  Percent,
  Radar,
  CalendarDays,
  LineChart,
  ShieldCheck,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useAccount } from '@/contexts/AccountContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { 
  calculateReturnPercentage, 
  calculateAdvancedStats,
  buildEquitySeries,
  getTradeDate,
  getTradeNetProfit
} from '@/lib/tradeCalculations.js';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { selectedAccountId, accounts, originalBalances } = useAccount();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountName = selectedAccount ? selectedAccount.accountName : 'All Accounts';

  const currentBalancesMap = accounts.reduce((acc, a) => { acc[a.id] = a.startingBalance; return acc; }, {});
  const totalCurrentBalance = !selectedAccountId
    ? accounts.reduce((sum, a) => sum + (a.startingBalance || 0), 0)
    : (accounts.find(a => a.id === selectedAccountId)?.startingBalance || 10000);

  const fetchTrades = useCallback(async (date) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      let filterString = `userId = "${currentUser.id}" && ((entryDate >= "${start} 00:00:00.000Z" && entryDate <= "${end} 23:59:59.999Z") || (date >= "${start} 00:00:00.000Z" && date <= "${end} 23:59:59.999Z"))`;
      if (selectedAccountId) {
        filterString += ` && accountId = "${selectedAccountId}"`;
      }

      const records = await pb.collection('trades').getFullList({
        filter: filterString,
        sort: '-entryDate',
        $autoCancel: false
      });
      
      setTrades(records);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to load trades. Please try again.');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [currentUser, selectedAccountId]);

  useEffect(() => {
    fetchTrades(currentDate);
  }, [currentDate, fetchTrades]);

  const handleSync = () => {
    setIsSyncing(true);
    fetchTrades(currentDate);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayData = (day) => {
    const dayTrades = trades.filter(t => {
      const tradeDate = getTradeDate(t);
      return tradeDate ? isSameDay(tradeDate, day) : false;
    });
    const pnl = dayTrades.reduce((sum, t) => {
      return sum + getTradeNetProfit(t, originalBalances, currentBalancesMap);
    }, 0);
    return { count: dayTrades.length, pnl };
  };

  const calculateStats = () => {
    const advancedStats = calculateAdvancedStats(trades, totalCurrentBalance, originalBalances, currentBalancesMap);
    const returnPercentage = calculateReturnPercentage(advancedStats.netPnL, totalCurrentBalance);

    return {
      ...advancedStats,
      returnPercentage,
      monetaryGain: advancedStats.netPnL,
      tradeCount: advancedStats.totalTrades
    };
  };

  const stats = calculateStats();
  const formatEuro = (val) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(val);
  const formatProfitFactor = (val) => val === Infinity ? '∞' : val.toFixed(2);
  const equitySeries = buildEquitySeries(trades, totalCurrentBalance, originalBalances, currentBalancesMap);
  const equityData = equitySeries.map((point) => ({
    ...point,
    pnl: point.cumulativePnL,
    balance: point.balance,
  }));
  const endingBalance = equitySeries[equitySeries.length - 1]?.balance ?? totalCurrentBalance;
  const riskMode = stats.maxDrawdownPct >= 10 || stats.avgRiskPct >= 2.5
    ? 'Pressure'
    : stats.maxDrawdownPct >= 5 || stats.avgRiskPct >= 1.5
      ? 'Watch'
      : 'Controlled';
  const riskModeClass = riskMode === 'Pressure'
    ? 'text-destructive'
    : riskMode === 'Watch'
      ? 'text-accent'
      : 'text-success';
  const primaryMetrics = [
    { title: 'Return', value: `${stats.returnPercentage >= 0 ? '+' : ''}${stats.returnPercentage.toFixed(2)}%`, icon: <Percent className="h-5 w-5" />, valueClass: stats.returnPercentage >= 0 ? 'text-success' : 'text-destructive' },
    { title: 'Net P/L', value: `${stats.monetaryGain >= 0 ? '+' : '-'}${formatEuro(Math.abs(stats.monetaryGain))}`, icon: <DollarSign className="h-5 w-5" />, valueClass: stats.monetaryGain >= 0 ? 'text-success' : 'text-destructive' },
    { title: 'Trades', value: stats.tradeCount.toString(), icon: <Activity className="h-5 w-5" /> },
    { title: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: <Target className="h-5 w-5" /> },
    { title: 'Profit Factor', value: formatProfitFactor(stats.profitFactor), icon: <Radar className="h-5 w-5" /> },
    { title: 'Expectancy', value: formatEuro(stats.expectancy), icon: <Target className="h-5 w-5" />, valueClass: stats.expectancy >= 0 ? 'text-success' : 'text-destructive' },
    { title: 'Avg. R', value: `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, icon: <TrendingUp className="h-5 w-5" />, valueClass: stats.avgR >= 0 ? 'text-success' : 'text-destructive' },
    { title: 'Max DD', value: `${stats.maxDrawdownPct.toFixed(2)}%`, icon: <TrendingDown className="h-5 w-5" />, valueClass: stats.maxDrawdownPct > 10 ? 'text-destructive' : 'text-foreground' },
  ];
  const recentTrades = [...trades]
    .sort((a, b) => {
      const bDate = getTradeDate(b);
      const aDate = getTradeDate(a);
      return (bDate ? bDate.getTime() : 0) - (aDate ? aDate.getTime() : 0);
    })
    .slice(0, 5);

  return (
    <>
      <Helmet>
        <title>Command - Trading Journal</title>
      </Helmet>
      <main className="desk-shell market-grid">
        <div className="desk-container">
          <section className="command-panel rounded-lg p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="section-kicker mb-3">Live trading command</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <h1 className="text-3xl font-black tracking-normal sm:text-5xl">JournalOS Command</h1>
                  <Badge className="w-fit border-primary/30 bg-primary/15 px-3 py-1.5 text-primary hover:bg-primary/20">
                    {accountName}
                  </Badge>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Month performance, execution quality and trade flow in one focused workspace.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3">
                  <p className="surface-label">Net month</p>
                  <p className={`mt-1 text-2xl font-black ${stats.netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {stats.netPnL >= 0 ? '+' : ''}{formatEuro(stats.netPnL)}
                  </p>
                </div>
                <Button onClick={handleSync} disabled={isSyncing || loading} className="h-auto gap-2 bg-primary px-5 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Desk
                </Button>
              </div>
            </div>
          </section>

          {error && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {primaryMetrics.map((metric) => (
              <StatCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                loading={loading}
                valueClass={metric.valueClass}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card className="command-panel overflow-hidden rounded-lg">
              <CardHeader className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-kicker mb-2">Equity command</p>
                  <CardTitle className="flex items-center gap-3 text-2xl font-black">
                    <LineChart className="h-6 w-6 text-primary" />
                    Balance Trajectory
                  </CardTitle>
                </div>
                <div className="rounded-md border border-white/10 bg-black/20 px-4 py-3 text-right">
                  <p className="surface-label">Ending balance</p>
                  <p className="mt-1 text-xl font-black">{formatEuro(endingBalance)}</p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {loading ? (
                  <Skeleton className="h-[320px] rounded-md bg-white/10" />
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dashboardEquityFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.38} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} width={72} tickFormatter={(value) => `€${Number(value).toLocaleString('en-US')}`} />
                        <Tooltip content={<DashboardTooltip formatEuro={formatEuro} />} />
                        <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#dashboardEquityFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel rounded-lg">
              <CardHeader className="border-b border-white/10">
                <p className="section-kicker mb-2">Risk pulse</p>
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  Desk Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md bg-white/10" />)
                ) : (
                  <>
                    <div className="rounded-md border border-white/10 bg-black/20 p-4">
                      <p className="surface-label">Mode</p>
                      <p className={`mt-1 text-3xl font-black ${riskModeClass}`}>{riskMode}</p>
                    </div>
                    <RiskRow label="Avg. risk" value={`${stats.avgRiskPct.toFixed(2)}%`} />
                    <RiskRow label="Avg. risk value" value={formatEuro(stats.avgStopLossAmount)} />
                    <RiskRow label="Total R" value={`${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`} valueClass={stats.totalR >= 0 ? 'text-success' : 'text-destructive'} />
                    <RiskRow label="Best / Worst" value={`${formatEuro(stats.bestTrade)} / ${formatEuro(stats.worstTrade)}`} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card className="command-panel overflow-hidden rounded-lg">
              <CardHeader className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-kicker mb-2">Performance calendar</p>
                  <CardTitle className="flex items-center gap-3 text-2xl font-black">
                    <CalendarDays className="h-6 w-6 text-primary" />
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 p-1">
                  <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month" className="hover:bg-white/[0.06]">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month" className="hover:bg-white/[0.06]">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {loading ? (
                    Array.from({ length: 35 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-md bg-white/10" />
                    ))
                  ) : (
                    calendarDays.map((day, i) => {
                      const { count, pnl } = getDayData(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isPositive = pnl > 0;
                      const isNegative = pnl < 0;

                      return (
                        <div
                          key={i}
                          className={`h-24 rounded-md border p-2 transition-colors ${!isCurrentMonth ? 'border-transparent bg-black/10 opacity-35' : 'border-white/10 bg-white/[0.035]'} ${isCurrentMonth && isPositive ? 'border-success/35 bg-success/10' : ''} ${isCurrentMonth && isNegative ? 'border-destructive/35 bg-destructive/10' : ''}`}
                        >
                          <div className="flex h-full flex-col justify-between">
                            <span className={`text-sm font-bold ${!isCurrentMonth ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {format(day, 'd')}
                            </span>
                            {count > 0 && (
                              <div className="text-right">
                                <span className={`block text-[11px] font-black ${isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {pnl > 0 ? '+' : ''}{formatEuro(pnl)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {count} trade{count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel rounded-lg">
              <CardHeader className="border-b border-white/10">
                <p className="section-kicker mb-2">Execution feed</p>
                <CardTitle className="text-2xl font-black">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md bg-white/10" />)
                ) : recentTrades.length === 0 ? (
                  <p className="rounded-md border border-white/10 bg-black/20 px-4 py-8 text-sm text-muted-foreground">No trades recorded for this month.</p>
                ) : (
                  recentTrades.map((trade) => {
                    const net = getTradeNetProfit(trade, originalBalances, currentBalancesMap);
                    const tradeDate = trade.entryDate || trade.date;
                    return (
                      <div key={trade.id} className="rounded-md border border-white/10 bg-black/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-black">{trade.symbol || trade.instrument || 'Trade'}</p>
                            <p className="text-xs text-muted-foreground">{tradeDate ? format(new Date(tradeDate), 'MMM dd') : 'No date'} · {Number(trade.rrSecured || 0).toFixed(2)}R</p>
                          </div>
                          <p className={`text-sm font-black ${net > 0 ? 'text-success' : net < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {net > 0 ? '+' : ''}{formatEuro(net)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
};

const DashboardTooltip = ({ active, payload, label, formatEuro }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-md border border-white/10 bg-popover px-4 py-3 shadow-2xl">
      <p className="text-sm font-black text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">Balance</p>
      <p className="text-base font-black text-primary">{formatEuro(point.balance)}</p>
      <p className={`mt-1 text-xs font-bold ${point.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
        {point.pnl >= 0 ? '+' : ''}{formatEuro(point.pnl)} P/L
      </p>
    </div>
  );
};

const RiskRow = ({ label, value, valueClass = 'text-foreground' }) => (
  <div className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.035] px-4 py-3">
    <span className="surface-label">{label}</span>
    <span className={`text-sm font-black ${valueClass}`}>{value}</span>
  </div>
);

const StatCard = ({ title, value, icon, loading, valueClass = 'text-foreground' }) => (
  <Card className="stat-surface rounded-lg">
    <CardContent className="flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="surface-label mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 bg-white/10" />
        ) : (
          <h3 className={`truncate text-2xl font-black ${valueClass}`}>{value}</h3>
        )}
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
