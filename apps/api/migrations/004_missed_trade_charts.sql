ALTER TABLE missedTrades
  ADD COLUMN validationUrl TEXT NOT NULL AFTER contextUrl,
  ADD COLUMN entryUrl TEXT NOT NULL AFTER validationUrl;
