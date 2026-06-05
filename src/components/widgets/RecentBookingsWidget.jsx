import React from 'react';
import StatusBadge from '../ui/StatusBadge';

const RecentBookingsWidget = ({ bookings }) => {
  return (
    <div className="bg-surface rounded-card shadow-soft overflow-hidden animate-fade-in h-full flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-heading font-bold text-text-primary">Recent Bookings</h3>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Guest</th>
              <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Room</th>
              <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Dates</th>
              <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Amount</th>
              <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings?.map((booking) => (
              <tr key={booking.id} className="hover:bg-background/50 transition-colors group">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {booking.guest.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{booking.guest}</p>
                      <p className="text-xs text-text-secondary">{booking.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <p className="text-sm text-text-primary">{booking.room}</p>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <p className="text-sm text-text-primary">{booking.checkIn}</p>
                  <p className="text-xs text-text-secondary">to {booking.checkOut}</p>
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right">
                  <p className="text-sm font-medium text-text-primary">${booking.amount}</p>
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-center">
                  <StatusBadge type={booking.status} />
                </td>
              </tr>
            ))}
            {(!bookings || bookings.length === 0) && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-text-secondary text-sm">
                  No recent bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentBookingsWidget;
