import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Calendar, Users, BedDouble, ChevronDown } from 'lucide-react';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const inputVariants = {
  focus: { scale: 1.02, boxShadow: '0 0 0 2px rgba(242,183,5,0.5)' },
};

export default function Booking() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState('SINGLE');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleBookNow = async () => {
    // Validate inputs
    if (!checkIn || !checkOut) {
      showToast.error('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      showToast.error('Check-out date must be after check-in date');
      return;
    }

    if (!guests || guests < 1) {
      showToast.error('Please select number of guests');
      return;
    }

    // Check if user is logged in
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Searching for available rooms...', {
      style: {
        background: '#6b7280',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
      },
    });

    try {
      const response = await apiClient.get('/rooms', {
        params: {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: guests,
          type: roomType,   // FIX: backend reads `type`, not `roomType`
        },
      });

      toast.dismiss(toastId);

      // Filter to only truly available rooms
      const availableRooms = (response.data.rooms || []).filter(
        (r) => r.isAvailable !== false && r.status === 'AVAILABLE'
      );

      if (availableRooms.length > 0) {
        showToast.success(`Found ${availableRooms.length} available room(s)`);
        navigate('/reservations', {
          state: { checkIn, checkOut, guests, roomType, availableRooms },
        });
      } else {
        showToast.error('No rooms available for the selected dates');
      }
    } catch (error) {
      toast.dismiss(toastId);
      showToast.error(error.response?.data?.message || 'Failed to search rooms');
    } finally {
      setLoading(false);
    }
  };

  const getRoomTypeOptions = () => {
    return [
      { value: 'SINGLE', label: 'Single Room' },
      { value: 'DOUBLE', label: 'Double Room' },
      { value: 'SUITE', label: 'Suite' },
      { value: 'DELUXE', label: 'Deluxe Suite' },
    ];
  };

  return (
    <section id="booking" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="bg-[#F5F5F2] rounded-card shadow-soft p-8 md:p-12 border border-[#E8ECE7]"
        >
          {/* Section Heading */}
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
              Reserve Your <span className="text-gold italic font-serif">Stay</span>
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Book directly for the best rates and exclusive luxury perks.
            </p>
          </div>

          {/* Booking Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {/* Check In */}
            <motion.div
              whileFocus="focus"
              variants={inputVariants}
              className="relative bg-white rounded-input px-5 py-4 shadow-soft border border-[#E8ECE7] transition-all duration-300"
            >
              <label className="flex items-center gap-2 text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                <Calendar size={14} className="text-primary" />
                Check‑in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckIn(val);
                  if (checkOut && new Date(checkOut) <= new Date(val)) {
                    const nextDay = new Date(val);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOut(nextDay.toISOString().split('T')[0]);
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full text-text-primary font-medium bg-transparent outline-none cursor-pointer"
                style={{ colorScheme: 'light' }}
                disabled={loading}
              />
            </motion.div>

            {/* Check Out */}
            <motion.div
              whileFocus="focus"
              variants={inputVariants}
              className="relative bg-white rounded-input px-5 py-4 shadow-soft border border-[#E8ECE7] transition-all duration-300"
            >
              <label className="flex items-center gap-2 text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                <Calendar size={14} className="text-primary" />
                Check‑out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={
                  checkIn
                    ? (() => {
                      const d = new Date(checkIn);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().split('T')[0];
                    })()
                    : new Date().toISOString().split('T')[0]
                }
                className="w-full text-text-primary font-medium bg-transparent outline-none cursor-pointer"
                style={{ colorScheme: 'light' }}
                disabled={loading}
              />
            </motion.div>

            {/* UPDATED: Guests Dropdown Container */}
            <motion.div
              whileFocus="focus"
              variants={inputVariants}
              className="relative bg-white rounded-input px-5 py-4 shadow-soft border border-[#E8ECE7] transition-all duration-300 flex flex-col justify-between"
            >
              <label className="flex items-center gap-2 text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                <Users size={14} className="text-primary" />
                Guests
              </label>
              <div className="relative flex items-center w-full">
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full text-center pr-8 pl-2 font-serif text-text-primary font-medium bg-transparent outline-none cursor-pointer appearance-none tracking-wide focus:outline-none"
                  disabled={loading}
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num} className="bg-white text-text-primary text-center">
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-1 text-text-secondary pointer-events-none"
                />
              </div>
            </motion.div>

            {/* UPDATED: Room Type Dropdown Container */}
            <motion.div
              whileFocus="focus"
              variants={inputVariants}
              className="relative bg-white rounded-input px-5 py-4 shadow-soft border border-[#E8ECE7] transition-all duration-300 flex flex-col justify-between"
            >
              <label className="flex items-center gap-2 text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                <BedDouble size={14} className="text-primary" />
                Room
              </label>
              <div className="relative flex items-center w-full">
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full text-center pr-8 pl-2 font-serif text-text-primary font-medium bg-transparent outline-none cursor-pointer appearance-none tracking-wide focus:outline-none"
                  disabled={loading}
                >
                  {getRoomTypeOptions().map((option) => (
                    <option key={option.value} value={option.value} className="bg-white text-text-primary text-center">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-1 text-text-secondary pointer-events-none"
                />
              </div>
            </motion.div>
          </div>

          {/* Book Now Button */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={handleBookNow}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.04, boxShadow: loading ? 'none' : '0 12px 35px rgba(212,175,55,0.4)' }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="bg-gold text-white px-10 py-3 rounded-full font-bold text-lg tracking-wide shadow-lg shadow-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? '⏳ Searching...' : 'Book Now'}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}