import React, { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { chartLinks } from '@/lib/screenshots';

function Shot({ link, symbol }) {
  const [failed, setFailed] = useState(false);
  return <a href={link.url} target="_blank" rel="noreferrer noopener" className="chart-shot" title={link.hint}>
    <span className="chart-shot-frame">{link.image && !failed
      ? <img src={link.image} alt={`${link.label}-Chart zu ${symbol}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : <span className="chart-shot-empty"><ImageOff size={18} />Keine Vorschau</span>}</span>
    <span className="chart-shot-label">{link.label}<ExternalLink size={12} /></span>
  </a>;
}

/** Thumbnails of all chart links of a trade (context, confirmation, entry). */
export default function ChartStrip({ trade }) {
  const links = chartLinks(trade);
  if (!links.length) return null;
  return <div className="chart-strip" aria-label="Chart-Screenshots">{links.map(link => <Shot key={link.key} link={link} symbol={trade.symbol} />)}</div>;
}

/** Compact links for tables: K · B · E. */
export function ChartLinks({ trade }) {
  const links = chartLinks(trade);
  if (!links.length) return <span className="text-muted-foreground">—</span>;
  return <span className="chart-links">{links.map(link => <a key={link.key} href={link.url} target="_blank" rel="noreferrer noopener" aria-label={`${link.label}-Chart zu ${trade.symbol} öffnen`} title={link.label}>{link.label[0]}</a>)}</span>;
}
