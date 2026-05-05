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
import { Filter, X, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Label
} from 'recharts';
import { getTradeGrossProfit, calculateNetProfit } from '@/lib/tradeCalculations.js';

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
      const d = new Date(t.entryDate || t.date);
      if (!isNaN(d.getTime())) {
        const monthIdx = d.getMonth();
        const gross = getTradeGrossProfit(t, originalBalances, currentBalancesMap);
        const net = calculateNetProfit(gross, t.commissionPercentage, originalBalances, currentBalancesMap);
        
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
      const d = new Date(t.entryDate || t.date);
      if (!isNaN(d.getTime())) {
        const dayName = days[d.getDay()];
        const gross = getTradeGrossProfit(t, originalBalances, currentBalancesMap);
        const net = calculateNetProfit(gross, t.commissionPercentage, originalBalances, currentBalancesMap);
        
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg min-w-[180px]">
          <p className="font-medium text-foreground mb-2 border-b border-border pb-1">{label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Trades</span>
              <span className="font-semibold text-foreground">{data.trades}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">P&L ($)</span>
              <span className={`font-semibold ${data.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.pnl >= 0 ? '+' : '-'}${Math.abs(data.pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">P&L (%)</span>
              <span className={`font-semibold ${data.pnlPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.pnlPct >= 0 ? '+' : '-'}{Math.abs(data.pnlPct).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>Charts - Trading Journal</title>
        <meta name="description" content="Visual performance analytics and trading charts" />
      </Helmet>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Charts</h1>
              <Badge variant="secondary" className="font-medium text-sm px-3 py-1 bg-primary/10 text-primary">
                {accountName}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">Visual representation of your trading data</p>
          </div>
        </div>

        <Tabs value="/charts" onValueChange={(v) => navigate(v)} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
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
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[400px] rounded-2xl" />)}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-2xl border border-border shadow-sm">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <Card className="shadow-md rounded-2xl overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                <CardTitle className="text-xl">Win/Loss Distribution</CardTitle>
                <CardDescription>Breakdown of your trade outcomes</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PieChart data={pieData} />
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-2xl overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                <CardTitle className="text-xl">Day of Week Performance</CardTitle>
                <CardDescription>Profit and Loss breakdown by day of the week</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dy={10}
                    >
                      <Label 
                        value="Day of the Week" 
                        offset={-15} 
                        position="insideBottom" 
                        style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }} 
                      />
                    </XAxis>
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => `$${val}`}
                    >
                      <Label 
                        value="Profit / Loss ($)" 
                        angle={-90} 
                        position="insideLeft" 
                        offset={-10} 
                        style={{ textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }} 
                      />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }} 
                      payload={[
                        { value: 'Profit', type: 'square', color: '#10b981' },
                        { value: 'Loss', type: 'square', color: '#ef4444' }
                      ]} 
                    />
                    <Bar dataKey="pnl" name="P&L ($)" maxBarSize={40}>
                      {dayOfWeekData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md rounded-2xl overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                <CardTitle className="text-xl">Monthly Performance</CardTitle>
                <CardDescription>Profit and Loss progression across the year</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dy={10}
                    >
                      <Label 
                        value="Month" 
                        offset={-15} 
                        position="insideBottom" 
                        style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }} 
                      />
                    </XAxis>
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => `$${val}`}
                    >
                      <Label 
                        value="Profit / Loss ($)" 
                        angle={-90} 
                        position="insideLeft" 
                        offset={-10} 
                        style={{ textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }} 
                      />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }} 
                      payload={[
                        { value: 'Profit', type: 'square', color: '#10b981' },
                        { value: 'Loss', type: 'square', color: '#ef4444' }
                      ]} 
                    />
                    <Bar dataKey="pnl" name="P&L ($)" maxBarSize={50}>
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md rounded-2xl overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                <CardTitle className="text-xl">Equity Curve</CardTitle>
                <CardDescription>Cumulative profit/loss over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <EquityCurve trades={trades} startingBalance={totalCurrentBalance} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md rounded-2xl overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                <CardTitle className="text-xl">Balance Curve</CardTitle>
                <CardDescription>Account balance progression over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <BalanceCurve trades={trades} startingBalance={totalCurrentBalance} />
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </>
  );
};

export default ChartsPage;