import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, BedDouble, ChevronDown, Search, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function RoomBookingForm({ roomTypes }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);

  // Set default selected room type when roomTypes are loaded
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && !selectedType) {
      setSelectedType(roomTypes[0]._id);
    }
  }, [roomTypes, selectedType]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!selectedType) {
      showToast.error('Please select a room type');
      return;
    }
    if (!checkIn || !checkOut) {
      showToast.error('Please select check-in and check-out dates');
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      showToast.error('Check-out date must be after check-in date');
      return;
    }

    setLoading(true);
    setResult(null);

    const toastId = toast.loading('Checking room availability…', {
      style: { background: '#111', color: '#fff', borderRadius: '12px', border: '1px solid rgba(242,183,5,0.3)' },
    });

    try {
      const response = await apiClient.post('/availability/check', {
        typeId: selectedType,
        category: 'ROOM',
        checkIn,
        checkOut,
        guests
      });

      toast.dismiss(toastId);
      const data = response.data;
      setResult(data);

      if (data.available && data.availableUnits && data.availableUnits.length > 0) {
        showToast.success('Room is available!');
      } else {
        showToast.error('Room is not available. See recommendations below.');
      }
    } catch (error) {
      toast.dismiss(toastId);
      showToast.error(error.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    const reservationData = {
      checkIn,
      checkOut,
      guests,
      roomTypeId: selectedType,
      category: 'ROOM',
      availableUnits: result?.availableUnits || []
    };

    if (!user) {
      // Save pending reservation in sessionStorage
      sessionStorage.setItem('pendingReservation', JSON.stringify(reservationData));
      showToast.success('Search saved. Redirecting to login to complete reservation...');
      navigate('/login');
    } else {
      // Navigate straight to reservation page
      navigate('/reservations', { state: reservationData });
    }
  };

  const selectedTypeData = roomTypes.find(t => t._id === selectedType);
  const pricePreview = (() => {
    if (!selectedTypeData || !checkIn || !checkOut) return null;
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return null;
    return {
      nights,
      rate: selectedTypeData.price || selectedTypeData.basePricePerNight || 0,
      total: nights * (selectedTypeData.price || selectedTypeData.basePricePerNight || 0)
    };
  })();

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room Type */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <BedDouble size={11} className="text-[#F2B705]" /> Room Type
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setResult(null); // Clear search result on type change
              }}
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer appearance-none"
              style={{ colorScheme: theme }}
            >
              {roomTypes.length === 0 && (
                <option value="" disabled className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Loading types...</option>
              )}
              {roomTypes.map((opt) => (
                <option key={opt._id} value={opt._id} className="bg-white text-text-primary dark:bg-[#111] dark:text-white">
                  {opt.name} — ETB {opt.price || opt.basePricePerNight}/night
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Check-in Date */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Calendar size={11} className="text-[#F2B705]" /> Check-in Date
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setResult(null); // Clear search result
                if (checkOut && new Date(checkOut) <= new Date(e.target.value)) {
                  const next = new Date(e.target.value);
                  next.setDate(next.getDate() + 1);
                  setCheckOut(next.toISOString().split('T')[0]);
                }
              }}
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer"
              style={{ colorScheme: theme }}
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Calendar size={11} className="text-[#F2B705]" /> Check-out Date
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <input
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setResult(null); // Clear search result
              }}
              min={
                checkIn
                  ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
                  : new Date().toISOString().split('T')[0]
              }
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer"
              style={{ colorScheme: theme }}
            />
          </div>
        </div>

        {/* Guests */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Users size={11} className="text-[#F2B705]" /> Guests
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <select
              value={guests}
              onChange={(e) => {
                setGuests(parseInt(e.target.value));
                setResult(null); // Clear search result
              }}
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer appearance-none"
              style={{ colorScheme: theme }}
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n} className="bg-white text-text-primary dark:bg-[#111] dark:text-white">
                  {n} {n === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/40 pointer-events-none" />
          </div>
        </div>
      </form>

      {/* Action buttons and Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        {/* Estimated Price Display */}
        <div>
          {pricePreview && (
            <p className="text-xs font-['Inter'] text-text-secondary dark:text-white/60">
              Est. Total: <span className="text-sm font-semibold text-[#0F5B4F] dark:text-white">ETB {pricePreview.rate.toLocaleString()}</span> × {pricePreview.nights} night{pricePreview.nights !== 1 ? 's' : ''} = <span className="text-base font-bold text-[#F2B705]">ETB {pricePreview.total.toLocaleString()}</span>
            </p>
          )}
        </div>

        {/* Search Button */}
        <div className="flex justify-end">
          <motion.button
            onClick={handleSearch}
            disabled={loading}
            whileHover={!loading ? { scale: 1.04, boxShadow: '0 12px 40px rgba(242,183,5,0.3)' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="relative overflow-hidden flex items-center gap-3 bg-[#F2B705] text-[#0F5B4F] font-['Inter'] font-bold text-sm tracking-[0.1em] uppercase px-8 py-3.5 rounded-full shadow-glow-gold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0F5B4F]/40 border-t-[#0F5B4F] rounded-full animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search Availability
                </>
              )}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Availability Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mt-6 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden"
          >
            {result.available ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-emerald-500 dark:text-emerald-400 font-semibold text-sm">
                      Room Available
                    </h4>
                    <p className="text-xs text-text-secondary dark:text-white/60 mt-0.5">
                      Good news! We found available rooms matching your criteria.
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleReserve}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-['Inter'] font-semibold text-xs tracking-wider uppercase px-6 py-3 rounded-full shadow-lg transition-all"
                >
                  Proceed to Reservation
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-rose-500 dark:text-rose-400 font-semibold text-sm">
                      Room Not Available
                    </h4>
                    <p className="text-xs text-text-secondary dark:text-white/60 mt-0.5">
                      No availability found for {selectedTypeData?.name} during the selected dates.
                    </p>
                  </div>
                </div>

                {/* Suggestions Panel */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                    <p className="text-[11px] font-bold text-text-secondary dark:text-white/40 uppercase tracking-widest">
                      Suggested Options:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.suggestions.map((sug, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setSelectedType(sug.roomTypeId);
                            if (sug.altCheckIn && sug.altCheckOut) {
                              setCheckIn(new Date(sug.altCheckIn).toISOString().split('T')[0]);
                              setCheckOut(new Date(sug.altCheckOut).toISOString().split('T')[0]);
                            }
                            setResult(null); // Clear results to prompt re-search
                            showToast.success(`Selected suggestion: ${sug.name}`);
                          }}
                          className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-[#F2B705]/40 transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            <span className="text-xs font-semibold text-text-primary dark:text-white group-hover:text-[#F2B705] transition-colors">
                              {sug.name}
                            </span>
                            <p className="text-[11px] text-text-secondary dark:text-white/50 mt-1">
                              {sug.suggestion}
                            </p>
                          </div>
                          <span className="text-[10px] text-[#F2B705] font-semibold uppercase tracking-wider mt-2 self-end group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            Select Option <ArrowRight size={10} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
