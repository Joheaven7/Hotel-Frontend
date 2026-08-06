import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Building2, ArrowRight } from 'lucide-react';
import apiClient from '../../services/api';
import Navbar from '../../components/landing/Navbar';

export default function HallListingPage() {
  const [hallTypes, setHallTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHallTypes = async () => {
      try {
        const { data } = await apiClient.get('/hall-types/public');
        setHallTypes(data.hallTypes || data.data || []);
      } catch (error) {
        console.error('Failed to fetch hall types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHallTypes();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold text-text-primary dark:text-white mb-6">
            Event Venues & Conference Halls
          </h1>
          <p className="text-text-secondary dark:text-white/70 max-w-2xl mx-auto font-['Inter']">
            Host magnificent weddings, global conferences, and grand banquets in our state-of-the-art event spaces.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-[#F2B705]/20 border-t-[#F2B705] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hallTypes.map((type, index) => (
              <motion.div
                key={type._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden shadow-lg border border-neutral-100 dark:border-white/5 group hover:shadow-xl hover:border-[#F2B705]/30 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={type.images?.[0] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1920'}
                    alt={type.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                    From ETB {type.basePricePerHour}/hour
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-['Playfair_Display'] text-2xl font-bold text-text-primary dark:text-white mb-3">
                    {type.name}
                  </h3>
                  
                  <p className="text-text-secondary dark:text-white/60 text-sm mb-6 line-clamp-2 font-['Inter']">
                    {type.description || 'Flexible and elegant venue space for your special event.'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-white/60 mb-6 font-['Inter']">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} className="text-[#F2B705]" />
                      Up to {type.maxOccupancy || 200} Guests
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 size={16} className="text-[#F2B705]" />
                      Event Space
                    </div>
                  </div>

                  <Link
                    to={`/reservations`}
                    className="mt-auto flex items-center justify-between text-[#0F5B4F] dark:text-[#F2B705] font-semibold text-sm uppercase tracking-wider group-hover:gap-4 transition-all"
                  >
                    Reserve Space
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
