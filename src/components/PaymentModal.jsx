import React, { useState } from 'react';
import apiClient from '../services/api';
import { AlertCircle, Loader } from 'lucide-react';
import Modal from './Modal';

const PaymentModal = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'CASH',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post(`/payments/${payment._id}/mark-paid`, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Mark Payment as Paid" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="alert alert-danger flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Payment Amount:</span> ${payment.amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-semibold">Guest:</span> {payment.customerId?.firstName} {payment.customerId?.lastName}
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method *</label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Add any notes about this payment..."
            className="form-textarea"
          ></textarea>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-success flex-1 justify-center"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;