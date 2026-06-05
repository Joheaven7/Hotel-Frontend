// LuxuryGalleryPage.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { motion } from 'framer-motion';
import {
  Star,
  Wifi,
  Wind,
  Tv,
  Waves,
  Coffee,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// ---------- STATIC FALLBACK DATA (used when API returns empty) ----------
const staticRooms = [
  {
    id: 'static-1',
    title: 'Deluxe Room',
    description: 'Spacious room with a king‑size bed, elegant décor, and garden views.',
    pricePerNight: 120,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
    amenities: ['wifi', 'ac', 'tv', 'pool', 'breakfast'],
    type: 'Deluxe',
  },
  {
    id: 'static-2',
    title: 'Executive Suite',
    description: 'Separate living area, premium amenities, and panoramic city skyline.',
    pricePerNight: 220,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80',
    amenities: ['wifi', 'ac', 'tv', 'breakfast'],
    type: 'Executive',
  },
  {
    id: 'static-3',
    title: 'Presidential Suite',
    description: 'Ultimate luxury with a private terrace, butler service, and jacuzzi.',
    pricePerNight: 550,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
    amenities: ['wifi', 'ac', 'tv', 'pool', 'breakfast'],
    type: 'Presidential',
  },
  {
    id: 'static-4',
    title: 'Family Room',
    description: 'Two queen beds, kid‑friendly amenities, and a spacious bathroom.',
    pricePerNight: 180,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
    amenities: ['wifi', 'ac', 'tv', 'breakfast'],
    type: 'Family',
  },
  {
    id: 'static-5',
    title: 'Honeymoon Suite',
    description: 'Romantic setup with a canopy bed, rose petals, and champagne on arrival.',
    pricePerNight: 350,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    amenities: ['wifi', 'ac', 'tv', 'pool', 'breakfast'],
    type: 'Honeymoon',
  },
  {
    id: 'static-6',
    title: 'Ocean View Room',
    description: 'Wake up to breathtaking ocean views and enjoy a private balcony.',
    pricePerNight: 280,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
    amenities: ['wifi', 'ac', 'tv', 'pool', 'breakfast'],
    type: 'OceanView',
  },
];

const staticHalls = [
  {
    id: 'static-h1',
    title: 'Grand Wedding Hall',
    capacity: 'Up to 300 guests',
    description: 'A magnificent ballroom with crystal chandeliers and a private garden entrance.',
    pricePerHour: 450,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'static-h2',
    title: 'Executive Conference Hall',
    capacity: 'Up to 120 guests',
    description: 'State‑of‑the‑art AV equipment, soundproofing, and ergonomic seating.',
    pricePerHour: 300,
    image: 'https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'static-h3',
    title: 'Royal Banquet Hall',
    capacity: 'Up to 200 guests',
    description: 'Elegant dining space with a live kitchen and gold‑accented interiors.',
    pricePerHour: 380,
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80',
  },
];

// ---------- UTILITY ICONS ----------
const amenityIcons = {
  wifi: <Wifi size={16} />,
  ac: <Wind size={16} />,
  tv: <Tv size={16} />,
  pool: <Waves size={16} />,
  breakfast: <Coffee size={16} />,
};

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', alt: 'Hotel Lobby' },
  { src: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80', alt: 'Swimming Pool' },
  { src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', alt: 'Restaurant' },
  { src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80', alt: 'Rooftop Lounge' },
  { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80', alt: 'Spa' },
  { src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80', alt: 'Wedding Venue' },
  { src: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80', alt: 'Luxury Room Detail' },
  { src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80', alt: 'Presidential Suite Lounge' },
];

// ---------- GALLERY COMPONENTS ----------

const Hero = () => (
  <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden rounded-b-[50px] md:rounded-b-[80px]">
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: 'url(https://picsum.photos/seed/luxuryhotel/1920/1080)' }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4"
    >
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-['Playfair_Display'] font-bold text-white mb-6 leading-tight">
        Discover Our <span className="text-[#F2B705]">Luxury</span> Spaces
      </h1>
      <p className="text-lg md:text-xl text-gray-200 max-w-2xl mb-8">
        Experience unparalleled elegance, breathtaking views, and world‑class hospitality at LUXSTAY Hotels.
      </p>
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(242,183,5,0.4)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
        className="bg-[#F2B705] text-[#0F5B4F] px-8 py-3 rounded-full font-['Poppins'] font-semibold text-lg hover:bg-yellow-400 transition-colors shadow-xl cursor-pointer"
      >
        Explore Rooms
      </motion.button>
    </motion.div>
  </section>
);

const RoomCard = ({ room, user, navigate }) => {
  const handleBookNow = () => {
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }
    navigate(`/rooms/${room.id || room._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white rounded-[30px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group border border-gray-100"
    >
      <div className="relative overflow-hidden h-56 rounded-t-[30px]">
        <img
          src={room.images?.[0] || room.image || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80'}
          alt={room.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center space-x-1 shadow-md">
          <span className="text-sm font-bold text-[#0F5B4F] font-['Poppins']">
            {room.rating || 4.5}
          </span>
          <Star size={14} className="fill-[#F2B705] text-[#F2B705]" />
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-['Playfair_Display'] font-bold text-[#0F5B4F] mb-2">
          {room.title}
        </h3>
        <p className="text-[#333333] text-sm mb-4 line-clamp-2 font-['Poppins']">
          {room.type || room.title} Room - {room.description || 'Luxurious accommodation'}
        </p>

        <div className="flex items-center space-x-3 mb-4 text-[#0F5B4F]">
          {room.amenities?.length > 0
            ? room.amenities.map((a) => (
              <span key={a} title={a}>
                {amenityIcons[a.toLowerCase()] || <Wifi size={16} />}
              </span>
            ))
            : [amenityIcons.wifi, amenityIcons.ac, amenityIcons.tv]}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#F2B705] font-['Poppins']">
              ${room.pricePerNight || room.price}
            </span>
            <span className="text-sm text-gray-500 font-['Poppins']"> / Night</span>
          </div>
          <motion.button
            onClick={handleBookNow}
            whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(15,91,79,0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#0F5B4F] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#0d4a40] transition-colors shadow-md cursor-pointer font-['Poppins']"
          >
            Book Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const RoomsSection = ({ rooms, user, navigate, loading }) => {
  const [selectedType, setSelectedType] = useState('ALL');

  // Use static rooms only when API returns empty and loading is finished
  const baseRooms = rooms.length > 0 ? rooms : !loading ? staticRooms : [];

  // Filter rooms on-the-fly based on selected category type
  const displayRooms = baseRooms.filter((room) => {
    if (selectedType === 'ALL') return true;
    const rType = (room.type || room.title || '').toUpperCase();
    return rType.includes(selectedType);
  });

  const categories = ['ALL', 'SINGLE', 'DOUBLE', 'DELUXE', 'SUITE'];

  return (
    <section id="rooms" className="py-24 bg-[#F5F5F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-[#0F5B4F] mb-4">
            Luxury Rooms & Suites
          </h2>
          <div className="w-20 h-1 bg-[#F2B705] mx-auto mb-6 rounded-full" />
          <p className="text-lg text-[#333333] max-w-2xl mx-auto font-['Poppins']">
            Each room is a sanctuary of comfort and style, designed to provide an unforgettable stay.
          </p>
        </motion.div>

        {/* Dynamic Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedType(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2.5 rounded-full font-['Poppins'] font-semibold text-sm tracking-wide transition-all duration-300 shadow-sm cursor-pointer ${selectedType === cat
                ? 'bg-[#0F5B4F] text-white shadow-[#0F5B4F]/20'
                : 'bg-white text-[#0F5B4F] hover:bg-gray-100 border border-gray-200/50'
                }`}
            >
              {cat === 'ALL' ? 'All Spaces' : `${cat.charAt(0) + cat.slice(1).toLowerCase()} Rooms`}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#333333] font-['Poppins']">⏳ Loading rooms...</p>
          </div>
        ) : displayRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayRooms.map((room) => (
              <RoomCard key={room._id || room.id} room={room} user={user} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl shadow-md p-8">
            <p className="text-[#333333] font-['Poppins'] text-lg">No rooms matching "{selectedType}" available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
};

const HallCard = ({ hall, user, navigate }) => {
  const handleBookNow = () => {
    if (!user) {
      showToast.info('Please login to book a hall');
      navigate('/login');
      return;
    }
    navigate(`/halls/${hall.id || hall._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -8 }}
      className="bg-white rounded-[30px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row border border-gray-100"
    >
      <div className="md:w-2/5 overflow-hidden rounded-l-[30px] md:rounded-l-[30px] md:rounded-r-none">
        <img
          src={hall.images?.[0] || hall.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'}
          alt={hall.title}
          loading="lazy"
          decoding="async"
          className="w-full h-64 md:h-full object-cover transition-transform duration-700 hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80';
          }}
        />
      </div>
      <div className="p-6 md:p-8 flex flex-col justify-center md:w-3/5">
        <h3 className="text-2xl font-['Playfair_Display'] font-bold text-[#0F5B4F] mb-2">
          {hall.name || hall.title}
        </h3>
        <p className="text-sm text-gray-500 mb-2 flex items-center font-['Poppins']">
          <span className="inline-block w-2 h-2 bg-[#F2B705] rounded-full mr-2" />
          {hall.capacity || 'Capacity available'}
        </p>
        <p className="text-[#333333] mb-6 font-['Poppins']">
          {hall.description || 'Premium event space for your special occasions'}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#F2B705] font-['Poppins']">
              ${hall.pricePerHour || hall.price}
            </span>
            <span className="text-sm text-gray-500 font-['Poppins']"> / Hour</span>
          </div>
          <motion.button
            onClick={handleBookNow}
            whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(242,183,5,0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#F2B705] text-[#0F5B4F] px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-yellow-400 transition-colors shadow-md cursor-pointer font-['Poppins']"
          >
            Book Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const HallsSection = ({ halls, user, navigate, loading }) => {
  // Use static halls only when API returns empty and loading is finished
  const displayHalls = halls.length > 0 ? halls : !loading ? staticHalls : [];

  return (
    <section id="halls" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-[#0F5B4F] mb-4">
            Luxury Event Halls
          </h2>
          <div className="w-20 h-1 bg-[#F2B705] mx-auto mb-6 rounded-full" />
          <p className="text-lg text-[#333333] max-w-2xl mx-auto font-['Poppins']">
            From intimate weddings to grand conferences, our halls set the stage for unforgettable moments.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#333333] font-['Poppins']">⏳ Loading halls...</p>
          </div>
        ) : displayHalls.length > 0 ? (
          <div className="space-y-8">
            {displayHalls.map((hall) => (
              <HallCard key={hall._id || hall.id} hall={hall} user={user} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl shadow-md p-8">
            <p className="text-[#333333] font-['Poppins'] text-lg">No event halls available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
};

const GalleryGrid = () => (
  <section id="gallery" className="py-24 bg-[#F5F5F2]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-[#0F5B4F] mb-4">
          Our Gallery
        </h2>
        <div className="w-20 h-1 bg-[#F2B705] mx-auto mb-6 rounded-full" />
        <p className="text-lg text-[#333333] max-w-2xl mx-auto font-['Poppins']">
          A visual journey through our stunning spaces and amenities.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {galleryImages.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="overflow-hidden rounded-2xl group cursor-pointer relative shadow-md hover:shadow-xl transition-shadow"
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/seed/gallery-fallback/600/400';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-4">
              <span className="text-white text-sm font-medium font-['Poppins']">{img.alt}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CTABanner = ({ user, navigate }) => {
  const handleReserveNow = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    navigate('/rooms');
  };

  return (
    <section className="py-24 bg-[#0F5B4F] relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#F2B705] opacity-10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#F2B705] opacity-10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center px-4"
      >
        <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-white mb-6">
          Book Your Dream Stay Today
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-['Poppins']">
          Reserve your luxury experience now and enjoy exclusive offers and world‑class service.
        </p>
        <motion.button
          onClick={handleReserveNow}
          whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(242,183,5,0.08)' }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#F2B705] text-[#0F5B4F] px-10 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors shadow-2xl inline-flex items-center cursor-pointer font-['Poppins']"
        >
          Reserve Now
        </motion.button>
      </motion.div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#0F5B4F] text-white pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        <div>
          <Link to="/" className="text-3xl font-['Playfair_Display'] font-bold text-white mb-4 block hover:opacity-80 transition-opacity">
            LUXSTAY <span className="text-[#F2B705]">HOTELS</span>
          </Link>
          <p className="text-gray-300 text-sm leading-relaxed font-['Poppins']">
            Experience the pinnacle of luxury hospitality. Every detail is crafted to create unforgettable moments.
          </p>
        </div>

        <div>
          <h4 className="text-xl font-['Playfair_Display'] font-bold text-white mb-5">Quick Links</h4>
          <ul className="space-y-3">
            {[
              { label: 'Home', to: '/' },
              { label: 'Rooms', to: '#rooms' },
              { label: 'Events', to: '#halls' },
              { label: 'Gallery', to: '#gallery' },
              { label: 'Contact', to: '/#contact' },
            ].map((link) => (
              <li key={link.label}>
                {link.to.startsWith('/') ? (
                  <Link
                    to={link.to}
                    className="text-white/60 hover:text-[#F2B705] transition-colors duration-200 text-sm tracking-wide flex items-center gap-2 group font-['Poppins']"
                  >
                    <span className="w-1.5 h-1.5 bg-[#F2B705] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.to}
                    className="text-white/60 hover:text-[#F2B705] transition-colors duration-200 text-sm tracking-wide flex items-center gap-2 group font-['Poppins']"
                  >
                    <span className="w-1.5 h-1.5 bg-[#F2B705] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xl font-['Playfair_Display'] font-bold text-white mb-5">Contact Us</h4>
          <div className="space-y-4 text-gray-300 text-sm font-['Poppins']">
            <div className="flex items-center space-x-3">
              <MapPin size={16} className="text-[#F2B705]" />
              <span>123 Addis Ababa, Ethiopia</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone size={16} className="text-[#F2B705]" />
              <a href="tel:+251907070601" className="hover:text-[#F2B705] transition-colors">
                +251907070601
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Mail size={16} className="text-[#F2B705]" />
              <a href="mailto:luxstay@hotel.com" className="hover:text-[#F2B705] transition-colors">
                luxstay@hotel.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm font-['Poppins']">
        © {new Date().getFullYear()} LUXSTAY Hotels. All rights reserved.
      </div>
    </div>
  </footer>
);

// ---------- MAIN PAGE COMPONENT ----------
const LuxuryGalleryPage = () => {
  const [rooms, setRooms] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingHalls, setLoadingHalls] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [roomRes, hallRes] = await Promise.allSettled([
          apiClient.get('/room-types/public'),
          apiClient.get('/hall-types/public'),
        ]);

        if (roomRes.status === 'fulfilled') {
          const types = (roomRes.value.data.roomTypes || []).map(rt => ({
            id: rt._id,
            title: rt.name,
            description: rt.description || `Experience our ${rt.name} at its finest.`,
            pricePerNight: rt.basePricePerNight,
            capacity: rt.maxOccupancy,
            amenities: rt.amenities || [],
            image: rt.images?.[0] || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
          }));
          if (types.length > 0) setRooms(types);
        }

        if (hallRes.status === 'fulfilled') {
          const types = (hallRes.value.data.hallTypes || []).map(ht => ({
            id: ht._id,
            title: ht.name,
            description: ht.description || `Host your event in our ${ht.name}.`,
            pricePerHour: ht.basePricePerHour,
            capacity: ht.maxOccupancy,
            amenities: ht.amenities || [],
            image: ht.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
          }));
          if (types.length > 0) setHalls(types);
        }
      } catch (error) {
        console.error('Error loading fallback static structures:', error);
      } finally {
        setLoadingRooms(false);
        setLoadingHalls(false);
      }
    };

    fetchPublicData();
  }, []);

  return (
    <div className="font-['Poppins'] bg-[#F5F5F2] min-h-screen">
      <Navbar />
      <Hero />
      <RoomsSection rooms={rooms} user={user} navigate={navigate} loading={loadingRooms} />
      <HallsSection halls={halls} user={user} navigate={navigate} loading={loadingHalls} />
      <GalleryGrid />
      <CTABanner user={user} navigate={navigate} />
      <Footer />
    </div>
  );
};

export default LuxuryGalleryPage;