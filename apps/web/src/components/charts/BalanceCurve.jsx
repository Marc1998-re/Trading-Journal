import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { buildEquitySeries } from '@/lib/tradeCalculations.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;

    return (
      <div className="min-w-[180px] rounded-md border border-white/10 bg-card p-3 shadow-lg">
        <p className="mb-1 text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-primary">
          €{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }

  return null;
};

const BalanceCurve = ({ trades, startingBalance = 10000, originalBalances = {}, currentBalances = {} }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="flex h-[330px] items-center justify-center text-muted-foreground">
        No trade data available
      </div>
    );
  }

  const chartData = buildEquitySeries(trades, startingBalance, originalBalances, currentBalances)
    .map((point) => ({
      date: point.label,
      balance: point.balance,
    }));

  // Determine domain to make chart look good even with small changes
  const minBalance = Math.min(...chartData.map(d => d.balance));
  const maxBalance = Math.max(...chartData.map(d => d.balance));
  const padding = (maxBalance - minBalance) * 0.1 || startingBalance * 0.05;

  return (
    <ResponsiveContainer width="100%" height={330}>
      <AreaChart data={chartData} margin={{ top: 14, right: 14, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} tickMargin={10} />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          tick={{ fontSize: 12 }} 
          domain={[Math.max(0, minBalance - padding), maxBalance + padding]}
          tickFormatter={(val) => `€${val.toLocaleString()}`}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          fill="url(#colorBalance)"
          activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default BalanceCurve;
