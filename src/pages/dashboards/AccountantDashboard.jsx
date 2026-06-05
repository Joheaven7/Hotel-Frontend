import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { dashboardService } from '../../services/dashboardService';
import { DollarSign, FileText, AlertCircle, TrendingUp, RefreshCw, Wallet, Users, Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';

const COLORS = ['#0F5B4F', '#F2B705', '#E05252', '#4CAF50', '#9C27B0'];

const AccountantDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getAccountantStats();
      setData(response);
    } catch (err) {
      console.error('AccountantDashboard fetch error:', err);
      setError(err?.response?.data?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportReport = () => {
    if (!data?.pendingPayments?.length) {
      alert('No pending payments to export');
      return;
    }
    const csv = [
      ['Payment #', 'Customer', 'Amount', 'Reservation', 'Created'].join(','),
      ...data.pendingPayments.map(p =>
        [p.paymentNumber || p.id, p.customerName, p.amount, p.reservation, p.createdAt].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title="Financial Overview"
          subtitle="Manage hotel revenue, expenses, and payroll"
          breadcrumbs={[{ label: 'Home' }, { label: 'Accountant Dashboard' }]}
        />
        <div className="bg-error/10 border border-error/20 text-error p-5 rounded-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} />
            <p className="font-medium">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Financial Overview"
        subtitle="Revenue, expenses, payroll and pending payments"
        breadcrumbs={[{ label: 'Home' }, { label: 'Accountant Dashboard' }]}
        action={
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft"
          >
            <Download size={16} /> Export Report
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`ETB ${(stats.totalRevenue || 0).toLocaleString()}`}
              icon={TrendingUp}
              color="success"
            />
            <StatCard
              title="Today's Revenue"
              value={`ETB ${(stats.todayRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              color="primary"
            />
            <StatCard
              title="Monthly Payroll"
              value={`ETB ${(stats.totalExpenses || 0).toLocaleString()}`}
              icon={Users}
              color="warning"
            />
            <StatCard
              title="Pending Invoices"
              value={stats.pendingInvoices || 0}
              icon={FileText}
              color="error"
            />
          </>
        )}
      </div>

      {/* Revenue Chart + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border lg:col-span-2">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Monthly Revenue (Last 6 Months)</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-text-secondary">Loading...</div>
          ) : (data?.revenueChart || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueChart}>
                <defs>
                  <linearGradient id="colorRevAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F5B4F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F5B4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0F5B4F" fill="url(#colorRevAcc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-secondary">No revenue data yet</div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Expense Breakdown</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-text-secondary">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.expenseBreakdown || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(data?.expenseBreakdown || []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Payroll Summary */}
      {!loading && data?.payrollSummary && Object.keys(data.payrollSummary).length > 0 && (
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Current Month Payroll Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Base Salary', value: data.payrollSummary.totalBaseSalary || 0 },
              { label: 'Bonuses', value: data.payrollSummary.totalBonus || 0 },
              { label: 'Deductions', value: data.payrollSummary.totalDeductions || 0 },
              { label: 'Net Salary', value: data.payrollSummary.totalNetSalary || 0 },
              { label: 'Paid', value: null, count: data.payrollSummary.paidCount || 0 },
              { label: 'Pending', value: null, count: data.payrollSummary.pendingCount || 0 },
            ].map(({ label, value, count }) => (
              <div key={label} className="p-3 rounded-xl bg-background border border-border text-center">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{label}</p>
                <p className="font-bold text-text-primary">
                  {value !== null ? `ETB ${value.toLocaleString()}` : count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Payments Table */}
      <div className="bg-white rounded-card shadow-soft p-6 border border-border">
        <h3 className="text-lg font-heading font-bold text-text-primary mb-4">
          Pending Payments
          {data?.pendingPayments?.length > 0 && (
            <span className="ml-2 text-sm bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
              {data.pendingPayments.length}
            </span>
          )}
        </h3>
        {loading ? (
          <CardSkeleton />
        ) : !data?.pendingPayments?.length ? (
          <p className="text-text-secondary text-sm py-4 text-center">No pending payments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Payment #</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Customer</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Amount</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Reservation</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-background transition-colors">
                    <td className="py-2 px-3 font-mono text-xs text-text-secondary">{p.paymentNumber || p.id?.slice(-8)}</td>
                    <td className="py-2 px-3 font-medium text-text-primary">{p.customerName}</td>
                    <td className="py-2 px-3 font-semibold text-warning">ETB {(p.amount || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-text-secondary">{p.reservation}</td>
                    <td className="py-2 px-3 text-text-secondary">{p.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;