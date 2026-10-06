import { readConfig } from './config.mjs';
import { createPool } from './database.mjs';
import { createMailer } from './mail.mjs';

const config = readConfig();
const pool = createPool(config);
try {
  await pool.query('SELECT name FROM schemaMigrations');
  console.log('Database connection and migration table: OK');
  await createMailer(config).verify();
  console.log('SMTP connection: OK (delivery and SPF/DKIM still require a real recipient test)');
} finally { await pool.end(); }
