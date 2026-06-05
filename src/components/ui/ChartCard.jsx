import React from 'react';

const ChartCard = ({ title, subtitle, action, children }) => {
  return (
    <div className="bg-surface rounded-card shadow-soft p-6 flex flex-col animate-fade-in h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-bold text-text-primary">{title}</h3>
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
