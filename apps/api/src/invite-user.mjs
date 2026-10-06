import { readConfig } from './config.mjs';
import { createPool } from './database.mjs';
import { createMailer } from './mail.mjs';
import { authService } from './auth.mjs';
import { secretToken } from './security.mjs';
import { email, signupSchema } from './validation.mjs';

const args = process.argv.slice(2);
if (!args.includes('--email') || !args.includes('--name')) throw new Error('Usage: invite-user.mjs --email ADDRESS --name NAME. No password is accepted or printed.');
const address = email.parse(args[args.indexOf('--email') + 1]);
const name = args[args.indexOf('--name') + 1];
const config = readConfig(), pool = createPool(config), mailer = createMailer(config);
try {
  await mailer.verify();
  const auth = authService(pool, config, mailer);
  const [[existing]] = await pool.execute('SELECT id FROM users WHERE email = ?', [address]);
  const password = secretToken();
  const user = existing || await auth.signup(signupSchema.parse({ email: address, name, password, passwordConfirm: password }));
  await auth.requestAction('verify', { email: address });
  await auth.requestAction('reset', { email: address });
  console.log('Destination user ID: ' + user.id + '. Verification and password setup requested. No existing password or verified state was overwritten.');
} finally { await pool.end(); }
