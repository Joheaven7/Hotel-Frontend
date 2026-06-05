import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  Percent,
  ShieldAlert,
  XCircle,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// PayrollPage
// ─────────────────────────────────────────────────────────────────────────────
const APPROVAL_STYLES = {
  DRAFT:    'bg-gray-100 text-gray-600 border-gray-200',
  PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  PAID:     'bg-blue-100 text-blue-700 border-blue-200',
};

const PayrollPage = () => {
  const { user } = useAuthStore();

  // Role flags
  const isHR             = user?.role === 'HR';
  const isManager        = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role);
  const isAccountant     = ['SUPER_ADMIN', 'ACCOUNTANT'].includes(user?.role);
  const canCreate        = isHR || ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const canEdit          = isManager; // legacy — keep for modal gates

  const [payrolls, setPayrolls]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterMonth, setFilterMonth]     = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus]   = useState('all');
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState({});
  const [stats, setStats]                 = useState(null);
  const [submitting, setSubmitting]       = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/payroll/month/${filterMonth}`, {
        params: { page, limit: 100 },
      });
      setPayrolls(response.data.payrollEntries || []);
      setPagination({
        page:   response.data.page,
        limit:  response.data.limit,
        total:  response.data.total,
        pages:  response.data.pages,
        totals: response.data.totals,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, page]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/payroll/stats/report', {
        params: { startMonth: filterMonth, endMonth: filterMonth },
      });
      setStats(response.data);
    } catch (err) {
      // stats are supplementary — don't toast
    }
  }, [filterMonth]);

  useEffect(() => {
    fetchPayrolls();
    fetchStats();
  }, [fetchPayrolls, fetchStats]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleMarkAsPaid = async (payrollId) => {
    setSubmitting(true);
    const toastId = toast.loading('Marking payroll as paid...');
    try {
      await apiClient.post(`/payroll/${payrollId}/mark-paid`, { notes: 'Paid via dashboard' });
      toast.success('Payroll marked as paid', { id: toastId });
      fetchPayrolls();
      fetchStats();
      if (showViewModal) setShowViewModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark as paid', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (payrollId) => {
    const toastId = toast.loading('Submitting for approval...');
    try {
      await apiClient.post(`/payroll/${payrollId}/submit`);
      toast.success('Submitted for manager approval', { id: toastId });
      fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit', { id: toastId });
    }
  };

  const handleApprove = async (payrollId) => {
    const toastId = toast.loading('Approving payroll...');
    try {
      await apiClient.post(`/payroll/${payrollId}/approve`);
      toast.success('Payroll approved', { id: toastId });
      fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve', { id: toastId });
    }
  };

  const handleReject = async (payrollId) => {
    const reason = window.prompt('Enter rejection reason (required):');
    if (reason === null) return; // cancelled
    if (!reason.trim()) { toast.error('Rejection reason is required'); return; }
    const toastId = toast.loading('Rejecting payroll...');
    try {
      await apiClient.post(`/payroll/${payrollId}/reject`, { reason });
      toast.success('Payroll rejected and sent back to HR', { id: toastId });
      fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject', { id: toastId });
    }
  };

  const handleDeletePayroll = async (payrollId) => {
    if (!window.confirm('Delete this payroll entry? This cannot be undone.')) return;
    setSubmitting(true);
    const toastId = toast.loading('Deleting payroll...');
    try {
      await apiClient.delete(`/payroll/${payrollId}`);
      toast.success('Payroll deleted', { id: toastId });
      fetchPayrolls();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (payrolls.length === 0) { toast.error('No payroll data to export'); return; }
    const headers = ['Staff Name', 'Department', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Approval', 'Paid', 'Month'];
    const rows = payrolls.map((p) => [
      `${p.staffId?.firstName || ''} ${p.staffId?.lastName || ''}`,
      p.staffId?.department || 'N/A',
      p.baseSalary  || 0,
      p.bonus       || 0,
      p.deductions  || 0,
      p.netSalary   || 0,
      p.approvalStatus || 'DRAFT',
      p.isPaid ? 'Yes' : 'No',
      p.month,
    ]);
    const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `payroll-${filterMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Payroll exported');
  };

  // ── Client-side filtering ───────────────────────────────────────────────────
  const filteredPayrolls = payrolls.filter((p) => {
    const fullName = `${p.staffId?.firstName || ''} ${p.staffId?.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (p.staffId?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid'     && p.isPaid) ||
      (filterStatus === 'unpaid'   && !p.isPaid) ||
      (p.approvalStatus || 'DRAFT') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading && payrolls.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-600 font-medium">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Payroll Management</h1>
              <p className="text-slate-600">
                {isHR ? 'Prepare and submit payroll drafts for approval' :
                 isManager ? 'Approve or reject submitted payroll entries' :
                 isAccountant ? 'Execute approved payroll payments' :
                 'View payroll records'}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} /> Create Payroll
              </button>
            )}
          </div>

          {/* Stat Cards */}
          {pagination.totals && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={<DollarSign className="text-green-600" size={24} />} label="Total Net Salary"
                value={`ETB ${(pagination.totals.totalNetSalary || 0).toLocaleString()}`} bg="bg-green-50" />
              <StatCard icon={<Users className="text-blue-600" size={24} />} label="Staff Count"
                value={pagination.total || 0} bg="bg-blue-50" />
              <StatCard icon={<CheckCircle2 className="text-emerald-600" size={24} />} label="Paid"
                value={pagination.totals.paidCount || 0} bg="bg-emerald-50" />
              <StatCard icon={<Clock className="text-amber-600" size={24} />} label="Pending"
                value={pagination.totals.pendingCount || 0} bg="bg-amber-50" />
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Month</label>
              <input
                type="month" value={filterMonth}
                onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PAID">Paid</option>
                <option value="paid">Payment Done</option>
                <option value="unpaid">Payment Pending</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text" placeholder="Search by name or email..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button onClick={fetchPayrolls}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                <RefreshCw size={16} /> Refresh
              </button>
              <button onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  {['Staff', 'Department', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Approval', 'Paid', 'Actions'].map((h) => (
                    <th key={h} className={`px-6 py-4 font-bold text-slate-700 ${
                      ['Base Salary', 'Bonus', 'Deductions', 'Net Salary'].includes(h) ? 'text-right' :
                      ['Approval', 'Paid', 'Actions'].includes(h) ? 'text-center' : 'text-left'
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <AlertCircle className="mx-auto mb-3 text-slate-400" size={40} />
                      <p className="text-slate-700 font-semibold text-lg mb-2">No payroll records found for this month</p>
                      <p className="text-slate-500 text-sm mb-6">Payroll draft has not been initialized for {filterMonth} yet.</p>
                      {canCreate && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          <Plus size={20} /> Create Payroll for {filterMonth}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPayrolls.map((payroll) => (
                    <tr key={payroll._id} className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {payroll.staffId?.firstName} {payroll.staffId?.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{payroll.staffId?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{payroll.staffId?.department || 'N/A'}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        ETB {(payroll.baseSalary || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        +ETB {(payroll.bonus || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">
                        -ETB {(payroll.deductions || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-base">
                        ETB {(payroll.netSalary || 0).toLocaleString()}
                      </td>

                      {/* Approval Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          APPROVAL_STYLES[payroll.approvalStatus || 'DRAFT']
                        }`}>
                          {payroll.approvalStatus || 'DRAFT'}
                        </span>
                      </td>

                      {/* Paid Status */}
                      <td className="px-6 py-4 text-center">
                        {payroll.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle2 size={14} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                            <Clock size={14} /> Pending
                          </span>
                        )}
                      </td>

                      {/* Actions — role-aware */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">

                          {/* View — everyone */}
                          <button
                            onClick={() => { setSelectedPayroll(payroll); setShowViewModal(true); }}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* HR: Submit draft for approval */}
                          {isHR && payroll.approvalStatus === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForApproval(payroll._id)}
                              className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600"
                              title="Submit for approval"
                            >
                              <Send size={16} />
                            </button>
                          )}

                          {/* Manager: Approve pending */}
                          {isManager && payroll.approvalStatus === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(payroll._id)}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                              title="Approve"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          {/* Manager: Reject pending */}
                          {isManager && payroll.approvalStatus === 'PENDING' && (
                            <button
                              onClick={() => handleReject(payroll._id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          )}

                          {/* Accountant: Mark paid (APPROVED only) */}
                          {isAccountant && payroll.approvalStatus === 'APPROVED' && !payroll.isPaid && (
                            <button
                              onClick={() => handleMarkAsPaid(payroll._id)}
                              disabled={submitting}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600 disabled:opacity-50"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          {/* HR / Manager: Edit DRAFT or REJECTED payrolls */}
                          {canCreate && ['DRAFT', 'REJECTED'].includes(payroll.approvalStatus || 'DRAFT') && (
                            <button
                              onClick={() => { setSelectedPayroll(payroll); setShowEditModal(true); }}
                              className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {/* Manager: Delete DRAFT or REJECTED payrolls */}
                          {isManager && ['DRAFT', 'REJECTED'].includes(payroll.approvalStatus || 'DRAFT') && (
                            <button
                              onClick={() => handleDeletePayroll(payroll._id)}
                              disabled={submitting}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {canCreate && showCreateModal && (
        <CreatePayrollModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchPayrolls(); fetchStats(); }}
          defaultMonth={filterMonth}
        />
      )}

      {showViewModal && selectedPayroll && (
        <ViewPayrollModal
          payroll={selectedPayroll}
          onClose={() => { setShowViewModal(false); setSelectedPayroll(null); }}
          onMarkAsPaid={() => handleMarkAsPaid(selectedPayroll._id)}
          isSubmitting={submitting}
          canPay={isAccountant && selectedPayroll?.approvalStatus === 'APPROVED'}
        />
      )}

      {canCreate && showEditModal && selectedPayroll && (
        <EditPayrollModal
          payroll={selectedPayroll}
          onClose={() => { setShowEditModal(false); setSelectedPayroll(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedPayroll(null); fetchPayrolls(); fetchStats(); }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, bg }) => (
  <div className={`${bg} rounded-lg p-4 border border-slate-200`}>
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Modal wrapper
// ─────────────────────────────────────────────────────────────────────────────
const Modal = ({ onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CreatePayrollModal
// ─────────────────────────────────────────────────────────────────────────────
const CreatePayrollModal = ({ onClose, onSuccess, defaultMonth }) => {
  const [month, setMonth]               = useState(defaultMonth);
  const [staffList, setStaffList]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [baseSalaryMap, setBaseSalaryMap] = useState({});
  const [bonusMap, setBonusMap]         = useState({});
  const [deductionsMap, setDeductionsMap] = useState({});

  useEffect(() => {
    const fetchActiveStaff = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users', { params: { excludeRole: 'CUSTOMER', isActive: 'true' } });
        const staff = response.data.users || response.data || [];
        setStaffList(staff);
        const sb = {};
        const ib = {};
        const id = {};
        staff.forEach((s) => {
          sb[s._id] = s.baseSalary || 0;
          ib[s._id] = 0;
          id[s._id] = 0;
        });
        setBaseSalaryMap(sb);
        setBonusMap(ib);
        setDeductionsMap(id);
      } catch (err) {
        toast.error('Failed to load payroll-eligible employee list');
      } finally {
        setLoading(false);
      }
    };
    fetchActiveStaff();
  }, []);

  const handleNumericChange = (staffId, field, value) => {
    const n = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    if (field === 'salary') setBaseSalaryMap((p) => ({ ...p, [staffId]: n }));
    else if (field === 'bonus') setBonusMap((p) => ({ ...p, [staffId]: n }));
    else setDeductionsMap((p) => ({ ...p, [staffId]: n }));
  };

  const calcNet = (baseSalary, staffId) => {
    const salary = baseSalaryMap[staffId] ?? baseSalary;
    return (salary || 0) + (bonusMap[staffId] || 0) - (deductionsMap[staffId] || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (staffList.length === 0) return toast.error('No staff records found.');
    setSubmitting(true);
    const toastId = toast.loading('Creating payroll...');
    try {
      const response = await apiClient.post('/payroll/monthly/create', { month, baseSalaryMap, bonusMap, deductionsMap });
      toast.success(`Payroll created for ${month}`, { id: toastId });
      onSuccess(response.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create payroll', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal onClose={onClose} title="Create Monthly Payroll">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Create Monthly Payroll" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Month</label>
          <input
            type="month" value={month} onChange={(e) => setMonth(e.target.value)} required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {staffList.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <AlertCircle size={20} />
            <p className="font-medium">No active staff members found.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto border border-slate-300 rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  {['Staff', 'Base Salary (ETB)', 'Bonus (ETB)', 'Deductions (ETB)', 'Net'].map((h) => (
                    <th key={h} className={`px-4 py-3 font-semibold text-slate-700 ${h === 'Staff' ? 'text-left' : 'text-right'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{staff.firstName} {staff.lastName}</p>
                      <p className="text-xs text-slate-500">{staff.department || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={baseSalaryMap[staff._id] ?? ''}
                          onChange={(e) => handleNumericChange(staff._id, 'salary', e.target.value)}
                          className="w-full px-3 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Percent size={13} className="absolute left-2 top-2 text-green-500" />
                        <input
                          type="number" min="0" placeholder="0"
                          value={bonusMap[staff._id] ?? ''}
                          onChange={(e) => handleNumericChange(staff._id, 'bonus', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <ShieldAlert size={13} className="absolute left-2 top-2 text-red-400" />
                        <input
                          type="number" min="0" placeholder="0"
                          value={deductionsMap[staff._id] ?? ''}
                          onChange={(e) => handleNumericChange(staff._id, 'deductions', e.target.value)}
                          className="w-full pl-7 pr-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ETB {calcNet(staff.baseSalary, staff._id).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-all">
            Cancel
          </button>
          <button type="submit" disabled={submitting || staffList.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all">
            {submitting ? 'Creating...' : 'Create Payroll'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ViewPayrollModal
// ─────────────────────────────────────────────────────────────────────────────
const ViewPayrollModal = ({ payroll, onClose, onMarkAsPaid, isSubmitting, canPay }) => (
  <Modal onClose={onClose} title="Payroll Details">
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DetailItem label="Staff Name"  value={`${payroll.staffId?.firstName || ''} ${payroll.staffId?.lastName || ''}`} />
        <DetailItem label="Month"       value={payroll.month} />
        <DetailItem label="Department"  value={payroll.staffId?.department || 'N/A'} />
        <DetailItem label="Email"       value={payroll.staffId?.email || 'N/A'} />
        <DetailItem label="Approval"    value={
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            APPROVAL_STYLES[payroll.approvalStatus || 'DRAFT']
          }`}>
            {payroll.approvalStatus || 'DRAFT'}
          </span>
        } />
        {payroll.rejectedReason && (
          <DetailItem label="Rejection Reason" value={payroll.rejectedReason} />
        )}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="font-bold text-slate-900 mb-4">Salary Breakdown</h3>
        <div className="space-y-3">
          <SalaryRow label="Base Salary" value={payroll.baseSalary} />
          <SalaryRow label="Bonus"       value={payroll.bonus}      isPositive />
          <SalaryRow label="Deductions"  value={payroll.deductions} isNegative />
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-sm text-slate-600">Net Salary</p>
            <p className="text-2xl font-bold text-blue-600">ETB {(payroll.netSalary || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="font-bold text-slate-900 mb-3">Payment Status</h3>
        {payroll.isPaid ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} />
              Paid{payroll.paidAt ? ` on ${new Date(payroll.paidAt).toLocaleDateString()}` : ''}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-700 font-semibold flex items-center gap-2 mb-3">
              <Clock size={18} /> Pending Payment
            </p>
            {canPay && (
              <button
                onClick={onMarkAsPaid} disabled={isSubmitting}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-all"
              >
                {isSubmitting ? 'Processing...' : 'Mark as Paid'}
              </button>
            )}
            {!canPay && payroll.approvalStatus !== 'APPROVED' && (
              <p className="text-xs text-amber-600 font-medium">
                Payment requires Manager approval first
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button onClick={onClose} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all">
          Close
        </button>
      </div>
    </div>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// EditPayrollModal
// ─────────────────────────────────────────────────────────────────────────────
const EditPayrollModal = ({ payroll, onClose, onSuccess }) => {
  const [bonus, setBonus]           = useState(payroll.bonus || 0);
  const [deductions, setDeductions] = useState(payroll.deductions || 0);
  const [submitting, setSubmitting] = useState(false);

  const netSalary = (payroll.baseSalary || 0) + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Updating payroll...');
    try {
      await apiClient.put(`/payroll/${payroll._id}`, {
        bonus:      parseFloat(bonus)      || 0,
        deductions: parseFloat(deductions) || 0,
      });
      toast.success('Payroll updated', { id: toastId });
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update payroll', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Payroll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <DetailItem label="Staff"       value={`${payroll.staffId?.firstName || ''} ${payroll.staffId?.lastName || ''}`} />
        <DetailItem label="Base Salary" value={`ETB ${(payroll.baseSalary || 0).toLocaleString()}`} />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Bonus (ETB)</label>
          <input type="number" min="0" step="0.01" value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Deductions (ETB)</label>
          <input type="number" min="0" step="0.01" value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Estimated Net Salary</p>
          <p className="text-2xl font-bold text-blue-600">ETB {netSalary.toLocaleString()}</p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-all">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold flex items-center gap-2 transition-all">
            <Save size={16} />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────────────────────
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">{label}</p>
    <p className="text-slate-900 font-medium">{value}</p>
  </div>
);

const SalaryRow = ({ label, value, isPositive, isNegative }) => {
  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-900';
  const sign  = isPositive ? '+' : isNegative ? '-' : '';
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-slate-700 font-medium">{label}</p>
      <p className={`font-bold text-lg ${color}`}>
        {sign}ETB {Math.abs(value || 0).toLocaleString()}
      </p>
    </div>
  );
};



export default PayrollPage;
