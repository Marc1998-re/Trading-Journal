import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readConfig } from './config.mjs';
import { createPool } from './database.mjs';

export async function migrate(pool) {
  const connection = await pool.getConnection();
  try {
    const [[lock]] = await connection.query("SELECT GET_LOCK(CONCAT('trading_desk:', MD5(DATABASE())), 30) AS acquired");
    if (Number(lock.acquired) !== 1) throw new Error('Another schema migration is running.');
    await connection.query('CREATE TABLE IF NOT EXISTS schemaMigrations (name VARCHAR(120) PRIMARY KEY, checksum CHAR(64) NOT NULL, appliedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3))');
    const files = (await readdir(new URL('../migrations/', import.meta.url))).filter(name => /^\d+_[a-z_]+\.sql$/.test(name)).sort();
    for (const name of files) {
      const sql = await readFile(new URL('../migrations/' + name, import.meta.url), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const [[existing]] = await connection.execute('SELECT checksum FROM schemaMigrations WHERE name = ?', [name]);
      if (existing) {
        if (existing.checksum !== checksum) throw new Error('Applied migration changed: ' + name);
        continue;
      }
      // Migration files are reviewed static DDL, never request data. Initial DDL is restartable.
      for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean)) await connection.query(statement);
      await connection.execute('INSERT INTO schemaMigrations (name, checksum) VALUES (?, ?)', [name, checksum]);
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK(CONCAT('trading_desk:', MD5(DATABASE())))").catch(() => {});
    connection.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool(readConfig());
  try { await migrate(pool); console.log('Database migrations applied.'); }
  finally { await pool.end(); }
}
