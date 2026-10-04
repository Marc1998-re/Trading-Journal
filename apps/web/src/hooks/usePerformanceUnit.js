import { useEffect, useState } from 'react';

export function usePerformanceUnit() {
  const [unit, setUnit] = useState(() => {
    try { return localStorage.getItem('journal-performance-unit') === 'percent' ? 'percent' : 'money'; }
    catch { return 'money'; }
  });
  useEffect(() => {
    try { localStorage.setItem('journal-performance-unit', unit); }
    catch { /* The selection still works when browser storage is unavailable. */ }
  }, [unit]);
  return [unit, setUnit];
}
