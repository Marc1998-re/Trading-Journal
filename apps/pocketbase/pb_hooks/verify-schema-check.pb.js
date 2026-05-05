/// <reference path="../pb_data/types.d.ts" />
// This is a diagnostic hook to verify the users collection schema
// It will log schema information without blocking operations

onRecordAfterCreateSuccess((e) => {
  console.log("=== USERS COLLECTION SCHEMA VERIFICATION ===");
  console.log("Record created successfully: " + e.record.id);
  console.log("Email: " + e.record.get("email"));
  console.log("Verified status: " + e.record.get("verified"));
  e.next();
}, "users");