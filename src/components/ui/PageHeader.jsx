import React from 'react';

const PageHeader = ({ title, subtitle, breadcrumbs, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        {breadcrumbs && (
          <nav className="flex items-center text-sm text-text-secondary mb-2 space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span>/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'font-medium text-text-primary' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-heading font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
