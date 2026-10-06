import { z } from 'zod';
import { ApiError, parse } from './errors.mjs';
import { newId, publicRecord, transaction } from './database.mjs';
import { email, id, password, signupSchema } from './validation.mjs';
import { hashPassword, verifyPassword, secretToken, hashToken, sessionCookie, limit } from './security.mjs';

const actionSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const cookieOptions = config => ({ httpOnly: true, secure: config.secureCookie, sameSite: 'lax', path: '/' });

export function authService(pool, config, mailer) {
  // The dummy hash gives unknown and known users the same password-hashing work.
  const dummyHash = hashPassword(secretToken());
  async function createSession(db, res, userId) {
    const token = secretToken();
    await db.execute('INSERT INTO sessions (tokenHash, userId, expiresAt) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 7 DAY))', [hashToken(token), userId]);
    res.cookie(config.cookieName, token, { ...cookieOptions(config), maxAge: 7 * 86400000 });
  }
  async function requireUser(req, _res, next) {
    const token = sessionCookie(req, config);
    if (!token) throw new ApiError(401, 'Bitte melde dich an.');
    const [[row]] = await pool.execute('SELECT users.* FROM sessions JOIN users ON users.id = sessions.userId WHERE sessions.tokenHash = ? AND sessions.expiresAt > UTC_TIMESTAMP(3)', [hashToken(token)]);
    if (!row) throw new ApiError(401, 'Bitte melde dich erneut an.');
    if (!row.verified) throw new ApiError(403, 'Bitte bestaetige zuerst deine E-Mail-Adresse.', { verified: { code: 'verification_required' } });
    req.user = publicRecord(row);
    req.sessionHash = hashToken(token);
    next();
  }
  async function signup(input) {
    const data = parse(signupSchema, input);
    const passwordHash = await hashPassword(data.password);
    const userId = newId();
    await pool.execute('INSERT INTO users (id, email, name, passwordHash) VALUES (?, ?, ?, ?)', [userId, data.email, data.name, passwordHash]);
    return { id: userId, email: data.email, name: data.name, verified: false };
  }
  async function login(req, res) {
    const data = parse(z.object({ identity: email, password: z.string().min(1).max(128) }).strict(), req.body);
    await limit(pool, 'login-ip:' + req.ip, 60, 600);
    await limit(pool, 'login-user:' + req.ip + ':' + data.identity, 10, 600);
    const [[snapshot]] = await pool.execute('SELECT * FROM users WHERE email = ?', [data.identity]);
    const correct = await verifyPassword(data.password, snapshot?.passwordHash || await dummyHash);
    if (!snapshot || !correct) throw new ApiError(401, 'E-Mail oder Passwort ist falsch.');
    return transaction(pool, async db => {
      // Hash outside the row lock; a changed hash prevents a reset/login race.
      const [[user]] = await db.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [snapshot.id]);
      if (!user || user.passwordHash !== snapshot.passwordHash) throw new ApiError(401, 'Bitte melde dich mit deinem aktuellen Passwort an.');
      if (!user.verified) throw new ApiError(403, 'Bitte bestaetige zuerst deine E-Mail-Adresse.', { verified: { code: 'verification_required' } });
      await createSession(db, res, user.id);
      return { record: publicRecord(user) };
    });
  }
  async function logout(req, res) {
    const token = sessionCookie(req, config);
    if (token) await pool.execute('DELETE FROM sessions WHERE tokenHash = ?', [hashToken(token)]);
    res.clearCookie(config.cookieName, cookieOptions(config));
  }
  async function requestAction(kind, input) {
    const data = parse(z.object({ email }).strict(), input);
    await limit(pool, 'mail:' + data.email, 5, 3600);
    // Fail clearly on missing SMTP even for unknown addresses, without account enumeration.
    await mailer.verify();
    const [[user]] = await pool.execute('SELECT * FROM users WHERE email = ?', [data.email]);
    if (!user || (kind === 'verify' && user.verified)) return;
    const token = secretToken(), digest = hashToken(token);
    const seconds = kind === 'reset' ? 3600 : 86400;
    await pool.execute('INSERT INTO actionTokens (tokenHash, userId, purpose, expiresAt) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE tokenHash = VALUES(tokenHash), expiresAt = VALUES(expiresAt)', [digest, user.id, kind, seconds]);
    try { await mailer.send(kind, user.email, token); }
    catch (error) {
      await pool.execute('DELETE FROM actionTokens WHERE tokenHash = ?', [digest]);
      console.error('SMTP delivery failed:', error.code || 'smtp_error');
      throw new ApiError(503, 'Der Mailversand ist fehlgeschlagen. Dein Konto bleibt bestehen. Bitte versuche es spaeter erneut.');
    }
  }
  async function confirmAction(kind, input) {
    const schema = kind === 'reset' ? actionSchema.extend({ password, passwordConfirm: password }).refine(value => value.password === value.passwordConfirm, { path: ['passwordConfirm'], message: 'Die Passwoerter stimmen nicht ueberein.' }) : actionSchema;
    const data = parse(schema, input);
    const passwordHash = kind === 'reset' ? await hashPassword(data.password) : null;
    await transaction(pool, async db => {
      const [[token]] = await db.execute('SELECT * FROM actionTokens WHERE tokenHash = ? AND purpose = ? AND expiresAt > UTC_TIMESTAMP(3) FOR UPDATE', [hashToken(data.token), kind]);
      if (!token) throw new ApiError(400, 'Der Link ist ungueltig oder abgelaufen.');
      if (kind === 'reset') {
        await db.execute('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, token.userId]);
        await db.execute('DELETE FROM sessions WHERE userId = ?', [token.userId]);
      } else await db.execute('UPDATE users SET verified = TRUE WHERE id = ?', [token.userId]);
      await db.execute('DELETE FROM actionTokens WHERE tokenHash = ?', [token.tokenHash]);
    });
  }
  async function updateUser(req, res) {
    parse(id, req.params.id);
    if (req.params.id !== req.user.id) throw new ApiError(404, 'Nicht gefunden.');
    const schema = z.object({ name: z.string().trim().min(1).max(200).optional(), oldPassword: z.string().min(1).max(128).optional(), password: password.optional(), passwordConfirm: password.optional() }).strict();
    const data = parse(schema, req.body);
    if (data.password && (data.password !== data.passwordConfirm || !data.oldPassword)) throw new ApiError(400, 'Bitte gib das aktuelle Passwort und zwei uebereinstimmende neue Passwoerter ein.');
    if (!data.password && (data.passwordConfirm || data.oldPassword)) throw new ApiError(400, 'Das neue Passwort fehlt.');
    const encoded = data.password ? await hashPassword(data.password) : null;
    return transaction(pool, async db => {
      const [[row]] = await db.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
      if (!row) throw new ApiError(401, 'Bitte melde dich erneut an.');
      if (data.password) {
        if (!await verifyPassword(data.oldPassword, row.passwordHash)) throw new ApiError(400, 'Das aktuelle Passwort ist falsch.', { oldPassword: { message: 'Falsches Passwort.' } });
        await db.execute('UPDATE users SET passwordHash = ? WHERE id = ?', [encoded, row.id]);
        await db.execute('DELETE FROM sessions WHERE userId = ?', [row.id]);
        await createSession(db, res, row.id);
      }
      if (data.name) await db.execute('UPDATE users SET name = ? WHERE id = ?', [data.name, row.id]);
      const [[updated]] = await db.execute('SELECT * FROM users WHERE id = ?', [row.id]);
      return publicRecord(updated);
    });
  }
  async function deleteUser(req, res) {
    const data = parse(z.object({ password: z.string().min(1).max(128) }).strict(), req.body);
    await limit(pool, 'delete-user:' + req.user.id, 5, 600);
    await transaction(pool, async db => {
      const [[row]] = await db.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
      if (!row) throw new ApiError(401, 'Bitte melde dich erneut an.');
      if (!await verifyPassword(data.password, row.passwordHash)) throw new ApiError(400, 'Falsches Passwort.');
      // Delete trades first: account ownership foreign keys deliberately restrict account deletion.
      await db.execute('DELETE FROM trades WHERE userId = ?', [row.id]);
      await db.execute('DELETE FROM users WHERE id = ?', [row.id]);
    });
    res.clearCookie(config.cookieName, cookieOptions(config));
  }
  return { requireUser, signup, login, logout, requestAction, confirmAction, updateUser, deleteUser };
}
