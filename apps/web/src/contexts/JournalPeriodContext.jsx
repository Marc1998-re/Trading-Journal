import React, { createContext, useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import { initialJournalPeriod, updateJournalPeriod } from '@/lib/journalNavigation';

const JournalPeriodContext = createContext(null);

export function JournalPeriodProvider({ children }) {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const { confirmNavigation } = useNavigationGuard();
  const scope = pathname.startsWith('/demo') ? 'demo' : currentUser?.id || 'guest';
  // Remounting this small state holder separates demo, logout and user sessions.
  return <PeriodState key={scope} scope={scope} confirmNavigation={confirmNavigation}>{children}</PeriodState>;
}

function PeriodState({ scope, confirmNavigation, children }) {
  const [period, setPeriodState] = useState(() => initialJournalPeriod(scope));
  const [demoReviews, setDemoReviews] = useState({});
  const value = useMemo(() => {
    const setPeriod = patch => {
      const next = updateJournalPeriod(period, scope, patch);
      if (next === period) return true;
      if (!confirmNavigation()) return false;
      setPeriodState(next);
      return true;
    };
    return { ...period, demoReviews, setDemoReviews, setPeriod, setMonth: month => setPeriod({ month }), setRange: range => setPeriod({ range }) };
  }, [period, scope, confirmNavigation, demoReviews]);
  return <JournalPeriodContext.Provider value={value}>{children}</JournalPeriodContext.Provider>;
}

export function useJournalPeriod() {
  const context = useContext(JournalPeriodContext);
  if (!context) throw new Error('JournalPeriodProvider is missing.');
  return context;
}
