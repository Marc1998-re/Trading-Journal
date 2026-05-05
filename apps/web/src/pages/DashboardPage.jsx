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
  parseISO
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
  BarChart2,
  Percent
} from 'lucide-react';
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
  calculateMonetaryGain,
  getTradeGrossProfit,
  calculateNetProfit
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
        sort: '-date',
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
    const dayTrades = trades.filter(t => isSameDay(parseISO(t.date || t.entryDate), day));
    const pnl = dayTrades.reduce((sum, t) => {
      const gross = getTradeGrossProfit(t, originalBalances, currentBalancesMap);
      const net = calculateNetProfit(gross, t.commissionPercentage, originalBalances, currentBalancesMap);
      return sum + net;
    }, 0);
    return { count: dayTrades.length, pnl };
  };

  const calculateStats = () => {
    const processedTrades = trades.map(t => {
      const gross = getTradeGrossProfit(t, originalBalances, currentBalancesMap);
      const net = calculateNetProfit(gross, t.commissionPercentage, originalBalances, currentBalancesMap);
      return { ...t, calculatedNet: net };
    });

    const profits = processedTrades.filter(t => t.calculatedNet > 0).map(t => t.calculatedNet);
    const losses = processedTrades.filter(t => t.calculatedNet < 0).map(t => t.calculatedNet);
    
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = losses.length > 0 ? Math.min(...losses) : 0;
    
    const avgWin = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    const winRate = processedTrades.length > 0 ? (profits.length / processedTrades.length) * 100 : 0;
    
    const grossProfit = profits.reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);

    const netPnL = processedTrades.reduce((sum, t) => sum + t.calculatedNet, 0);
    const returnPercentage = calculateReturnPercentage(netPnL, totalCurrentBalance);
    const monetaryGain = calculateMonetaryGain(netPnL);

    return { bestTrade, worstTrade, avgWin, avgLoss, winRate, profitFactor, returnPercentage, monetaryGain };
  };

  const stats = calculateStats();

  const formatEuro = (val) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(val);
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.entryDate || b.date) - new Date(a.entryDate || a.date))
    .slice(0, 5);

  return (
    <>
      <Helmet>
        <title>Dashboard - Trading Journal</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Trading Dashboard</h1>
              <Badge variant="secondary" className="font-medium text-sm px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {accountName}
              </Badge>
            </div>
            <p className="text-muted-foreground">Month performance, risk profile and recent trading activity.</p>
          </div>
          <Button onClick={handleSync} disabled={isSyncing || loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Return %" 
            value={`${stats.returnPercentage >= 0 ? '+' : ''}${stats.returnPercentage.toFixed(2)}%`} 
            icon={<Percent className="w-5 h-5 text-primary" />} 
            loading={loading} 
            valueClass={stats.returnPercentage >= 0 ? "text-success" : "text-destructive"}
          />
          <StatCard 
            title="Monetary Gain" 
            value={`${stats.monetaryGain >= 0 ? '+' : '-'}${formatEuro(Math.abs(stats.monetaryGain))}`} 
            icon={<DollarSign className="w-5 h-5 text-primary" />} 
            loading={loading} 
            valueClass={stats.monetaryGain >= 0 ? "text-success" : "text-destructive"}
          />
          <StatCard 
            title="Best Trade" 
            value={formatEuro(stats.bestTrade)}
            icon={<TrendingUp className="w-5 h-5 text-success" />} 
            loading={loading} 
            valueClass="text-success"
          />
          <StatCard 
            title="Worst Trade" 
            value={formatEuro(stats.worstTrade)}
            icon={<TrendingDown className="w-5 h-5 text-destructive" />} 
            loading={loading}
            valueClass="text-destructive"
          />
          <StatCard 
            title="Win Rate" 
            value={`${stats.winRate.toFixed(1)}%`} 
            icon={<Target className="w-5 h-5 text-primary" />} 
            loading={loading} 
          />
          <StatCard 
            title="Avg. Win" 
            value={formatEuro(stats.avgWin)}
            icon={<DollarSign className="w-5 h-5 text-success" />} 
            loading={loading} 
            valueClass="text-success"
          />
          <StatCard 
            title="Avg. Loss" 
            value={formatEuro(stats.avgLoss)}
            icon={<Activity className="w-5 h-5 text-destructive" />} 
            loading={loading} 
            valueClass="text-destructive"
          />
          <StatCard 
            title="Profit Factor" 
            value={stats.profitFactor.toFixed(2)} 
            icon={<BarChart2 className="w-5 h-5 text-info" />} 
            loading={loading} 
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="min-w-[140px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {loading ? (
                  Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
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
                        className={`h-24 rounded-lg p-2 flex flex-col justify-between border transition-colors
                          ${!isCurrentMonth ? 'opacity-40 bg-muted/30 border-transparent' : 'bg-card border-border'}
                          ${isCurrentMonth && isPositive ? 'bg-success/10 border-success/20' : ''}
                          ${isCurrentMonth && isNegative ? 'bg-destructive/10 border-destructive/20' : ''}
                        `}
                      >
                        <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                        {count > 0 && (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold ${isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {pnl > 0 ? '+' : ''}{formatEuro(pnl)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {count} trade{count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
              ) : recentTrades.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">No trades recorded for this month.</p>
              ) : (
                recentTrades.map((trade) => {
                  const gross = getTradeGrossProfit(trade, originalBalances, currentBalancesMap);
                  const net = calculateNetProfit(gross, trade.commissionPercentage, originalBalances, currentBalancesMap);
                  const tradeDate = trade.entryDate || trade.date;
                  return (
                    <div key={trade.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <div>
                        <p className="font-semibold">{trade.symbol || trade.instrument || 'Trade'}</p>
                        <p className="text-xs text-muted-foreground">{tradeDate ? format(new Date(tradeDate), 'MMM dd') : 'No date'} · {Number(trade.rrSecured || 0).toFixed(2)}R</p>
                      </div>
                      <p className={`text-sm font-bold ${net > 0 ? 'text-success' : net < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {net > 0 ? '+' : ''}{formatEuro(net)}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ title, value, icon, loading, valueClass = "text-foreground" }) => (
  <Card className="border-border shadow-sm">
    <CardContent className="p-5 flex items-center gap-4">
      <div className="p-3 bg-secondary rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <h3 className={`text-2xl font-bold ${valueClass}`}>{value}</h3>
        )}
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
