import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { SectionTitle, Metric } from './JournalUI';
import RiskBasisLabel from './RiskBasisLabel';
import MetricHelp from './MetricHelp';
import { buildProcessedTrades } from '@/lib/tradeCalculations';
import { buildRDistribution, buildRollingExpectancy, buildReviewComparison, riskScopes, riskSources, summarizeRiskSources } from '@/lib/riskAnalysis';
import { decimal, money, rValue } from '@/lib/format';

const axisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

function RDistribution({ distribution }) {
  return <section className="min-w-0" aria-labelledby="distribution-title">
    <div className="flex min-h-10 items-center gap-1"><h3 id="distribution-title" className="text-sm font-semibold">Verteilung der Netto-R</h3><MetricHelp helpKey="distribution" /></div>
    <p className="mt-2 text-xs text-muted-foreground" role="status">{distribution.count} von {distribution.total} Trades ausgewertet · {distribution.excluded} ausgeschlossen</p>
    <div className="mt-4 grid grid-cols-2 border-y">
      <Metric label="Median" value={rValue(distribution.median)} detail="Mitte der geordneten Ergebnisse" />
      <Metric label="Mittelwert" value={rValue(distribution.mean)} detail="Historischer Erwartungswert" />
    </div>
    {distribution.count ? <>
      <div className="mt-4 h-64 min-w-0" role="img" aria-label="Verteilung der Netto-R-Ergebnisse, Anzahl Trades je Ergebnisbereich">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={distribution.bins} margin={{ top: 18, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 6" />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={40} />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={30} />
          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><span>{payload[0].payload.range}</span><strong>{payload[0].value} Trades</strong></div> : null} />
          <Bar dataKey="count" maxBarSize={42} isAnimationActive={false}>{distribution.bins.map(bin => <Cell key={bin.label} fill={`hsl(var(--${bin.color}))`} />)}</Bar>
        </BarChart></ResponsiveContainer>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground"><p>Mittlere 50 %: <span className="font-mono text-foreground">{rValue(distribution.q1)} bis {rValue(distribution.q3)}</span> · Quartile linear interpoliert.</p><MetricHelp helpKey="quartiles" /></div>
      <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer py-2">Verteilungswerte</summary><dl className="divide-y">{distribution.bins.map(bin => <div key={bin.label} className="flex justify-between gap-3 py-2"><dt>{bin.range}</dt><dd className="shrink-0">{bin.count} Trades</dd></div>)}</dl></details>
    </> : <p className="flex h-64 items-center text-sm text-muted-foreground">Keine gültigen R-Werte für diese Auswahl. Das Euro-Ergebnis bleibt unverändert.</p>}
  </section>;
}

function RollingExpectancy({ rolling, windowSize, onWindowChange }) {
  const latest = rolling.latest;
  const points = rolling.points.filter(point => point.complete);
  const validCount = points.filter(point => Number.isFinite(point.mean)).length;
  const ready = validCount > 0;
  return <section className="min-w-0" aria-labelledby="rolling-title">
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-3"><h3 id="rolling-title" className="text-sm font-semibold">Netto-R im Zeitverlauf</h3>
      <div className="period-switch" role="group" aria-label="Fenster für gleitenden Erwartungswert">{[20, 50].map(size => <button type="button" key={size} aria-pressed={windowSize === size} onClick={() => onWindowChange(size)} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{size} Trades</button>)}</div>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Nach Einstiegszeit · Überlappende Fenster · Keine Prognose</p>
    <div className="mt-4 grid grid-cols-2 border-y">
      <Metric label="Letztes Fenster" value={rValue(latest?.mean)} detail={latest?.complete ? `Mittelwert über ${latest.rCount} gültige R-Werte` : `${latest?.windowCount || 0} von ${windowSize} Trades vorhanden`} />
      <Metric label="R-Abdeckung" value={`${latest?.rCount || 0} / ${latest?.windowCount || 0}`} detail={latest?.complete ? `${latest.excluded} im Fenster ausgeschlossen` : 'Fenster noch unvollständig'} />
    </div>
    {ready ? <div className="mt-4 h-64 min-w-0" role="img" aria-label={`Gleitender Netto-R-Erwartungswert über die letzten ${windowSize} Trades`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 18, right: 18, left: 0, bottom: 24 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 6" />
        <XAxis dataKey="tradeNumber" tick={axisTick} axisLine={false} tickLine={false} minTickGap={30} tickFormatter={v => `#${v}`} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={55} tickFormatter={v => `${decimal(v, 1)} R`} domain={[min => Math.min(0, min), max => Math.max(0, max)]} />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
        <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><span>Trade #{payload[0].payload.tradeNumber} · {payload[0].payload.dateLabel}</span><strong>{rValue(payload[0].value)}</strong><span>{payload[0].payload.rCount} / {windowSize} mit gültigem R</span></div> : null} />
        <Line dataKey="mean" type="linear" stroke="hsl(var(--primary))" strokeWidth={2} dot={validCount === 1 ? { r: 3 } : false} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
      </LineChart></ResponsiveContainer>
    </div> : <p className="flex h-64 items-center text-sm text-muted-foreground">{latest?.complete ? 'Keine gültigen R-Werte in einem vollständigen Fenster.' : `Für das erste vollständige Fenster fehlen ${windowSize - (latest?.windowCount || 0)} datierte Trades in diesem Zeitraum.`}</p>}
    <p className="text-xs leading-5 text-muted-foreground">Jeder Punkt umfasst die letzten {windowSize} Trades im gewählten Zeitraum, nicht die letzten {windowSize} gültigen R-Werte. Der Mittelwert nutzt nur die vorhandene Risikobasis. Fehlende Abschlusszeiten und wechselnde Setups begrenzen die Vergleichbarkeit.</p>
    {rolling.excludedDates > 0 && <p role="status" className="mt-2 text-xs text-muted-foreground">{rolling.excludedDates} Trades ohne gültiges Einstiegsdatum bleiben aus diesem Verlauf ausgeschlossen.</p>}
  </section>;
}

function ReviewComparison({ comparison, field, onFieldChange }) {
  const { pathname } = useLocation();
  return <section className="journal-section min-w-0" aria-labelledby="review-comparison-title">
    <SectionTitle number="03" title="Regeltreue und Ergebnisse" helpKey="reviewComparison"><div className="period-switch" role="group" aria-label="Regel-Check vergleichen">{[['reviewSetup', 'Setup'], ['reviewRisk', 'Risiko']].map(([key, label]) => <button key={key} type="button" aria-pressed={field === key} onClick={() => onFieldChange(key)} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{label}</button>)}</div></SectionTitle>
    <h3 id="review-comparison-title" className="text-sm mb-2">{field === 'reviewSetup' ? 'Setup eingehalten?' : 'Geplantes Risiko eingehalten?'}</h3>
    <p className="text-xs text-muted-foreground mb-4" role="status">{comparison.completed} von {comparison.total} Reviews abgeschlossen · {comparison.excluded} offene oder unvollständige Reviews nicht verglichen</p>
    {comparison.completed ? <div className="journal-table-wrap" role="region" aria-label="Regeltreue im Vergleich" tabIndex={0}><table className="journal-table min-w-[620px]">
      <caption className="sr-only">Ergebnisse abgeschlossener Reviews nach eigener Regelbewertung; R-Werte gemäß gewählter Risikobasis.</caption>
      <thead><tr>{['Bewertung', 'Trades', 'Netto EUR', 'Ø Netto-R', 'Median R', 'R-Basis'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{comparison.groups.map(group => <tr key={group.key}><th scope="row" className="!bg-transparent !text-foreground !whitespace-normal">{group.label}</th><td>{group.trades}</td><td className="whitespace-nowrap font-mono text-xs">{group.trades ? money(group.netPnL, true) : '—'}</td><td className="whitespace-nowrap font-mono text-xs">{rValue(group.mean)}</td><td className="whitespace-nowrap font-mono text-xs">{rValue(group.median)}</td><td className="text-xs whitespace-nowrap">{group.rCount} / {group.trades}</td></tr>)}</tbody>
    </table></div> : <div className="border-y py-8"><p className="text-sm text-muted-foreground">Noch keine abgeschlossenen Reviews in diesem Zeitraum.</p><Link className="inline-block py-3 text-sm text-primary underline underline-offset-4" to={`${pathname.startsWith('/demo') ? '/demo' : ''}/review`}>Zum Review</Link></div>}
    <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">Selbsteinschätzungen, keine Ursache-Wirkungs-Analyse. Kleine Gruppen, unterschiedliche Setups und selektiv abgeschlossene Reviews können das Bild verzerren. „Nicht bewertet“ ist kein Regelverstoß. Netto EUR umfasst alle Trades der jeweiligen Gruppe; R-Basis nennt die davon auswertbaren R-Werte.</p>
  </section>;
}

export default function RiskAnalysis({ trades, balances }) {
  const [scope, setScope] = useState('all');
  const [windowSize, setWindowSize] = useState(20);
  const [field, setField] = useState('reviewSetup');
  const items = useMemo(() => buildProcessedTrades(trades, balances, balances), [trades, balances]);
  const counts = useMemo(() => summarizeRiskSources(items), [items]);
  const distribution = useMemo(() => buildRDistribution(items, scope), [items, scope]);
  const rolling = useMemo(() => buildRollingExpectancy(items, windowSize, scope), [items, windowSize, scope]);
  const comparison = useMemo(() => buildReviewComparison(items, field, scope), [items, field, scope]);
  return <div className="min-w-0" data-testid="risk-analysis">
    <section className="journal-section !pt-0" aria-label="Risikodaten und Analysebasis">
      <SectionTitle number="01" title="Die Basis deiner R-Auswertung" />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">{Object.keys(riskSources).map(source => <div key={source} className="min-w-0"><dt><RiskBasisLabel source={source} /></dt><dd className="mt-1 font-mono text-2xl">{counts[source]} <span className="text-xs text-muted-foreground">Trades</span></dd></div>)}</dl>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t pt-4"><p className="max-w-xl text-xs leading-5 text-muted-foreground">Die Auswahl gilt für Verteilung, gleitenden Erwartungswert und R-Werte im Review-Vergleich. Kennzahlen oben, Rankings und Euro-Ergebnisse bleiben auf der vollständigen Zeitraum-Auswahl.</p>
        <label className="grid min-w-0 w-full gap-2 text-xs text-muted-foreground sm:w-auto">Risikobasis für R-Auswertungen<select aria-label="Risikobasis für R-Auswertungen" className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground" value={scope} onChange={event => setScope(event.target.value)}>{Object.entries(riskScopes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
    </section>
    <section className="journal-section"><SectionTitle number="02" title="Ergebnisprofil und Entwicklung" /><div className="grid min-w-0 gap-10 xl:grid-cols-2"><RDistribution distribution={distribution} /><RollingExpectancy rolling={rolling} windowSize={windowSize} onWindowChange={setWindowSize} /></div></section>
    <ReviewComparison comparison={comparison} field={field} onFieldChange={setField} />
  </div>;
}
