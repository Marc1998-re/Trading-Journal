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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Analysis</h1>
              <Badge variant="secondary" className="font-medium text-sm px-3 py-1 bg-primary/10 text-primary">
                {accountName}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">Comprehensive insights into your trading performance</p>
          </div>
        </div>

        <Tabs value="/analysis" onValueChange={(v) => navigate(v)} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="/analysis">Analysis</TabsTrigger>
            <TabsTrigger value="/charts">Charts</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
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
    </>
  );
};

export default AnalysisPage;