ALTER TABLE trades
  ADD COLUMN exitDate DATE NULL AFTER entryTime,
  ADD COLUMN exitTime VARCHAR(5) NOT NULL DEFAULT '' AFTER exitDate,
  ADD COLUMN plannedRR DECIMAL(20,6) NULL AFTER riskRewardRatio,
  ADD COLUMN mae DECIMAL(20,6) NULL AFTER plannedRR,
  ADD COLUMN mfe DECIMAL(20,6) NULL AFTER mae,
  ADD COLUMN grade VARCHAR(1) NOT NULL DEFAULT '' AFTER mfe,
  ADD COLUMN emotion VARCHAR(20) NOT NULL DEFAULT '' AFTER grade,
  ADD COLUMN confidence TINYINT UNSIGNED NULL AFTER emotion;

ALTER TABLE tradingAccounts
  ADD COLUMN accountType VARCHAR(10) NOT NULL DEFAULT 'private' AFTER currency,
  ADD COLUMN propFirm VARCHAR(80) NOT NULL DEFAULT '' AFTER accountType,
  ADD COLUMN dailyLossLimit DECIMAL(20,6) NULL AFTER propFirm,
  ADD COLUMN maxLoss DECIMAL(20,6) NULL AFTER dailyLossLimit,
  ADD COLUMN drawdownMode VARCHAR(10) NOT NULL DEFAULT 'static' AFTER maxLoss,
  ADD COLUMN profitTarget DECIMAL(20,6) NULL AFTER drawdownMode,
  ADD COLUMN maxRiskPerTrade DECIMAL(12,6) NULL AFTER profitTarget,
  ADD COLUMN maxTradesPerDay TINYINT UNSIGNED NULL AFTER maxRiskPerTrade;

CREATE TABLE IF NOT EXISTS missedTrades (
  id VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  userId VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  accountId VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  symbol VARCHAR(30) NOT NULL,
  entryDate DATE NOT NULL, entryTime VARCHAR(5) NOT NULL,
  setup VARCHAR(80) NOT NULL DEFAULT '', side VARCHAR(5) NOT NULL DEFAULT '',
  grade VARCHAR(1) NOT NULL DEFAULT '',
  decision VARCHAR(10) NOT NULL DEFAULT 'missed',
  reason VARCHAR(20) NOT NULL DEFAULT 'other',
  potentialR DECIMAL(20,6) NULL,
  notes TEXT NOT NULL, contextUrl TEXT NOT NULL,
  created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY missed_user_date (userId, entryDate, entryTime, id),
  KEY missed_account_date (userId, accountId, entryDate, entryTime, id),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accountId, userId) REFERENCES tradingAccounts(id, userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
