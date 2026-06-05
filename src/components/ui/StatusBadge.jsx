import React from 'react';

const statusConfig = {
  // Reservation statuses
  pending:      { color: 'bg-warning/10 text-warning border-warning/20',           label: 'Pending' },
  confirmed:    { color: 'bg-primary/10 text-primary border-primary/20',            label: 'Confirmed' },
  checked_in:   { color: 'bg-success/10 text-success border-success/20',            label: 'Checked In' },
  checked_out:  { color: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20', label: 'Checked Out' },
  cancelled:    { color: 'bg-error/10 text-error border-error/20',                  label: 'Cancelled' },
  waitlist:     { color: 'bg-warning/10 text-warning border-warning/20',            label: 'Waitlist' },

  // Room statuses
  available:    { color: 'bg-success/10 text-success border-success/20',            label: 'Available' },
  occupied:     { color: 'bg-primary/10 text-primary border-primary/20',            label: 'Occupied' },
  maintenance:  { color: 'bg-warning/10 text-warning border-warning/20',            label: 'Maintenance' },
  blocked:      { color: 'bg-error/10 text-error border-error/20',                  label: 'Blocked' },
  booked:       { color: 'bg-primary/10 text-primary border-primary/20',            label: 'Booked' },

  // Payment statuses
  paid:         { color: 'bg-success/10 text-success border-success/20',            label: 'Paid' },
  unpaid:       { color: 'bg-error/10 text-error border-error/20',                  label: 'Unpaid' },
  failed:       { color: 'bg-error/10 text-error border-error/20',                  label: 'Failed' },
  refunded:     { color: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20', label: 'Refunded' },
  completed:    { color: 'bg-success/10 text-success border-success/20',            label: 'Completed' },

  // Maintenance statuses
  open:         { color: 'bg-error/10 text-error border-error/20',                  label: 'Open' },
  in_progress:  { color: 'bg-warning/10 text-warning border-warning/20',            label: 'In Progress' },

  // User statuses
  active:       { color: 'bg-success/10 text-success border-success/20',            label: 'Active' },
  inactive:     { color: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20', label: 'Inactive' },
  deactivated:  { color: 'bg-error/10 text-error border-error/20',                  label: 'Deactivated' },

  // Default
  default:      { color: 'bg-border text-text-secondary border-border',             label: 'Unknown' },
};

const StatusBadge = ({ type, status, customLabel }) => {
  // Support both `type` and legacy `status` prop names
  const key = (type || status || '').toLowerCase().replace(/-/g, '_');
  const config = statusConfig[key] || statusConfig.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {customLabel || config.label}
    </span>
  );
};

export default StatusBadge;