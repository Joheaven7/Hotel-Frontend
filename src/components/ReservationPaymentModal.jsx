import React, { useState } from 'react';
import { X, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import Modal from './ui/Modal';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

const ReservationPaymentModal = ({ isOpen, onClose, reservation, onPaymentSuccess }) => {
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('CHAPA');
  const [loading, setLoading] = useState(false);

  if (!reservation) return null;

  const totalPrice = reservation.totalPrice || 0;

  const handleChapaPayment = async () => {
    setLoading(true);
    const toastId = toast.loading('Redirecting to Chapa...');
    try {
      const response = await apiClient.post('/payments/chapa/initiate', {
        reservationId:  reservation._id,
        amount:         totalPrice,
        customerEmail:  user?.email,
        customerPhone:  user?.phone,
        customerName:   `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      });
      toast.dismiss(toastId);
      const checkoutUrl = response.data?.checkout_url;
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        onPaymentSuccess?.();
        onClose();
      } else {
        toast.error('No checkout URL received from Chapa');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate Chapa payment', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = () => {
    toast.success('Cash payment noted. Please pay at the front desk.');
    onPaymentSuccess?.();
    onClose();
  };

  const handlePay = () => {
    // Prevent duplicate submissions
    if (loading) return;
    
    if (paymentMethod === 'CHAPA') {
      handleChapaPayment();
    } else {
      handleCashPayment();
    }
  };

  const PAYMENT_METHODS = [
    {
      id:    'CHAPA',
      name:  'Chapa Online',
      desc:  'Pay securely via Chapa (card, mobile money)',
      icon:  CreditCard,
    },
    {
      id:    'CASH',
      name:  'Cash at Hotel',
      desc:  'Pay in person at the front desk on arrival',
      icon:  Banknote,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="md">
      <div className="space-y-6">

        {/* Reservation summary */}
        <div className="bg-background rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Reservation Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Booking #</span>
              <span className="font-semibold text-text-primary">{reservation.reservationNumber || reservation._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Check-in</span>
              <span className="font-medium text-text-primary">
                {new Date(reservation.checkInDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Check-out</span>
              <span className="font-medium text-text-primary">
                {new Date(reservation.checkOutDate).toLocaleDateString()}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="font-semibold text-text-primary">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                ETB {totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment method selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Payment Method</h3>
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const selected = paymentMethod === method.id;
            return (
              <label
                key={method.id}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selected}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-2 rounded-lg ${selected ? 'bg-primary/10 text-primary' : 'bg-background text-text-secondary'}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-text-primary'}`}>
                    {method.name}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{method.desc}</p>
                </div>
                {selected && (
                  <CheckCircle size={18} className="text-primary shrink-0" />
                )}
              </label>
            );
          })}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-xl font-semibold transition-all shadow-soft disabled:cursor-not-allowed"
        >
          {loading
            ? 'Processing...'
            : paymentMethod === 'CHAPA'
              ? `Pay ETB ${totalPrice.toLocaleString()} via Chapa`
              : 'Confirm — Pay at Hotel'
          }
        </button>

        <p className="text-xs text-text-secondary text-center">
          Your payment information is secure and encrypted
        </p>
      </div>
    </Modal>
  );
};

export default ReservationPaymentModal;