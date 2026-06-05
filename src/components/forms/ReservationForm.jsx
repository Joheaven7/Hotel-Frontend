import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Users, ChevronRight, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';

const ReservationForm = ({ roomId, onSuccess }) => {
  const [formData, setFormData] = useState({
    checkInDate:    '',
    checkOutDate:   '',
    numberOfGuests: 1,
    specialRequests: '',
  });
  const [loading, setLoading]         = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);

  useEffect(() => {
    if (roomId) fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    setRoomLoading(true);
    try {
      const response = await apiClient.get(`/rooms/${roomId}`);
      setRoomDetails(response.data.room || response.data);
    } catch (error) {
      toast.error('Failed to load room details');
    } finally {
      setRoomLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotalPrice = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !roomDetails) return 0;
    const nights = Math.ceil(
      (new Date(formData.checkOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights * roomDetails.pricePerNight : 0;
  };

  const nights = formData.checkInDate && formData.checkOutDate
    ? Math.ceil((new Date(formData.checkOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const totalPrice = calculateTotalPrice();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.checkInDate || !formData.checkOutDate) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (new Date(formData.checkInDate) >= new Date(formData.checkOutDate)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }
    const maxGuests = roomDetails?.capacity || 4;
    if (formData.numberOfGuests < 1 || formData.numberOfGuests > maxGuests) {
      toast.error(`Please select between 1 and ${maxGuests} guests`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Processing your booking...');
    try {
      const response = await apiClient.post('/reservations', {
        roomId,
        checkInDate:     formData.checkInDate,
        checkOutDate:    formData.checkOutDate,
        numberOfGuests:  parseInt(formData.numberOfGuests),
        specialRequests: formData.specialRequests,
      });

      toast.success('Booking confirmed! Check your email for details.', { id: toastId });

      setFormData({
        checkInDate: '', checkOutDate: '', numberOfGuests: 1, specialRequests: '',
      });

      onSuccess?.(response.data.reservation);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to create reservation',
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Book This Room</h2>

      {/* Room info banner */}
      {roomLoading ? (
        <div className="h-14 bg-background rounded-xl border border-border animate-pulse" />
      ) : roomDetails ? (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{roomDetails.type}</span> Room &nbsp;·&nbsp;
            Max {roomDetails.capacity} guests &nbsp;·&nbsp;
            <span className="text-primary font-semibold">ETB {(roomDetails.pricePerNight || 0).toLocaleString()}/night</span>
          </p>
        </div>
      ) : null}

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            <Calendar size={14} className="text-primary" /> Check-in
          </label>
          <input
            type="date" name="checkInDate"
            value={formData.checkInDate}
            min={today}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-primary bg-background"
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            <Calendar size={14} className="text-primary" /> Check-out
          </label>
          <input
            type="date" name="checkOutDate"
            value={formData.checkOutDate}
            min={formData.checkInDate || today}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-primary bg-background"
            required
          />
        </div>
      </div>

      {/* Guests */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
          <Users size={14} className="text-primary" /> Guests
        </label>
        <select
          name="numberOfGuests"
          value={formData.numberOfGuests}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-primary bg-background"
        >
          {Array.from({ length: roomDetails?.capacity || 6 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
          ))}
        </select>
      </div>

      {/* Special requests */}
      <div>
        <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Special Requests <span className="normal-case font-normal text-text-secondary">(optional)</span>
        </label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests}
          onChange={handleChange}
          placeholder="Late check-in, high floor, dietary needs..."
          className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-primary bg-background resize-none"
          rows={3}
        />
      </div>

      {/* Price summary */}
      {nights > 0 && roomDetails && (
        <div className="bg-background rounded-xl border border-border p-4 space-y-2 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>{nights} night{nights !== 1 ? 's' : ''} × ETB {(roomDetails.pricePerNight || 0).toLocaleString()}</span>
            <span className="font-semibold text-text-primary">ETB {(nights * roomDetails.pricePerNight).toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between items-center">
            <span className="font-semibold text-text-primary">Total Price</span>
            <span className="text-2xl font-bold text-primary">ETB {totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-xl font-semibold transition-all shadow-soft disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Processing...</>
        ) : (
          <>Complete Booking <ChevronRight size={18} /></>
        )}
      </button>

      <p className="text-xs text-text-secondary text-center">
        You'll receive a confirmation email with all booking details
      </p>
    </form>
  );
};

export default ReservationForm;