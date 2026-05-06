import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { buildEquitySeries } from '@/lib/tradeCalculations.js';

const BalanceCurve = ({ trades, startingBalance = 10000, originalBalances = {}, currentBalances = {} }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
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
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} tickMargin={10} />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          tick={{ fontSize: 12 }} 
          domain={[Math.max(0, minBalance - padding), maxBalance + padding]}
          tickFormatter={(val) => `€${val.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
          itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
          formatter={(value) => [`€${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Balance']}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          fill="url(#colorBalance)"
          activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default BalanceCurve;
