import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import { Wifi, Wind, Tv, Waves, Coffee, Star, ChevronRight } from 'lucide-react';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, '');
  return `${baseUrl}/${url.replace(/\\/g, '/')}`;
};

// ── Amenity chip icon map ──────────────────────────────────────────────────────
const amenityIcons = {
  wifi:      <Wifi size={12} />,
  ac:        <Wind size={12} />,
  tv:        <Tv size={12} />,
  pool:      <Waves size={12} />,
  breakfast: <Coffee size={12} />,
};

// ── Static fallback rooms ──────────────────────────────────────────────────────
const fallbackRooms = [
  {
    id: 'f1', title: 'Deluxe Room', price: 180, rating: 4.7, type: 'Deluxe',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    description: 'Spacious king-size bed, elegant décor, panoramic city views, and premium amenities.',
    amenities: ['wifi', 'ac', 'tv', 'breakfast'],
  },
  {
    id: 'f2', title: 'Executive Suite', price: 320, rating: 4.9, type: 'Suite',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    description: 'Separate living area, bespoke furnishings, butler service, and Addis Ababa skyline views.',
    amenities: ['wifi', 'ac', 'tv', 'pool', 'breakfast'],
  },
  {
    id: 'f3', title: 'Presidential Suite', price: 650, rating: 5, type: 'Presidential',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    description: 'The pinnacle of luxury — private terrace, plunge pool, personal butler, and curated art.',
    amenities: ['wifi', 'ac', 'tv', 'pool', 'breakfast'],
  },
  {
    id: 'f4', title: 'Garden Terrace', price: 240, rating: 4.8, type: 'Terrace',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    description: 'Private outdoor terrace with lush garden views, soaking tub, and artisan breakfast service.',
    amenities: ['wifi', 'ac', 'tv', 'breakfast'],
  },
];

// ── 3D Tilt card ───────────────────────────────────────────────────────────────
function RoomCard({ room, navigate, user }) {
  const cardRef = useRef(null);
  const [tilted, setTilted] = useState(false);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -10;
    const rotateY = ((x - cx) / cx) *  10;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    setTilted(true);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    setTilted(false);
  };

  const handleExplore = () => {
    if (!user) {
      showToast.info('Please login to book');
      navigate('/login');
      return;
    }
    navigate(`/reservations`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="tilt-card relative group rounded-[24px] overflow-hidden cursor-pointer bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 shadow-soft dark:shadow-card-dark transition-all duration-300"
      >
        {/* Image */}
        <div className="relative overflow-hidden h-60">
          <img
            src={room.image}
            alt={room.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.src = fallbackRooms[0].image; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Gold glow border on hover */}
          <div
            className="absolute inset-0 rounded-[24px] transition-all duration-300 pointer-events-none"
            style={{
              boxShadow: tilted ? '0 0 0 1.5px rgba(242,183,5,0.5) inset' : '0 0 0 0 transparent inset',
            }}
          />

          {/* Rating badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-[#F2B705]/20">
            <Star size={12} className="fill-[#F2B705] text-[#F2B705]" />
            <span className="font-['Inter'] text-white text-xs font-semibold">{room.rating}</span>
          </div>

          {/* Type badge */}
          <div className="absolute top-4 left-4 bg-[#F2B705]/15 backdrop-blur-sm border border-[#F2B705]/30 rounded-full px-3 py-1">
            <span className="font-['Inter'] text-[#F2B705] text-[10px] tracking-[0.15em] uppercase font-semibold">
              {room.type}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6">
          <h3 className="font-['Playfair_Display'] text-text-primary dark:text-white text-xl font-semibold mb-2">
            {room.title}
          </h3>
          <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">
            {room.description}
          </p>

          {/* Amenity chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(room.amenities || []).slice(0,4).map((a) => (
              <span
                key={a}
                className="flex items-center gap-1.5 font-['Inter'] text-[10px] text-text-secondary dark:text-white/50 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-2.5 py-1"
              >
                {amenityIcons[a.toLowerCase()] || <Wifi size={12} />}
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </span>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-['Playfair_Display'] text-[#F2B705] text-2xl font-bold">
                ${room.price}
              </span>
              <span className="font-['Inter'] text-text-secondary/70 dark:text-white/40 text-xs ml-1">/night</span>
            </div>
            <button
              onClick={handleExplore}
              className="group/btn flex items-center gap-2 font-['Inter'] text-[#F2B705] text-sm font-semibold tracking-wide"
            >
              Explore
              {/* underline draw */}
              <span className="block relative">
                <span className="relative flex items-center gap-1">
                  <span className="absolute bottom-0 left-0 h-px bg-[#F2B705] w-0 group-hover/btn:w-full transition-all duration-300" />
                  <ChevronRight size={16} />
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RoomTypes() {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);

  useEffect(() => {
    apiClient.get('/room-types/public')
      .then((res) => {
        const types = (res.data.roomTypes || []).map((rt) => ({
          id:          rt._id,
          title:       rt.name,
          description: rt.description || `Experience our ${rt.name} at its finest.`,
          price:       rt.basePricePerNight,
          rating:      (4.5 + Math.random() * 0.5).toFixed(1),
          type:        rt.name,
          amenities:   rt.amenities || ['wifi', 'ac', 'tv'],
          image:       getImageUrl(rt.images?.[0]) || fallbackRooms[0].image,
        }));
        setRooms(types.length > 0 ? types : fallbackRooms);
      })
      .catch(() => setRooms(fallbackRooms))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="rooms" className="section-dark-2 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-['Inter'] text-[#F2B705] text-xs tracking-[0.3em] uppercase">
            Accommodations
          </span>
          <h2
            className="font-['Playfair_Display'] font-bold text-text-primary dark:text-white mt-3 mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}
          >
            Curated for Every Journey
          </h2>
          <div className="gold-line-center" />
          <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-base max-w-xl mx-auto mt-4">
            From intimate retreats to sweeping presidential suites — every room is a private world unto itself.
          </p>
        </motion.div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-[24px] bg-white/5 animate-pulse h-96" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rooms.slice(0, 4).map((room) => (
              <RoomCard key={room.id} room={room} navigate={navigate} user={user} />
            ))}
          </div>
        )}

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-14"
        >
          <button
            onClick={() => navigate('/gallery')}
            className="btn-lux-outline font-['Inter'] cursor-pointer"
          >
            View All Accommodations
          </button>
        </motion.div>
      </div>
    </section>
  );
}
