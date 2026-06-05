import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import {useAuthStore} from '../../store/authStore';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: 'easeOut' },
  }),
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/services');

      // Set services from API or use fallback
      const fetchedServices = response.data.services || [];

      if (fetchedServices.length === 0) {
        setServices([
          {
            id: 1,
            title: 'Accommodation',
            description:
              'Sumptuous suites with panoramic views, premium bedding, and bespoke interiors designed for ultimate comfort.',
            image:
              'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
            fallback:
              'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600',
            dark: true,
          },
          {
            id: 2,
            title: 'Gourmet Dining',
            description:
              'Michelin‑starred chefs craft culinary masterpieces using the finest seasonal ingredients from around the world.',
            image:
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
            fallback:
              'https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg?auto=compress&cs=tinysrgb&w=600',
            dark: false,
          },
          {
            id: 3,
            title: 'Infinity Pool',
            description:
              'Our iconic infinity pool merges seamlessly with the horizon, offering a tranquil oasis above the city skyline.',
            image:
              'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
            fallback:
              'https://images.pexels.com/photos/261388/pexels-photo-261388.jpeg?auto=compress&cs=tinysrgb&w=600',
            dark: false,
          },
        ]);
      } else {
        setServices(
          fetchedServices.map((service, idx) => ({
            id: service._id || idx,
            title: service.name || service.title || '',
            description: service.description || '',
            image: service.image || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
            fallback:
              'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600',
            dark: idx % 2 === 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching services:', error);

      // Set fallback services on error
      setServices([
        {
          id: 1,
          title: 'Accommodation',
          description:
            'Sumptuous suites with panoramic views, premium bedding, and bespoke interiors designed for ultimate comfort.',
          image:
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
          fallback:
            'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600',
          dark: true,
        },
        {
          id: 2,
          title: 'Gourmet Dining',
          description:
            'Michelin‑starred chefs craft culinary masterpieces using the finest seasonal ingredients from around the world.',
          image:
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
          fallback:
            'https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg?auto=compress&cs=tinysrgb&w=600',
          dark: false,
        },
        {
          id: 3,
          title: 'Infinity Pool',
          description:
            'Our iconic infinity pool merges seamlessly with the horizon, offering a tranquil oasis above the city skyline.',
          image:
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
          fallback:
            'https://images.pexels.com/photos/261388/pexels-photo-261388.jpeg?auto=compress&cs=tinysrgb&w=600',
          dark: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAllServices = () => {
    if (!user) {
      showToast.info('Please login to view all services');
      navigate('/login');
      return;
    }
    navigate('/services');
  };

  const handleLearnMore = (service) => {
    if (!user) {
      showToast.info('Please login to learn more about this service');
      navigate('/login');
      return;
    }
    navigate(`/services/${service.id}`);
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 md:mb-16"
        >
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-text-dark mb-3">
              Luxury Services
            </h2>
            <p className="text-text-dark/65 text-base md:text-lg max-w-lg">
              Curated experiences designed to elevate every moment of your stay at LUXSTAY Hotels.
            </p>
          </div>
          <motion.button
            onClick={handleSeeAllServices}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(242,183,5,0.5)' }}
            whileTap={{ scale: 0.98 }}
            className="bg-gold text-[#0F5B4F] px-7 py-3 rounded-full font-semibold text-sm tracking-wide self-start sm:self-auto cursor-pointer"
          >
            See All Services
          </motion.button>
        </motion.div>

        {/* Service Cards */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-dark/60">⏳ Loading services...</p>
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((card, index) => (
              <motion.div
                key={card.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`rounded-2xl overflow-hidden shadow-lg h-full flex flex-col transition-all cursor-pointer ${
                  card.dark ? 'bg-[#0F5B4F]' : 'bg-white'
                }`}
              >
                <div className="overflow-hidden">
                  <motion.img
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                    src={card.image}
                    alt={card.title}
                    className="w-full h-52 sm:h-56 object-cover"
                    onError={(e) => {
                      e.target.src = card.fallback;
                    }}
                  />
                </div>
                <div className="p-6 md:p-7 flex flex-col flex-grow">
                  <h3
                    className={`font-heading text-xl md:text-2xl font-bold mb-3 ${
                      card.dark ? 'text-white' : 'text-[#0F5B4F]'
                    }`}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`text-sm md:text-base leading-relaxed ${
                      card.dark ? 'text-white/80' : 'text-text-dark/70'
                    }`}
                  >
                    {card.description}
                  </p>
                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => handleLearnMore(card)}
                      className={`font-semibold text-sm tracking-wide flex items-center gap-1.5 hover:gap-2.5 transition-all ${
                        card.dark ? 'text-gold' : 'text-[#0F5B4F]'
                      }`}
                    >
                      Learn more
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-dark/60">No services available</p>
          </div>
        )}
      </div>
    </section>
  );
}