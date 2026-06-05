import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import ChartCard from '../ui/ChartCard';

const OccupancyChartWidget = ({ data }) => {
  return (
    <ChartCard 
      title="Occupancy Rate" 
      subtitle="Percentage of rooms booked"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`${value}%`, 'Occupancy']}
            cursor={{ fill: '#F6F8F5' }}
          />
          <Bar 
            dataKey="rate" 
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {data?.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.rate > 80 ? '#0F5B4F' : entry.rate > 60 ? '#8BCF9B' : '#DDEB7B'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default OccupancyChartWidget;
