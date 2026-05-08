import React from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  'win rate': 'hsl(var(--success))',
  'loss rate': 'hsl(var(--destructive))',
  'breakeven rate': 'hsl(var(--muted-foreground))',
};

const PieChart = ({ data }) => {
  const total = (data?.wins || 0) + (data?.losses || 0) + (data?.breakeven || 0);

  const chartData = [
    { name: 'Win Rate', value: data?.wins || 0 },
    { name: 'Loss Rate', value: data?.losses || 0 },
    { name: 'Breakeven Rate', value: data?.breakeven || 0 },
  ].filter((item) => item.value > 0);
  const winRate = total > 0 ? ((data?.wins || 0) / total) * 100 : 0;

  if (chartData.length === 0 || total === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-muted-foreground">
        No trade data available
      </div>
    );
  }

  return (
    <div className="grid min-h-[320px] grid-cols-1 items-center gap-5 md:grid-cols-[240px_1fr]">
      <div className="relative h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={92}
              innerRadius={62}
              paddingAngle={2}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${((value / total) * 100).toFixed(1)}% (${value} trades)`, name]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border) / 0.7)',
                borderRadius: '6px',
                boxShadow: '0 16px 40px rgb(0 0 0 / 0.28)',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-3xl font-black text-success">{winRate.toFixed(0)}%</p>
            <p className="surface-label mt-1">Win Rate</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {chartData.map((item) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          const color = COLORS[item.name.toLowerCase()];
          return (
            <div key={item.name} className="rounded-md border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-bold">{item.name}</span>
                </div>
                <span className="text-sm font-black">{percent.toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.value} trades</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieChart;
