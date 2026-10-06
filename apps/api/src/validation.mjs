import { z } from 'zod';
import { ApiError, parse } from './errors.mjs';

export const id = z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/);
export const email = z.email().max(254).transform(value => value.trim().toLowerCase());
export const password = z.string().min(12, 'Mindestens 12 Zeichen erforderlich.').max(128);
export const signupSchema = z.object({ email, password, passwordConfirm: password, name: z.string().trim().min(1).max(200), verified: z.literal(false).optional() }).strict().refine(value => value.password === value.passwordConfirm, { path: ['passwordConfirm'], message: 'Die Passwoerter stimmen nicht ueberein.' });
const amount = z.number().finite().min(-1e12).max(1e12);
const nullableAmount = amount.nullable();
const text = max => z.string().max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z?)?$/).transform(value => value.slice(0, 10)).pipe(z.iso.date()).refine(value => value >= '1900-01-01' && value <= '2100-12-31', 'Ungueltiges Einstiegsdatum.');
const link = z.union([z.literal(''), z.url().max(2000).refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Nur HTTP(S)-Links erlaubt.')]);
const owner = { userId: id.optional() };
const trade = z.object({
  ...owner, accountId: id, symbol: text(30).trim().min(1).transform(value => value.toUpperCase()),
  entryDate: date, entryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  date: date.optional(), time: text(5).optional(), instrument: text(30).optional(),
  setup: text(80).default(''), side: z.enum(['', 'long', 'short']).default(''),
  riskAmount: amount.positive().nullable().default(null), profitLoss: nullableAmount.default(null),
  fees: amount.nonnegative().nullable().default(0), commissionPercentage: z.number().min(0).max(100).nullable().default(0),
  stopLoss: z.number().min(0).max(100).nullable().default(null), stopLossPips: amount.nonnegative().nullable().default(null),
  rrSecured: nullableAmount.default(null), riskRewardRatio: nullableAmount.default(null),
  status: z.enum(['', 'Win', 'Loss', 'Breakeven']).default(''),
  notes: text(5000).default(''), contextUrl: link.default(''), validationUrl: link.default(''), entryUrl: link.default(''),
  reviewStatus: z.enum(['', 'draft', 'completed']).default(''), reviewSetup: z.enum(['', 'yes', 'no', 'na']).default(''), reviewRisk: z.enum(['', 'yes', 'no', 'na']).default(''),
  reviewTags: z.array(z.enum(['plan', 'early', 'late', 'risk', 'exit', 'patience'])).max(6).default([]),
  reviewLesson: text(1000).default(''), reviewAction: text(1000).default(''),
  // Only the server writes this timestamp; supplied values are never trusted.
  reviewCompletedAt: text(40).nullable().optional(),
}).strict();

export const collectionSchemas = {
  trades: trade,
  tradingAccounts: z.object({ ...owner, accountName: text(200).trim().min(1), startingBalance: amount.positive(), currency: z.literal('EUR').default('EUR'), status: z.enum(['active', 'inactive']).default('active') }).strict(),
  userSettings: z.object({ ...owner, startingBalance: amount.positive().default(10000), commissionPercentage: z.number().min(0).max(100).default(0), theme: z.enum(['light', 'dark']).default('dark') }).strict(),
  symbols: z.object({ ...owner, symbol: text(30).trim().min(1).transform(value => value.toUpperCase()) }).strict(),
  cookieConsent: z.object({ ...owner, consentGiven: z.boolean(), preferences: text(4000).refine(value => { try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed); } catch { return false; } }) }).strict(),
};

export function validateRecord(name, input, userId, previous = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, 'Ungueltige Eingaben.');
  if (input.userId && input.userId !== userId) throw new ApiError(403, 'Fremde Daten duerfen nicht bearbeitet werden.');
  const schema = collectionSchemas[name];
  if (!schema) throw new ApiError(404, 'Nicht gefunden.');
  const old = previous ? Object.fromEntries(Object.entries(previous).filter(([key]) => key in schema.shape)) : {};
  const value = parse(schema, { ...old, ...input, userId });
  delete value.date; delete value.time; delete value.instrument;
  if (name === 'trades') {
    value.reviewTags = [...new Set(value.reviewTags)].sort();
    if (value.reviewStatus === 'completed') {
      value.reviewLesson = value.reviewLesson.trim(); value.reviewAction = value.reviewAction.trim();
      if (!value.reviewLesson || !value.reviewAction) throw new ApiError(400, 'Ein abgeschlossener Review braucht eine Erkenntnis und einen naechsten Schritt.');
      value.reviewCompletedAt = previous?.reviewStatus === 'completed' ? previous.reviewCompletedAt : new Date().toISOString();
    } else value.reviewCompletedAt = null;
  }
  return value;
}

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1), perPage: z.coerce.number().int().min(1).max(200).default(100),
  sort: z.string().max(100).default('created'), accountId: id.optional(), userId: id.optional(),
  from: z.iso.date().optional(), to: z.iso.date().optional(),
}).strict();
