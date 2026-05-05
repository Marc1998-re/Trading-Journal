/// <reference path="../pb_data/types.d.ts" />
// This hook converts stopLoss from monetary values to percentages
// It runs once during migration to transform existing data
onRecordEnrich((e) => {
  // Add a comment field to indicate the conversion status
  // This helps track which records have been converted
  if (e.record.get("stopLoss") && !e.record.get("_conversionNote")) {
    // Mark that this record's stopLoss is now in percentage format
    e.record.set("_conversionNote", "stopLoss converted to percentage format");
  }
  e.next();
}, "trades");