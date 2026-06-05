import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartCard from '../ui/ChartCard';

const RevenueChartWidget = ({ data }) => {
  return (
    <ChartCard 
      title="Revenue Overview" 
      subtitle="Past 7 days performance"
      action={
        <select className="bg-background border border-border text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This Year</option>
        </select>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F5B4F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0F5B4F" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECE7" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`$${value}`, undefined]}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0F5B4F" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            name="Revenue"
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            stroke="#D4AF37" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpenses)" 
            name="Expenses"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default RevenueChartWidget;
