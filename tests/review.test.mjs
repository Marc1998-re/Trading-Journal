import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewForm, reviewPayload, reviewStatus, summarizeReviews } from '../apps/web/src/lib/review.js';
import { tradesToCsv } from '../apps/web/src/lib/tradeExport.js';

test('legacy notes become drafts, never completed reviews', () => {
  assert.equal(reviewStatus({}), 'open');
  assert.equal(reviewStatus({ notes: '  ' }), 'open');
  assert.equal(reviewStatus({ notes: 'An old note' }), 'draft');
  assert.equal(reviewStatus({ reviewTags: ['plan'] }), 'draft');
  assert.equal(reviewStatus({ reviewStatus: 'draft' }), 'draft');
  assert.equal(reviewStatus({ reviewStatus: 'completed' }), 'completed');
});
test('partial drafts retain notes and checks without requiring a conclusion', () => {
  const payload = reviewPayload({ notes: ' Plan ', reviewSetup: 'yes' }, 'draft');
  assert.equal(payload.notes, 'Plan');
  assert.equal(payload.reviewSetup, 'yes');
  assert.equal(payload.reviewAction, '');
  assert.equal(payload.reviewStatus, 'draft');
});
test('completion requires both a lesson and an action, without mandatory optional checks', () => {
  for (const form of [{}, { reviewLesson: 'Lesson' }, { reviewAction: 'Action' }, { reviewLesson: ' ', reviewAction: 'Action' }]) {
    assert.throws(() => reviewPayload(form, 'completed'), /Erkenntnis/);
  }
  const value = reviewPayload({ reviewLesson: ' Lesson ', reviewAction: ' Action ' }, 'completed');
  assert.equal(value.reviewLesson, 'Lesson');
  assert.equal(value.reviewAction, 'Action');
  assert.equal(value.reviewSetup, '');
});
test('invalid statuses, checks, tags and oversized input are rejected', () => {
  assert.throws(() => reviewPayload({}, 'open'));
  assert.throws(() => reviewPayload({ reviewRisk: 'sometimes' }, 'draft'));
  assert.throws(() => reviewPayload({ reviewTags: ['unknown'] }, 'draft'));
  for (const [key, limit] of [['notes', 5000], ['reviewLesson', 1000], ['reviewAction', 1000]]) {
    assert.throws(() => reviewPayload({ [key]: 'a'.repeat(limit + 1) }, 'draft'));
    assert.equal(reviewPayload({ [key]: 'a'.repeat(limit) }, 'draft')[key].length, limit);
  }
});
test('tag normalization is stable, unique and does not mutate the source', () => {
  const source = { reviewTags: ['risk', 'plan', 'plan'] };
  assert.deepEqual(reviewPayload(source, 'draft').reviewTags, ['plan', 'risk']);
  assert.deepEqual(source.reviewTags, ['risk', 'plan', 'plan']);
  assert.deepEqual(reviewForm({ reviewTags: 'legacy' }).reviewTags, []);
});
test('retrospective counts completed self-assessments only, once per trade', () => {
  const summary = summarizeReviews([
    {}, { notes: 'Legacy' }, { reviewStatus: 'draft', reviewTags: ['risk'] },
    { reviewStatus: 'completed', reviewTags: ['plan', 'plan', 'risk'] },
    { reviewStatus: 'completed', reviewTags: ['plan'] },
  ]);
  assert.equal(summary.open, 1);
  assert.equal(summary.draft, 2);
  assert.equal(summary.completed, 2);
  assert.deepEqual(summary.tags.map(({ id, count }) => [id, count]), [['plan', 2], ['risk', 1]]);
  assert.equal(summarizeReviews([]).completed, 0);
});
test('CSV retains structured review fields and escapes formula-like conclusions', () => {
  const csv = tradesToCsv([{ notes: 'Note', reviewStatus: 'completed', reviewTags: ['plan'], reviewLesson: '=DANGER()', reviewAction: 'Next step', reviewCompletedAt: '2026-09-29' }]);
  assert.ok(csv.includes('"Review-Status"'));
  assert.ok(csv.includes('"Abgeschlossen"'));
  assert.ok(csv.includes('"\'=DANGER()"'));
  assert.ok(csv.includes('"Next step"'));
  assert.ok(csv.includes('"2026-09-29"'));
});
