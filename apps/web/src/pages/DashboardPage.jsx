import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getISOWeek } from 'date-fns';
import { Helmet } from 'react-helmet';
import { ArrowUpRight, Plus, ShieldCheck, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJournalData } from '@/hooks/useJournalData';
import { usePerformanceUnit } from '@/hooks/usePerformanceUnit';
import { buildEquitySeries, buildProcessedTrades, buildDayPerformance, dayKey } from '@/lib/tradeCalculations';
import { money, shortMoney, percent, rValue, decimal } from '@/lib/format';
import { PageHeading, PeriodToolbar, PerformanceUnitSwitch, SectionTitle, DataState, SignedValue, KpiCard, SplitBar, Gauge, StatGrid, Panel, toneOf } from '@/components/journal/JournalUI';
import PerformanceChart from '@/components/journal/PerformanceChart';
import MetricHelp from '@/components/journal/MetricHelp';
import { AccountRulesCard, RulesPrompt } from '@/components/journal/AccountRules';
import { hasRules } from '@/lib/accountRules';
import { reviewStatus, reviewStatusLabels } from '@/lib/review';
import { calculateDisciplineStats, summarizeMissedTrades, sideLabel } from '@/lib/proJournal';

function monthWeeks(first, offset, days) {
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
  const padded = [...cells, ...Array.from({ length: (7 - cells.length % 7) % 7 }, () => null)];
  return Array.from({ length: padded.length / 7 }, (_, w) => padded.slice(w * 7, w * 7 + 7));
}

function DisciplineRow({ label, value, detail, helpKey }) {
  const known = Number.isFinite(value);
  const tone = !known ? 'muted-foreground' : value >= 80 ? 'success' : value >= 60 ? 'warning' : 'destructive';
  return <div className="discipline-row">
    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-xs text-muted-foreground">{label}{helpKey && <MetricHelp helpKey={helpKey} label={label} />}</span><strong className="font-mono text-sm">{known ? percent(value, { digits: 0 }) : '—'}</strong></div>
    <Gauge value={known ? value : 0} max={100} tone={tone} />
    <span className="text-[11px] text-muted-foreground">{detail}</span>
  </div>;
}

export default function DashboardPage() {
  const data = useJournalData();
  const { stats, balances, opening, trades } = data;
  const [unit, setUnit] = usePerformanceUnit();
  const percentage = unit === 'percent';
  const [mode, setMode] = useState('balance');
  const [selectedDay, setSelectedDay] = useState(null);
  useEffect(() => setSelectedDay(null), [data.month, data.range, data.anchor, data.from, data.to]);
  const rows = useMemo(() => buildProcessedTrades(trades, balances, balances).reverse(), [trades, balances]);
  const series = useMemo(() => buildEquitySeries(trades, opening, balances, balances), [trades, opening, balances]);
  const discipline = useMemo(() => calculateDisciplineStats(trades), [trades]);
  const missed = useMemo(() => summarizeMissedTrades(data.missed), [data.missed]);
  const prefix = data.demo ? '/demo' : '';
  const dayGroups = useMemo(() => buildDayPerformance(trades, balances, balances), [trades, balances]);
  const calendar = new Map(dayGroups.map(g => [g.key, g]));
  const first = new Date(data.month.getFullYear(), data.month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(data.month.getFullYear(), data.month.getMonth() + 1, 0).getDate();
  const weeks = monthWeeks(first, offset, days);
  const visibleRows = selectedDay ? rows.filter(r => r.date && dayKey(r.date) === selectedDay) : rows.slice(0, 6);
  const populated = stats.totalTrades > 0;
  const loading = data.loading;
  const breakeven = stats.totalTrades - stats.wins - stats.losses;
  const streak = stats.currentStreakType === 'win' ? `${stats.currentStreakCount} Gewinne` : stats.currentStreakType === 'loss' ? `${stats.currentStreakCount} Verluste` : '—';

  return <div className="journal-page">
    <Helmet><title>Übersicht · The Trading Desk</title></Helmet>
    <PageHeading eyebrow="Performance-Cockpit" title="Übersicht" action={data.demo ? <Button asChild><Link to="/signup">Eigenes Journal starten</Link></Button> : <Button asChild><Link to={prefix + '/trades?new=1'}><Plus />Trade erfassen</Link></Button>}>Ergebnis, Qualität, Risiko und Disziplin auf einen Blick.</PageHeading>
    <PeriodToolbar data={data}><PerformanceUnitSwitch unit={unit} onChange={setUnit} /></PeriodToolbar>
    <DataState data={data} />

    <div className="kpi-grid" aria-busy={loading}>
      <KpiCard label="Netto-Ergebnis" helpKey={percentage ? 'returnPct' : 'netPnl'} loading={loading}
        value={populated ? (percentage ? percent(stats.returnPct, { digits: 2, sign: true }) : money(stats.netPnL, true)) : '—'}
        tone={populated ? toneOf(stats.netPnL) : undefined}
        detail={populated ? (percentage ? `${money(stats.netPnL, true)} · Basis ${money(opening)}` : `${percent(stats.returnPct, { digits: 2, sign: true })} auf ${money(opening)}`) : 'Nach erfassten Gebühren'} />
      <KpiCard label="Profitfaktor" loading={loading} value={populated ? decimal(stats.profitFactor) : '—'}
        tone={populated ? (stats.profitFactor >= 1 ? 'positive' : 'negative') : undefined}
        visual={populated && <Gauge value={stats.profitFactor} max={3} tone={stats.profitFactor >= 1 ? 'success' : 'destructive'} marker={1} />}
        detail={populated ? `${money(stats.grossProfit)} Gewinne / ${money(stats.grossLoss)} Verluste` : 'Gewinne ÷ Verluste'} />
      <KpiCard label="Trefferquote" loading={loading} value={populated ? percent(stats.winRate) : '—'}
        visual={populated && <SplitBar parts={[{ value: stats.wins, className: 'bg-success' }, { value: breakeven, className: 'bg-muted-foreground' }, { value: stats.losses, className: 'bg-destructive' }]} />}
        detail={populated ? `${stats.wins} G · ${breakeven} BE · ${stats.losses} V` : 'Positive Trades ÷ alle'} />
      <KpiCard label="Erwartungswert" loading={loading} value={populated ? rValue(stats.expectancyR) : '—'} tone={populated ? toneOf(stats.expectancyR) : undefined}
        detail={populated ? `${money(stats.expectancy, true)} je Trade · ${stats.rSampleSize} mit Risiko` : 'Ø Netto-R je Trade'} />
      <KpiCard label="Max. Rückgang" loading={loading} value={populated ? percent(stats.maxDrawdownPct) : '—'} tone={stats.maxDrawdownPct > 0 ? 'negative' : undefined}
        visual={populated && <Gauge value={stats.maxDrawdownPct} max={20} tone="destructive" />}
        detail={populated ? `${money(-stats.maxDrawdown)} vom Hoch · Recovery ${stats.recoveryFactor === null ? '—' : decimal(stats.recoveryFactor)}` : 'Vom Kontohöchststand'} />
    </div>

    {!loading && !data.error && (() => {
      const ruled = data.activeAccounts.filter(hasRules).slice(0, 3);
      if (ruled.length) return <div className="rules-grid">{ruled.map(account => <AccountRulesCard key={account.id} account={account} trades={data.allTrades} settingsPath={data.demo ? '/signup' : '/settings'} />)}</div>;
      return !data.demo && data.accounts.length ? <div className="rules-grid"><RulesPrompt /></div> : null;
    })()}

    {!loading && !data.error && !trades.length && <div className="journal-empty mb-8"><h3>Platz für deinen nächsten Trade.</h3><p>In diesem Zeitraum gibt es noch keine Einträge. Erfasse einen Trade oder wähle einen anderen Zeitraum.</p><Button asChild variant="outline"><Link to={prefix + '/trades'}>Zum Trade-Journal<ArrowUpRight /></Link></Button></div>}

    <div className="cockpit-grid">
      <Panel className="capital-panel" eyebrow="01 · Kapitalverlauf" title={percentage ? percent(stats.returnPct, { digits: 2, sign: true }) : money(mode === 'balance' ? stats.endingBalance : stats.netPnL)}
        action={percentage ? <span className="text-xs text-muted-foreground">Rendite seit Zeitraumstart</span> : <div role="group" aria-label="Darstellung" className="period-switch">{[['balance', 'Kontostand'], ['pnl', 'Netto-P&L']].map(([key, label]) => <button key={key} onClick={() => setMode(key)} aria-pressed={mode === key}>{label}</button>)}</div>}>
        <PerformanceChart series={series} mode={percentage ? 'return' : mode} height={300} />
        <p className="mt-3 text-xs text-muted-foreground">Realisiert, nach Gebühren · Start {money(opening)} · {stats.totalTrades} Trades · Offene Positionen nicht enthalten</p>
      </Panel>

      <Panel className="discipline-panel" eyebrow="02 · Prozess" title="Disziplin-Score" action={<ShieldCheck size={18} className="text-primary" />}>
        <div className="space-y-4">
          <DisciplineRow label="Reviews abgeschlossen" value={discipline.reviewRate} detail={`${discipline.completed} von ${stats.totalTrades} Trades`} />
          <DisciplineRow label="Setup-Regeltreue" helpKey="adherence" value={discipline.setupAdherence} detail={`${discipline.setupRated} bewertete Reviews`} />
          <DisciplineRow label="Risiko-Regeltreue" helpKey="adherence" value={discipline.riskAdherence} detail={`${discipline.riskRated} bewertete Reviews`} />
          <DisciplineRow label="Anteil A-Setups" helpKey="grade" value={discipline.aShare} detail={discipline.graded ? `${discipline.graded} Trades mit Note` : 'Noch keine Setup-Noten erfasst'} />
        </div>
        <Link to={prefix + '/missed'} className="missed-teaser">
          <EyeOff size={16} className="shrink-0 text-warning" />
          <span className="min-w-0 flex-1"><strong className="block text-sm">{missed.total} nicht genommene Setups</strong><span className="text-xs text-muted-foreground">{missed.missed} verpasst · {missed.valid} bewusst ausgelassen{missed.opportunityCount ? ` · ${rValue(missed.opportunityR)} liegengelassen` : ''}</span></span>
          <ArrowUpRight size={15} className="text-muted-foreground" />
        </Link>
        <Button asChild variant="outline" className="mt-3 w-full"><Link to={prefix + '/review'}>Review öffnen<ArrowUpRight /></Link></Button>
      </Panel>
    </div>

    <section className="journal-section">
      <SectionTitle number="03" title="Kennzahlen auf einen Blick" />
      <StatGrid columns={5} items={[
        { label: 'Ø Gewinn', value: stats.wins ? money(stats.avgWin) : '—', detail: stats.avgWinR !== null && stats.wins ? rValue(stats.avgWinR) : null, tone: stats.wins ? 'positive' : undefined },
        { label: 'Ø Verlust', value: stats.losses ? money(stats.avgLoss) : '—', detail: stats.avgLossR !== null && stats.losses ? rValue(stats.avgLossR) : null, tone: stats.losses ? 'negative' : undefined },
        { label: 'Gewinn-Verlust-Verhältnis', value: populated ? decimal(stats.payoffRatio) : '—', detail: 'Ø Gewinn ÷ Ø Verlust' },
        { label: 'Gesamt-R', value: stats.rSampleSize ? rValue(stats.totalR) : '—', tone: toneOf(stats.totalR), detail: `${stats.rSampleSize} Trades mit Risiko` },
        { label: 'SQN', value: stats.sqn === null ? '—' : decimal(stats.sqn), detail: stats.sqn === null ? 'Mind. 2 R-Werte' : stats.sqn >= 3 ? 'Sehr gut' : stats.sqn >= 2 ? 'Gut' : stats.sqn >= 1.6 ? 'Durchschnitt' : 'Schwach' },
        { label: 'Größter Gewinn', value: populated ? money(stats.bestTrade, true) : '—', tone: toneOf(stats.bestTrade) },
        { label: 'Größter Verlust', value: populated ? money(stats.worstTrade, true) : '—', tone: toneOf(stats.worstTrade) },
        { label: 'Aktuelle Serie', helpKey: stats.currentStreakType === 'loss' ? 'lossStreak' : 'winStreak', value: streak, detail: `Rekord: ${stats.longestWinStreak} G / ${stats.longestLossStreak} V` },
        { label: 'Handelstage', value: stats.tradingDays || '—', detail: stats.tradingDays ? `Ø ${decimal(stats.avgTradesPerDay, 1)} Trades pro Tag` : null },
        { label: 'Erfasste Kosten', value: money(stats.totalFees), detail: stats.grossProfit ? `${percent(stats.totalFees / (stats.grossProfit + stats.totalFees) * 100)} der Bruttogewinne` : null },
      ]} />
    </section>

    <div className="dashboard-detail-grid">
      <section className="journal-section dashboard-calendar"><SectionTitle number="04" title={data.range === 'month' ? 'Handelskalender' : 'Deine Handelstage'}>{data.range === 'month' && <span className="text-xs text-muted-foreground">{data.month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span>}</SectionTitle>
        {data.range === 'month' ? <div className="calendar-grid calendar-with-weeks">{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Woche'].map(d => <div key={d} className="pb-2 text-center text-xs text-muted-foreground">{d}</div>)}
          {weeks.map((week, w) => {
            const weekGroups = week.filter(Boolean).map(d => calendar.get(dayKey(d))).filter(Boolean);
            const weekNet = weekGroups.reduce((s, g) => s + g.netPnL, 0), weekTrades = weekGroups.reduce((s, g) => s + g.trades, 0);
            return <React.Fragment key={'w' + w}>
              {week.map((date, i) => {
                if (!date) return <div key={`e${w}-${i}`} />;
                const key = dayKey(date); const g = calendar.get(key);
                return <button key={key} className={'calendar-cell ' + (g ? 'has-trades ' + (g.netPnL >= 0 ? 'positive' : 'negative') : '')} aria-pressed={selectedDay === key} aria-label={`${date.getDate()}. ${first.toLocaleDateString('de-DE', { month: 'long' })}: ${g ? money(g.netPnL) + ', ' + g.trades + ' Trades' : 'keine Trades'}`} onClick={() => setSelectedDay(selectedDay === key ? null : key)}><span>{date.getDate()}</span>{g && <><strong className={g.netPnL >= 0 ? 'text-success' : 'text-destructive'}>{shortMoney(g.netPnL)}</strong><small className="text-muted-foreground" title={`${g.trades} Trades, Trefferquote ${percent(g.winRate, { digits: 0 })}`}>{g.trades} T · {percent(g.winRate, { digits: 0 })}</small></>}</button>;
              })}
              <div className={'calendar-week ' + (weekTrades ? (weekNet >= 0 ? 'positive' : 'negative') : '')}><span>KW {getISOWeek(week.find(Boolean))}</span>{weekTrades ? <><strong className={weekNet >= 0 ? 'text-success' : 'text-destructive'}>{money(Math.round(weekNet), true).replace(',00', '')}</strong><small>{weekTrades} Trades</small></> : <small>—</small>}</div>
            </React.Fragment>;
          })}</div>
          : <div className="max-h-80 overflow-y-auto">{dayGroups.slice().sort((a, b) => b.key.localeCompare(a.key)).map(g => <button key={g.key} className="flex w-full items-center justify-between gap-3 border-b py-3 text-sm hover:bg-secondary" aria-pressed={selectedDay === g.key} onClick={() => setSelectedDay(selectedDay === g.key ? null : g.key)}><span>{new Date(g.key + 'T12:00:00').toLocaleDateString('de-DE')}<small className="block text-left text-muted-foreground">{g.trades} Trades</small></span><SignedValue value={g.netPnL} /></button>)}</div>}
        <p className="mt-4 text-xs text-muted-foreground">Tagesergebnisse nach Gebühren · {dayGroups.length} Handelstage · {dayGroups.filter(g => g.netPnL > 0).length} grüne, {dayGroups.filter(g => g.netPnL < 0).length} rote Tage</p>
      </section>
      <section className="journal-section dashboard-trades">
        <SectionTitle number="05" title={selectedDay ? 'Trades vom ' + new Date(selectedDay + 'T12:00:00').toLocaleDateString('de-DE') : 'Letzte Trades'}>{selectedDay ? <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>Auswahl aufheben</Button> : <Link className="text-xs text-primary flex items-center gap-1" to={prefix + '/trades'}>Alle Trades<ArrowUpRight size={14} /></Link>}</SectionTitle>
        <div className="journal-table-wrap"><table className="journal-table"><thead><tr><th>Trade</th><th>Netto</th><th className="hidden sm:table-cell">Netto-R</th><th>Review</th></tr></thead><tbody>{visibleRows.map(r => <tr key={r.trade.id}><td><strong className="flex items-center gap-2">{r.symbol}{sideLabel(r.trade.side) !== '—' && <span className={'side-badge ' + sideLabel(r.trade.side).toLowerCase()}>{sideLabel(r.trade.side)}</span>}{r.trade.grade && <span className={'grade-badge grade-' + r.trade.grade}>{r.trade.grade}</span>}</strong><span className="sub">{r.date?.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} · {r.trade.entryTime} · {r.trade.setup || 'Ohne Setup'}</span></td><td><SignedValue value={r.netProfit} /></td><td className="hidden sm:table-cell font-mono">{rValue(r.netR)}</td><td><Link to={prefix + '/review?trade=' + r.trade.id} className={reviewStatus(r.trade) === 'completed' ? 'text-xs text-muted-foreground' : 'review-pending'}>{reviewStatusLabels[reviewStatus(r.trade)]}<span className="sr-only"> für {r.symbol}</span></Link></td></tr>)}</tbody></table></div>
        {!visibleRows.length && <p className="py-6 text-sm text-muted-foreground">Keine Trades in dieser Auswahl.</p>}
      </section>
    </div>
  </div>;
}
