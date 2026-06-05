import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import {
  Users, Banknote, ClipboardList, CheckCircle2,
  Clock, XCircle, AlertCircle, RefreshCw, Plus,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

const STATUS_STYLES = {
  DRAFT:    'bg-gray-100 text-gray-600 border-gray-200',
  PENDING:  'bg-warning/10 text-warning border-warning/20',
  APPROVED: 'bg-success/10 text-success border-success/20',
  REJECTED: 'bg-error/10 text-error border-error/20',
  PAID:     'bg-primary/10 text-primary border-primary/20',
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [payrollRes, usersRes] = await Promise.allSettled([
        apiClient.get(`/payroll/month/${currentMonth}`),
        apiClient.get('/users?role=STAFF'),
      ]);

      if (payrollRes.status === 'fulfilled') {
        setPayrolls(payrollRes.value.data?.payrollEntries || []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data?.users || []);
      }
    } catch (err) {
      setError('Failed to load HR dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitForApproval = async (payrollId) => {
    try {
      await apiClient.post(`/payroll/${payrollId}/submit`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
    }
  };

  const stats = {
    totalStaff:    users.length,
    activeStaff:   users.filter((u) => u.isActive).length,
    draftPayrolls: payrolls.filter((p) => p.approvalStatus === 'DRAFT').length,
    pending:       payrolls.filter((p) => p.approvalStatus === 'PENDING').length,
    approved:      payrolls.filter((p) => p.approvalStatus === 'APPROVED').length,
    rejected:      payrolls.filter((p) => p.approvalStatus === 'REJECTED').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="HR Dashboard"
        subtitle={`Employee management and payroll preparation — ${currentMonth}`}
        breadcrumbs={[{ label: 'Home' }, { label: 'HR Dashboard' }]}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/users')}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-btn text-sm font-medium text-text-primary hover:bg-background transition-colors"
            >
              <Users size={16} /> Employees
            </button>
            <button
              onClick={() => navigate('/payroll')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft text-sm"
            >
              <Plus size={16} /> New Payroll
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
        ) : (
          <>
            <StatCard title="Total Staff"     value={stats.totalStaff}    icon={Users}         color="primary" />
            <StatCard title="Active Staff"    value={stats.activeStaff}   icon={CheckCircle2}  color="success" />
            <StatCard title="Draft Payrolls"  value={stats.draftPayrolls} icon={ClipboardList} color="warning" />
            <StatCard title="Pending Approval" value={stats.pending}      icon={Clock}         color="secondary" />
          </>
        )}
      </div>

      {/* Payroll Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Draft payrolls — ready to submit */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">
              Draft Payrolls
              {stats.draftPayrolls > 0 && (
                <span className="ml-2 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium border border-warning/20">
                  {stats.draftPayrolls}
                </span>
              )}
            </h3>
            <button onClick={() => navigate('/payroll')} className="text-sm text-primary hover:underline font-medium">
              Manage →
            </button>
          </div>

          {loading ? <CardSkeleton /> : (
            <div className="space-y-3">
              {payrolls.filter((p) => p.approvalStatus === 'DRAFT').length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No draft payrolls for {currentMonth}</p>
                  <button
                    onClick={() => navigate('/payroll')}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Create payroll →
                  </button>
                </div>
              ) : (
                payrolls
                  .filter((p) => p.approvalStatus === 'DRAFT')
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                      <div>
                        <p className="font-semibold text-text-primary text-sm">
                          {p.staffId?.firstName} {p.staffId?.lastName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          ETB {(p.netSalary || 0).toLocaleString()}
                          {p.bonus > 0 && <span className="text-success ml-1">+ETB {p.bonus.toLocaleString()} bonus</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSubmitForApproval(p._id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Status overview */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-4">
            Payroll Status — {currentMonth}
          </h3>
          {loading ? <CardSkeleton /> : (
            <div className="space-y-3">
              {[
                { label: 'Draft',    count: stats.draftPayrolls, status: 'DRAFT',    icon: ClipboardList },
                { label: 'Pending',  count: stats.pending,       status: 'PENDING',  icon: Clock },
                { label: 'Approved', count: stats.approved,      status: 'APPROVED', icon: CheckCircle2 },
                { label: 'Rejected', count: stats.rejected,      status: 'REJECTED', icon: XCircle },
              ].map(({ label, count, status, icon: Icon }) => (
                <div
                  key={status}
                  className={`flex items-center justify-between p-3 rounded-xl border ${STATUS_STYLES[status] || 'bg-background border-border'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <span className="font-bold text-lg">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rejected payrolls — need HR attention */}
      {!loading && stats.rejected > 0 && (
        <div className="bg-error/5 border border-error/20 rounded-card p-6">
          <h3 className="text-lg font-heading font-bold text-error mb-4 flex items-center gap-2">
            <XCircle size={20} /> Rejected Payrolls — Action Required
          </h3>
          <div className="space-y-3">
            {payrolls
              .filter((p) => p.approvalStatus === 'REJECTED')
              .map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-error/20">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      {p.staffId?.firstName} {p.staffId?.lastName}
                    </p>
                    <p className="text-xs text-error mt-0.5">
                      Reason: {p.rejectedReason || 'No reason given'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/payroll')}
                    className="px-3 py-1.5 text-xs font-semibold bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors"
                  >
                    Fix & Resubmit
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Staff List Preview */}
      <div className="bg-white rounded-card shadow-soft p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-bold text-text-primary">Staff Overview</h3>
          <button onClick={() => navigate('/users')} className="text-sm text-primary hover:underline font-medium">
            Manage staff →
          </button>
        </div>
        {loading ? <CardSkeleton /> : users.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-6">No staff members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Department</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Base Salary</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 8).map((u) => (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-background transition-colors">
                    <td className="py-2 px-3 font-medium text-text-primary">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-2 px-3 text-text-secondary">{u.department || '—'}</td>
                    <td className="py-2 px-3 font-semibold text-primary">
                      ETB {(u.baseSalary || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        u.isActive
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-error/10 text-error border-error/20'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
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
  );
};

export default HRDashboard;