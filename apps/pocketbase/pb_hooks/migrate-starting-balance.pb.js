/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // This hook runs after a tradingAccount is created
  // It fetches the user's settings and sets startingBalance if not already set
  if (e.record.get("startingBalance") === null || e.record.get("startingBalance") === undefined) {
    try {
      const userSettings = $app.findFirstRecordByData("userSettings", "userId", e.record.get("userId"));
      if (userSettings) {
        const balance = userSettings.get("startingBalance");
        if (balance !== null && balance !== undefined) {
          e.record.set("startingBalance", balance);
          $app.save(e.record);
        }
      }
    } catch (err) {
      // User settings not found, skip
    }
  }
  e.next();
}, "tradingAccounts");

onRecordUpdate((e) => {
  // Ensure startingBalance is set during updates
  if (e.record.get("startingBalance") === null || e.record.get("startingBalance") === undefined) {
    try {
      const userSettings = $app.findFirstRecordByData("userSettings", "userId", e.record.get("userId"));
      if (userSettings) {
        const balance = userSettings.get("startingBalance");
        if (balance !== null && balance !== undefined) {
          e.record.set("startingBalance", balance);
        }
      }
    } catch (err) {
      // User settings not found, skip
    }
  }
  e.next();
}, "tradingAccounts");