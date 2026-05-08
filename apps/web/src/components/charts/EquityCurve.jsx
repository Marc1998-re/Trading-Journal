import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { buildEquitySeries } from '@/lib/tradeCalculations.js';

const CustomTooltip = ({ active, payload, label, startingBalance }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const safeStartingBalance = Math.max(startingBalance, 0.01); // Prevent division by zero
    const pct = ((val / safeStartingBalance) * 100).toFixed(2);
    const sign = val >= 0 ? '+' : '';
    const colorClass = val >= 0 ? 'text-success' : 'text-destructive';
    const formattedValue = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(val);

    return (
      <div className="min-w-[180px] rounded-md border border-white/10 bg-card p-3 shadow-lg">
        <p className="mb-1 text-sm text-muted-foreground">{label}</p>
        <p className={`font-bold text-lg ${colorClass}`}>
          {formattedValue} <span className="text-sm font-medium opacity-80">({sign}{pct}%)</span>
        </p>
      </div>
    );
  }
  return null;
};

const EquityCurve = ({ trades, startingBalance = 10000, originalBalances = {}, currentBalances = {} }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="flex h-[330px] items-center justify-center text-muted-foreground">
        No trade data available
      </div>
    );
  }

  const chartData = buildEquitySeries(trades, startingBalance, originalBalances, currentBalances)
    .filter((point) => point.tradeCount > 0)
    .map((point) => ({
      date: point.label,
      cumulativePL: point.cumulativePnL,
    }));

  // Calculate gradient offset for split color (green for positive, red for negative)
  const dataMax = Math.max(...chartData.map((i) => i.cumulativePL), 0);
  const dataMin = Math.min(...chartData.map((i) => i.cumulativePL), 0);
  
  const gradientOffset = () => {
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  return (
    <ResponsiveContainer width="100%" height={330}>
      <AreaChart data={chartData} margin={{ top: 14, right: 14, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="hsl(var(--success))" stopOpacity={0.28} />
            <stop offset={off} stopColor="hsl(var(--destructive))" stopOpacity={0.28} />
          </linearGradient>
          <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="hsl(var(--success))" stopOpacity={1} />
            <stop offset={off} stopColor="hsl(var(--destructive))" stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} tickMargin={10} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 12 }}
          tickFormatter={(val) => `€${val.toLocaleString()}`}
          width={72}
        />
        <Tooltip content={<CustomTooltip startingBalance={startingBalance} />} />
        <Area
          type="monotone"
          dataKey="cumulativePL"
          stroke="url(#splitStroke)"
          strokeWidth={3}
          fill="url(#splitColor)"
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))', fill: 'hsl(var(--primary))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EquityCurve;
