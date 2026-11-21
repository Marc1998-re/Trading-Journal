// The journal stores up to three chart links per trade, in the order a trader documents them.
export const chartFields = [
  ['contextUrl', 'Kontext', 'Übergeordneter Chart / Marktbild'],
  ['validationUrl', 'Validierung', 'Signal, das den Einstieg validiert'],
  ['entryUrl', 'Einstieg', 'Ausführung mit Stop und Ziel'],
];

/** Direct image for a TradingView snapshot or an image link; null when only a page link is known. */
export function snapshotImage(url) {
  if (!url) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const tradingView = /^(?:[a-z]+\.)?tradingview\.com$/i.test(parsed.hostname) && /^\/x\/([A-Za-z0-9]{4,32})\/?$/.exec(parsed.pathname);
  if (tradingView) return `https://s3.tradingview.com/snapshots/${tradingView[1][0].toLowerCase()}/${tradingView[1]}.png`;
  return /\.(png|jpe?g|gif|webp)$/i.test(parsed.pathname) ? parsed.href : null;
}

export const chartLinks = trade => chartFields.filter(([key]) => trade?.[key]).map(([key, label, hint]) => ({ key, label, hint, url: trade[key], image: snapshotImage(trade[key]) }));
