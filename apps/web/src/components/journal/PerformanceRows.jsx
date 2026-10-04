import React from 'react';
import { money, percent, rValue } from '@/lib/format';

export default function PerformanceRows({groups,empty='Noch keine abgeschlossenen Trades.'}) {
  const max=Math.max(...groups.map(g=>Math.abs(g.netPnL)),1);
  if(!groups.length)return <p className="py-8 text-sm text-muted-foreground">{empty}</p>;
  return <div className="performance-rows">{groups.map(g=><div key={g.key} className="performance-row"><div className="min-w-0"><strong>{g.label}</strong><span>{g.trades} Trades · {percent(g.winRate)} positiv</span></div><div className="diverging-track" aria-hidden="true"><i/><b className={g.netPnL<0?'negative':''} style={{width:`${Math.abs(g.netPnL)/max*50}%`,left:g.netPnL<0?`${50-Math.abs(g.netPnL)/max*50}%`:'50%'}}/></div><div className="text-right min-w-0"><strong className={g.netPnL<0?'text-destructive':'text-success'}>{money(g.netPnL,true)}</strong><span>{rValue(g.avgR)} / Trade</span></div></div>)}</div>;
}
