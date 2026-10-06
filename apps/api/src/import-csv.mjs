import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse as parseCsv } from 'csv-parse/sync';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { readConfig } from './config.mjs';
import { createPool, newId, transaction } from './database.mjs';
import { insertRecord } from './records.mjs';
import { id, validateRecord } from './validation.mjs';

const headers = ['Account ID', 'Symbol', 'Entry Date', 'Entry Time', 'Stop Loss (%)', 'Stop Loss (€)', 'Stop Loss (Pips)', 'Risk/Reward Ratio', 'Status', 'Profit/Loss', 'Commission %', 'RR Secured', 'Notes', 'Context URL', 'Validation URL', 'Entry URL'];
const accountSchema = z.object({ sourceAccountId: id, accountName: z.string().trim().min(1).max(200), startingBalance: z.number().positive().max(1e12), currency: z.literal('EUR') });
const digest = value => createHash('sha256').update(value).digest('hex');

function number(value, field, row) {
  if (value === '') return null;
  if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) throw new Error(`Invalid number in row ${row}, ${field}.`);
  return Number(value);
}

export function buildImportPlan(csv, mapping, userId) {
  const rows = parseCsv(csv, { bom: true, skip_empty_lines: true });
  // Both the legacy export's compact header and its space-separated variant are accepted.
  const compact = value => value.replace(/[\s()/]/g, '').replace('€', 'EUR').toLowerCase();
  if (!rows.length || rows[0].length !== 16 || rows[0].some((value, index) => compact(value) !== compact(headers[index]))) throw new Error('CSV columns do not match the journal export.');
  const accounts = z.array(accountSchema).parse(mapping.accounts);
  const known = new Set(accounts.map(account => account.sourceAccountId));
  if (known.size !== accounts.length) throw new Error('Duplicate account mapping.');
  const missing = [...new Set(rows.slice(1).map(row => row[0]))].filter(value => !known.has(value));
  if (missing.length) throw new Error('Confirm account names and starting balances before importing: ' + missing.join(', '));
  const occurrences = new Map();
  const trades = rows.slice(1).map((row, index) => {
    if (row.length !== 16) throw new Error('Invalid column count in CSV row ' + (index + 2));
    const value = (column, field) => number(row[column], field, index + 2);
    const input = {
      userId, accountId: row[0], symbol: row[1], entryDate: row[2], entryTime: row[3],
      stopLoss: value(4, 'stopLoss'), riskAmount: value(5, 'riskAmount'), stopLossPips: value(6, 'stopLossPips'),
      riskRewardRatio: value(7, 'riskRewardRatio'), status: row[8], profitLoss: value(9, 'profitLoss'),
      commissionPercentage: value(10, 'commissionPercentage'), rrSecured: value(11, 'rrSecured'),
      notes: row[12], contextUrl: row[13], validationUrl: row[14], entryUrl: row[15], fees: null,
    };
    const trade = validateRecord('trades', input, userId);
    const canonical = JSON.stringify(row);
    const occurrence = (occurrences.get(canonical) || 0) + 1;
    occurrences.set(canonical, occurrence);
    return { ...trade, importFingerprint: digest(canonical + ':' + occurrence), sourceRow: index + 2 };
  });
  return { accounts, trades, grossProfitLoss: trades.reduce((total, trade) => total + (trade.profitLoss || 0), 0) };
}

export async function applyImport(pool, plan, userId) {
  return transaction(pool, async db => {
    const [[user]] = await db.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!user) throw new Error('Create the destination user first.');
    for (const account of plan.accounts) {
      const [[existing]] = await db.execute('SELECT * FROM tradingAccounts WHERE id = ? FOR UPDATE', [account.sourceAccountId]);
      if (existing && existing.userId !== userId) throw new Error('An account ID belongs to a different user.');
      if (existing) {
        if (existing.accountName !== account.accountName || Number(existing.startingBalance) !== account.startingBalance) throw new Error('Existing account differs from the confirmed mapping.');
      } else await insertRecord(db, 'tradingAccounts', userId, { accountName: account.accountName, startingBalance: account.startingBalance, currency: account.currency }, { id: account.sourceAccountId });
    }
    let inserted = 0, skipped = 0;
    for (const { sourceRow: _sourceRow, importFingerprint, ...trade } of plan.trades) {
      const [[existing]] = await db.execute('SELECT id FROM trades WHERE userId = ? AND importFingerprint = ?', [userId, importFingerprint]);
      if (existing) { skipped++; continue; }
      await insertRecord(db, 'trades', userId, trade, { id: newId(), importFingerprint });
      inserted++;
    }
    return { inserted, skipped };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = name => args[args.indexOf(name) + 1];
  if (!args.includes('--file') || !args.includes('--accounts') || !args.includes('--user-id')) throw new Error('Required: --file /private/export.csv --accounts /private/account-mapping.json --user-id USER_ID. Default is dry-run; --apply writes atomically.');
  const csv = await readFile(option('--file'), 'utf8');
  const mapping = JSON.parse(await readFile(option('--accounts'), 'utf8'));
  const plan = buildImportPlan(csv, mapping, option('--user-id'));
  console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', accounts: plan.accounts.length, trades: plan.trades.length, grossProfitLoss: plan.grossProfitLoss, missingFees: plan.trades.filter(trade => trade.fees === null).length }));
  if (args.includes('--apply')) {
    const pool = createPool(readConfig());
    try { console.log(JSON.stringify(await applyImport(pool, plan, option('--user-id')))); }
    finally { await pool.end(); }
  }
}
