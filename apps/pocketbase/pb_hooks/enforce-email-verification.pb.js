/// <reference path="../pb_data/types.d.ts" />
onRecordAuthRequest((e) => {
  if (!e.record.verified()) {
    throw new ForbiddenError('Bitte bestätige zuerst deine E-Mail-Adresse.', {
      verification: { code: 'verification_required', message: 'E-Mail noch nicht bestätigt.' }
    });
  }
  e.next();
}, 'users');
