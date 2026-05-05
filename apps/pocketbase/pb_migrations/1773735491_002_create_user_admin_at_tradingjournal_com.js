/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Disabled: never create application users with hardcoded credentials.
  // If an admin/demo user is needed, create it manually with a unique password
  // or seed it from private environment variables outside source control.
  return;
}, (app) => {
  return;
})
