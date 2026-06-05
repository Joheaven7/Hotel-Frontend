import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { dashboardService } from '../../services/dashboardService';
import {
  Users, DollarSign, Home, TrendingUp, AlertCircle,
  Calendar as CalendarIcon, Wallet, ShieldCheck, Activity,
  RefreshCw, UserCheck, Clock,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const ROLE_COLORS = {
  SUPER_ADMIN: '#7C3AED',
  ADMIN:       '#0F5B4F',
  MANAGER:     '#0891B2',
  HR:          '#DB2777',
  ACCOUNTANT:  '#16A34A',
  STAFF:       '#D97706',
  CUSTOMER:    '#2563EB',
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData]           = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate:   new Date().toISOString().split('T')[0],
  });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, analyticsRes, auditRes] = await Promise.allSettled([
        apiClient.get('/dashboards'),
        dashboardService.getAdvancedAnalytics(dateRange.startDate, dateRange.endDate),
        apiClient.get('/auditlogs/summary'),
      ]);

      if (dashRes.status === 'fulfilled')     setData(dashRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
      if (auditRes.status === 'fulfilled')     setAuditData(auditRes.value.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [dateRange]);

  // Time-series chart data
  const chartData = (analytics?.dailyRevenue || []).map((item) => {
    const res = analytics?.dailyReservations?.find((r) => r._id === item._id);
    return {
      date:         item._id,
      revenue:      item.revenue || 0,
      reservations: res?.count  || 0,
    };
  });

  // Monthly revenue bar chart
  const monthlyRevenue = (data?.revenueByMonth || []).slice().reverse().map((m) => ({
    month:   m._id,
    revenue: m.revenue || 0,
  }));

  // Users by role
  const totalUsers = (data?.usersByRole || []).reduce((s, r) => s + r.count, 0);

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error p-4 rounded-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} />
          <p className="font-medium">{error}</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-1.5 bg-error/10 rounded-lg text-sm font-semibold hover:bg-error/20">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="System Overview"
        subtitle="Complete hotel management system analytics and health status"
        breadcrumbs={[{ label: 'Home' }, { label: 'Super Admin Dashboard' }]}
        action={
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft">
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />

      {/* ── Primary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`ETB ${(data?.totalRevenue || 0).toLocaleString()}`}
              icon={DollarSign} color="primary"
            />
            <StatCard
              title="Total Rooms"
              value={data?.totalRooms || 0}
              icon={Home} color="secondary"
            />
            <StatCard
              title="Occupancy Rate"
              value={`${data?.occupancyRate || 0}%`}
              icon={TrendingUp} color="warning"
            />
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={Users} color="success"
            />
          </>
        )}
      </div>

      {/* ── Time-Series Analytics ── */}
      <div className="bg-white rounded-card shadow-soft p-6 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-heading font-bold text-text-primary">Revenue & Reservations Trend</h3>
            <p className="text-sm text-text-secondary mt-1">Daily breakdown for selected period</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date" name="startDate" value={dateRange.startDate}
              onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
            <span className="text-text-secondary text-sm">to</span>
            <input
              type="date" name="endDate" value={dateRange.endDate}
              onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">Loading...</div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevSA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F2B705" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#F2B705" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => n === 'Revenue (ETB)' ? [`ETB ${v.toLocaleString()}`, n] : [v, n]} />
                <Legend />
                <Area yAxisId="left"  type="monotone" dataKey="revenue"      name="Revenue (ETB)" stroke="#F2B705" fill="url(#colorRevSA)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="reservations" name="Reservations"  stroke="#0F5B4F" fill="#0F5B4F"          fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">No data for selected range</div>
          )}
        </div>
      </div>

      {/* ── Second Row: Revenue by Month + Users by Role ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Monthly Revenue (Last 6 Months)</h3>
          {loading ? <CardSkeleton /> : monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue" fill="#0F5B4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">No monthly revenue data</div>
          )}
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Users by Role</h3>
            <button onClick={() => navigate('/users')} className="text-sm text-primary hover:underline font-medium">
              Manage users →
            </button>
          </div>
          {loading ? <CardSkeleton /> : (
            <div className="space-y-3">
              {(data?.usersByRole || []).map((item) => {
                const pct = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;
                const color = ROLE_COLORS[item._id] || '#6B7280';
                return (
                  <div key={item._id}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium text-text-primary">{item._id.replace('_', ' ')}</span>
                      <span className="font-bold text-text-primary">{item.count} <span className="text-text-secondary font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden border border-border">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
              {!(data?.usersByRole?.length) && (
                <p className="text-text-secondary text-sm text-center py-4">No user data</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Third Row: Operations + Maintenance + Audit ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Overview */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Operations Overview</h3>
          {loading ? <CardSkeleton /> : (
            <div className="space-y-3">
              {[
                { label: 'Total Reservations', value: data?.totalReservations || 0,                       color: 'text-primary',   icon: CalendarIcon },
                { label: 'Pending Payments',   value: `ETB ${(data?.pendingPayments?.total || 0).toLocaleString()}`, color: 'text-warning', icon: Clock },
                { label: 'Monthly Payroll',    value: `ETB ${(data?.monthlyPayrollCost || 0).toLocaleString()}`,     color: 'text-success', icon: Wallet },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Icon size={16} className={color} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className={`font-bold text-sm ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Status */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Maintenance Status</h3>
            <button onClick={() => navigate('/maintenance')} className="text-sm text-primary hover:underline font-medium">View all →</button>
          </div>
          {loading ? <CardSkeleton /> : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-error/5 border border-error/20 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-error text-sm">Open Requests</p>
                  <p className="text-xs text-text-secondary mt-0.5">Require attention</p>
                </div>
                <p className="text-3xl font-bold text-error">{data?.maintenanceStatus?.open || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-warning text-sm">In Progress</p>
                  <p className="text-xs text-text-secondary mt-0.5">Being worked on</p>
                </div>
                <p className="text-3xl font-bold text-warning">{data?.maintenanceStatus?.inProgress || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Audit Activity */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Recent Activity</h3>
            <button onClick={() => navigate('/audit-logs')} className="text-sm text-primary hover:underline font-medium">Full log →</button>
          </div>
          {loading ? <CardSkeleton /> : (
            <div className="space-y-2.5">
              {(auditData?.recentLogins || []).length > 0 ? (
                auditData.recentLogins.map((log) => (
                  <div key={log._id} className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {log.userId?.firstName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {log.userId?.firstName} {log.userId?.lastName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {log.actionType} · {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-text-secondary">
                  <Activity size={28} className="mx-auto mb-1 opacity-30" />
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;