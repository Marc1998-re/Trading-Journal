import React from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  'win rate': '#10b981', // Green
  'loss rate': '#ef4444', // Red
  'breakeven rate': '#6b7280', // Gray
};

const PieChart = ({ data }) => {
  const total = (data.wins || 0) + (data.losses || 0) + (data.breakeven || 0);
  
  const chartData = [
    { name: 'Win Rate', value: data.wins || 0 },
    { name: 'Loss Rate', value: data.losses || 0 },
    { name: 'Breakeven Rate', value: data.breakeven || 0 },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0 || total === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No trade data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPie>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${((value / total) * 100).toFixed(1)}%`}
          outerRadius={90}
          innerRadius={60}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [`${((value / total) * 100).toFixed(1)}% (${value} trades)`, name]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
      </RechartsPie>
    </ResponsiveContainer>
  );
};

export default PieChart;