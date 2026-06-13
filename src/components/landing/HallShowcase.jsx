import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { showToast } from '../../services/toast';
import { useAuthStore } from '../../store/authStore';

// Keyword-to-image map for matching hall names to beautiful Unsplash images
const hallImageMap = {
  wedding:    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80',
  conference: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1920&q=80',
  banquet:    'https://images.unsplash.com/photo-1530103862676-de8892ebe829?w=1920&q=80',
};

// Pick a fallback image by scanning the hall name for keywords
const getFallbackImage = (name, index) => {
  const lower = (name || '').toLowerCase();
  for (const [keyword, url] of Object.entries(hallImageMap)) {
    if (lower.includes(keyword)) return url;
  }
  // Round-robin through the images if no keyword matches
  const urls = Object.values(hallImageMap);
  return urls[index % urls.length];
};

const fallbackHalls = [
  {
    id: 'h1',
    title: 'Grand Wedding Hall',
    capacity: 'Up to 300 guests',
    description: 'A magnificent ballroom with crystal chandeliers, soaring ceilings, and a private garden entrance designed for unforgettable celebrations.',
    image: hallImageMap.wedding,
  },
  {
    id: 'h2',
    title: 'Executive Conference Center',
    capacity: 'Up to 120 guests',
    description: 'State-of-the-art audiovisual equipment, acoustic soundproofing, and ergonomic seating crafted for global summits and corporate excellence.',
    image: hallImageMap.conference,
  },
  {
    id: 'h3',
    title: 'Royal Banquet Hall',
    capacity: 'Up to 200 guests',
    description: 'An elegant dining space featuring a live showcase kitchen, gold-accented interiors, and panoramic views of the city skyline.',
    image: hallImageMap.banquet,
  },
];

function HallRow({ hall, index, user, navigate }) {
  const isEven = index % 2 === 0;

  const handleReserve = () => {
    if (!user) {
      showToast.info('Please login to book a hall');
      navigate('/login');
      return;
    }
    navigate('/reservations');
  };

  return (
    <div
      className={`w-full ${isEven ? 'section-warm' : 'section-warm-gray'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}>
          
          {/* Image Side */}
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: isEven ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative overflow-hidden rounded-[24px] shadow-elevated"
            >
              <img
                src={hall.image}
                alt={hall.title}
                loading="lazy"
                className="w-full h-[400px] md:h-[500px] object-cover hover:scale-105 transition-transform duration-1000"
                onError={(e) => {
                  if (!e.target.dataset.fallbackApplied) {
                    e.target.dataset.fallbackApplied = 'true';
                    e.target.src = hall.fallbackImage || fallbackHalls[0].image;
                  }
                }}
              />
            </motion.div>
          </div>

          {/* Text Side */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block font-['Inter'] font-semibold text-primary dark:text-[#F2B705] text-[10px] tracking-[0.2em] uppercase px-3 py-1 border border-primary/20 dark:border-[#F2B705]/30 rounded-full mb-6">
                {hall.capacity}
              </span>
              
              <h3 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold text-text-primary dark:text-white mb-6 leading-tight">
                {hall.title}
              </h3>
              
              <div className="w-12 h-[2px] bg-[#F2B705] mb-6" />
              
              <p className="font-['Inter'] text-text-secondary dark:text-white/70 text-base leading-relaxed mb-10 max-w-lg">
                {hall.description}
              </p>
              
              <button
                onClick={handleReserve}
                className="group relative inline-flex items-center gap-4 font-['Inter'] font-bold text-primary dark:text-[#F2B705] text-sm tracking-widest uppercase cursor-pointer transition-colors duration-300"
              >
                <span className="relative z-10">Reserve Space</span>
                <div className="w-10 h-10 rounded-full border border-primary/20 dark:border-[#F2B705]/20 flex items-center justify-center group-hover:bg-primary dark:group-hover:bg-[#F2B705] group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default function HallShowcase() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    apiClient.get('/hall-types/public')
      .then((res) => {
        const types = (res.data.hallTypes || []).map((ht, index) => {
          const fallbackImg = getFallbackImage(ht.name, index);

          // Only use backend image if it's a valid full URL (uploaded to cloud storage)
          const backendImg = ht.images?.[0];
          const hasValidImage = backendImg && backendImg.startsWith('http');

          return {
            id: ht._id,
            title: ht.name,
            capacity: `Up to ${ht.maxOccupancy || '200'} guests`,
            description: ht.description || `Host your extraordinary event in our magnificent ${ht.name}.`,
            image: hasValidImage ? backendImg : fallbackImg,
            fallbackImage: fallbackImg,
          };
        });
        setHalls(types.length > 0 ? types : fallbackHalls);
      })
      .catch(() => setHalls(fallbackHalls))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="halls" className="w-full flex flex-col pt-16">
      
      {/* Shared Heading */}
      <div className="section-warm text-center py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-['Inter'] text-primary dark:text-[#F2B705] text-xs tracking-[0.3em] uppercase">
            Meetings & Events
          </span>
          <h2
            className="font-['Playfair_Display'] font-bold text-text-primary dark:text-white mt-3 mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}
          >
            Extraordinary Venues
          </h2>
          <div className="gold-line-center" />
        </motion.div>
      </div>

      {/* Alternating Hall Rows */}
      {loading ? (
        <div className="py-24 text-center section-warm">
          <p className="font-['Inter'] text-gray-500">Loading venues...</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {halls.slice(0, 3).map((hall, idx) => (
            <HallRow key={hall.id} hall={hall} index={idx} user={user} navigate={navigate} />
          ))}
        </div>
      )}

    </section>
  );
}
