import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../services/api';
import { dashboardService } from '../../services/dashboardService';
import { Star, Award, History, FileDown, AlertCircle, CalendarDays, CreditCard, Clock, MessageSquare } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import ComplaintForm from '../../components/ComplaintForm';

const CustomerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardService.getCustomerStats();
        setData(response);
      } catch (err) {
        setError('Failed to load your dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadInvoice = async (reservationId) => {
    try {
      const response = await apiClient.get(`/invoices/reservation/${reservationId}?download=true`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LuxStay_Invoice_${reservationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Invoice not available yet — payment may still be pending');
    }
  };

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error p-4 rounded-card flex items-center gap-3">
        <AlertCircle size={24} />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My LuxStay"
        subtitle="Your reservations, payments, and loyalty rewards"
        breadcrumbs={[{ label: 'Home' }, { label: 'Guest Dashboard' }]}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/reservations')}
              className="bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft text-sm"
            >
              + Book a Room
            </button>
            <button
              onClick={() => setComplaintOpen(true)}
              className="flex items-center gap-2 border border-border text-text-primary px-4 py-2 rounded-btn font-medium hover:bg-background transition-colors text-sm"
            >
              <MessageSquare size={15} /> Feedback
            </button>
          </div>
        }
      />

      {/* Complaint / Feedback Modal */}
      <Modal
        isOpen={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        title="Submit Feedback or Complaint"
        size="md"
      >
        <ComplaintForm
          onSuccess={() => setComplaintOpen(false)}
          onClose={() => setComplaintOpen(false)}
        />
      </Modal>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
        ) : (
          <>
            <StatCard
              title="Loyalty Points"
              value={(data?.stays?.points || 0).toLocaleString()}
              icon={Star}
              color="warning"
            />
            <StatCard
              title="Membership Tier"
              value={data?.stays?.tier || 'Member'}
              icon={Award}
              color="primary"
            />
            <StatCard
              title="Total Reservations"
              value={data?.totalReservations || 0}
              icon={CalendarDays}
              color="secondary"
            />
            <StatCard
              title="Total Payments"
              value={data?.totalPayments || 0}
              icon={CreditCard}
              color="success"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Stays */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Upcoming Stays</h3>
            <button
              onClick={() => navigate('/reservations')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all
            </button>
          </div>
          {loading ? (
            <CardSkeleton />
          ) : !(data?.stays?.upcoming?.length) ? (
            <div className="text-center py-8 text-text-secondary">
              <Clock size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No upcoming stays</p>
              <button
                onClick={() => navigate('/reservations')}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Book now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.stays.upcoming.map((stay) => (
                <div key={stay.id} className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{stay.room}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {stay.checkIn} → {stay.checkOut}
                      </p>
                    </div>
                    <StatusBadge type={stay.status} />
                  </div>
                  {stay.totalPrice > 0 && (
                    <p className="text-xs font-semibold text-primary mt-2">
                      ETB {stay.totalPrice.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings / Past Stays */}
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Recent Bookings</h3>
            <button
              onClick={() => navigate('/reservations')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all
            </button>
          </div>
          {loading ? (
            <CardSkeleton />
          ) : !(data?.stays?.past?.length) ? (
            <div className="text-center py-8 text-text-secondary">
              <History size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No past stays yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.stays.past.map((stay) => (
                <div key={stay.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{stay.room}</p>
                    <p className="text-xs text-text-secondary">{stay.checkIn} → {stay.checkOut}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <StatusBadge type={stay.status} />
                      {stay.amount > 0 && (
                        <p className="text-xs font-semibold text-text-secondary mt-1">
                          ETB {stay.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {['checked_out', 'completed'].includes(stay.status) && (
                      <button
                        onClick={() => handleDownloadInvoice(stay.id)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                        title="Download Invoice"
                      >
                        <FileDown size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      {!loading && data?.paymentSummary?.length > 0 && (
        <div className="bg-white rounded-card shadow-soft p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-text-primary">Payment Summary</h3>
            <button onClick={() => navigate('/payments')} className="text-sm text-primary hover:underline font-medium">
              View all payments
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.paymentSummary.map((s) => (
              <div key={s._id} className="p-3 rounded-xl border border-border bg-background text-center">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{s._id}</p>
                <p className="font-bold text-text-primary">{s.count}</p>
                <p className="text-xs text-text-secondary">ETB {(s.total || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;