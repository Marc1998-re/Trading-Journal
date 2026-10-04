/// <reference path="../pb_data/types.d.ts" />
// This is a diagnostic hook to verify the users collection schema
// It will log schema information without blocking operations

onRecordAfterCreateSuccess((e) => {
  // Do not log account addresses or verification tokens.
  e.next();
}, "users");
