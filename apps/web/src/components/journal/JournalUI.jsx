import React from 'react';
import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { money, percent, rValue, decimal } from '@/lib/format';
import MetricHelp from './MetricHelp';
import { metricHelpKeys } from '@/lib/metricHelp';
export { default as PeriodToolbar } from './PeriodToolbar';

export function IconButton({label,children,...props}) {
  return <TooltipProvider delayDuration={250}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={label} {...props}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip></TooltipProvider>;
}
export function PerformanceUnitSwitch({unit,onChange}) {
  return <div className="period-switch" role="group" aria-label="Einheit für Netto-Ergebnis und Kapitalverlauf">
    {[['money','€','Beträge in Euro'],['percent','%','Rendite in Prozent']].map(([value,symbol,label]) => <button type="button" key={value} className="min-w-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" aria-label={label} title={label} aria-pressed={unit===value} onClick={()=>onChange(value)}>{symbol}</button>)}
  </div>;
}
export function PageHeading({eyebrow,title,children,action}) {
  return <div className="journal-heading"><div><p className="text-xs font-medium text-primary mb-2">{eyebrow}</p><h1>{title}</h1>{children&&<p className="mt-2 text-sm text-muted-foreground">{children}</p>}</div>{action}</div>;
}
export function SectionTitle({number,title,children,helpKey}) {
  return <div className="section-heading"><div className="flex min-w-0 items-center gap-1"><h2><span>{number}</span>{title}</h2>{helpKey&&<MetricHelp helpKey={helpKey} label={title}/>}</div>{children}</div>;
}
export function Metric({label,value,detail,tone,helpKey=metricHelpKeys[label]}) {
  return <div className="journal-metric"><div className="flex min-h-8 items-center gap-1.5 text-xs text-muted-foreground">{label}{helpKey&&<MetricHelp helpKey={helpKey} label={label}/>}</div><div className={`metric-number ${tone==='positive'?'text-success':tone==='negative'?'text-destructive':''}`}>{value}</div><p className="text-xs text-muted-foreground mt-2">{detail}</p></div>;
}
export function MetricStrip({stats,loading=false,unit='money',opening}) {
  const populated=stats.totalTrades>0;
  const percentage=unit==='percent';
  const result=percentage?percent(stats.returnPct,{digits:2,sign:true}):money(stats.netPnL,true);
  return <div className="metric-strip" aria-busy={loading}>
    <Metric label="Netto-Ergebnis" value={loading?'…':populated?result:'—'} detail={percentage?(stats.returnPct===null?'Kein positives Startkapital':`Basis: ${money(opening)} zum Zeitraumstart`):'Nach erfassten Gebühren'} tone={populated&&(!percentage||stats.returnPct!==null)?stats.netPnL>=0?'positive':'negative':undefined} helpKey={percentage?'returnPct':'netPnl'}/>
    <Metric label="Erwartungswert" value={loading?'…':populated?rValue(stats.expectancyR):'—'} detail={`${stats.rSampleSize||0} Trades mit Risikobasis`}/>
    <Metric label="Trefferquote" value={loading?'…':populated?percent(stats.winRate):'—'} detail={`${stats.wins} von ${stats.totalTrades} Trades positiv`}/>
    <Metric label="Max. Rückgang" value={loading?'…':populated?percent(stats.maxDrawdownPct):'—'} detail="Vom Kontohöchststand im Zeitraum" tone={stats.maxDrawdownPct>0?'negative':undefined}/>
  </div>;
}
export function DataState({data}) {
  if(data.error)return <div role="alert" className="data-state border-destructive/30"><p>{data.error}</p><Button variant="outline" onClick={data.refresh}>Erneut versuchen</Button></div>;
  if(data.loading)return <div role="status" className="data-state"><RefreshCw className="animate-spin" size={18}/>Trades werden geladen…</div>;
  return null;
}
export function SignedValue({value,unit='money'}) {
  return <span className={`inline-flex items-center gap-1.5 font-mono ${value>0?'text-success':value<0?'text-destructive':'text-muted-foreground'}`}>{value>0?<ArrowUpRight size={14}/>:value<0?<ArrowDownRight size={14}/>:null}{unit==='money'?money(value,true):unit==='r'?rValue(value):decimal(value)}</span>;
}
