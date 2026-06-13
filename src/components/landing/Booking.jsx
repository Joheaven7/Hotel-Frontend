import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Calendar, Users, BedDouble, ChevronDown, Search } from 'lucide-react';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function Booking() {
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests,   setGuests]   = useState(1);
  const [roomType, setRoomType] = useState('SINGLE');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const theme    = useThemeStore((s) => s.theme);

  const handleSearch = async () => {
    if (!checkIn || !checkOut) {
      showToast.error('Please select check-in and check-out dates');
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      showToast.error('Check-out date must be after check-in date');
      return;
    }
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Searching for available rooms…', {
      style: { background: '#111', color: '#fff', borderRadius: '12px', border: '1px solid rgba(242,183,5,0.3)' },
    });

    try {
      const response = await apiClient.get('/rooms', {
        params: { checkInDate: checkIn, checkOutDate: checkOut, numberOfGuests: guests, type: roomType },
      });
      toast.dismiss(toastId);
      const availableRooms = (response.data.rooms || []).filter(
        (r) => r.isAvailable !== false && r.status === 'AVAILABLE'
      );
      if (availableRooms.length > 0) {
        showToast.success(`Found ${availableRooms.length} available room(s)`);
        navigate('/reservations', { state: { checkIn, checkOut, guests, roomType, availableRooms } });
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

  const roomTypeOptions = [
    { value: 'SINGLE',  label: 'Single Room'  },
    { value: 'DOUBLE',  label: 'Double Room'  },
    { value: 'SUITE',   label: 'Suite'         },
    { value: 'DELUXE',  label: 'Deluxe Suite' },
  ];

  return (
    <section id="booking" className="relative z-10 py-0">
      {/* ── Floating glassmorphism card that overlaps the hero ──────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 md:-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-[28px] overflow-hidden bg-white/70 dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-elevated dark:shadow-2xl transition-all duration-300"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-[#F2B705] rounded-full" />
              <div>
                <h2 className="font-['Playfair_Display'] text-text-primary dark:text-white text-xl md:text-2xl font-semibold">
                  Check Availability
                </h2>
                <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-xs tracking-wide">
                  Best rate guaranteed · No booking fees
                </p>
              </div>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Check-in */}
              <div className="group">
                <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
                  <Calendar size={11} className="text-[#F2B705]" /> Check-in
                </label>
                <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300 cursor-pointer">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
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

              {/* Check-out */}
              <div className="group">
                <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
                  <Calendar size={11} className="text-[#F2B705]" /> Check-out
                </label>
                <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300 cursor-pointer">
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
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
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    disabled={loading}
                    className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer appearance-none"
                    style={{ colorScheme: theme }}
                  >
                    {[1,2,3,4,5,6].map((n) => (
                      <option key={n} value={n} className="bg-white text-text-primary dark:bg-[#111] dark:text-white">
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Room Type */}
              <div className="group">
                <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
                  <BedDouble size={11} className="text-[#F2B705]" /> Room Type
                </label>
                <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    disabled={loading}
                    className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer appearance-none"
                    style={{ colorScheme: theme }}
                  >
                    {roomTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white text-text-primary dark:bg-[#111] dark:text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/40 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Search button */}
            <div className="mt-6 flex justify-end">
              <motion.button
                onClick={handleSearch}
                disabled={loading}
                whileHover={!loading ? { scale: 1.04, boxShadow: '0 12px 40px rgba(242,183,5,0.5)' } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                className="relative overflow-hidden flex items-center gap-3 bg-[#F2B705] text-[#0F5B4F] font-['Inter'] font-bold text-sm tracking-[0.1em] uppercase px-10 py-4 rounded-full shadow-glow-gold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {/* shimmer */}
                {!loading && (
                  <span
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2.5s linear infinite',
                    }}
                  />
                )}
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
        </motion.div>
      </div>
    </section>
  );
}