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
        <section className="command-panel rounded-lg p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="section-kicker mb-3">Performance lab</p>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-black tracking-normal sm:text-5xl">Analysis</h1>
              <Badge className="font-medium text-sm px-3 py-1 bg-primary/10 text-primary border-primary/30">
                {accountName}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Comprehensive insights into your trading performance, edge and risk profile.</p>
          </div>
        </div>
        </section>

        <Tabs value="/analysis" onValueChange={(v) => navigate(v)} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-black/20 border border-white/10">
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

export default AnalysisPage;
