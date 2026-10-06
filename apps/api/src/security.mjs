import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ApiError } from './errors.mjs';

const scrypt = promisify(scryptCallback);
const settings = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
let hashing = 0;
const waiting = [];
export const secretToken = () => randomBytes(32).toString('hex');
export const hashToken = value => createHash('sha256').update(value).digest('hex');

async function deriveKey(password, salt) {
  // Shared hosting: bound memory-heavy hashing and reject an overloaded queue.
  if (hashing >= 2) {
    if (waiting.length >= 20) throw new ApiError(503, 'Der Server ist momentan ausgelastet. Bitte versuche es spaeter erneut.');
    await new Promise(resolve => waiting.push(resolve));
  } else hashing++;
  try { return await scrypt(password, salt, 64, settings); }
  finally {
    const next = waiting.shift();
    if (next) next();
    else hashing--;
  }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt);
  return 'scrypt$131072$8$1$' + salt + '$' + key.toString('hex');
}

export async function verifyPassword(password, encoded) {
  const match = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded || '');
  if (!match) return false;
  const key = await deriveKey(password, match[1]);
  return timingSafeEqual(key, Buffer.from(match[2], 'hex'));
}

export function sessionCookie(req, config) {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(config.cookieName + '='));
  const token = value?.slice(config.cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token || '') ? token : null;
}

export async function limit(pool, key, max, seconds) {
  const bucket = hashToken(key);
  await pool.execute('INSERT INTO rateLimits (bucket, hits, expiresAt) VALUES (?, 1, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE hits = IF(expiresAt <= UTC_TIMESTAMP(3), 1, hits + 1), expiresAt = IF(expiresAt <= UTC_TIMESTAMP(3), VALUES(expiresAt), expiresAt)', [bucket, seconds]);
  const [[row]] = await pool.execute('SELECT hits FROM rateLimits WHERE bucket = ?', [bucket]);
  if (row.hits > max) throw new ApiError(429, 'Zu viele Anfragen. Bitte warte einige Minuten.');
}
