import React from 'react';
import { Helmet } from 'react-helmet';
import { useJournalData } from '@/hooks/useJournalData';
import { usePerformanceUnit } from '@/hooks/usePerformanceUnit';
import { buildEquitySeries, buildWeekdayPerformance, getTradeDate, calculateNetPnL } from '@/lib/tradeCalculations';
import { PageHeading, PeriodToolbar, PerformanceUnitSwitch, SectionTitle, DataState } from '@/components/journal/JournalUI';
import PerformanceChart from '@/components/journal/PerformanceChart';
import PerformanceRows from '@/components/journal/PerformanceRows';
import { money, percent } from '@/lib/format';

export default function ChartsPage() {
  const data=useJournalData(),{stats,trades,balances,opening}=data;
  const [unit,setUnit]=usePerformanceUnit();
  const percentage=unit==='percent';
  const series=buildEquitySeries(trades,opening,balances,balances);
  return <div className="journal-page"><Helmet><title>Verläufe · The Trading Desk</title></Helmet><PageHeading eyebrow="Dein Ergebnis im Zeitverlauf." title="Verläufe">Hochpunkte, Rückgänge und wiederkehrende Muster.</PageHeading><PeriodToolbar data={data}><PerformanceUnitSwitch unit={unit} onChange={setUnit}/></PeriodToolbar><DataState data={data}/>
    <section className="journal-section pt-0"><SectionTitle number="01" title={percentage?'Rendite seit Zeitraumstart':'Realisierter Kontostand'} helpKey={percentage?'returnPct':'balance'}><span className="text-xl font-medium">{percentage?percent(stats.returnPct,{digits:2,sign:true}):money(stats.endingBalance)}</span></SectionTitle><PerformanceChart series={series} mode={percentage?'return':'balance'} height={300}/><p className="text-xs text-muted-foreground mt-3">{percentage?`Basis: ${money(opening)} zum Zeitraumstart. Nach erfassten Gebühren. Nicht erfasste Ein- und Auszahlungen bleiben unberücksichtigt. `:'Die Stufen zeigen erfasste Ergebnisse, geordnet nach Einstieg. '}Offene Gewinne und Verluste sind nicht enthalten.</p></section>
    <section className="journal-section"><SectionTitle number="02" title="Abstand zum vorherigen Hoch" helpKey="drawdown"><span className="text-sm text-destructive">Max. {percent(stats.maxDrawdownPct)}</span></SectionTitle><PerformanceChart series={series} mode="drawdown" height={200}/></section>
    <div className="grid min-w-0 gap-10 xl:grid-cols-2 journal-section"><section><SectionTitle number="03" title="Wochentage"/><PerformanceRows groups={buildWeekdayPerformance(trades,balances,balances)}/></section><section><SectionTitle number="04" title={'Handelsjahr '+data.month.getFullYear()}/><div className="year-grid grid grid-cols-3 gap-px bg-border border">{Array.from({length:12},(_,m)=>{const monthTrades=data.allTrades.filter(t=>{const d=getTradeDate(t);return d&&d.getFullYear()===data.month.getFullYear()&&d.getMonth()===m;});const pnl=calculateNetPnL(monthTrades,balances,balances);return <button key={m} aria-pressed={data.range==='month'&&data.month.getMonth()===m} className="min-w-0 bg-background p-4 text-left hover:bg-secondary" onClick={()=>data.setPeriod({month:new Date(data.month.getFullYear(),m,1),range:'month'})} aria-label={new Date(2026,m,1).toLocaleDateString('de-DE',{month:'long'})+' auswählen'}><span className="text-xs text-muted-foreground">{new Date(2026,m,1).toLocaleDateString('de-DE',{month:'short'})}</span><strong className={'block text-xs mt-3 break-words '+(monthTrades.length?(pnl>=0?'text-success':'text-destructive'):'text-muted-foreground')}>{monthTrades.length?money(pnl,true):'—'}</strong><span className="block text-xs mt-1 text-muted-foreground">{monthTrades.length} Trades</span></button>;})}</div></section></div>
  </div>;
}
