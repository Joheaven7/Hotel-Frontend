import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import apiClient from '../../services/api';
import { useThemeStore } from '../../store/themeStore';

// ── Static fallback data (beautiful Unsplash images per category) ──────────────
const fallbackImages = [
  // ROOMS
  { id: 'f1', src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80', alt: 'Deluxe Room', category: 'ROOMS' },
  { id: 'f2', src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=75&auto=format', alt: 'Garden Terrace Room', category: 'ROOMS' },
  { id: 'f3', src: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=75&auto=format', alt: 'Classic Double Room', category: 'ROOMS' },
  // SUITES
  { id: 'f4', src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=75&auto=format', alt: 'Executive Suite', category: 'SUITES' },
  { id: 'f5', src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=75&auto=format', alt: 'Presidential Suite', category: 'SUITES' },
  { id: 'f6', src: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=75&auto=format', alt: 'Royal Suite Lounge', category: 'SUITES' },
  // HALLS
  { id: 'f7', src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=75&auto=format', alt: 'Grand Wedding Hall', category: 'HALLS' },
  { id: 'f8', src: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=75&auto=format', alt: 'Conference Center', category: 'HALLS' },
  { id: 'f9', src: 'https://images.unsplash.com/photo-1530103862676-de8892ebe829?w=800&q=75&auto=format', alt: 'Royal Banquet Hall', category: 'HALLS' },
  // AMENITIES
  { id: 'f10', src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=75&auto=format', alt: 'Rooftop Pool', category: 'AMENITIES' },
  { id: 'f11', src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=75&auto=format', alt: 'Luxury Spa', category: 'AMENITIES' },
  { id: 'f12', src: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=75&auto=format', alt: 'Fitness Center', category: 'AMENITIES' },
  // DINING
  { id: 'f13', src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=75&auto=format', alt: 'Fine Dining', category: 'DINING' },
  { id: 'f14', src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=75&auto=format', alt: 'Restaurant Interior', category: 'DINING' },
  { id: 'f15', src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=75&auto=format', alt: 'Rooftop Bar', category: 'DINING' },
  // ALL (general hotel showcase)
  { id: 'f16', src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=75&auto=format', alt: 'Hotel Exterior', category: 'ALL' },
  { id: 'f17', src: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=75&auto=format', alt: 'Grand Lobby', category: 'ALL' },
];

const filters = ['ALL', 'ROOMS', 'SUITES', 'HALLS', 'AMENITIES', 'DINING'];

// Resolve backend image paths to full URLs
const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, '');
  return `${baseUrl}/${path.replace(/\\/g, '/')}`;
};

// ── Image item with Blur-Up & 3D tilt ──────────────────────────────────────────
function GalleryImage({ item, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [tilted, setTilted] = useState(false);
  const cardRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -8;
    const rotateY = ((x - cx) / cx) * 8;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    setTilted(true);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    setTilted(false);
  };

  // Generate low-quality preview URL if it's an Unsplash image
  const isUnsplash = item.src && item.src.includes('unsplash.com');
  const previewSrc = isUnsplash 
    ? item.src.split('?')[0] + '?w=50&q=10'
    : item.src;

  const finalSrc = error ? fallbackImages[0].src : item.src;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="tilt-card relative group rounded-[24px] overflow-hidden cursor-pointer bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 shadow-soft dark:shadow-card-dark transition-all duration-300 w-full"
      style={{ willChange: 'transform' }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-[280px]">
        {/* Layer 1: Blurred Preview */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${previewSrc})`,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: loaded ? 0 : 1
          }}
        />

        {/* Layer 2: Main High-Quality Image */}
        <img
          src={finalSrc}
          alt={item.alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1.2s] ease-out group-hover:scale-110 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Shimmer overlay while loading */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}

        {/* Dark bottom gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />

        {/* Gold glow border on hover */}
        <div
          className="absolute inset-0 rounded-t-[24px] transition-all duration-300 pointer-events-none"
          style={{
            boxShadow: tilted ? '0 0 0 1.5px rgba(242,183,5,0.5) inset' : '0 0 0 0 transparent inset',
          }}
        />

        {/* Top-left Type Badge */}
        <div className="absolute top-4 left-4 bg-[#F2B705]/15 backdrop-blur-sm border border-[#F2B705]/30 rounded-full px-3 py-1 z-10">
          <span className="font-['Inter'] text-[#F2B705] text-[10px] tracking-[0.15em] uppercase font-semibold">
            {item.category}
          </span>
        </div>
      </div>

      {/* Card body (Title underneath) */}
      <div className="p-6 relative">
        <h3 className="font-['Playfair_Display'] text-text-primary dark:text-white text-xl font-semibold mb-2 group-hover:text-[#F2B705] transition-colors duration-300">
          {item.alt}
        </h3>
        
        <div className="flex items-center gap-2 text-text-secondary dark:text-white/50 font-['Inter'] text-xs tracking-widest uppercase mt-4">
          <Maximize2 size={12} className="text-[#F2B705]" />
          <span>View Image</span>
        </div>
        
        {/* Gold glow border for bottom half on hover */}
        <div
          className="absolute inset-0 rounded-b-[24px] transition-all duration-300 pointer-events-none"
          style={{
            boxShadow: tilted ? '0 0 0 1.5px rgba(242,183,5,0.5) inset' : '0 0 0 0 transparent inset',
            borderTop: 'none'
          }}
        />
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function GalleryPage() {
  const [images, setImages] = useState(fallbackImages);
  const [filter, setFilter] = useState('ALL');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const theme = useThemeStore((s) => s.theme);

  // Filter images
  const displayImages = images.filter((img) => filter === 'ALL' || img.category === filter);

  // Fetch API images and merge with fallbacks
  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.allSettled([
      apiClient.get('/room-types/public'),
      apiClient.get('/hall-types/public')
    ]).then(([roomRes, hallRes]) => {
      let apiImages = [];

      if (roomRes.status === 'fulfilled') {
        (roomRes.value.data.roomTypes || []).forEach((rt, i) => {
          (rt.images || []).forEach((imgPath, j) => {
            const resolvedUrl = resolveImageUrl(imgPath);
            // Only use images that are full http URLs (uploaded to cloud/CDN)
            if (resolvedUrl && resolvedUrl.startsWith('http')) {
              apiImages.push({
                id: `api-r-${i}-${j}`,
                src: resolvedUrl,
                alt: rt.name,
                category: rt.name.toLowerCase().includes('suite') ? 'SUITES' : 'ROOMS'
              });
            }
          });
        });
      }

      if (hallRes.status === 'fulfilled') {
        (hallRes.value.data.hallTypes || []).forEach((ht, i) => {
          (ht.images || []).forEach((imgPath, j) => {
            const resolvedUrl = resolveImageUrl(imgPath);
            if (resolvedUrl && resolvedUrl.startsWith('http')) {
              apiImages.push({
                id: `api-h-${i}-${j}`,
                src: resolvedUrl,
                alt: ht.name,
                category: 'HALLS'
              });
            }
          });
        });
      }

      // Always keep fallbacks to ensure every category has images.
      // API images are added on top of the fallbacks.
      if (apiImages.length > 0) {
        // Deduplicate: remove fallbacks for categories that now have real API images
        const apiCategories = new Set(apiImages.map(img => img.category));
        const keptFallbacks = fallbackImages.filter(f => !apiCategories.has(f.category));
        setImages([...apiImages, ...keptFallbacks]);
      }
      // If no API images, fallbackImages stay as the default (set in useState init)
    });
  }, []);

  // Lightbox keyboard nav
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % displayImages.length);
    if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [lightboxIndex, displayImages.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [lightboxIndex]);

  return (
    <div className="min-h-screen bg-background dark:bg-[#0A0A0A] font-sans selection:bg-[#F2B705]/30 selection:text-white flex flex-col transition-colors duration-300">
      <Navbar />

      {/* ── Cinematic Hero ──────────────────────────────────────────────────── */}
      <section className="relative w-full pt-32 pb-16 md:pt-40 md:pb-24 flex items-center justify-center overflow-hidden border-b border-black/5 dark:border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-background dark:from-[#0A0A0A] to-transparent z-10" />
        <div className="relative z-20 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-['Inter'] text-[#F2B705] text-xs tracking-[0.3em] uppercase mb-4 block">
              Visual Journey
            </span>
            <h1 className="font-['Playfair_Display'] font-bold text-text-primary dark:text-white text-5xl md:text-6xl lg:text-7xl mb-6">
              Our World, <span className="italic font-light">Your Canvas</span>
            </h1>
            <div className="flex items-center justify-center gap-3 text-text-secondary/60 dark:text-white/50 text-xs font-['Inter'] tracking-widest uppercase">
              <span>Home</span>
              <span className="w-1 h-1 rounded-full bg-[#F2B705]" />
              <span className="text-[#0F5B4F] dark:text-white">Gallery</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <div className="w-full bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { num: '247', label: 'Rooms' },
              { num: '12', label: 'Event Spaces' },
              { num: '5', label: 'Dining Venues' },
              { num: '1', label: 'Rooftop Pool' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="flex items-center gap-3"
              >
                <span className="font-['Playfair_Display'] text-2xl font-bold text-[#F2B705]">{stat.num}</span>
                <span className="font-['Inter'] text-text-secondary dark:text-white/60 text-xs tracking-widest uppercase">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLightboxIndex(null); }}
              className={`filter-pill font-['Inter'] text-xs font-semibold tracking-widest uppercase px-6 py-2.5 rounded-full border transition-all duration-300 ${filter === f
                  ? 'active'
                  : 'text-text-secondary border-black/10 hover:border-[#0F5B4F] hover:text-[#0F5B4F] dark:text-white/60 dark:border-white/10 dark:hover:border-white/30 dark:hover:text-white'
                }`}
            >
              <span className="relative z-10">{f}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Masonry Grid ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 flex-grow">
        <div className="masonry-grid">
          {displayImages.map((img, idx) => (
            <div key={img.id} className="masonry-item">
              <GalleryImage item={img} onClick={() => setLightboxIndex(idx)} />
            </div>
          ))}
        </div>

        {displayImages.length === 0 && (
          <div className="text-center py-20 text-text-secondary dark:text-white/50 font-['Inter']">
            No images found for this category.
          </div>
        )}
      </div>

      <Footer />

      {/* ── Fullscreen Lightbox ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            >
              <motion.div animate={{ rotate: [90, 0] }} transition={{ duration: 0.3 }}>
                <X size={24} />
              </motion.div>
            </button>

            {/* Counter */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 font-['Inter'] text-white/60 tracking-widest text-sm">
              {lightboxIndex + 1} <span className="text-white/30 mx-1">/</span> {displayImages.length}
            </div>

            {/* Prev Button */}
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
              }}
            >
              <ChevronLeft size={32} />
            </button>

            {/* Next Button */}
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % displayImages.length);
              }}
            >
              <ChevronRight size={32} />
            </button>

            {/* Image Container */}
            <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={displayImages[lightboxIndex].src}
                  alt={displayImages[lightboxIndex].alt}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="lightbox-img"
                />
              </AnimatePresence>

              {/* Caption */}
              <motion.div
                key={`caption-${lightboxIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-12 left-0 right-0 text-center font-['Playfair_Display'] text-xl text-white"
              >
                {displayImages[lightboxIndex].alt}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}