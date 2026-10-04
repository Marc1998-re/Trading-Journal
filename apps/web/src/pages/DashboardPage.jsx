import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowUpRight, Plus, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJournalData } from '@/hooks/useJournalData';
import { usePerformanceUnit } from '@/hooks/usePerformanceUnit';
import { buildEquitySeries, buildProcessedTrades, buildDayPerformance, dayKey } from '@/lib/tradeCalculations';
import { money, shortMoney, percent, rValue } from '@/lib/format';
import { PageHeading, PeriodToolbar, PerformanceUnitSwitch, MetricStrip, SectionTitle, DataState, SignedValue } from '@/components/journal/JournalUI';
import PerformanceChart from '@/components/journal/PerformanceChart';
import { reviewStatus, reviewStatusLabels, summarizeReviews } from '@/lib/review';

export default function DashboardPage() {
  const data=useJournalData();
  const {stats,balances,opening,trades}=data;
  const [unit,setUnit]=usePerformanceUnit();
  const percentage=unit==='percent';
  const [mode,setMode]=useState('balance');
  const [selectedDay,setSelectedDay]=useState(null);
  useEffect(()=>setSelectedDay(null),[data.month,data.range,data.anchor,data.from,data.to]);
  const rows=useMemo(()=>buildProcessedTrades(trades,balances,balances).reverse(),[trades,balances]);
  const series=useMemo(()=>buildEquitySeries(trades,opening,balances,balances),[trades,opening,balances]);
  const prefix=data.demo?'/demo':'';
  const dayGroups=buildDayPerformance(trades,balances,balances);
  const calendar=new Map(dayGroups.map(g=>[g.key,g]));
  const first=new Date(data.month.getFullYear(),data.month.getMonth(),1);
  const offset=(first.getDay()+6)%7;
  const days=new Date(data.month.getFullYear(),data.month.getMonth()+1,0).getDate();
  const visibleRows=selectedDay?rows.filter(r=>r.date&&dayKey(r.date)===selectedDay):rows.slice(0,5);
  const missing=stats.totalTrades-summarizeReviews(trades).completed;
  return <div className="journal-page">
    <Helmet><title>Übersicht · The Trading Desk</title></Helmet>
    <PageHeading eyebrow="Performance / Zeitraum" title="Übersicht" action={<Button asChild><Link to={prefix+'/trades'}><Plus/>Trade erfassen</Link></Button>}>Ergebnis, Risiko und die nächste gute Frage.</PageHeading>
    <PeriodToolbar data={data}><PerformanceUnitSwitch unit={unit} onChange={setUnit}/></PeriodToolbar>
    <DataState data={data}/><MetricStrip stats={stats} loading={data.loading} unit={unit} opening={opening}/>
    {!data.loading&&!data.error&&!trades.length&&<div className="journal-empty mb-8"><h3>Platz für deinen nächsten Trade.</h3><p>In diesem Zeitraum gibt es noch keine Einträge. Erfasse einen Trade oder wähle einen anderen Monat.</p><Button asChild variant="outline"><Link to={prefix+'/trades'}>Zum Trade-Journal<ArrowUpRight/></Link></Button></div>}
    <div className="journal-columns">
      <section className="capital-section min-w-0"><SectionTitle number="01" title="Kapitalverlauf" helpKey={percentage?'returnPct':mode==='balance'?'balance':'netPnl'}>{percentage?<span className="text-xs text-muted-foreground">Rendite seit Zeitraumstart</span>:<div role="group" aria-label="Darstellung" className="period-switch">{[['balance','Kontostand'],['pnl','Netto-P&L']].map(([key,label])=><button key={key} onClick={()=>setMode(key)} aria-pressed={mode===key}>{label}</button>)}</div>}</SectionTitle>
        <div className="capital-readout"><strong>{percentage?percent(stats.returnPct,{digits:2,sign:true}):money(mode==='balance'?stats.endingBalance:stats.netPnL)}</strong><span className="text-xs text-muted-foreground">realisiert · nach Gebühren</span></div>
        <PerformanceChart series={series} mode={percentage?'return':mode} height={290}/><div className="outcome-strip">{[[stats.wins,"Gewinne","text-success"],[stats.losses,"Verluste","text-destructive"],[stats.totalTrades-stats.wins-stats.losses,"Break-even","text-muted-foreground"]].map(([count,label,tone])=><div key={label}><span>{label}</span><strong className={tone}>{count}<small className="ml-2 text-xs text-muted-foreground">{percent(stats.totalTrades?count/stats.totalTrades*100:0)}</small></strong></div>)}</div><div className="outcome-bar" aria-hidden="true">{[[stats.wins,"bg-success"],[stats.losses,"bg-destructive"],[stats.totalTrades-stats.wins-stats.losses,"bg-muted-foreground"]].map(([count,tone],i)=><i key={i} className={tone} style={{width:`${stats.totalTrades?count/stats.totalTrades*100:0}%`}}/>)}</div><p className="text-xs text-muted-foreground mt-4">Start im Zeitraum: {money(opening)} · {stats.totalTrades} Trades · Offene Positionen nicht enthalten{percentage&&' · Nicht erfasste Ein- und Auszahlungen bleiben unberücksichtigt'}</p>
      </section>
      <aside className="review-focus"><div className="flex items-center justify-between"><span className="text-xs text-primary">Dein Review-Fokus</span><NotebookPen className="text-primary" size={17}/></div><h3>Die Session endet.<br/>Dein Review beginnt.</h3><div className="focus-readout"><span className="focus-number">{String(missing).padStart(2,'0')}</span><p className="mt-1">Reviews noch nicht abgeschlossen</p></div><p>{stats.totalTrades<30?'Kleine Stichprobe: Betrachte Muster zunächst als Fragen, nicht als bestätigten Vorteil.':'Vergleiche deine Setups mit ihrer Stichprobengröße. Einzelne Ausreißer können das Gesamtbild verändern.'}</p><Button asChild variant="outline" className="mt-5 w-full"><Link to={prefix+'/review'}>Review öffnen<ArrowUpRight/></Link></Button></aside>
    </div>
    <div className="dashboard-detail-grid">
    <section className="journal-section dashboard-calendar"><SectionTitle number="02" title={data.range==='month'?'Dein Handelsmonat':'Deine Handelstage'}>{data.range==='month'&&<span className="text-xs text-muted-foreground">{data.month.toLocaleDateString('de-DE',{month:'long',year:'numeric'})}</span>}</SectionTitle>
      {data.range==='month'?<div className="calendar-grid">{['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=><div key={d} className="pb-2 text-center text-xs text-muted-foreground">{d}</div>)}
      {Array.from({length:offset},(_,i)=><div key={'empty-'+i}/>)}{Array.from({length:days},(_,i)=>{const key=dayKey(new Date(first.getFullYear(),first.getMonth(),i+1));const g=calendar.get(key);return <button key={key} className={'calendar-cell '+(g?'has-trades '+(g.netPnL>=0?'positive':'negative'):'')} aria-pressed={selectedDay===key} aria-label={`${i+1}. ${first.toLocaleDateString('de-DE',{month:'long'})}: ${g?money(g.netPnL)+', '+g.trades+' Trades':'keine Trades'}`} onClick={()=>setSelectedDay(selectedDay===key?null:key)}><span>{i+1}</span>{g&&<><strong className={g.netPnL>=0?'text-success':'text-destructive'}>{shortMoney(g.netPnL)}</strong><small className="text-muted-foreground">{g.trades} Trades</small></>}</button>;})}</div>:<div className="max-h-80 overflow-y-auto">{dayGroups.slice().sort((a, b) => b.key.localeCompare(a.key)).map(g=><button key={g.key} className="flex w-full items-center justify-between gap-3 border-b py-3 text-sm hover:bg-secondary" aria-pressed={selectedDay===g.key} onClick={()=>setSelectedDay(selectedDay===g.key?null:g.key)}><span>{new Date(g.key+'T12:00:00').toLocaleDateString('de-DE')}<small className="block text-left text-muted-foreground">{g.trades} Trades</small></span><SignedValue value={g.netPnL}/></button>)}</div>}
      <p className="mt-4 text-xs text-muted-foreground">Tagesergebnisse nach Gebühren · {dayGroups.length} Handelstage im gewählten Zeitraum · {percent(stats.totalTrades?(stats.reviewCount||0)/stats.totalTrades*100:0)} mit Notiz</p>
    </section>
    <section className="journal-section dashboard-trades">
      <SectionTitle number="03" title={selectedDay?'Trades vom '+new Date(selectedDay+'T12:00:00').toLocaleDateString('de-DE'):'Letzte Trades'}>{selectedDay?<Button variant="ghost" size="sm" onClick={()=>setSelectedDay(null)}>Auswahl aufheben</Button>:<Link className="text-xs text-primary flex items-center gap-1" to={prefix+'/trades'}>Alle Trades<ArrowUpRight size={14}/></Link>}</SectionTitle>
      <div className="journal-table-wrap"><table className="journal-table"><thead><tr><th>Trade</th><th>Netto</th><th className="hidden sm:table-cell">Netto-R</th><th>Review</th></tr></thead><tbody>{visibleRows.map(r=><tr key={r.trade.id}><td><strong>{r.symbol}</strong><span className="sub">{r.date?.toLocaleDateString('de-DE',{day:'2-digit',month:'short'})} · {r.trade.entryTime}</span></td><td><SignedValue value={r.netProfit}/></td><td className="hidden sm:table-cell font-mono">{rValue(r.netR)}</td><td><Link to={prefix+'/review?trade='+r.trade.id} className={reviewStatus(r.trade)==='completed'?'text-xs text-muted-foreground':'review-pending'}>{reviewStatusLabels[reviewStatus(r.trade)]}<span className="sr-only"> für {r.symbol}</span></Link></td></tr>)}</tbody></table></div>
      {!visibleRows.length&&<p className="py-6 text-sm text-muted-foreground">Keine Trades in dieser Auswahl.</p>}
    </section>
    </div>
  </div>;
}
