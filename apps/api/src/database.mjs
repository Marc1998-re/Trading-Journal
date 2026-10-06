import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';

export const newId = () => randomBytes(16).toString('hex');
export function createPool(config) {
  const pool = mysql.createPool(config.db);
  pool.on('connection', connection => {
    // Queue before application queries: driver timezone alone does not set MySQL's clock.
    connection.query("SET SESSION time_zone = '+00:00'", error => {
      if (error) {
        console.error('MySQL timezone setup failed:', error.code || 'internal_error');
        connection.destroy();
      }
    });
  });
  return pool;
}

export async function transaction(pool, operation) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function publicRecord(row) {
  if (!row) return null;
  const record = { ...row };
  delete record.passwordHash;
  delete record.importFingerprint;
  if ('verified' in record) record.verified = Boolean(record.verified);
  if ('consentGiven' in record) record.consentGiven = Boolean(record.consentGiven);
  if (typeof record.reviewTags === 'string') record.reviewTags = JSON.parse(record.reviewTags);
  for (const key of ['created', 'updated', 'reviewCompletedAt']) {
    if (record[key]) record[key] = record[key].replace(' ', 'T') + 'Z';
    else if (key in record) record[key] = '';
  }
  if (record.entryDate) { record.date = record.entryDate; record.time = record.entryTime; }
  return record;
}
