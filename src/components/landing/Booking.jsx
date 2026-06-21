import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import RoomBookingForm from './RoomBookingForm';
import HallBookingForm from './HallBookingForm';

export default function Booking() {
  const [selectedBookingType, setSelectedBookingType] = useState('ROOM'); // 'ROOM' | 'HALL'
  const [roomTypes, setRoomTypes] = useState([]);
  const [hallTypes, setHallTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    setLoadingTypes(true);
    apiClient.get('/types')
      .then(res => {
        const fetchedTypes = res.data.types || [];
        setRoomTypes(fetchedTypes.filter(t => t.category === 'ROOM'));
        setHallTypes(fetchedTypes.filter(t => t.category === 'HALL'));
      })
      .catch(err => {
        console.error('Failed to fetch types:', err);
        showToast.error('Failed to load room/hall types. Please try again.');
      })
      .finally(() => {
        setLoadingTypes(false);
      });
  }, []);

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
            {/* Header + Tabs Switcher Grid */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-[#F2B705] rounded-full" />
                <div>
                  <h2 className="font-['Playfair_Display'] text-text-primary dark:text-white text-xl md:text-2xl font-semibold">
                    Book Your Stay
                  </h2>
                  <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-xs tracking-wide">
                    Best rate guaranteed · No booking fees
                  </p>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-full border border-black/10 dark:border-white/10 w-full md:w-auto md:min-w-[280px]">
                <button
                  onClick={() => setSelectedBookingType('ROOM')}
                  className={`flex-1 py-2.5 rounded-full text-xs font-['Inter'] font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                    selectedBookingType === 'ROOM'
                      ? 'bg-[#F2B705] text-[#0F5B4F] shadow-sm'
                      : 'text-text-secondary dark:text-white/60 hover:text-[#F2B705] dark:hover:text-white'
                  }`}
                >
                  Book Room
                </button>
                <button
                  onClick={() => setSelectedBookingType('HALL')}
                  className={`flex-1 py-2.5 rounded-full text-xs font-['Inter'] font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                    selectedBookingType === 'HALL'
                      ? 'bg-[#F2B705] text-[#0F5B4F] shadow-sm'
                      : 'text-text-secondary dark:text-white/60 hover:text-[#F2B705] dark:hover:text-white'
                  }`}
                >
                  Book Hall
                </button>
              </div>
            </div>

            {/* Forms rendering container */}
            {loadingTypes ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#F2B705]/20 border-t-[#F2B705] rounded-full animate-spin mb-4" />
                <p className="text-text-secondary dark:text-white/50 font-['Inter'] text-xs tracking-widest uppercase animate-pulse">
                  Loading Types...
                </p>
              </div>
            ) : (
              <div>
                {selectedBookingType === 'ROOM' ? (
                  <motion.div
                    key="room-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RoomBookingForm roomTypes={roomTypes} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="hall-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HallBookingForm hallTypes={hallTypes} />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}