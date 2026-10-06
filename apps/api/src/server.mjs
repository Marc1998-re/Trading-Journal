import { readConfig } from './config.mjs';
import { createPool } from './database.mjs';
import { createMailer } from './mail.mjs';
import { createApp } from './app.mjs';
import { startMaintenance } from './maintenance.mjs';

const config = readConfig();
const pool = createPool(config);
// Deploy migrations explicitly before starting; HTTP requests never alter the schema.
await pool.query('SELECT name FROM schemaMigrations LIMIT 1');
const stopMaintenance = startMaintenance(pool);
const server = createApp({ pool, config, mailer: createMailer(config) }).listen(config.PORT, config.HOST, () => {
  console.log(`The Trading Desk: http://${config.HOST}:${config.PORT}`);
});
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  if (closing) return;
  closing = true;
  server.close(async () => { await stopMaintenance(); await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
});
