import { parseDay } from './journalPeriod.js';

export function initialJournalPeriod(scope, today = new Date()) {
  return {
    scope,
    month: scope === 'demo' ? new Date(2026, 7, 1) : new Date(today.getFullYear(), today.getMonth(), 1),
    range: 'month',
    anchor: scope === 'demo' ? new Date(2026, 7, 30) : today,
    from: '',
    to: '',
  };
}

export function updateJournalPeriod(previous, scope, patch, today) {
  const current = previous.scope === scope ? previous : initialJournalPeriod(scope, today);
  const next = { ...current, ...patch, scope };
  if (!(next.month instanceof Date) || !Number.isFinite(next.month.getTime())) return current;
  if (patch.month && !patch.anchor) next.anchor = patch.month;
  if (patch.anchor) next.month = patch.anchor;
  if (!['month', 'all', 'week', 'custom'].includes(next.range)) return current;
  if (!(next.anchor instanceof Date) || !Number.isFinite(next.anchor.getTime())) return current;
  if (next.range === 'custom') {
    const start = parseDay(next.from), end = parseDay(next.to);
    if (!start || !end || end < start) return current;
    next.month = start;
    next.anchor = start;
  }
  if (next.range === current.range && next.month.getFullYear() === current.month.getFullYear() && next.month.getMonth() === current.month.getMonth() && next.from === current.from && next.to === current.to && (next.range !== 'week' || next.anchor.getTime() === current.anchor.getTime())) return current;
  return { ...next, month: new Date(next.month.getFullYear(), next.month.getMonth(), 1) };
}

export function resolveReviewTrade(allTrades, queue, requestedId) {
  // A supplied ID is authoritative, including invalid or unavailable IDs.
  if (requestedId !== null) return allTrades.find(trade => trade.id === requestedId) || null;
  return queue[0] || null;
}

export function confirmDeparture(guard, confirm, alert) {
  if (guard?.busy) {
    alert('Dein Review wird gerade gespeichert. Bitte warte einen Moment.');
    return false;
  }
  if (!guard?.dirty) return true;
  if (!confirm('Du hast ungespeicherte Review-Änderungen. Möchtest du sie verwerfen und fortfahren?')) return false;
  guard.onDiscard();
  guard.dirty = false;
  return true;
}

export function preventUnsavedUnload(event, guard) {
  if (!guard?.dirty && !guard?.busy) return;
  event.preventDefault();
  event.returnValue = '';
}
