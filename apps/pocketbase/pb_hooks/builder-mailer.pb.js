/// <reference path="../pb_data/types.d.ts" />
// Standalone delivery uses PocketBase's configured SMTP transport.
// Do not silently fall back to the private Horizons mail relay.
onMailerSend((e) => {
  if (!e.app.settings().smtp.enabled) {
    throw new Error('SMTP is not configured. Set PocketBase Settings > Mail settings before requesting account emails.');
  }
  e.next();
});
