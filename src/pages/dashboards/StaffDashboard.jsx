import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { CheckCircle, Clock, AlertCircle, LogIn, LogOut, Wrench, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import TaskBoardWidget from '../../components/widgets/TaskBoardWidget';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import { format, isValid } from 'date-fns';
import { onSocketEvent, offSocketEvent } from '../../services/socket';

const safeFormat = (d) => {
  try {
    const dt = new Date(d);
    return isValid(dt) ? format(dt, 'MMM dd, yyyy') : 'N/A';
  } catch { return 'N/A'; }
};

const StaffDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getStaffStats();
      setData(response);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time: cron auto-checkout updates counter
  useEffect(() => {
    const handleAutoCheckout = () => {
      // Re-fetch to get updated counts
      fetchData();
    };
    onSocketEvent('reservation:autoCheckout', handleAutoCheckout);
    return () => offSocketEvent('reservation:autoCheckout', handleAutoCheckout);
  }, []);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Shift" subtitle="Your tasks and check-ins for today" />
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} />
            <p className="font-medium">{error}</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-1.5 bg-error/10 hover:bg-error/20 rounded-lg text-sm font-semibold">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Shift"
        subtitle="Today's assigned tasks, check-ins, and check-outs"
        breadcrumbs={[{ label: 'Home' }, { label: 'Staff Dashboard' }]}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
        ) : (
          <>
            <StatCard title="Assigned Tasks" value={data?.stats?.assigned || 0} icon={Wrench} color="primary" />
            <StatCard title="Pending Tasks" value={data?.stats?.pending || 0} icon={Clock} color="warning" />
            <StatCard title="Today Check-ins" value={data?.todayCheckIns || 0} icon={LogIn} color="success" />
            <StatCard title="Today Check-outs" value={data?.todayCheckOuts || 0} icon={LogOut} color="secondary" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Maintenance Tasks */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Assigned Maintenance Tasks</h3>
          {loading ? (
            <CardSkeleton />
          ) : !data?.tasks?.length ? (
            <div className="text-center py-8 text-text-secondary">
              <CheckCircle size={40} className="mx-auto mb-2 text-success opacity-40" />
              <p className="text-sm font-medium">No tasks assigned to you</p>
            </div>
          ) : (
            <TaskBoardWidget tasks={data.tasks} />
          )}
        </div>

        {/* Today's Check-ins */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Today's Check-ins</h3>
          {loading ? (
            <CardSkeleton />
          ) : !(data?.todayCheckInsDetails?.length) ? (
            <div className="text-center py-8 text-text-secondary">
              <LogIn size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No check-ins today</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.todayCheckInsDetails.map((res) => (
                <div key={res._id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      {res.customerId
                        ? `${res.customerId.firstName || ''} ${res.customerId.lastName || ''}`.trim() || 'Guest'
                        : 'Guest'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {res.roomId?.roomNumber ? `Room ${res.roomId.roomNumber}` : 'Room TBD'} &bull; {res.numberOfGuests || 1} guest(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                      {res.status?.toLowerCase() || 'pending'}
                    </span>
                    <p className="text-xs text-text-secondary mt-1">{safeFormat(res.checkInDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Housekeeping Panel
      <div className="bg-white rounded-card shadow-soft p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-bold text-text-primary">Housekeeping</h3>
          <button
            onClick={() => navigate('/housekeeping')}
            className="text-sm text-primary hover:underline font-medium"
          >
            Full view →
          </button>
        </div>
        <HousekeepingPanel />
      </div> */}

      {/* Today's Check-outs */}
      {!loading && data?.todayCheckOutsDetails?.length > 0 && (
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Today's Check-outs</h3>
          <div className="space-y-3">
            {data.todayCheckOutsDetails.map((res) => (
              <div key={res._id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                <div>
                  <p className="font-semibold text-text-primary text-sm">
                    {res.customerId
                      ? `${res.customerId.firstName || ''} ${res.customerId.lastName || ''}`.trim() || 'Guest'
                      : 'Guest'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {res.roomId?.roomNumber ? `Room ${res.roomId.roomNumber}` : 'Room TBD'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                    Check-out
                  </span>
                  <p className="text-xs text-text-secondary mt-1">{safeFormat(res.checkOutDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;