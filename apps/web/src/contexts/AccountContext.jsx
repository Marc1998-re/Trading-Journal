import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

const AccountContext = createContext(null);

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

export const AccountProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [originalBalances, setOriginalBalances] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return localStorage.getItem('selectedAccountId') || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const records = await pb.collection('tradingAccounts').getFullList({
        filter: `userId = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      
      setAccounts(records);
      
      // Store initial session balances for ratio calculations
      setOriginalBalances(prev => {
        const newMap = { ...prev };
        let changed = false;
        records.forEach(r => {
          if (newMap[r.id] === undefined) {
            newMap[r.id] = r.startingBalance;
            changed = true;
          }
        });
        return changed ? newMap : prev;
      });
      
      if (selectedAccountId && !records.find(a => a.id === selectedAccountId)) {
        setSelectedAccountId(null);
        localStorage.removeItem('selectedAccountId');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load trading accounts');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedAccountId]);

  useEffect(() => {
    if (currentUser) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setOriginalBalances({});
      setSelectedAccountId(null);
    }
  }, [currentUser, fetchAccounts]);

  const selectAccount = (accountId) => {
    setSelectedAccountId(accountId);
    if (accountId) {
      localStorage.setItem('selectedAccountId', accountId);
    } else {
      localStorage.removeItem('selectedAccountId');
    }
  };

  const selectAllAccounts = () => {
    selectAccount(null);
  };

  const updateAccountBalance = async (accountId, newBalance) => {
    try {
      const record = await pb.collection('tradingAccounts').update(accountId, { 
        startingBalance: newBalance 
      }, { $autoCancel: false });
      
      setAccounts(prev => prev.map(a => a.id === accountId ? record : a));
      toast.success('Account balance updated');
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
      throw error;
    }
  };

  const createAccount = async (accountName) => {
    if (!currentUser) return;
    try {
      const record = await pb.collection('tradingAccounts').create({
        accountName,
        userId: currentUser.id,
        status: 'active',
        startingBalance: 10000 // Default for new accounts
      }, { $autoCancel: false });

      setAccounts(prev => [record, ...prev]);
      setOriginalBalances(prev => ({ ...prev, [record.id]: record.startingBalance }));
      toast.success('Account created successfully');
      return record;
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
      throw error;
    }
  };

  const renameAccount = async (accountId, newName) => {
    try {
      const record = await pb.collection('tradingAccounts').update(accountId, {
        accountName: newName
      }, { $autoCancel: false });
      
      setAccounts(prev => prev.map(acc => acc.id === accountId ? record : acc));
      toast.success('Account renamed successfully');
    } catch (error) {
      console.error('Error renaming account:', error);
      toast.error('Failed to rename account');
      throw error;
    }
  };

  const deleteAccount = async (accountId, targetAccountId) => {
    try {
      const tradesToReassign = await pb.collection('trades').getFullList({
        filter: `accountId = "${accountId}"`,
        $autoCancel: false
      });

      if (tradesToReassign.length > 0) {
        toast.info(`Reassigning ${tradesToReassign.length} trades...`);
        await Promise.all(
          tradesToReassign.map(trade => 
            pb.collection('trades').update(trade.id, { accountId: targetAccountId }, { $autoCancel: false })
          )
        );
      }

      await pb.collection('tradingAccounts').delete(accountId, { $autoCancel: false });
      
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      if (selectedAccountId === accountId) {
        selectAccount(targetAccountId);
      }
      
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      throw error;
    }
  };

  const value = {
    accounts,
    originalBalances,
    selectedAccountId,
    isLoading,
    selectAccount,
    selectAllAccounts,
    updateAccountBalance,
    createAccount,
    renameAccount,
    deleteAccount,
    refreshAccounts: fetchAccounts
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};