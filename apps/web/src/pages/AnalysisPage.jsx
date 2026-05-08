import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useAccount } from '@/contexts/AccountContext.jsx';
import { useFilters, buildTradeFilterString } from '@/contexts/FilterContext.jsx';
import pb from '@/lib/pocketbaseClient';
import AnalysisDashboard from '@/components/AnalysisDashboard.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Activity, BarChart3, Radar, ShieldCheck } from 'lucide-react';

const AnalysisPage = () => {
  const { currentUser } = useAuth();
  const { selectedAccountId, accounts, originalBalances, updateAccountBalance } = useAccount();
  const { filters } = useFilters();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountName = selectedAccount ? selectedAccount.accountName : 'All Accounts';

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const filterString = buildTradeFilterString(currentUser.id, filters, selectedAccountId);

        const tradesResult = await pb.collection('trades').getFullList({
          filter: filterString,
          sort: '-entryDate',
          $autoCancel: false,
        });

        setTrades(tradesResult);
      } catch (err) {
        toast.error('Failed to load analysis data');
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

  return (
    <>
      <Helmet>
        <title>Analysis - Trading Journal</title>
        <meta name="description" content="Analyze your trading performance with detailed metrics" />
      </Helmet>
      <main className="desk-shell market-grid">
        <div className="desk-container">
        <section className="command-panel relative overflow-hidden rounded-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-info via-primary to-accent" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="border-b border-white/10 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
              <p className="section-kicker mb-3">Performance lab</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <h1 className="text-4xl font-black tracking-normal sm:text-6xl">Analysis</h1>
                <Badge className="w-fit border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                  {accountName}
                </Badge>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Comprehensive insights into performance, edge, drawdown and risk behavior.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-black/20 p-5 sm:p-7">
              <LabTile icon={<BarChart3 className="h-5 w-5" />} label="Trades" value={trades.length.toString()} loading={loading} />
              <LabTile icon={<Radar className="h-5 w-5" />} label="Scope" value={selectedAccountId ? 'Account' : 'All'} loading={loading} />
              <LabTile icon={<ShieldCheck className="h-5 w-5" />} label="Mode" value="Audit" loading={false} />
              <LabTile icon={<Activity className="h-5 w-5" />} label="View" value="Live" loading={false} />
            </div>
          </div>
        </section>

        <Tabs value="/analysis" onValueChange={(v) => navigate(v)} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 border border-white/10 bg-black/20 p-1">
            <TabsTrigger value="/analysis">Analysis</TabsTrigger>
            <TabsTrigger value="/charts">Charts</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 bg-white/10" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-white/10" />)}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 bg-white/10" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-white/10" />)}
              </div>
            </div>
          </div>
        ) : (
          <AnalysisDashboard 
            trades={trades} 
            accounts={accounts}
            originalBalances={originalBalances}
            selectedAccountId={selectedAccountId}
            onUpdateBalance={updateAccountBalance} 
          />
        )}
        </div>
      </main>
    </>
  );
};

const LabTile = ({ icon, label, value, loading }) => (
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

export default AnalysisPage;
