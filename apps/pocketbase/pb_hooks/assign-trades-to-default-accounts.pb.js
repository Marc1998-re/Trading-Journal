/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // This hook runs after a trade is created
  // If accountId is not set, assign it to the user's default account
  
  if (!e.record.get("accountId")) {
    const userId = e.record.get("userId");
    
    // Find or create default account for this user
    let defaultAccount = $app.findFirstRecordByData("tradingAccounts", "accountName", "Default Account");
    
    if (!defaultAccount || defaultAccount.get("userId") !== userId) {
      // Create default account if it doesn't exist for this user
      defaultAccount = new Record("tradingAccounts");
      defaultAccount.set("accountName", "Default Account");
      defaultAccount.set("userId", userId);
      defaultAccount.set("status", "active");
      $app.save(defaultAccount);
    }
    
    // Update the trade with the default account ID
    e.record.set("accountId", defaultAccount.id);
    $app.save(e.record);
  }
  
  e.next();
}, "trades");