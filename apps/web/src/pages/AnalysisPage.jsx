import React from 'react';
import { Helmet } from 'react-helmet';
import { useJournalData } from '@/hooks/useJournalData';
import { usePerformanceUnit } from '@/hooks/usePerformanceUnit';
import { buildSymbolPerformance, buildSetupPerformance, buildWeekdayPerformance } from '@/lib/tradeCalculations';
import { PageHeading, PeriodToolbar, PerformanceUnitSwitch, MetricStrip, Metric, SectionTitle, DataState } from '@/components/journal/JournalUI';
import PerformanceRows from '@/components/journal/PerformanceRows';
import MetricHelp from '@/components/journal/MetricHelp';
import RiskAnalysis from '@/components/journal/RiskAnalysis';
import { decimal, money, percent, rValue } from '@/lib/format';

export default function AnalysisPage() {
  const data=useJournalData(),{stats,trades,balances}=data;
  const [unit,setUnit]=usePerformanceUnit();
  const symbols=buildSymbolPerformance(trades,balances,balances),setups=buildSetupPerformance(trades,balances,balances),weekdays=buildWeekdayPerformance(trades,balances,balances);
  return <div className="journal-page"><Helmet><title>Analyse · The Trading Desk</title></Helmet><PageHeading eyebrow="Deinen Vorteil verstehen." title="Analyse">Vergleiche Ergebnisse nach Setup, Symbol und Wochentag.</PageHeading><PeriodToolbar data={data}><PerformanceUnitSwitch unit={unit} onChange={setUnit}/></PeriodToolbar><DataState data={data}/><MetricStrip stats={stats} loading={data.loading} unit={unit} opening={data.opening}/>
    {!data.loading && !data.error && <RiskAnalysis trades={trades} balances={balances}/>}
    <div className="grid min-w-0 gap-10 xl:grid-cols-2"><section><SectionTitle number="04" title="Welche Märkte tragen dein Ergebnis?" helpKey="ranking"/><PerformanceRows groups={symbols}/></section><section><SectionTitle number="05" title="Welche Setups haben bisher funktioniert?" helpKey="ranking"/><PerformanceRows groups={setups}/></section></div>
    <section className="journal-section"><SectionTitle number="06" title="Qualität statt nur Trefferquote"/><div className="grid grid-cols-2 xl:grid-cols-4"><Metric label="Profitfaktor" value={stats.totalTrades?decimal(stats.profitFactor):'—'} detail="Nettogewinne / Nettoverluste"/><Metric label="Gewinn-Verlust-Verhältnis" value={stats.totalTrades?decimal(stats.payoffRatio):'—'} detail="Ø Gewinn / Betrag Ø Verlust"/><Metric label="Erwartungswert in EUR" value={stats.totalTrades?money(stats.expectancy):'—'} detail="Netto-Ergebnis / Abschlüsse"/><Metric label="Erfasste Kosten" value={money(stats.totalFees)} detail="Gebühren + Gewinnbeteiligung"/></div>
      <div className="grid grid-cols-2 xl:grid-cols-4 border-t"><Metric label="Ø Gewinn" value={stats.wins?money(stats.avgWin):'—'} detail={stats.wins+' Gewinn-Trades'}/><Metric label="Ø Verlust" value={stats.losses?money(stats.avgLoss):'—'} detail={stats.losses+' Verlust-Trades'}/><Metric label="Längste Gewinnserie" value={stats.longestWinStreak} detail="Break-even unterbricht die Serie"/><Metric label="Längste Verlustserie" value={stats.longestLossStreak} detail="Chronologisch nach Einstiegszeit"/></div>
    </section>
    <div className="grid min-w-0 gap-10 xl:grid-cols-2 journal-section">
      <section><SectionTitle number="07" title="Wochentage im Vergleich" helpKey="ranking"/><PerformanceRows groups={weekdays}/></section>
      <section>
        <SectionTitle number="08" title="Wie belastbar ist die Auswertung?"/>
        <div className="border-l-2 border-info pl-5 space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">{stats.totalTrades} abgeschlossene Trades. Auch größere Stichproben garantieren keine künftigen Ergebnisse. Prüfe, ob Zeitraum, Märkte und Setups vergleichbar sind.</p>
          {stats.confidence && <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><p>Trefferquote: 95-%-Wilson-Intervall</p><MetricHelp helpKey="wilson"/></div>
            <p className="text-xl mt-2">{percent(stats.confidence.lower)} bis {percent(stats.confidence.upper)}</p>
            <p className="text-xs text-muted-foreground mt-2">Unter Annahme unabhängiger, vergleichbarer Trades. Abhängige Trades können die Unsicherheit erhöhen. Dieses Intervall gilt nicht für den R-Erwartungswert.</p>
          </div>}
          <dl className="text-sm space-y-3">
            <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1 text-muted-foreground">Netto-R gesamt, alle Risikobasen<MetricHelp helpKey="totalR"/></dt><dd className="shrink-0">{stats.rSampleSize ? rValue(stats.totalR) : '—'}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1 text-muted-foreground">Trades mit Risikobasis<MetricHelp helpKey="totalCoverage"/></dt><dd className="shrink-0">{stats.rSampleSize || 0} / {stats.totalTrades}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1 text-muted-foreground">Ø verfügbares Geldrisiko<MetricHelp helpKey="meanRisk"/></dt><dd className="shrink-0">{money(stats.avgStopLossAmount)}</dd></div>
          </dl>
          <p className="text-xs leading-5 text-muted-foreground">Das mittlere Geldrisiko umfasst {stats.riskSampleSize || 0} verfügbare Werte einschließlich Rekonstruktionen und Schätzungen. Fehlende Werte werden nicht als null gewertet.</p>
        </div>
      </section>
    </div>
  </div>;
}
