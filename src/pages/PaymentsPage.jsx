import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X, DollarSign, Download, Eye, AlertCircle, CreditCard, ExternalLink, FileDown } from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';

const canManagePayments = (role) => ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(role);

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || '';
  const isManager = canManagePayments(role);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0, totalRevenue: 0 });

  useEffect(() => { fetchPayments(); }, []);

  const location = useLocation();
  const [urlSearch, setUrlSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setUrlSearch(q);
  }, [location.search]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments');
      const allPayments = response.data.payments || response.data || [];
      setPayments(allPayments);
      setStats({
        total: allPayments.length,
        paid: allPayments.filter((p) => p.status === 'PAID').length,
        pending: allPayments.filter((p) => p.status === 'PENDING').length,
        failed: allPayments.filter((p) => p.status === 'FAILED').length,
        totalRevenue: allPayments
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
      });
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId, method = 'CASH') => {
    setActionLoading(`${paymentId}-paid`);
    const toastId = toast.loading('Processing payment...');
    try {
      await apiClient.put(`/payments/${paymentId}/paid`, { paymentMethod: method });
      toast.success('Payment marked as paid!', { id: toastId });
      fetchPayments();
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as paid', { id: toastId });
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkAsFailed = async (paymentId) => {
    setActionLoading(`${paymentId}-failed`);
    const toastId = toast.loading('Updating status...');
    try {
      await apiClient.put(`/payments/${paymentId}/failed`, { failureReason: 'Declined by manager' });
      toast.error('Payment marked as failed', { id: toastId });
      fetchPayments();
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment', { id: toastId });
    } finally {
      setActionLoading('');
    }
  };

  const handleInitiateChapa = async (payment) => {
    // Prevent duplicate initiation
    if (actionLoading === `${payment._id}-chapa`) return;
    
    const toastId = toast.loading('Redirecting to payment...');
    setActionLoading(`${payment._id}-chapa`);
    try {
      const res = await apiClient.post('/payments/chapa/initiate', {
        reservationId: payment.reservation?._id || payment.reservation,
        amount: payment.amount,
        customerEmail: payment.customerEmail || user?.email,
        customerPhone: payment.customerPhone || user?.phone,
        customerName: payment.customerName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      });
      toast.dismiss(toastId);
      const url = res.data?.checkout_url;
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('No checkout URL received');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Payment initiation failed';
      toast.error(errMsg, { id: toastId });
    } finally {
      setActionLoading('');
    }
  };

  const handleDownloadInvoice = async (paymentId, paymentNumber) => {
    try {
      const response = await apiClient.get(`/invoices/${paymentId}?download=true`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LuxStay_Invoice_${paymentNumber || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  const handleExport = () => {
    if (!payments.length) { toast.error('No payments to export'); return; }
    const csv = [
      ['Payment #', 'Reservation', 'Amount (ETB)', 'Currency', 'Method', 'Status', 'Customer', 'Date'].join(','),
      ...payments.map((p) => [
        p.paymentNumber || p._id?.slice(-8),
        p.reservation?.reservationNumber || 'N/A',
        p.amount,
        p.currency || 'ETB',
        p.paymentMethod || 'N/A',
        p.status,
        p.customerName || p.customerEmail || 'N/A',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Exported successfully');
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Payment #',
      accessor: (row) => (
        <span className="font-mono text-xs font-semibold text-text-primary">
          {row.paymentNumber || row._id?.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Reservation',
      accessor: (row) => (
        <span className="text-sm text-text-secondary">
          {row.reservation?.reservationNumber || 'N/A'}
        </span>
      ),
    },
    ...(isManager ? [{
      header: 'Customer',
      accessor: (row) => (
        <div>
          <p className="font-medium text-text-primary text-sm">{row.customerName || 'N/A'}</p>
          <p className="text-xs text-text-secondary">{row.customerEmail || ''}</p>
        </div>
      ),
    }] : []),
    {
      header: 'Amount',
      accessor: (row) => (
        <span className="font-bold text-primary">
          ETB {(row.amount || 0).toLocaleString()} {row.currency !== 'ETB' ? `(${row.currency})` : ''}
        </span>
      ),
    },
    {
      header: 'Method',
      accessor: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20 uppercase">
          {row.paymentMethod || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge type={row.status?.toLowerCase()} />,
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-text-secondary">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setSelectedPayment(row); setIsDetailModalOpen(true); }}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-background transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>

          {row.status === 'PAID' && (
            <>
              <button
                onClick={() => navigate(`/invoices/${row._id}`)}
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                title="View Invoice"
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() => handleDownloadInvoice(row._id, row.paymentNumber)}
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                title="Download Invoice PDF"
              >
                <FileDown size={15} />
              </button>
            </>
          )}

          {row.status === 'PENDING' && (
            <button
              onClick={() => handleInitiateChapa(row)}
              disabled={actionLoading === `${row._id}-chapa`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Pay with Chapa"
            >
              <CreditCard size={13} /> {actionLoading === `${row._id}-chapa` ? 'Processing...' : 'Chapa Pay'}
            </button>
          )}

          {isManager && row.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleMarkAsPaid(row._id)}
                disabled={actionLoading === `${row._id}-paid`}
                className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                title="Mark as Paid"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => handleMarkAsFailed(row._id)}
                disabled={actionLoading === `${row._id}-failed`}
                className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                title="Mark as Failed"
              >
                <X size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isManager ? 'Payments Management' : 'My Payments'}
        subtitle={isManager ? 'Track, verify, and reconcile guest transactions' : 'View your payment history and complete pending payments'}
        breadcrumbs={[{ label: 'Home' }, { label: 'Payments' }]}
        action={
          isManager && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft"
            >
              <Download size={18} /> Export CSV
            </button>
          )
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-card shadow-soft p-5 border-t-4 border-primary">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-text-primary mt-2">{stats.total}</p>
        </div>
        <div className="bg-surface rounded-card shadow-soft p-5 border-t-4 border-success">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Paid</p>
          <p className="text-3xl font-bold text-success mt-2">{stats.paid}</p>
        </div>
        <div className="bg-surface rounded-card shadow-soft p-5 border-t-4 border-warning">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Pending</p>
          <p className="text-3xl font-bold text-warning mt-2">{stats.pending}</p>
        </div>
        {isManager ? (
          <div className="bg-surface rounded-card shadow-soft p-5 border-t-4 border-primary">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-primary mt-2">ETB {stats.totalRevenue.toLocaleString()}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-card shadow-soft p-5 border-t-4 border-error">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Failed</p>
            <p className="text-3xl font-bold text-error mt-2">{stats.failed}</p>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        searchPlaceholder="Search payment #, reservation, or customer..."
        searchValue={urlSearch}
        onSearchChange={setUrlSearch}
        pageSize={10}
        emptyMessage="No payments found."
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Payment — ${selectedPayment?.paymentNumber || selectedPayment?._id?.slice(-8).toUpperCase() || ''}`}
        size="lg"
        footer={
          <>
            {selectedPayment?.status === 'PENDING' && (
              <button
                onClick={() => handleInitiateChapa(selectedPayment)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors text-sm shadow-soft"
              >
                <CreditCard size={15} /> Pay with Chapa
              </button>
            )}

            {isManager && selectedPayment?.status === 'PENDING' && (
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => handleMarkAsPaid(selectedPayment._id)}
                  disabled={actionLoading === `${selectedPayment?._id}-paid`}
                  className="px-4 py-2 bg-success text-white rounded-btn font-medium hover:bg-success/90 transition-colors text-sm disabled:opacity-60"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => handleMarkAsFailed(selectedPayment._id)}
                  disabled={actionLoading === `${selectedPayment?._id}-failed`}
                  className="px-4 py-2 bg-error text-white rounded-btn font-medium hover:bg-error/90 transition-colors text-sm disabled:opacity-60"
                >
                  Mark as Failed
                </button>
              </div>
            )}

            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background transition-colors text-sm font-medium"
            >
              Close
            </button>

            {selectedPayment?.status === 'PAID' && (
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => { setIsDetailModalOpen(false); navigate(`/invoices/${selectedPayment._id}`); }}
                  className="flex items-center gap-2 px-3 py-2 border border-primary text-primary rounded-btn text-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  <Eye size={14} /> View Invoice
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedPayment._id, selectedPayment.paymentNumber)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <FileDown size={14} /> Download PDF
                </button>
              </div>
            )}
          </>
        }
      >
        {selectedPayment && (
          <div className="space-y-4">
            {selectedPayment.status === 'PENDING' && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Payment Awaiting Checkout</p>
                    <p className="text-xs text-text-secondary mt-0.5">Secure gateway checkout via Chapa is ready.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleInitiateChapa(selectedPayment)}
                  className="w-full sm:w-auto px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={13} /> Pay Securely Now
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Customer', value: selectedPayment.customerName || 'N/A' },
                { label: 'Email', value: selectedPayment.customerEmail || 'N/A' },
                { label: 'Reservation', value: selectedPayment.reservation?.reservationNumber || 'N/A' },
                { label: 'Amount', value: `ETB ${(selectedPayment.amount || 0).toLocaleString()}` },
                { label: 'Method', value: selectedPayment.paymentMethod || 'N/A' },
                { label: 'Created', value: selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl bg-background border border-border">
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-semibold text-text-primary text-sm">{value}</p>
                </div>
              ))}

              <div className="p-4 rounded-xl bg-background border border-border">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">Status</p>
                <StatusBadge type={selectedPayment.status?.toLowerCase()} />
              </div>

              {selectedPayment.paidAt && (
                <div className="p-4 rounded-xl bg-background border border-border">
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">Paid At</p>
                  <p className="font-semibold text-success text-sm">{new Date(selectedPayment.paidAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            {selectedPayment.paidAt && (
              <div className="bg-success/5 border border-success/20 p-4 rounded-xl flex items-center gap-3">
                <div className="p-1.5 bg-success/10 rounded-lg text-success shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-success">Payment Verified</p>
                  <p className="text-xs text-text-secondary mt-0.5">Confirmed on {new Date(selectedPayment.paidAt).toLocaleString()}</p>
                </div>
              </div>
            )}

            {selectedPayment.failureReason && (
              <div className="bg-error/5 border border-error/20 p-4 rounded-xl flex items-center gap-3">
                <div className="p-1.5 bg-error/10 rounded-lg text-error shrink-0">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-error">Payment Failed</p>
                  <p className="text-xs text-text-secondary mt-0.5">{selectedPayment.failureReason}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;