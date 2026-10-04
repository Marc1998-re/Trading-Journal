import test from 'node:test';
import assert from 'node:assert/strict';
import { dateInput, parseDay, periodBounds, periodLabel, selectPeriodTrades } from '../apps/web/src/lib/journalPeriod.js';
import { initialJournalPeriod, updateJournalPeriod } from '../apps/web/src/lib/journalNavigation.js';
import { calculateAdvancedStats } from '../apps/web/src/lib/tradeCalculations.js';

const custom = (from, to) => ({ range: 'custom', from, to });
test('custom dates reject impossible, missing and reversed dates', () => {
  for (const value of ['', '2026-02-29', '2026-4-1', '2026-04-31', null]) assert.equal(parseDay(value), null);
  assert.equal(dateInput(parseDay('2024-02-29')), '2024-02-29');
  assert.throws(() => periodBounds(custom('2026-08-31', '2026-08-01')));
  assert.throws(() => periodBounds(custom('', '2026-08-01')));
});
test('week starts on Monday and crosses month and year boundaries', () => {
  const bounds = periodBounds({ range: 'week', anchor: new Date(2027, 0, 3) });
  assert.equal(dateInput(bounds.start), '2026-12-28');
  assert.equal(dateInput(bounds.end), '2027-01-04');
});
test('custom end is exclusive midnight of the next calendar day, including DST changes', () => {
  for (const [day, next] of [['2026-03-29', '2026-03-30'], ['2026-10-25', '2026-10-26'], ['2024-02-29', '2024-03-01']]) {
    const bounds = periodBounds(custom(day, day));
    assert.equal(dateInput(bounds.start), day);
    assert.equal(dateInput(bounds.end), next);
    assert.equal(bounds.end.getHours(), 0);
  }
});
test('selected range includes both dates, excludes adjacent days and rebases opening capital', () => {
  const all = [
    { id: 'before', entryDate: '2026-08-23', profitLoss: 1000, fees: 100 },
    { id: 'first', entryDate: '2026-08-24', entryTime: '00:00', profitLoss: 100 },
    { id: 'last', entryDate: '2026-08-30', entryTime: '23:59', profitLoss: -20 },
    { id: 'after', entryDate: '2026-08-31', profitLoss: 999 },
    { id: 'invalid', entryDate: '2026-02-31', profitLoss: 999 },
  ];
  const result = selectPeriodTrades(all, custom('2026-08-24', '2026-08-30'), 10000, {});
  assert.deepEqual(result.trades.map(t => t.id), ['first', 'last']);
  assert.equal(result.opening, 10900);
  assert.equal(calculateAdvancedStats(result.trades, result.opening).returnPct, 80 / 10900 * 100);
  const total = selectPeriodTrades(all, { range: 'all' }, 10000, {});
  assert.equal(total.trades, all);
  assert.equal(total.opening, 10000);
});
test('custom selection is atomic and changing to a week uses its start', () => {
  const initial = initialJournalPeriod('demo');
  const selected = updateJournalPeriod(initial, 'demo', custom('2026-07-16', '2026-08-12'));
  assert.equal(dateInput(selected.anchor), '2026-07-16');
  assert.equal(dateInput(selected.month), '2026-07-01');
  const week = updateJournalPeriod(selected, 'demo', { range: 'week' });
  assert.equal(dateInput(periodBounds(week).start), '2026-07-13');
  assert.equal(updateJournalPeriod(selected, 'demo', custom('2026-08-31', '2026-08-01')), selected);
});
test('labels show selected dates without claiming close-date reporting', () => {
  assert.equal(periodLabel({ range: 'all' }), 'Gesamter Zeitraum');
  assert.equal(periodLabel(custom('2026-08-24', '2026-08-30')), '24.8.2026 – 30.8.2026');
});
