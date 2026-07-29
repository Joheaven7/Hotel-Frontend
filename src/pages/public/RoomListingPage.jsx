import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BedDouble, Users, Maximize, ArrowRight } from 'lucide-react';
import apiClient from '../../services/api';
import Navbar from '../../components/landing/Navbar';

export default function RoomListingPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const { data } = await apiClient.get('/room-types');
        setRoomTypes(data.data || []);
      } catch (error) {
        console.error('Failed to fetch room types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold text-text-primary dark:text-white mb-6">
            Our Luxury Rooms
          </h1>
          <p className="text-text-secondary dark:text-white/70 max-w-2xl mx-auto font-['Inter']">
            Experience unparalleled comfort and elegance in our thoughtfully designed rooms and suites.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-[#F2B705]/20 border-t-[#F2B705] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes.map((type, index) => (
              <motion.div
                key={type._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden shadow-lg border border-neutral-100 dark:border-white/5 group hover:shadow-xl hover:border-[#F2B705]/30 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={type.images?.[0]?.url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070'}
                    alt={type.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                    From ETB {type.basePricePerNight}/night
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-['Playfair_Display'] text-2xl font-bold text-text-primary dark:text-white mb-3">
                    {type.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-white/60 mb-6 font-['Inter']">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} className="text-[#F2B705]" />
                      {type.capacity} Guests
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BedDouble size={16} className="text-[#F2B705]" />
                      {type.bedType}
                    </div>
                    {type.size && (
                      <div className="flex items-center gap-1.5">
                        <Maximize size={16} className="text-[#F2B705]" />
                        {type.size} m²
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/rooms/${type._id}`}
                    className="mt-auto flex items-center justify-between text-[#0F5B4F] dark:text-[#F2B705] font-semibold text-sm uppercase tracking-wider group-hover:gap-4 transition-all"
                  >
                    View Details
                    <ArrowRight size={16} className="text-[#F2B705] group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
