/// <reference path="../pb_data/types.d.ts" />
onRecordValidate((e) => {
  if (e.record.getString('reviewStatus') === 'completed') {
    const lesson = e.record.getString('reviewLesson').trim();
    const action = e.record.getString('reviewAction').trim();
    if (!lesson || !action) throw new BadRequestError('Ein abgeschlossener Review braucht eine Erkenntnis und einen nächsten Schritt.');
    e.record.set('reviewLesson', lesson);
    e.record.set('reviewAction', action);
    const original = e.record.original();
    const completedAt = original.getString('reviewStatus') === 'completed' ? original.getString('reviewCompletedAt') : '';
    e.record.set('reviewCompletedAt', completedAt || new Date().toISOString());
  } else {
    e.record.set('reviewCompletedAt', '');
  }
  e.next();
}, 'trades');
