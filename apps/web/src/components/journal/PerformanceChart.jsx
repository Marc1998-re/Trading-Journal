import React from 'react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, AreaChart, Area } from 'recharts';
import { shortMoney, money, percent } from '@/lib/format';

export default function PerformanceChart({series,mode='balance',height=260}) {
  const drawdown=mode==='drawdown';
  const returns=mode==='return';
  const key=drawdown?'drawdownPct':returns?'returnPct':mode==='pnl'?'cumulativePnL':'balance';
  const color=drawdown?'hsl(var(--destructive))':'hsl(var(--primary))';
  const Chart=AreaChart;
  if(returns&&!series.some(point=>Number.isFinite(point.returnPct))) return <div className="performance-chart flex items-center justify-center text-center text-sm text-muted-foreground px-6" style={{height}} role="status">Für die Prozentansicht ist ein positives Startkapital nötig.</div>;
  return <div className="performance-chart" style={{height}} role="img" aria-label={drawdown?'Verlauf des realisierten Rückgangs':returns?'Realisierte Rendite seit Zeitraumstart in Prozent':'Realisierter Kontoverlauf nach jedem Trade'}><ResponsiveContainer width="100%" height="100%"><Chart data={series} margin={{top:18,right:16,left:0,bottom:4}}>
    <CartesianGrid vertical={true} stroke="hsl(var(--border))" strokeOpacity={0.6} strokeDasharray="2 6"/>
    <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={48} tick={{fill:'hsl(var(--muted-foreground))',fontSize:11}} dy={10}/>
    <YAxis axisLine={false} tickLine={false} width={66} domain={drawdown?[0,'auto']:['auto','auto']} tickFormatter={drawdown||returns?v=>percent(v,{sign:returns}):shortMoney} tick={{fill:'hsl(var(--muted-foreground))',fontSize:11}} tickCount={4}/>
    <Tooltip content={({active,payload})=>active&&payload?.length?<div className="chart-tooltip"><span>{payload[0].payload.label} · {payload[0].payload.tradeCount} Trades</span><strong>{drawdown?percent(payload[0].value):returns?percent(payload[0].value,{digits:2,sign:true}):money(payload[0].value)}</strong></div>:null}/>
    {(mode==='pnl'||returns)&&<ReferenceLine y={0} stroke="hsl(var(--muted-foreground))"/>}
    <Area dataKey={key} type="stepAfter" dot={false} activeDot={{r:4,stroke:'hsl(var(--background))',strokeWidth:2}} stroke={color} fill={color} fillOpacity={drawdown?0.09:0.06} baseValue={drawdown||returns?0:'dataMin'} strokeWidth={2} isAnimationActive={false}/>
  </Chart></ResponsiveContainer></div>;
}
