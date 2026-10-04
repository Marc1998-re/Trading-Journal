import test from 'node:test';
import assert from 'node:assert/strict';
import { initialJournalPeriod, updateJournalPeriod, resolveReviewTrade, confirmDeparture, preventUnsavedUnload } from '../apps/web/src/lib/journalNavigation.js';

const july = { id: 'july', notes: '', accountId: 'a' };
const august = { id: 'august', notes: 'Saved', accountId: 'a' };

test('explicit review ID resolves outside the current period and open-note queue', () => {
  assert.equal(resolveReviewTrade([july, august], [august], 'july'), july);
  assert.equal(resolveReviewTrade([july, august], [], 'august'), august);
});
test('missing, empty and inaccessible IDs never fall back to another trade', () => {
  for (const id of ['unknown', '', 'july']) assert.equal(resolveReviewTrade([august], [august], id), null);
});
test('only an absent review ID selects the first filtered trade', () => {
  assert.equal(resolveReviewTrade([july, august], [august], null), august);
  assert.equal(resolveReviewTrade([july, august], [], null), null);
});
test('demo and user periods are isolated, and new users start in the current month', () => {
  const demo = initialJournalPeriod('demo');
  assert.equal(demo.month.getMonth(), 7);
  const user = updateJournalPeriod(demo, 'user-b', {}, new Date(2026, 8, 24));
  assert.equal(user.scope, 'user-b');
  assert.equal(user.month.getMonth(), 8);
  assert.equal(user.range, 'month');
});
test('a month change and all-time reset are atomic and month dates are normalized', () => {
  const all = updateJournalPeriod(initialJournalPeriod('demo'), 'demo', { range: 'all' });
  const julyPeriod = updateJournalPeriod(all, 'demo', { month: new Date(2026, 6, 16), range: 'month' });
  assert.equal(julyPeriod.month.getMonth(), 6);
  assert.equal(julyPeriod.month.getDate(), 1);
  assert.equal(julyPeriod.range, 'month');
});
test('no-op and invalid selections leave the current period untouched', () => {
  const current = initialJournalPeriod('demo');
  for (const patch of [{ range: 'month' }, { month: new Date(2026, 7, 20) }, { month: new Date(NaN) }, { range: 'invalid' }]) {
    assert.equal(updateJournalPeriod(current, 'demo', patch), current);
  }
});
test('cancelling a departure preserves the draft and dirty state', () => {
  let discarded = false;
  const guard = { dirty: true, onDiscard: () => { discarded = true; } };
  assert.equal(confirmDeparture(guard, () => false, assert.fail), false);
  assert.equal(discarded, false);
  assert.equal(guard.dirty, true);
});
test('confirming discards once and does not ask again for the following route transition', () => {
  let calls = 0;
  const guard = { dirty: true, onDiscard: () => { calls++; } };
  assert.equal(confirmDeparture(guard, () => true, assert.fail), true);
  assert.equal(confirmDeparture(guard, assert.fail, assert.fail), true);
  assert.equal(calls, 1);
});
test('saving in progress blocks changes without discarding or asking to discard', () => {
  let alerted = false;
  const guard = { busy: true, dirty: true, onDiscard: assert.fail };
  assert.equal(confirmDeparture(guard, assert.fail, () => { alerted = true; }), false);
  assert.equal(alerted, true);
});
test('clean or unmounted editors allow navigation without dialogs', () => {
  assert.equal(confirmDeparture(null, assert.fail, assert.fail), true);
  assert.equal(confirmDeparture({ dirty: false }, assert.fail, assert.fail), true);
});
test('reload and closing protection applies to dirty or saving notes only', () => {
  for (const guard of [{ dirty: true }, { busy: true }]) {
    const event = { preventDefault() { this.prevented = true; }, returnValue: undefined };
    preventUnsavedUnload(event, guard);
    assert.equal(event.prevented, true);
    assert.equal(event.returnValue, '');
  }
  preventUnsavedUnload({ preventDefault: assert.fail }, { dirty: false, busy: false });
});
