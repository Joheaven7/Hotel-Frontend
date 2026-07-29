import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BedDouble, Calendar, Users, CreditCard, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';

export default function BookingConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reservationData = location.state;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '', // Required for public booking
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);

  // If no reservation data in state, redirect back
  if (!reservationData) {
    navigate('/rooms', { replace: true });
    return null;
  }

  const { guests, roomTypeId, hallTypeId, category } = reservationData;
  const isRoom = category === 'ROOM';

  // Resolve dates based on category
  const checkInDateVal = isRoom ? reservationData.checkIn : `${reservationData.eventDate}T${reservationData.startTime}`;
  const checkOutDateVal = isRoom ? reservationData.checkOut : `${reservationData.eventDate}T${reservationData.endTime}`;

  // Resolve price from the available unit — field varies by model
  const unit = reservationData.availableUnits?.[0];
  const rate = unit?.pricePerNight || unit?.roomTypeId?.basePricePerNight || unit?.pricePerHour || unit?.hallTypeId?.basePricePerHour || unit?.price || 0;

  let nightsOrHours = 0;
  if (isRoom) {
    nightsOrHours = Math.ceil((new Date(checkOutDateVal) - new Date(checkInDateVal)) / (1000 * 60 * 60 * 24));
  } else {
    const diffMs = new Date(checkOutDateVal) - new Date(checkInDateVal);
    nightsOrHours = Math.max(0, diffMs / (1000 * 60 * 60));
  }

  const total = nightsOrHours * rate;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading('Initiating secure payment...', {
      style: { background: '#111', color: '#fff' }
    });

    try {
      // 1. Create reservation (PENDING) and initiate payment via Chapa
      const payload = {
        // Reservation details
        category,
        roomTypeId,
        hallTypeId,
        checkInDate: checkInDateVal,
        checkOutDate: checkOutDateVal,
        numberOfGuests: guests,
        specialRequests: formData.specialRequests,
        // Guest details
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        idNumber: formData.idNumber,
        // The API will create the payment intent internally
        amount: total
      };

      // Call the public reservation endpoint
      const response = await apiClient.post('/reservations/public', payload);
      
      toast.dismiss(toastId);
      showToast.success('Reservation created. Redirecting to payment...');
      
      // Redirect to Chapa checkout
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      toast.dismiss(toastId);
      showToast.error(error.response?.data?.message || 'Failed to process booking');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-[#F2B705] transition-colors mb-8 font-['Inter'] text-sm tracking-widest uppercase"
        >
          <ChevronLeft size={16} /> Back to Search
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-black flex items-center justify-center rounded-full border border-[#F2B705]/30">
            <CreditCard className="text-[#F2B705]" size={20} />
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] text-4xl text-text-primary">Confirm Your Stay</h1>
            <p className="font-['Inter'] text-text-secondary mt-1">Complete guest details to finalize your reservation.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Guest Details Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-black/5 shadow-soft">
              <h2 className="font-['Playfair_Display'] text-2xl text-text-primary mb-6">Guest Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-black/5 border border-transparent focus:border-[#F2B705] rounded-xl px-4 py-3 font-['Inter'] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-black/5 border border-transparent focus:border-[#F2B705] rounded-xl px-4 py-3 font-['Inter'] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-black/5 border border-transparent focus:border-[#F2B705] rounded-xl px-4 py-3 font-['Inter'] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-black/5 border border-transparent focus:border-[#F2B705] rounded-xl px-4 py-3 font-['Inter'] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">National ID / Passport Number *</label>
                <input
                  type="text"
                  name="idNumber"
                  required
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className="w-full bg-black/5 border border-transparent focus:border-[#F2B705] rounded-xl px-4 py-3 font-['Inter'] outline-none transition-all"
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Special Requests (Optional)</label>
                <textarea
                  name="specialRequests"
                  rows="3"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  className="w-full bg-black/5 border border-transparent focus:border-[#F2B705] rounded-xl px-4 py-3 font-['Inter'] outline-none transition-all resize-none"
                  placeholder="E.g. Early check-in, dietary requirements..."
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2 bg-[#F2B705] text-[#0F5B4F] font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl disabled:opacity-50 transition-all"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </motion.button>
              <p className="text-center text-xs text-text-secondary mt-4">
                You will be redirected to Chapa to complete your payment securely.
              </p>
            </form>
          </div>

          {/* Booking Summary */}
          <div>
            <div className="bg-[#0A0A0A] rounded-2xl p-8 border border-[#F2B705]/20 text-white sticky top-24">
              <h3 className="font-['Playfair_Display'] text-2xl mb-6 text-[#F2B705]">Booking Summary</h3>
              
              <div className="space-y-4 mb-8">
                {isRoom ? (
                  <>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <Calendar size={16} className="text-[#F2B705]" /> Check-in
                      </div>
                      <span className="font-semibold">{new Date(checkInDateVal).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <Calendar size={16} className="text-[#F2B705]" /> Check-out
                      </div>
                      <span className="font-semibold">{new Date(checkOutDateVal).toLocaleDateString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <Calendar size={16} className="text-[#F2B705]" /> Event Date
                      </div>
                      <span className="font-semibold">{new Date(reservationData.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <Calendar size={16} className="text-[#F2B705]" /> Time Slot
                      </div>
                      <span className="font-semibold">{reservationData.startTime} - {reservationData.endTime}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3 text-white/70 text-sm">
                    <Users size={16} className="text-[#F2B705]" /> Guests
                  </div>
                  <span className="font-semibold">{guests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 text-white/70 text-sm">
                    <BedDouble size={16} className="text-[#F2B705]" /> {isRoom ? 'Nights' : 'Hours'}
                  </div>
                  <span className="font-semibold">{nightsOrHours}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white/70 text-sm">Rate per {isRoom ? 'night' : 'hour'}</span>
                  <span className="font-semibold">ETB {rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-white/10 mt-4">
                  <span className="text-white font-bold text-lg">Total</span>
                  <span className="text-[#F2B705] font-bold text-2xl">ETB {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
