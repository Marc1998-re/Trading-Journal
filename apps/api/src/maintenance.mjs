import { fileURLToPath } from 'node:url';
import { readConfig } from './config.mjs';
import { createPool } from './database.mjs';

export async function cleanupExpired(pool, batchSize = 1000) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10000) throw new Error('Invalid cleanup batch size.');
  const removed = {};
  // Fixed internal table names only; never remove users, accounts or trading data.
  for (const name of ['sessions', 'actionTokens', 'rateLimits']) {
    const [result] = await pool.execute(`DELETE FROM ${name} WHERE expiresAt <= UTC_TIMESTAMP(3) LIMIT ${batchSize}`);
    removed[name] = result.affectedRows;
  }
  return removed;
}

export function startMaintenance(pool, intervalMs = 3600000) {
  let active = null;
  const run = () => {
    if (active) return active;
    active = cleanupExpired(pool).catch(error => {
      console.error('Session cleanup failed:', error.code || error.name || 'internal_error');
    }).finally(() => { active = null; });
    return active;
  };
  const timer = setInterval(run, intervalMs);
  timer.unref();
  run();
  return async () => { clearInterval(timer); await active; };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool(readConfig());
  try { console.log(JSON.stringify(await cleanupExpired(pool, 10000))); }
  finally { await pool.end(); }
}
