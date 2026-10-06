import express from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { ApiError, parse } from './errors.mjs';
import { collectionSchemas, id } from './validation.mjs';
import { authService } from './auth.mjs';
import { limit } from './security.mjs';
import { listRecords, findRecord, createRecord, updateRecord, deleteRecord, moveAndDeleteAccount } from './records.mjs';

export function createApp({ pool, config, mailer, staticDir = fileURLToPath(new URL('../../../dist/apps/web/', import.meta.url)) }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  // Existing charts use inline styles, and the current optional analytics script is kept compatible.
  app.use(helmet({ contentSecurityPolicy: { directives: { 'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'], 'img-src': ["'self'", 'data:', 'https:'], 'connect-src': ["'self'", 'https://www.google-analytics.com', 'https://region1.google-analytics.com'], 'upgrade-insecure-requests': config.secureCookie ? [] : null } }, referrerPolicy: { policy: 'no-referrer' } }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req, _res, next) => {
    // Cookie-authenticated API stays same-origin; no wildcard CORS or browser DB credentials.
    if (!['GET', 'HEAD'].includes(req.method) && req.get('origin') !== config.origin) throw new ApiError(403, 'Diese Anfrage stammt nicht von deinem Journal.');
    next();
  });
  app.use(express.json({ limit: '64kb', strict: true }));
  const auth = authService(pool, config, mailer);
  app.get('/api/health', async (_req, res) => { await pool.query('SELECT 1'); res.json({ ok: true, backend: 'mysql' }); });
  app.post('/api/auth/signup', async (req, res) => {
    await limit(pool, 'signup:' + req.ip, 10, 3600);
    res.status(201).json(await auth.signup(req.body));
  });
  app.post('/api/auth/login', async (req, res) => res.json(await auth.login(req, res)));
  app.get('/api/auth/session', auth.requireUser, (req, res) => res.json({ record: req.user }));
  app.post('/api/auth/logout', async (req, res) => { await auth.logout(req, res); res.sendStatus(204); });
  for (const kind of ['verify', 'reset']) {
    app.post('/api/auth/' + kind + '/request', async (req, res) => {
      await limit(pool, 'mail-ip:' + req.ip, 20, 3600);
      await auth.requestAction(kind, req.body); res.sendStatus(204);
    });
    app.post('/api/auth/' + kind + '/confirm', async (req, res) => {
      await limit(pool, 'confirm:' + req.ip, 20, 600);
      await auth.confirmAction(kind, req.body); res.sendStatus(204);
    });
  }
  app.patch('/api/users/:id', auth.requireUser, async (req, res) => {
    await limit(pool, 'profile:' + req.user.id, 20, 600);
    res.json(await auth.updateUser(req, res));
  });
  app.delete('/api/users/me', auth.requireUser, async (req, res) => { await auth.deleteUser(req, res); res.sendStatus(204); });
  app.post('/api/accounts/:id/move-and-delete', auth.requireUser, async (req, res) => {
    const data = parse(z.object({ targetAccountId: id }).strict(), req.body);
    await moveAndDeleteAccount(pool, req.user.id, req.params.id, data.targetAccountId); res.sendStatus(204);
  });
  const records = express.Router();
  records.use(auth.requireUser);
  records.use(async (req, _res, next) => { await limit(pool, 'api:' + req.user.id, 600, 60); next(); });
  records.use('/:collection', (req, _res, next) => { if (!Object.hasOwn(collectionSchemas, req.params.collection)) throw new ApiError(404, 'Nicht gefunden.'); next(); });
  records.get('/:collection', async (req, res) => res.json(await listRecords(pool, req.params.collection, req.user.id, req.query)));
  records.get('/:collection/:id', async (req, res) => res.json(await findRecord(pool, req.params.collection, req.params.id, req.user.id)));
  records.post('/:collection', async (req, res) => res.status(201).json(await createRecord(pool, req.params.collection, req.user.id, req.body)));
  records.patch('/:collection/:id', async (req, res) => res.json(await updateRecord(pool, req.params.collection, req.user.id, req.params.id, req.body)));
  records.delete('/:collection/:id', async (req, res) => { await deleteRecord(pool, req.params.collection, req.user.id, req.params.id); res.sendStatus(204); });
  app.use('/api/records', records);
  app.use('/api', () => { throw new ApiError(404, 'Nicht gefunden.'); });
  if (existsSync(resolve(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { dotfiles: 'deny', index: false, maxAge: 0 }));
    app.get('/{*path}', (req, res, next) => {
      if (req.path.startsWith('/assets/') || /\.[a-z0-9]+$/i.test(req.path)) return next();
      res.set('Cache-Control', 'no-cache');
      res.sendFile(resolve(staticDir, 'index.html'));
    });
  }
  app.use((_req, res) => res.status(404).json({ status: 404, message: 'Nicht gefunden.', data: {} }));
  app.use((error, _req, res, _next) => {
    if (res.headersSent) return;
    const validation = error instanceof ApiError;
    const duplicate = error.code === 'ER_DUP_ENTRY';
    const malformed = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
    const status = validation ? error.status : duplicate ? 409 : malformed ? 400 : 500;
    if (status === 500) console.error('API error:', error.code || error.name || 'internal_error');
    if (status === 429) res.set('Retry-After', '600');
    res.status(status).json({ status, message: validation ? error.message : duplicate ? 'Dieser Eintrag existiert bereits.' : malformed ? 'Ungueltige oder zu grosse Anfrage.' : 'Der Server konnte die Anfrage nicht verarbeiten.', data: validation ? error.data : {} });
  });
  return app;
}
