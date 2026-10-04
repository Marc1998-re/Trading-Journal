import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';
import { useJournalPeriod } from '@/contexts/JournalPeriodContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import pb from '@/lib/pocketbaseClient';
import { demoAccounts, demoTrades } from '@/lib/demoData';
import { calculateAdvancedStats } from '@/lib/tradeCalculations';
import { selectPeriodTrades } from '@/lib/journalPeriod';

export function useJournalData() {
  const { pathname } = useLocation();
  const demo = pathname.startsWith('/demo');
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const context = useAccount();
  const period = useJournalPeriod();
  const { month, range, anchor, from, to, setMonth, setRange, setPeriod, demoReviews, setDemoReviews } = period;
  const { confirmNavigation } = useNavigationGuard();
  const [records,setRecords] = useState([]);
  const [loading,setLoading] = useState(!demo);
  const [error,setError] = useState('');
  const accounts=demo?demoAccounts:context.accounts;
  const refresh=useCallback(async()=>{
    if(demo || !userId) return;
    setLoading(true);setError('');
    try {
      const result=await pb.collection('trades').getFullList({filter:pb.filter('userId = {:user}',{user:userId}),sort:'entryDate,entryTime',requestKey:'journal-trades'});
      setRecords(result);
    } catch(e) {if(!e.isAbort) setError('Deine Trades konnten nicht geladen werden. Bitte versuche es erneut.');}
    finally {setLoading(false);}
  },[demo,userId]);
  useEffect(()=>{refresh();},[refresh]);
  const refreshSafely = useCallback(() => {
    if (confirmNavigation()) return refresh();
  }, [confirmNavigation, refresh]);
  const updateTrade = useCallback(record => {
    if (demo) setDemoReviews(previous => ({ ...previous, [record.id]: record }));
    else setRecords(previous => previous.map(trade => trade.id === record.id ? record : trade));
  }, [demo, setDemoReviews]);
  const data=useMemo(()=>{
    const all=(demo?demoTrades.map(t => demoReviews[t.id] || t):records).filter(t=>demo || !context.selectedAccountId || t.accountId===context.selectedAccountId);
    const balances=Object.fromEntries(accounts.map(a=>[a.id,Number(a.startingBalance)||0]));
    const active=demo || !context.selectedAccountId?accounts:accounts.filter(a=>a.id===context.selectedAccountId);
    const base=active.reduce((s,a)=>s+(Number(a.startingBalance)||0),0);
    const { trades, opening } = selectPeriodTrades(all, { month, range, anchor, from, to }, base, balances);
    return {allTrades:all,trades,balances,opening,stats:calculateAdvancedStats(trades,opening,balances,balances),accountName:active.length===1?active[0].accountName:'Alle Konten'};
  },[demo,records,accounts,context.selectedAccountId,month,range,anchor,from,to,demoReviews]);
  return {...data,demo,loading,error,refresh:refreshSafely,updateTrade,month,setMonth,range,setRange,setPeriod,anchor,from,to,accounts};
}
