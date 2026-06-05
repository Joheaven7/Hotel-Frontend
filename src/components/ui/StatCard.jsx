import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  return (
    <div className="bg-surface p-6 rounded-card shadow-soft hover:shadow-elevated transition-shadow duration-300 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          <h3 className="text-text-primary text-2xl font-heading font-bold">{value}</h3>
        </div>
        <div className={`p-3 rounded-full bg-${color}/10 text-${color}`}>
          {Icon && <Icon size={24} />}
        </div>
      </div>
      
      {(trend || trendValue) && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trend === 'up' ? 'text-success' : 'text-error'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
          <span className="text-text-secondary ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
