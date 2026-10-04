import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import { confirmDeparture, preventUnsavedUnload } from '@/lib/journalNavigation';

const NavigationGuardContext = createContext(null);

export function NavigationGuardProvider({ children }) {
  const guard = useRef(null);
  const handledLocation = useRef(null);
  const register = useCallback(value => {
    guard.current = value;
    return () => { if (guard.current === value) guard.current = null; };
  }, []);
  const confirmNavigation = useCallback(() => confirmDeparture(guard.current, message => window.confirm(message), message => window.alert(message)), []);
  const shouldBlock = useCallback(({ currentLocation, nextLocation }) =>
    Boolean(guard.current?.dirty || guard.current?.busy) &&
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search), []);
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      handledLocation.current = null;
      return;
    }
    if (handledLocation.current === blocker.location.key) return;
    handledLocation.current = blocker.location.key;
    if (confirmNavigation()) blocker.proceed();
    else blocker.reset();
  }, [blocker, confirmNavigation]);

  useBeforeUnload(useCallback(event => preventUnsavedUnload(event, guard.current), []));
  const value = useMemo(() => ({ register, confirmNavigation }), [register, confirmNavigation]);
  return <NavigationGuardContext.Provider value={value}>{children}</NavigationGuardContext.Provider>;
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) throw new Error('NavigationGuardProvider is missing.');
  return context;
}

export function useUnsavedReview(dirty, busy, onDiscard) {
  const { register } = useNavigationGuard();
  useLayoutEffect(() => register({ dirty, busy, onDiscard }), [register, dirty, busy, onDiscard]);
}
