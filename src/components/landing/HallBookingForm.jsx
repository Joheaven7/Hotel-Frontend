import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Landmark, ChevronDown, Search, CheckCircle, XCircle, ArrowRight, Clock } from 'lucide-react';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import { useThemeStore } from '../../store/themeStore';

export default function HallBookingForm({ hallTypes }) {
  const [eventDate, setEventDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('full-day'); // 'full-day' | 'morning' | 'afternoon' | 'evening' | 'custom'
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('17:00');
  const [guests, setGuests] = useState(20);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);

  // Set default selected hall type when hallTypes are loaded
  useEffect(() => {
    if (hallTypes && hallTypes.length > 0 && !selectedType) {
      setSelectedType(hallTypes[0]._id);
    }
  }, [hallTypes, selectedType]);

  const getTimeRange = () => {
    switch (timeSlot) {
      case 'morning':
        return { start: '08:00', end: '12:00' };
      case 'afternoon':
        return { start: '13:00', end: '17:00' };
      case 'evening':
        return { start: '18:00', end: '22:00' };
      case 'full-day':
      default:
        return { start: '08:00', end: '22:00' };
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!selectedType) {
      showToast.error('Please select a hall type');
      return;
    }
    if (!eventDate) {
      showToast.error('Please select an event date');
      return;
    }

    const { start, end } = timeSlot === 'custom' ? { start: customStart, end: customEnd } : getTimeRange();

    // Validate times
    if (timeSlot === 'custom') {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        showToast.error('End time must be after start time');
        return;
      }
    }

    const checkIn = `${eventDate}T${start}:00`;
    const checkOut = `${eventDate}T${end}:00`;

    setLoading(true);
    setResult(null);

    const toastId = toast.loading('Checking hall availability…', {
      style: { background: '#111', color: '#fff', borderRadius: '12px', border: '1px solid rgba(242,183,5,0.3)' },
    });

    try {
      const response = await apiClient.post('/availability/check', {
        typeId: selectedType,
        category: 'HALL',
        checkIn,
        checkOut,
        guests
      });

      toast.dismiss(toastId);
      const data = response.data;
      setResult(data);

      if (data.available && data.availableUnits && data.availableUnits.length > 0) {
        showToast.success('Hall is available!');
      } else {
        showToast.error('Hall is not available. See suggestions below.');
      }
    } catch (error) {
      toast.dismiss(toastId);
      showToast.error(error.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    const { start, end } = timeSlot === 'custom' ? { start: customStart, end: customEnd } : getTimeRange();
    const reservationData = {
      eventDate,
      startTime: start,
      endTime: end,
      guests,
      hallTypeId: selectedType,
      category: 'HALL',
      availableUnits: result?.availableUnits || []
    };

    navigate('/booking/confirm', { state: reservationData });
  };

  const selectedTypeData = hallTypes.find(t => t._id === selectedType);
  const pricePreview = (() => {
    if (!selectedTypeData || !eventDate) return null;
    const { start, end } = timeSlot === 'custom' ? { start: customStart, end: customEnd } : getTimeRange();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const hours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
    if (hours <= 0) return null;
    return {
      hours,
      rate: selectedTypeData.price || selectedTypeData.basePricePerHour || 0,
      total: hours * (selectedTypeData.price || selectedTypeData.basePricePerHour || 0)
    };
  })();

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hall Type */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Landmark size={11} className="text-[#F2B705]" /> Hall Type
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
              {hallTypes.length === 0 && (
                <option value="" disabled className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Loading types...</option>
              )}
              {hallTypes.map((opt) => (
                <option key={opt._id} value={opt._id} className="bg-white text-text-primary dark:bg-[#111] dark:text-white">
                  {opt.name} — ETB {opt.price || opt.basePricePerHour}/hr
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Event Date */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Calendar size={11} className="text-[#F2B705]" /> Event Date
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
                setResult(null); // Clear search result
              }}
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer"
              style={{ colorScheme: theme }}
            />
          </div>
        </div>

        {/* Time Slot */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Clock size={11} className="text-[#F2B705]" /> Time Slot
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <select
              value={timeSlot}
              onChange={(e) => {
                setTimeSlot(e.target.value);
                setResult(null); // Clear search result
              }}
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer appearance-none"
              style={{ colorScheme: theme }}
            >
              <option value="full-day" className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Full Day (08:00 - 22:00)</option>
              <option value="morning" className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Morning (08:00 - 12:00)</option>
              <option value="afternoon" className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Afternoon (13:00 - 17:00)</option>
              <option value="evening" className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Evening (18:00 - 22:00)</option>
              <option value="custom" className="bg-white text-text-primary dark:bg-[#111] dark:text-white">Custom Hours...</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Capacity / Guests */}
        <div className="group">
          <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
            <Users size={11} className="text-[#F2B705]" /> Capacity / Guests
          </label>
          <div className="relative bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 hover:border-[#F2B705]/40 rounded-2xl px-4 py-3 transition-all duration-300">
            <input
              type="number"
              value={guests}
              onChange={(e) => {
                setGuests(Math.max(1, parseInt(e.target.value) || 0));
                setResult(null); // Clear search result
              }}
              min="1"
              disabled={loading}
              className="w-full bg-transparent text-text-primary dark:text-white font-['Inter'] font-medium text-sm outline-none cursor-pointer"
              style={{ colorScheme: theme }}
            />
          </div>
        </div>
      </form>

      {/* Custom Hours Fields (visible only if Custom Hours is selected) */}
      <AnimatePresence>
        {timeSlot === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden"
          >
            <div>
              <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setResult(null);
                }}
                disabled={loading}
                className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 px-4 py-3 rounded-xl text-text-primary dark:text-white font-medium text-sm outline-none"
                style={{ colorScheme: theme }}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 font-['Inter'] text-text-secondary dark:text-white/50 text-[11px] tracking-[0.12em] uppercase mb-2">
                End Time
              </label>
              <input
                type="time"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setResult(null);
                }}
                disabled={loading}
                className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 px-4 py-3 rounded-xl text-text-primary dark:text-white font-medium text-sm outline-none"
                style={{ colorScheme: theme }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons and Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        {/* Estimated Price Display */}
        <div>
          {pricePreview && (
            <p className="text-xs font-['Inter'] text-text-secondary dark:text-white/60">
              Est. Total: <span className="text-sm font-semibold text-[#0F5B4F] dark:text-white">ETB {pricePreview.rate.toLocaleString()}</span> × {pricePreview.hours} hr{pricePreview.hours !== 1 ? 's' : ''} = <span className="text-base font-bold text-[#F2B705]">ETB {pricePreview.total.toLocaleString()}</span>
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
                      Hall Available
                    </h4>
                    <p className="text-xs text-text-secondary dark:text-white/60 mt-0.5">
                      Excellent news! The hall is available for your event.
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
                      Hall Not Available
                    </h4>
                    <p className="text-xs text-text-secondary dark:text-white/60 mt-0.5">
                      No availability found for {selectedTypeData?.name} during the selected time.
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
                            setSelectedType(sug.hallTypeId);
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
