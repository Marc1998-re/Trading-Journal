import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useSymbols = () => {
  const { currentUser } = useAuth();
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSymbols = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const records = await pb.collection('symbols').getFullList({
        sort: 'symbol',
        $autoCancel: false,
      });
      setSymbols(records.map(r => r.symbol));
    } catch (error) {
      console.error('Error fetching symbols:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  const addSymbol = async (newSymbol) => {
    if (!newSymbol || !currentUser?.id) return;
    const upperSymbol = newSymbol.toUpperCase().trim();

    // Check if it already exists locally to avoid unnecessary API calls
    if (symbols.map(s => s.toUpperCase()).includes(upperSymbol)) return;

    try {
      await pb.collection('symbols').create({
        symbol: upperSymbol,
        userId: currentUser.id
      }, { $autoCancel: false });
      
      // Optimistic update
      setSymbols(prev => {
        const updated = [...prev, upperSymbol];
        return [...new Set(updated)].sort();
      });
    } catch (error) {
      // Ignore duplicate errors (might have been created in another tab/device)
      console.error('Error adding symbol:', error);
    }
  };

  return { symbols, loading, addSymbol, fetchSymbols };
};