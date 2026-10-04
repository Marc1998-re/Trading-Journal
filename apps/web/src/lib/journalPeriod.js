import { addDays, addMonths, format, isValid, parse, startOfMonth, startOfWeek } from 'date-fns';
import { getTradeDate, calculateNetPnL } from './tradeCalculations.js';

export function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parse(value, 'yyyy-MM-dd', new Date(2000, 0, 1));
  return isValid(date) && format(date, 'yyyy-MM-dd') === value ? date : null;
}
export const dateInput = date => format(date, 'yyyy-MM-dd');

export function periodBounds(period) {
  if (period.range === 'all') return { start: null, end: null };
  if (period.range === 'custom') {
    const start = parseDay(period.from), last = parseDay(period.to);
    if (!start || !last || last < start) throw new Error('Wähle einen gültigen Zeitraum. Das Ende darf nicht vor dem Start liegen.');
    return { start, end: addDays(last, 1) };
  }
  if (period.range === 'week') {
    const start = startOfWeek(period.anchor, { weekStartsOn: 1 });
    return { start, end: addDays(start, 7) };
  }
  const start = startOfMonth(period.month);
  return { start, end: addMonths(start, 1) };
}

export function periodLabel(period) {
  const { start, end } = periodBounds(period);
  if (!start) return 'Gesamter Zeitraum';
  if (period.range === 'month') return start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  return `${start.toLocaleDateString('de-DE')} – ${addDays(end, -1).toLocaleDateString('de-DE')}`;
}

export function selectPeriodTrades(all, period, base, balances) {
  const { start, end } = periodBounds(period);
  const trades = start ? all.filter(t => { const date = getTradeDate(t); return date && date >= start && date < end; }) : all;
  const before = start ? all.filter(t => { const date = getTradeDate(t); return date && date < start; }) : [];
  return { trades, opening: base + calculateNetPnL(before, balances, balances) };
}
