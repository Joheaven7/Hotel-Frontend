import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from '../ui/ChartCard';

const COLORS = ['#0F5B4F', '#DDEB7B', '#D4AF37', '#8BCF9B', '#F4D06F', '#E57373'];

const ExpenseBreakdownWidget = ({ data }) => {
  return (
    <ChartCard 
      title="Expense Breakdown" 
      subtitle="Current month expenditures"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `$${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default ExpenseBreakdownWidget;
