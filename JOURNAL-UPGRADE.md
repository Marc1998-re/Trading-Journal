# Journal Workspace · September 2026

## Status

Local implementation, not deployed to Horizons or the public domain. The interactive demo at `/demo` uses fictional, read-only records and the same components/calculations as the real journal. It never creates backend records.

Existing production data has not been touched. A pre-edit source snapshot is at `/private/tmp/trading-journal-before-redesign-20260912.tar.gz`. Move backups to durable storage before a deployment; temporary directories are not backups for production.

## Run

Requires Node 22.12+ and npm. From this repository:

```sh
npm ci
npm run dev
npm test
npm run build
```

The demo needs no database. For real accounts, configure `apps/web/.env.local` with `VITE_POCKETBASE_URL`, or run PocketBase on `127.0.0.1:8090` behind the development proxy. The original bundled executable is Linux-only and cannot run on macOS. Use an official PocketBase executable for the target OS. Backend integration tests pass with PocketBase 0.40.4; upgrading an existing production database from 0.36.7 requires a backed-up staging rehearsal, not simply replacing its binary.

```sh
POCKETBASE_TEST_BINARY=/absolute/path/to/pocketbase npm run test:backend
```

This test creates an isolated temporary database, random test credentials, and a local SMTP receiver. It never connects to production. Ports 8099 and 2526 must be free.

## What Changed

- German desktop sidebar and mobile bottom navigation, token-based dark theme, local fonts.
- Overview with calendar, realized capital curve, net metrics, and review queue.
- Read-only demo, actual product screenshot on the landing page, no fictional paid plans or integrations.
- Trade create/edit/delete, money-risk snapshot, fixed fees, setup and direction, review notes.
- Symbol/setup/weekday analysis, sample sizes, Wilson interval with its independence limitation.
- Annual month heatmap and step curves; no invented intratrade equity.
- Full filtered CSV export, quoting and spreadsheet-formula protection.
- Email confirmation and password reset with a shared German HTML/text template.
- Explicit signup-versus-email error states, no false failure after successful verification without a session.
- Owner/verified API rules, account ownership checks, no email addresses in diagnostic logs.
- Compatible dependency security updates; npm audit reported zero known vulnerabilities on 2026-09-13.

## Calculation Contract

All entered results are realized, EUR-denominated results. New trades save `riskAmount`, the money risk at entry, independently from the current account capital. `profitLoss` is the realized gross amount, including a legitimate zero. Changing account capital does not rescale stored historical profit.

Net = gross - fixed fees - max(gross, 0) × profit-share percentage / 100. The legacy `commissionPercentage` is a profit share, not per-order commission. The fixed `fees` field covers trading costs on both winners and losers. Do not enter already-net broker P&L as gross and deduct the same costs again.

Net-R = net / original money risk. Expectancy-R is the mean of known Net-R values, not a weighted ratio of total profit to total risk. Legacy risk is reconstructed from gross/secured R where possible, otherwise estimated from account start capital and stop-loss percentage. Missing risks are excluded from R statistics and their sample size remains visible.

Win rate uses positive net results / all recorded closed trades. Drawdown uses the running peak of realized account balance, starting with opening capital for the selected period. No open-position valuations, cash-flow adjustment, FX conversion or account-broker reconciliation is implemented. These limitations must remain visible; no forward performance promises.

## Email Deployment Checklist

The new mail transport deliberately uses standard PocketBase SMTP, not the private Horizons relay. Do not paste only these hooks into Horizons and assume delivery will work.

1. Set server `APP_URL` to the actual HTTPS frontend origin, such as `https://marcstradingjournal.de`, without `/hcgi/platform` or a trailing route.
2. Configure PocketBase Settings > Mail settings with real SMTP host, port, encryption, username and password. Store credentials on the server, never in Git or `VITE_*` variables.
3. Configure a sender address on a domain you control, such as `noreply@marcstradingjournal.de`. The hook changes the sender name, not the authenticated sender address.
4. Set the DNS records required by the mail provider (SPF/DKIM; DMARC policy suited to the domain). Do not invent provider-specific values.
5. Deploy `journal-mail.cjs`, `send-verification-email.pb.js` and `builder-mailer.pb.js` together. Each handler requires its helper inside its isolated JSVM context and uses `e.meta.token`, never `tokenKey` or an extracted arbitrary URL.
6. Test signup, resend, confirmation and reset on staging, then test real delivery to multiple mailbox providers. Local SMTP acceptance does not establish inbox delivery or appearance in every mail client.

References: [PocketBase hooks](https://pocketbase.io/docs/js-event-hooks/), [isolated JS contexts](https://pocketbase.io/docs/js-overview/), [SMTP and email templates](https://pocketbase.io/docs/js-sending-emails/).

## Before Production

- Back up code, the entire PocketBase data directory and uploaded files. Rehearse restore.
- Rehearse migrations against an isolated copy of production, including existing users and legacy trades. New fields preserve existing data; the security migration intentionally does not weaken ownership rules on rollback.
- Check old default accounts/passwords have been removed or rotated. Removing an old seed migration does not delete a previously created user. Revoke the GitHub token formerly pasted in chat if still active.
- Recheck legal pages, operator details, privacy disclosures, retention and processors against actual operations. This code change is not a legal review.
- Broker sync, billing, open positions, deposits/withdrawals and multi-currency reconciliation are not implemented.
- Publishing source to GitHub is separate from deployment. DNS and live publication require the production checks above; this document does not confirm that they have been completed.

Figma: https://www.figma.com/design/stoukkbd5r5BZFMEBPHoH8/Ohne-Namen?node-id=8-12
