import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { findEdges, pickDiverse } from '@/lib/edgeFinder';
import { money, rValue } from '@/lib/format';
import MetricHelp from './MetricHelp';

const sampleLabels = { small: 'Kleine Stichprobe', medium: 'Erste Tendenz', solid: 'Belastbar' };

function Finding({ finding, leak, total }) {
  const comparison = !leak && finding.avgR !== null && total.avgR !== null ? `Ø ${rValue(finding.avgR)} je Trade. Dein Schnitt über alle Trades: ${rValue(total.avgR)}.` : finding.advice;
  return <li className={'edge-row ' + (leak ? 'is-leak' : 'is-strength')}>
    <div className="edge-row-head">
      <strong>{finding.title}</strong>
      <span className="edge-value">{money(finding.netPnL, true)}{finding.rCount > 0 && <small>{rValue(finding.totalR)}</small>}</span>
    </div>
    <p className="edge-meta">{finding.trades} Trades · {Math.round(finding.winRate)} % Treffer · {sampleLabels[finding.sample]}</p>
    <p className="edge-advice"><Lightbulb size={13} aria-hidden="true" /><span>{leak ? finding.advice : comparison}{leak && <i> Ohne diese Trades: <b>{money(finding.withoutPnL, true)}</b>.</i>}</span></p>
  </li>;
}

/** The patterns that cost or earn the most in the given trades. */
export default function EdgeFinder({ trades, balances, limit = 3, className = '' }) {
  const edges = useMemo(() => findEdges(trades, balances), [trades, balances]);
  const leaks = pickDiverse(edges.leaks, limit), strengths = pickDiverse(edges.strengths, limit);
  return <section className={'journal-panel edge-finder ' + className}>
    <header className="panel-header"><div className="min-w-0"><p className="panel-eyebrow">Hebel-Finder</p><h2 className="flex items-center gap-2">Deine größten Hebel<MetricHelp helpKey="edgeFinder" label="Deine größten Hebel" /></h2></div>
      <span className="text-xs text-muted-foreground">{edges.total.trades} Trades ausgewertet</span></header>
    {!edges.enough ? <p className="py-4 text-sm leading-6 text-muted-foreground">Ab 10 erfassten Trades im Zeitraum zeigt dir das Journal hier, welche Muster dich am meisten kosten und welche dein Ergebnis tragen.</p>
      : <div className="edge-columns">
        <div><h3 className="edge-heading text-destructive"><TrendingDown size={15} />Das kostet dich</h3>
          {leaks.length ? <ul>{leaks.map(f => <Finding key={f.kind + f.key} finding={f} total={edges.total} leak />)}</ul> : <p className="edge-empty">Kein Muster mit negativem Ergebnis gefunden. Stark.</p>}</div>
        <div><h3 className="edge-heading text-success"><TrendingUp size={15} />Das trägt dein Ergebnis</h3>
          {strengths.length ? <ul>{strengths.map(f => <Finding key={f.kind + f.key} finding={f} total={edges.total} />)}</ul> : <p className="edge-empty">Noch kein Muster, das klar über deinem Durchschnitt liegt.</p>}</div>
      </div>}
    {edges.enough && <p className="mt-4 text-[11px] leading-4 text-muted-foreground">Rückblick auf erfasste, abgeschlossene Trades. Die Hebel überschneiden sich und lassen sich nicht addieren. Keine Prognose.</p>}
  </section>;
}
