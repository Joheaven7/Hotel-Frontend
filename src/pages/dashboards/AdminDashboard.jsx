import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { CheckCircle, LogOut, Home, Calendar, AlertCircle, Clock, Wrench, BedDouble } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getAdminStats();
        setData(response);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error p-4 rounded-card flex items-center gap-3">
        <AlertCircle size={24} />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const roomStatus = data?.stats?.roomStatus || {};

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Hotel Operations"
        subtitle="Daily management and performance metrics"
        breadcrumbs={[{ label: 'Home' }, { label: 'Admin Dashboard' }]}
        action={
          <button
            onClick={() => navigate('/reservations')}
            className="bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft"
          >
            + New Reservation
          </button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
        ) : (
          <>
            <StatCard title="Today's Check-ins"    value={data?.stats?.checkInsToday || 0}        icon={CheckCircle} color="primary" />
            <StatCard title="Today's Check-outs"   value={data?.stats?.checkOutsToday || 0}       icon={LogOut}      color="warning" />
            <StatCard title="Occupancy Rate"        value={`${data?.stats?.occupancyRate || 0}%`}  icon={Home}        color="secondary" />
            <StatCard title="Pending Reservations"  value={data?.stats?.pendingReservations || 0}  icon={Clock}       color="error" />
          </>
        )}
      </div>

      {/* Room Status + Upcoming Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Status Breakdown */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Room Status</h3>
            <button onClick={() => navigate('/rooms')} className="text-sm text-primary hover:underline font-medium">
              Manage rooms
            </button>
          </div>
          {loading ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Available',    value: roomStatus.available   || 0, color: 'bg-success',   bar: 'bg-success' },
                { label: 'Occupied',     value: roomStatus.occupied    || 0, color: 'bg-primary',   bar: 'bg-primary' },
                { label: 'Maintenance',  value: roomStatus.maintenance || 0, color: 'bg-warning',   bar: 'bg-warning' },
                { label: 'Blocked',      value: roomStatus.blocked     || 0, color: 'bg-error',     bar: 'bg-error' },
              ].map(({ label, value, bar }) => {
                const total = roomStatus.total || 1;
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary font-medium">{label}</span>
                      <span className="font-bold text-text-primary">{value}</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden border border-border">
                      <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-text-secondary pt-1">Total: {roomStatus.total || 0} rooms</p>
            </div>
          )}
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Upcoming Reservations</h3>
            <button onClick={() => navigate('/reservations')} className="text-sm text-primary hover:underline font-medium">
              View all
            </button>
          </div>
          {loading ? (
            <CardSkeleton />
          ) : !(data?.recentBookings?.length) ? (
            <div className="text-center py-8 text-text-secondary">
              <Calendar size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No upcoming reservations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Guest</th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Room</th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Check-in</th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBookings.slice(0, 8).map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50 hover:bg-background transition-colors">
                      <td className="py-2 px-2 font-medium text-text-primary">{booking.guest}</td>
                      <td className="py-2 px-2 text-text-secondary">{booking.room}</td>
                      <td className="py-2 px-2 text-text-secondary">{booking.checkIn}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          booking.status === 'confirmed' ? 'bg-success/10 text-success'
                          : booking.status === 'pending' ? 'bg-warning/10 text-warning'
                          : 'bg-text-secondary/10 text-text-secondary'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Open Maintenance */}
      {!loading && data?.stats?.openMaintenanceTasks > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench size={20} className="text-warning" />
            <p className="font-medium text-text-primary">
              <span className="font-bold text-warning">{data.stats.openMaintenanceTasks}</span> open maintenance request(s) need attention
            </p>
          </div>
          <button
            onClick={() => navigate('/maintenance')}
            className="text-sm text-warning font-semibold hover:underline"
          >
            View tasks →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;