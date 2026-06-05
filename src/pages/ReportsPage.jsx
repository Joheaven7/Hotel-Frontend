import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle, Loader, Download, TrendingUp, Calendar,
  ShieldCheck, DollarSign, Activity, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import FormField from '../components/ui/FormField';
import StatusBadge from '../components/ui/StatusBadge';

// ── Role-to-tab mapping ───────────────────────────────────────────────────────
const REPORT_TYPES = [
  { value: 'revenue',     label: 'Revenue',     roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { value: 'occupancy',   label: 'Occupancy',   roles: ['SUPER_ADMIN', 'ADMIN'] },
  { value: 'payroll',     label: 'Payroll',     roles: ['SUPER_ADMIN', 'ACCOUNTANT', 'HR'] },
  { value: 'maintenance', label: 'Maintenance', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

const PIE_COLORS = ['#0F5B4F', '#F2B705', '#EF4444', '#4CAF50', '#9C27B0', '#2196F3'];

// ── ReportsPage ───────────────────────────────────────────────────────────────
const ReportsPage = () => {
  const { user } = useAuthStore();
  const role = user?.role || '';

  const allowedTabs = REPORT_TYPES.filter((t) => t.roles.includes(role));

  const [reportType, setReportType] = useState(allowedTabs[0]?.value || 'revenue');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(null);

      let response;

      switch (reportType) {
        case 'revenue':
          // Correct endpoint — /payments/stats/overview
          response = await apiClient.get('/payments/stats/overview');
          break;

        case 'occupancy':
          try {
            response = await apiClient.get('/rooms/occupancy/report', {
              params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
            });
          } catch (err) {
            if (err.response?.status === 404 || err.response?.status === 400) {
              setData({ notImplemented: true, message: err.response?.data?.message || 'Occupancy report requires a valid date range.' });
              return;
            }
            throw err;
          }
          break;

        case 'payroll':
          response = await apiClient.get('/payroll/stats/report', {
            params: {
              startMonth: dateRange.startDate.slice(0, 7),
              endMonth:   dateRange.endDate.slice(0, 7),
            },
          });
          break;

        case 'maintenance':
          try {
            response = await apiClient.get('/maintenance/stats/report', {
              params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
            });
          } catch (err) {
            if (err.response?.status === 404) {
              setData({ notImplemented: true, message: 'Maintenance report endpoint not yet available.' });
              return;
            }
            throw err;
          }
          break;

        default:
          return;
      }

      setData(response?.data || {});
    } catch (err) {
      console.error('Report fetch error:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = () => {
    if (!data || data.notImplemented) {
      toast.error('No data to export');
      return;
    }
    const json  = JSON.stringify(data, null, 2);
    const blob  = new Blob([json], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `${reportType}_report_${dateRange.startDate}_to_${dateRange.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  // ── Revenue renderer ────────────────────────────────────────────────────────
  const renderRevenue = () => {
    if (!data) return null;

    // Backend returns: { stats: [{_id, count, totalAmount}], totalRevenue, revenueByMethod, statusBreakdown, pendingPayments }
    const statusBreakdown  = data.statusBreakdown || data.stats || [];
    const revenueByMethod  = data.revenueByMethod || [];
    const totalRevenue     = data.totalRevenue || 0;
    const pendingPayments  = data.pendingPayments || { count: 0, total: 0 };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Revenue (Paid)"
            value={`ETB ${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="success"
          />
          <StatCard
            title="Awaiting Settlement"
            value={`ETB ${(pendingPayments.total || 0).toLocaleString()}`}
            icon={Activity}
            color="warning"
            trend={`${pendingPayments.count} pending`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by payment method */}
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Revenue by Payment Method
            </h3>
            {revenueByMethod.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMethod}>
                    <defs>
                      <linearGradient id="colorRevMethod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0F5B4F" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#0F5B4F" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="_id" tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Amount']} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Bar dataKey="total" fill="url(#colorRevMethod)" radius={[6, 6, 0, 0]} name="Amount (ETB)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No payment method data
              </div>
            )}
          </div>

          {/* Settlement flow pie */}
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
              <ShieldCheck size={18} className="text-success" />
              Settlement Distribution
            </h3>
            {statusBreakdown.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {statusBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No status data
              </div>
            )}
          </div>
        </div>

        {/* Detailed breakdown */}
        {statusBreakdown.length > 0 && (
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-4">Detailed Financial Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statusBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border bg-background/50 flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                      {item._id || 'Unknown'}
                    </span>
                    <h4 className="text-xl font-bold text-text-primary mt-1">
                      ETB {(item.totalAmount || item.total || 0).toLocaleString()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-secondary">{item.count} transactions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Occupancy renderer ──────────────────────────────────────────────────────
  const renderOccupancy = () => {
    if (!data) return null;

    // Backend returns: { totalRooms, occupiedRooms, occupancyRate, roomDetails: [{roomNumber, type, occupancyCount, isOccupied}] }
    const roomDetails = data.roomDetails || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Rooms"      value={data.totalRooms || 0}                     icon={TrendingUp}  color="primary" />
          <StatCard title="Currently Occupied" value={data.occupiedRooms || 0}                icon={Activity}    color="primary" />
          <StatCard title="Occupancy Rate"   value={`${Math.round(data.occupancyRate || 0)}%`} icon={ShieldCheck} color="success" />
        </div>

        {roomDetails.length > 0 && (
          <>
            {/* Occupancy bar chart */}
            <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
              <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                Bookings per Room
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomDetails.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="roomNumber" tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} label={{ value: 'Room #', position: 'insideBottom', offset: -2 }} />
                    <YAxis tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Bookings']} />
                    <Bar
                      dataKey="occupancyCount"
                      name="Bookings"
                      radius={[4, 4, 0, 0]}
                    >
                      {roomDetails.slice(0, 20).map((r, idx) => (
                        <Cell key={idx} fill={r.isOccupied ? '#0F5B4F' : '#D1FAE5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-text-secondary mt-2">Green = currently occupied · Light = available</p>
            </div>

            {/* Room ledger table */}
            <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-base font-semibold text-text-primary">Room Occupancy Ledger</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-background sticky top-0">
                    <tr>
                      {['Room #', 'Type', 'Status', 'Bookings in Period'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left font-semibold text-text-secondary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {roomDetails.map((room, idx) => (
                      <tr key={idx} className="hover:bg-background/40 transition-colors">
                        <td className="px-6 py-3 font-semibold text-text-primary">
                          {room.roomNumber}
                        </td>
                        <td className="px-6 py-3 text-text-secondary capitalize">{room.type}</td>
                        <td className="px-6 py-3">
                          <StatusBadge type={room.isOccupied ? 'checked_in' : 'available'} />
                        </td>
                        <td className="px-6 py-3 text-text-secondary">
                          {room.occupancyCount > 0
                            ? `${room.occupancyCount} booking${room.occupancyCount > 1 ? 's' : ''}`
                            : 'No bookings in range'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Payroll renderer ────────────────────────────────────────────────────────
  const renderPayroll = () => {
    if (!data) return null;

    // Backend returns: { totalPayroll: [{totalBaseSalary, totalBonus, totalDeductions, totalNetSalary, paidCount, pendingCount}], monthlyBreakdown: [{_id, totalNetSalary, staffCount, paidCount}], topEarners }
    const summary        = data.totalPayroll?.[0] || data.summary || {};
    const monthlyData    = (data.monthlyBreakdown || data.monthlyData || []).slice().reverse(); // oldest → newest for chart
    const topEarners     = data.topEarners || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Net Salary Paid"
            value={`ETB ${(summary.totalNetSalary || 0).toLocaleString()}`}
            icon={DollarSign}
            color="success"
          />
          <StatCard
            title="Payroll Runs Completed"
            value={summary.paidCount || 0}
            icon={ShieldCheck}
            color="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly trend */}
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Monthly Net Salary Trends
            </h3>
            {monthlyData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="_id" tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Net Salary']} />
                    <Line type="monotone" dataKey="totalNetSalary" stroke="#0F5B4F" strokeWidth={3} activeDot={{ r: 6 }} name="Net Salary (ETB)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No monthly data for this range
              </div>
            )}
          </div>

          {/* Top earners */}
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-4">Top Salaried Employees</h3>
            {topEarners.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {topEarners.map((earner, idx) => {
                  const staff = earner.staff?.[0] || earner;
                  const name  = `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim() || 'Staff';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-sm">{name}</p>
                          <p className="text-xs text-text-secondary">{staff?.department || 'N/A'}</p>
                        </div>
                      </div>
                      <p className="font-bold text-primary text-sm">
                        ETB {(earner.totalEarnings || earner.totalNetSalary || 0).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No earner data available
              </div>
            )}
          </div>
        </div>

        {/* Salary breakdown cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Base Salaries',    value: summary.totalBaseSalary  || 0, color: 'text-text-primary', sign: '' },
            { label: 'Total Bonuses Disbursed', value: summary.totalBonus       || 0, color: 'text-success',      sign: '+' },
            { label: 'Total Deductions',        value: summary.totalDeductions  || 0, color: 'text-error',        sign: '-' },
          ].map(({ label, value, color, sign }) => (
            <div key={label} className="bg-background p-4 rounded-xl border border-border">
              <p className="text-text-secondary text-sm font-semibold mb-2">{label}</p>
              <p className={`text-xl font-bold ${color}`}>
                {sign}ETB {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Maintenance renderer ────────────────────────────────────────────────────
  const renderMaintenance = () => {
    if (!data) return null;

    // Backend returns: { totalRequests, byStatus: [{_id, count}], byPriority: [{_id, count}], totalCost, avgResolutionTimeHours }
    const byStatus   = data.byStatus   || [];
    const byPriority = data.byPriority || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Requests"
            value={data.totalRequests || 0}
            icon={TrendingUp}
            color="primary"
          />
          <StatCard
            title="Total Cost"
            value={`ETB ${(data.totalCost || 0).toLocaleString()}`}
            icon={DollarSign}
            color="error"
          />
          <StatCard
            title="Avg Resolution Time"
            value={`${data.avgResolutionTimeHours || 0}h`}
            icon={ShieldCheck}
            color="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By status */}
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Requests by Status
            </h3>
            {byStatus.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStatus}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="_id" tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Count']} />
                    <Bar dataKey="count" fill="#0F5B4F" radius={[6, 6, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No status data
              </div>
            )}
          </div>

          {/* By priority pie */}
          <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
            <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
              <AlertCircle size={18} className="text-error" />
              Requests by Priority
            </h3>
            {byPriority.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byPriority}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {byPriority.map((_, idx) => (
                        <Cell key={idx} fill={['#0F5B4F', '#F2B705', '#EF4444', '#E57373'][idx % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No priority data
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Route to correct renderer ───────────────────────────────────────────────
  const renderReport = () => {
    if (data?.notImplemented) {
      return (
        <div className="bg-warning/5 border border-warning/20 rounded-card p-10 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-warning opacity-60" />
          <p className="font-semibold text-text-primary">{data.message}</p>
          <p className="text-sm text-text-secondary mt-1">This report will be available once the backend is fully implemented.</p>
        </div>
      );
    }
    if (reportType === 'revenue')     return renderRevenue();
    if (reportType === 'occupancy')   return renderOccupancy();
    if (reportType === 'payroll')     return renderPayroll();
    if (reportType === 'maintenance') return renderMaintenance();
    return null;
  };

  // ── Page render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Business Reports & Analytics"
        subtitle="Revenue, occupancy, payroll, and maintenance analytics"
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }]}
        action={
          <button
            onClick={handleExport}
            disabled={!data || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/40 text-white rounded-xl font-semibold transition-all shadow-soft"
          >
            <Download size={20} /> Export Data
          </button>
        }
      />

      {/* Report type tabs — filtered per role */}
      <div className="flex gap-2 flex-wrap">
        {allowedTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setReportType(tab.value)}
            className={`px-4 py-2 rounded-btn text-sm font-semibold transition-colors ${
              reportType === tab.value
                ? 'bg-primary text-white shadow-soft'
                : 'bg-surface text-text-secondary border border-border hover:text-text-primary hover:bg-background'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date range + refresh */}
      <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <FormField
            label="Start Date"
            name="startDate"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
          />
          <FormField
            label="End Date"
            name="endDate"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-5 bg-error/10 border border-error/20 rounded-card flex items-center gap-3 text-error">
          <AlertCircle size={20} />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-96 bg-surface border border-border rounded-card shadow-soft">
          <Loader className="animate-spin text-primary h-12 w-12" />
          <p className="text-text-secondary text-sm mt-4 font-semibold">Running analytics...</p>
        </div>
      )}

      {/* Report content */}
      {!loading && !error && data && (
        <div className="animate-fade-in">
          {renderReport()}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;