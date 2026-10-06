import nodemailer from 'nodemailer';
import template from '../../pocketbase/pb_hooks/journal-mail.cjs';
import { ApiError } from './errors.mjs';

export function createMailer(config) {
  const transport = config.SMTP_HOST ? nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE,
    requireTLS: config.NODE_ENV === 'production' && !config.SMTP_SECURE,
    ...(config.SMTP_USER ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } } : {}),
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  }) : null;
  return {
    async verify() {
      if (!transport || !config.SMTP_FROM) throw new ApiError(503, 'Der Mailversand ist noch nicht eingerichtet.');
      try { return await transport.verify(); }
      catch (error) {
        console.error('SMTP connection failed:', error.code || 'smtp_error');
        throw new ApiError(503, 'Der Mailserver ist momentan nicht erreichbar. Bitte versuche es spaeter erneut.');
      }
    },
    async send(kind, email, token) {
      if (!transport || !config.SMTP_FROM) throw new ApiError(503, 'Der Mailversand ist noch nicht eingerichtet.');
      const url = config.origin + (kind === 'reset' ? '/reset-password' : '/verify-pending') + '?token=' + encodeURIComponent(token);
      const content = template.render({ kind, email, url });
      const result = await transport.sendMail({ from: { name: 'The Trading Desk', address: config.SMTP_FROM }, to: email, ...content });
      if (!result.accepted?.length) throw new ApiError(503, 'Der Mailserver hat die Nachricht nicht angenommen.');
    },
  };
}
