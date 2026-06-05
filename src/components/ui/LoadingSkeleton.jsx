import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-surface p-6 rounded-card shadow-soft animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1 mr-4">
        <div className="h-4 bg-border rounded w-1/2"></div>
        <div className="h-8 bg-border rounded w-3/4"></div>
      </div>
      <div className="w-12 h-12 bg-border rounded-full"></div>
    </div>
    <div className="mt-4 h-4 bg-border rounded w-1/3"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-surface rounded-card shadow-soft overflow-hidden animate-pulse">
    <div className="p-4 border-b border-border bg-background/50 flex justify-between">
      <div className="h-6 bg-border rounded w-1/4"></div>
      <div className="h-6 bg-border rounded w-1/6"></div>
    </div>
    <div className="p-4">
      <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4">
            {[...Array(columns)].map((_, j) => (
              <div key={j} className="h-4 bg-border rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-6 animate-pulse">
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-border rounded w-1/4"></div>
        <div className="h-10 bg-border rounded-input w-full"></div>
      </div>
    ))}
    <div className="h-12 bg-border rounded-btn w-32 mt-8"></div>
  </div>
);
