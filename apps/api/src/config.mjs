import { readFileSync } from 'node:fs';
import { z } from 'zod';

const boolean = z.enum(['true', 'false']).transform(value => value === 'true');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4190),
  APP_URL: z.url(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(1).default(0),
  DB_HOST: z.string().min(1), DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/), DB_USER: z.string().min(1), DB_PASSWORD: z.string(),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(20).default(5),
  DB_SSL: boolean.default(false), DB_SSL_CA_FILE: z.string().default(''),
  SMTP_HOST: z.string().default(''), SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
  SMTP_USER: z.string().default(''), SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.union([z.email(), z.literal('')]).default(''), SMTP_SECURE: boolean.default(true),
});

export function readConfig(env = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) throw new Error('Invalid server configuration: ' + result.error.issues.map(issue => issue.path.join('.')).join(', '));
  const config = result.data;
  const url = new URL(config.APP_URL);
  if (url.origin !== config.APP_URL || url.username || url.password) throw new Error('APP_URL must be an origin without path, credentials or trailing slash.');
  const local = ['127.0.0.1', 'localhost'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && config.NODE_ENV !== 'production')) throw new Error('APP_URL requires HTTPS outside local development.');
  if (config.NODE_ENV === 'production' && (!config.DB_PASSWORD || !config.SMTP_HOST || !config.SMTP_FROM || !config.SMTP_USER || !config.SMTP_PASSWORD)) {
    throw new Error('Production requires database and SMTP credentials.');
  }
  config.origin = url.origin;
  config.secureCookie = url.protocol === 'https:';
  config.cookieName = config.secureCookie ? '__Host-td_session' : 'td_session';
  config.db = {
    host: config.DB_HOST, port: config.DB_PORT, database: config.DB_NAME,
    user: config.DB_USER, password: config.DB_PASSWORD, connectionLimit: config.DB_POOL_SIZE,
    waitForConnections: true, queueLimit: 100, timezone: 'Z', dateStrings: true,
    decimalNumbers: true, charset: 'utf8mb4', multipleStatements: false,
    ...(config.DB_SSL ? { ssl: { rejectUnauthorized: true, ...(config.DB_SSL_CA_FILE ? { ca: readFileSync(config.DB_SSL_CA_FILE) } : {}) } } : {}),
  };
  return config;
}
