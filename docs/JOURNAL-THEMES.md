# Journal themes

The journal uses one layout with two semantic color palettes:

- Light: white and mint surfaces, petrol text/actions, yellow accents.
- Dark: the existing graphite/cyan palette is preserved in full.

`apps/web/src/index.css` owns the palette. `terminal.css` owns the shared
workspace layout. The landing page keeps its independently scoped light theme.
Use semantic Tailwind colors; do not introduce hardcoded component colors.

`ThemeSwitch` exposes the modes in desktop/mobile navigation and settings.
The selection persists locally, synchronizes across tabs, and uses the existing
user-settings persistence for signed-in users. Persistence errors leave the
local choice intact and show a notification. Themes also apply to portaled UI.

The overview shows headline metrics, capital history and review focus, followed
by calendar and recent trades in a shared desktop row. Narrow layouts stack
these sections. The mobile ledger prioritizes net results and keeps the trade
column visible while horizontally scrolling. The review queue has a reduced
mobile height. Settings use section rows instead of nested cards.

## Verification

- `npm test`: calculation/export/mail tests plus palette and contrast tests.
- `npm run build --workspace web`: production build.
- Focused ESLint: changed journal pages, Header, ThemeContext, ThemeSwitch,
  SettingsSection.
- Browser QA on demo data: desktop and mobile layouts, both themes, reload
  persistence, month selection, calendar filtering, search and review queue.
- Production authentication, account writes and mail delivery are not exercised
  by the read-only demo review. No database migrations changed for this work.

Changes are local and have not been deployed to Horizons or the public domain.
