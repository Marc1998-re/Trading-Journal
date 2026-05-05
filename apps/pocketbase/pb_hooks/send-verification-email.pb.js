/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Disabled: this hook used a non-verification token in a custom URL.
  // The frontend already calls PocketBase requestVerification(), which
  // generates the correct verification token and sends it through the
  // configured mailer pipeline.
  e.next();
}, "users");
