import { readConfig } from './apps/api/src/config.mjs';
import { createPool } from './apps/api/src/database.mjs';
import { migrate } from './apps/api/src/migrate.mjs';

// Managed hosting has no interactive npm shell; migrations run before HTTP starts.
const pool = createPool(readConfig());
try { await migrate(pool); }
finally { await pool.end(); }
await import('./apps/api/src/server.mjs');
