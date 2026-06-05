import React, { useState } from 'react';
import { FiCreditCard, FiLoader } from 'react-icons/fi';
import apiClient from '../../services/api';

const ChapaPayment = ({ reservationId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/payments/chapa/initiate', {
        reservationId,
        amount,
        customerEmail: localStorage.getItem('userEmail'),
        customerPhone: localStorage.getItem('userPhone'),
        customerName: localStorage.getItem('userName'),
      });

      if (response.data.checkout_url) {
        // Redirect to Chapa checkout
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Payment initiation failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <FiLoader className="animate-spin" size={18} />
            Processing...
          </>
        ) : (
          <>
            <FiCreditCard size={18} />
            Pay with Chapa ({amount} ETB)
          </>
        )}
      </button>
    </div>
  );
};

export default ChapaPayment;