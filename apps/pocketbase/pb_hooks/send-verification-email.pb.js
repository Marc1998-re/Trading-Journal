/// <reference path="../pb_data/types.d.ts" />
onMailerRecordVerificationSend((e) => {
  const mail = require(__hooks + '/journal-mail.cjs');
  mail.customize(e, 'verification', $os.getenv('APP_URL'));
  e.next();
}, 'users');

onMailerRecordPasswordResetSend((e) => {
  const mail = require(__hooks + '/journal-mail.cjs');
  mail.customize(e, 'reset', $os.getenv('APP_URL'));
  e.next();
}, 'users');
