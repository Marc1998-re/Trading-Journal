import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';
import { useJournalData } from '@/hooks/useJournalData';
import { usePerformanceUnit } from '@/hooks/usePerformanceUnit';
import { buildSymbolPerformance, buildSetupPerformance, buildWeekdayPerformance } from '@/lib/tradeCalculations';
import { PageHeading, PeriodToolbar, PerformanceUnitSwitch, MetricStrip, SectionTitle, DataState, StatGrid, Panel, toneOf } from '@/components/journal/JournalUI';
import PerformanceRows from '@/components/journal/PerformanceRows';
import MetricHelp from '@/components/journal/MetricHelp';
import RiskAnalysis from '@/components/journal/RiskAnalysis';
import { decimal, money, percent, rValue } from '@/lib/format';
import { buildProBreakdowns, calculateExecutionStats, calculateDisciplineStats, formatDuration, sessions } from '@/lib/proJournal';
import { summarizeReviews } from '@/lib/review';

const tabs = [['overview', 'Überblick'], ['risk', 'R & Risiko'], ['edge', 'Setups & Märkte'], ['timing', 'Timing'], ['execution', 'Ausführung'], ['psychology', 'Psychologie']];
const axisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

function GroupTable({ groups, empty, label = 'Gruppe' }) {
  if (!groups.length) return <p className="py-6 text-sm text-muted-foreground">{empty}</p>;
  return <div className="journal-table-wrap"><table className="journal-table text-xs">
    <thead><tr>{[label, 'Trades', 'Treffer', 'Profitfaktor', 'Ø R', 'Gesamt-R', 'Netto'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{groups.map(g => <tr key={g.key}><th scope="row" className="!font-medium !text-foreground">{g.label}</th><td>{g.trades}</td><td>{percent(g.winRate, { digits: 0 })}</td><td className="font-mono">{g.profitFactor === null ? '—' : decimal(g.profitFactor)}</td><td className={`font-mono ${g.avgR > 0 ? 'text-success' : g.avgR < 0 ? 'text-destructive' : ''}`}>{rValue(g.avgR)}</td><td className="font-mono">{g.rCount ? rValue(g.totalR) : '—'}</td><td className={`whitespace-nowrap font-mono ${g.netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>{money(g.netPnL, true)}</td></tr>)}</tbody>
  </table></div>;
}

function Insight({ groups, noun }) {
  const eligible = groups.filter(g => g.trades >= 3 && g.avgR !== null);
  if (eligible.length < 2) return null;
  const best = [...eligible].sort((a, b) => b.avgR - a.avgR)[0], worst = [...eligible].sort((a, b) => a.avgR - b.avgR)[0];
  return <p className="mt-4 border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground">{noun}: <strong className="text-foreground">{best.label}</strong> ({rValue(best.avgR)} je Trade, {best.trades} Trades). Schwächste: <strong className="text-foreground">{worst.label}</strong> ({rValue(worst.avgR)}, {worst.trades} Trades). Gruppen unter 3 Trades bleiben unberücksichtigt.</p>;
}

function HourHeatmap({ groups }) {
  const byHour = new Map(groups.map(g => [g.key, g]));
  const max = Math.max(1, ...groups.map(g => Math.abs(g.netPnL)));
  return <div className="hour-heatmap">{Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map(hour => {
    const g = byHour.get(hour);
    const intensity = g ? 0.08 + Math.abs(g.netPnL) / max * 0.5 : 0;
    return <div key={hour} className="hour-cell" style={g ? { background: `hsl(var(--${g.netPnL >= 0 ? 'success' : 'destructive'}) / ${intensity})` } : undefined} title={g ? `${hour}:00 · ${g.trades} Trades · ${money(g.netPnL, true)}` : `${hour}:00 · keine Trades`}>
      <span>{hour}</span>{g ? <><strong className={g.netPnL >= 0 ? 'text-success' : 'text-destructive'}>{rValue(g.avgR).replace(' R', '')}</strong><small>{g.trades}×</small></> : <small>—</small>}
    </div>;
  })}</div>;
}

export default function AnalysisPage() {
  const data = useJournalData(), { stats, trades, balances } = data;
  const [unit, setUnit] = usePerformanceUnit();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab') : 'overview';
  const selectTab = key => setParams(p => { const n = new URLSearchParams(p); n.set('tab', key); return n; }, { replace: true });
  const symbols = useMemo(() => buildSymbolPerformance(trades, balances, balances), [trades, balances]);
  const setups = useMemo(() => buildSetupPerformance(trades, balances, balances), [trades, balances]);
  const weekdays = useMemo(() => buildWeekdayPerformance(trades, balances, balances), [trades, balances]);
  const pro = useMemo(() => buildProBreakdowns(trades, balances), [trades, balances]);
  const exec = useMemo(() => calculateExecutionStats(trades, balances), [trades, balances]);
  const discipline = useMemo(() => calculateDisciplineStats(trades), [trades]);
  const reviews = useMemo(() => summarizeReviews(trades), [trades]);
  const has = stats.totalTrades > 0;
  const ready = !data.loading && !data.error;

  return <div className="journal-page"><Helmet><title>Analyse · The Trading Desk</title></Helmet>
    <PageHeading eyebrow="Deinen Vorteil verstehen" title="Analyse">Von den Kernzahlen bis zu Timing, Ausführung und Psychologie: Wo liegt dein Edge, wo verlierst du ihn?</PageHeading>
    <PeriodToolbar data={data}><PerformanceUnitSwitch unit={unit} onChange={setUnit} /></PeriodToolbar><DataState data={data} />
    <MetricStrip stats={stats} loading={data.loading} unit={unit} opening={data.opening} />
    <div className="analysis-tabs" role="tablist" aria-label="Analysebereiche" onKeyDown={event => {
      const index = tabs.findIndex(([key]) => key === tab);
      const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      const key = tabs[(next + tabs.length) % tabs.length][0];
      selectTab(key);
      requestAnimationFrame(() => document.getElementById(`tab-${key}`)?.focus());
    }}>{tabs.map(([key, label]) => <button key={key} role="tab" id={`tab-${key}`} aria-controls={`panel-${key}`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => selectTab(key)}>{label}</button>)}</div>

    {ready && <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === 'overview' && <>
        <section className="mb-8"><SectionTitle number="01" title="Ergebnis & Qualität" /><StatGrid columns={4} items={[
          { label: 'Profitfaktor', value: has ? decimal(stats.profitFactor) : '—', tone: has ? (stats.profitFactor >= 1 ? 'positive' : 'negative') : undefined, detail: 'Nettogewinne ÷ Nettoverluste' },
          { label: 'Gewinn-Verlust-Verhältnis', value: has ? decimal(stats.payoffRatio) : '—', detail: 'Ø Gewinn ÷ Betrag Ø Verlust' },
          { label: 'Erwartungswert in EUR', value: has ? money(stats.expectancy, true) : '—', tone: toneOf(stats.expectancy), detail: 'Netto je Trade' },
          { label: 'Gesamt-R', value: stats.rSampleSize ? rValue(stats.totalR) : '—', tone: toneOf(stats.totalR), detail: `${stats.rSampleSize} / ${stats.totalTrades} mit Risikobasis` },
          { label: 'Ø Gewinn', value: stats.wins ? money(stats.avgWin) : '—', detail: `${stats.wins} Gewinner`, tone: stats.wins ? 'positive' : undefined },
          { label: 'Ø Verlust', value: stats.losses ? money(stats.avgLoss) : '—', detail: `${stats.losses} Verlierer`, tone: stats.losses ? 'negative' : undefined },
          { label: 'Ø Gewinn in R', value: rValue(stats.avgWinR), tone: toneOf(stats.avgWinR) },
          { label: 'Ø Verlust in R', value: rValue(stats.avgLossR), tone: toneOf(stats.avgLossR), detail: stats.avgLossR !== null && stats.avgLossR < -1.1 ? 'Verluste laufen über 1 R hinaus' : null },
        ]} /></section>
        <section className="mb-8"><SectionTitle number="02" title="Risiko & Robustheit" /><StatGrid columns={4} items={[
          { label: 'Max. Rückgang', helpKey: 'drawdown', value: has ? percent(stats.maxDrawdownPct) : '—', detail: money(-stats.maxDrawdown), tone: stats.maxDrawdown > 0 ? 'negative' : undefined },
          { label: 'Recovery-Faktor', value: stats.recoveryFactor === null ? '—' : decimal(stats.recoveryFactor), detail: 'Netto ÷ max. Rückgang' },
          { label: 'SQN', value: stats.sqn === null ? '—' : decimal(stats.sqn), detail: stats.rSampleSize < 30 ? `Nur ${stats.rSampleSize} R-Werte – wenig belastbar` : 'Systemqualität' },
          { label: 'R-Streuung', value: stats.rStdDev === null ? '—' : decimal(stats.rStdDev) + ' R', detail: 'Standardabweichung der Netto-R' },
          { label: 'Kelly-Quote', value: stats.kelly === null ? '—' : percent(stats.kelly), detail: 'Indikator, keine Positionsgröße' },
          { label: 'Größter Gewinn', value: has ? money(stats.bestTrade, true) : '—', tone: toneOf(stats.bestTrade), detail: has && stats.netPnL > 0 ? `${percent(stats.bestTrade / stats.netPnL * 100, { digits: 0 })} des Netto-Ergebnisses` : null },
          { label: 'Größter Verlust', value: has ? money(stats.worstTrade, true) : '—', tone: toneOf(stats.worstTrade) },
          { label: 'Ø verfügbares Geldrisiko', helpKey: 'meanRisk', value: money(stats.avgStopLossAmount), detail: `${stats.riskSampleSize} Werte` },
        ]} /></section>
        <section className="mb-8"><SectionTitle number="03" title="Serien & Aktivität" /><StatGrid columns={4} items={[
          { label: 'Längste Gewinnserie', value: stats.longestWinStreak, detail: 'Break-even unterbricht' },
          { label: 'Längste Verlustserie', value: stats.longestLossStreak, detail: 'Chronologisch nach Einstieg' },
          { label: 'Handelstage', value: stats.tradingDays || '—', detail: stats.tradingDays ? `Ø ${decimal(stats.avgTradesPerDay, 1)} Trades/Tag` : null },
          { label: 'Erfasste Kosten', value: money(stats.totalFees), detail: 'Gebühren + Gewinnbeteiligung' },
        ]} /></section>
        <section className="journal-section"><SectionTitle number="04" title="Wie belastbar ist die Auswertung?" />
          <div className="grid gap-8 lg:grid-cols-2"><div className="border-l-2 border-info pl-5 space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">{stats.totalTrades} abgeschlossene Trades. Ab etwa 30 Trades je Setup werden Muster aussagekräftiger; garantiert sind künftige Ergebnisse nie.</p>
            {stats.confidence && <div><div className="flex items-center gap-1 text-xs text-muted-foreground"><p>Trefferquote: 95-%-Wilson-Intervall</p><MetricHelp helpKey="wilson" /></div><p className="text-xl mt-2 font-mono">{percent(stats.confidence.lower)} bis {percent(stats.confidence.upper)}</p></div>}
          </div>
          <dl className="text-sm space-y-3">
            <div className="flex items-center justify-between gap-3 border-b pb-3"><dt className="flex items-center gap-1 text-muted-foreground">Trades mit Risikobasis<MetricHelp helpKey="totalCoverage" /></dt><dd className="font-mono">{stats.rSampleSize || 0} / {stats.totalTrades}</dd></div>
            <div className="flex items-center justify-between gap-3 border-b pb-3"><dt className="text-muted-foreground">Trades mit Setup-Note</dt><dd className="font-mono">{discipline.graded} / {stats.totalTrades}</dd></div>
            <div className="flex items-center justify-between gap-3 border-b pb-3"><dt className="text-muted-foreground">Trades mit MFE/MAE</dt><dd className="font-mono">{exec.mfeCount} / {stats.totalTrades}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Abgeschlossene Reviews</dt><dd className="font-mono">{reviews.completed} / {stats.totalTrades}</dd></div>
          </dl></div>
        </section>
      </>}

      {tab === 'risk' && <RiskAnalysis trades={trades} balances={balances} />}

      {tab === 'edge' && <>
        <div className="grid min-w-0 gap-10 xl:grid-cols-2 mb-4"><section><SectionTitle number="01" title="Welche Setups tragen dein Ergebnis?" helpKey="ranking" /><PerformanceRows groups={setups} /><Insight groups={setups} noun="Stärkstes Setup" /></section><section><SectionTitle number="02" title="Welche Märkte tragen dein Ergebnis?" helpKey="ranking" /><PerformanceRows groups={symbols} /><Insight groups={symbols} noun="Stärkster Markt" /></section></div>
        <section className="journal-section"><SectionTitle number="03" title="Setup-Qualität: A vs. B vs. C" helpKey="grade" /><GroupTable groups={pro.grade} label="Note" empty="Noch keine Setup-Noten erfasst. Vergib beim Erfassen eines Trades unter „Profi-Angaben“ eine Note A, B oder C." /><Insight groups={pro.grade} noun="Stärkste Qualitätsstufe" /></section>
        <section className="journal-section"><SectionTitle number="04" title="Long vs. Short" /><GroupTable groups={pro.side} label="Richtung" empty="Noch keine Richtung erfasst." /></section>
      </>}

      {tab === 'timing' && <>
        <section className="mb-8"><SectionTitle number="01" title="Handelssitzungen" helpKey="session" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{sessions.map(s => { const g = pro.session.find(x => x.key === s.key); return <Panel key={s.key} eyebrow={s.range} title={s.label}><p className={`font-mono text-2xl ${g ? (g.netPnL >= 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'}`}>{g ? money(g.netPnL, true) : '—'}</p><p className="mt-2 text-xs text-muted-foreground">{g ? `${g.trades} Trades · ${percent(g.winRate, { digits: 0 })} Treffer · ${rValue(g.avgR)} je Trade` : 'Keine Trades'}</p></Panel>; })}</div></section>
        <section className="journal-section"><SectionTitle number="02" title="Ø Netto-R nach Einstiegsstunde" /><HourHeatmap groups={pro.hour} /><p className="mt-3 text-xs text-muted-foreground">Farbintensität = Netto-Ergebnis der Stunde · Zahl = Ø R je Trade · darunter Anzahl Trades</p></section>
        <section className="journal-section"><SectionTitle number="03" title="Wochentage im Vergleich" helpKey="ranking" /><PerformanceRows groups={weekdays} /><Insight groups={weekdays} noun="Stärkster Wochentag" /></section>
        <section className="journal-section"><SectionTitle number="04" title="Haltedauer" helpKey="holdTime" /><StatGrid columns={3} items={[
          { label: 'Ø Haltedauer', value: formatDuration(exec.avgHold), detail: `${exec.holdCount} Trades mit Ausstieg` },
          { label: 'Ø Haltedauer Gewinner', helpKey: 'holdTime', value: formatDuration(exec.avgHoldWin), tone: 'positive' },
          { label: 'Ø Haltedauer Verlierer', helpKey: 'holdTime', value: formatDuration(exec.avgHoldLoss), tone: 'negative', detail: exec.avgHoldLoss > exec.avgHoldWin * 1.3 ? 'Verlierer laufen deutlich länger' : null },
        ]} /></section>
      </>}

      {tab === 'execution' && <>
        <section className="mb-8"><SectionTitle number="01" title="Ausführungsqualität" /><StatGrid columns={4} items={[
          { label: 'Ø MFE', value: exec.avgMfe === null ? '—' : decimal(exec.avgMfe) + ' R', detail: `${exec.mfeCount} Trades mit Angabe` },
          { label: 'Ø MAE', value: exec.avgMae === null ? '—' : decimal(exec.avgMae) + ' R', detail: `${exec.maeCount} Trades mit Angabe` },
          { label: 'Gewinnausschöpfung', value: exec.captureRatio === null ? '—' : percent(exec.captureRatio * 100, { digits: 0 }), detail: `${exec.captureCount} Gewinner mit MFE` },
          { label: 'Gewinne hergegeben', helpKey: 'mfe', value: exec.gaveBack, detail: 'Verlierer, die ≥ 1 R im Plus waren', tone: exec.gaveBack ? 'negative' : undefined },
          { label: 'Geplant vs. realisiert', value: exec.plannedCount ? `${decimal(exec.avgPlanned, 1)} → ${rValue(exec.avgRealizedPlanned)}` : '—', detail: `${exec.plannedCount} Trades mit Ziel` },
          { label: 'Ziel erreicht', helpKey: 'plannedVsRealized', value: exec.targetHitRate === null ? '—' : percent(exec.targetHitRate, { digits: 0 }), detail: 'Gewinner mit ≥ 95 % des Ziels' },
          { label: 'Volle Stop-Verluste', helpKey: 'mae', value: exec.stoppedFull, detail: 'Verlierer mit MAE ≥ 1 R' },
          { label: 'Ø Haltedauer', value: formatDuration(exec.avgHold), detail: `${exec.holdCount} Trades` },
        ]} /></section>
        <section className="journal-section"><SectionTitle number="02" title="MFE vs. realisiertes Ergebnis" helpKey="capture" />
          {exec.scatter.length ? <div className="h-80 min-w-0" role="img" aria-label="Streudiagramm: maximale Bewegung zu deinen Gunsten gegen realisiertes Netto-R">
            <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" />
              <XAxis type="number" dataKey="mfe" name="MFE" tickFormatter={v => decimal(v, 1) + ' R'} domain={[0, 'auto']} tick={axisTick} axisLine={false} tickLine={false} label={{ value: 'MFE (R)', position: 'insideBottom', offset: -8, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="number" dataKey="r" name="Netto-R" tickFormatter={v => decimal(v, 1) + ' R'} tick={axisTick} axisLine={false} tickLine={false} width={55} />
              <ZAxis range={[40, 40]} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: Math.max(...exec.scatter.map(p => p.mfe)), y: Math.max(...exec.scatter.map(p => p.mfe)) }]} stroke="hsl(var(--primary))" strokeDasharray="4 4" ifOverflow="extendDomain" />
              <Tooltip cursor={false} content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><span>{payload[0].payload.symbol}</span><strong>{rValue(payload[0].payload.r)} von max. {decimal(payload[0].payload.mfe)} R</strong></div> : null} />
              <Scatter data={exec.scatter} isAnimationActive={false}>{exec.scatter.map((p, i) => <Cell key={i} fill={`hsl(var(--${p.win ? 'success' : 'destructive'}))`} fillOpacity={0.75} />)}</Scatter>
            </ScatterChart></ResponsiveContainer>
          </div> : <p className="py-8 text-sm text-muted-foreground">Erfasse MFE (und optional MAE) unter „Profi-Angaben“, um zu sehen, wie viel der möglichen Bewegung du mitnimmst.</p>}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Punkte nahe der gestrichelten Linie: Ausstieg nahe am Bestwert. Gewinner weit darunter: Gewinne zu früh mitgenommen. Rote Punkte rechts: Trades, die im Plus waren und trotzdem verloren haben.</p>
        </section>
      </>}

      {tab === 'psychology' && <>
        <section className="mb-8"><SectionTitle number="01" title="Disziplin" helpKey="adherence" /><StatGrid columns={4} items={[
          { label: 'Setup-Regeltreue', value: discipline.setupAdherence === null ? '—' : percent(discipline.setupAdherence, { digits: 0 }), detail: `${discipline.setupRated} bewertet` },
          { label: 'Risiko-Regeltreue', value: discipline.riskAdherence === null ? '—' : percent(discipline.riskAdherence, { digits: 0 }), detail: `${discipline.riskRated} bewertet` },
          { label: 'Reviews abgeschlossen', helpKey: 'reviewComparison', value: discipline.reviewRate === null ? '—' : percent(discipline.reviewRate, { digits: 0 }), detail: `${discipline.completed} von ${stats.totalTrades}` },
          { label: 'Trades unter Tilt', helpKey: 'emotion', value: discipline.tiltShare === null ? '—' : percent(discipline.tiltShare, { digits: 0 }), detail: 'FOMO, Gier oder Frust', tone: discipline.tiltShare > 20 ? 'negative' : undefined },
        ]} /></section>
        <section className="journal-section"><SectionTitle number="02" title="Ergebnis nach Emotion beim Einstieg" helpKey="emotion" /><GroupTable groups={pro.emotion} label="Emotion" empty="Noch keine Emotionen erfasst. Wähle beim Erfassen unter „Profi-Angaben“, wie du dich beim Einstieg gefühlt hast." /><Insight groups={pro.emotion} noun="Beste Verfassung" /></section>
        <section className="journal-section"><SectionTitle number="03" title="Ergebnis nach Überzeugung" /><GroupTable groups={pro.confidence} label="Überzeugung" empty="Noch keine Überzeugung erfasst." /></section>
        <section className="journal-section"><SectionTitle number="04" title="Häufigste Lern-Tags" />{reviews.tags.length ? <dl className="grid gap-x-8 sm:grid-cols-2">{reviews.tags.sort((a, b) => b.count - a.count).map(tag => <div key={tag.id} className="flex justify-between gap-4 border-b py-3 text-sm"><dt>{tag.label}</dt><dd className="font-mono">{tag.count}×</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Noch keine Lern-Tags in abgeschlossenen Reviews.</p>}</section>
      </>}
    </div>}
  </div>;
}
