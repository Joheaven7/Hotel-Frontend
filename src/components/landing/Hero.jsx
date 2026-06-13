import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../services/toast';
import { ChevronDown } from 'lucide-react';

// ── Stagger variants ──────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.22, delayChildren: 0.3 },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 80, skewY: 4 },
  visible: {
    opacity: 1,
    y: 0,
    skewY: 0,
    transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const subtitleVariants = {
  hidden:   { opacity: 0, y: 30 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
};

// ── Bokeh / Floating orb data ──────────────────────────────────────────────────
const orbs = [
  { size: 320, top: '10%',  left: '5%',  delay: '0s',   duration: '9s',  opacity: 0.12 },
  { size: 200, top: '60%',  left: '15%', delay: '2s',   duration: '7s',  opacity: 0.08 },
  { size: 450, top: '20%',  left: '70%', delay: '1s',   duration: '11s', opacity: 0.1  },
  { size: 150, top: '75%',  left: '80%', delay: '3.5s', duration: '6s',  opacity: 0.15 },
  { size: 260, top: '45%',  left: '45%', delay: '0.8s', duration: '8s',  opacity: 0.07 },
];

export default function Hero() {
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const heroRef    = useRef(null);
  const bgRef      = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // ── Parallax scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return;
      const scrolled = window.scrollY;
      bgRef.current.style.transform = `translateY(${scrolled * 0.38}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Entrance: trigger loaded state ──────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleBookNow = () => {
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }
    navigate('/rooms');
  };

  const handleExplore = () => {
    const el = document.getElementById('booking');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative w-full h-screen min-h-[700px] overflow-hidden flex items-center justify-center"
    >
      {/* ── Parallax Background Image ──────────────────────────────────────────── */}
      <div
        ref={bgRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=70&auto=format')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          top: '-15%',
          bottom: '-15%',
          left: 0,
          right: 0,
        }}
      />

      {/* ── Multi-layer dark gradient overlay ─────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />

      {/* ── Bokeh / Atmospheric orbs ──────────────────────────────────────────── */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none will-change-transform"
          style={{
            width:  orb.size,
            height: orb.size,
            top:    orb.top,
            left:   orb.left,
            background: `radial-gradient(circle, rgba(242,183,5,${orb.opacity}) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: `bokeh ${orb.duration} ease-in-out ${orb.delay} infinite`,
          }}
        />
      ))}

      {/* ── Green atmospheric glow bottom ─────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(15,91,79,0.25) 0%, transparent 70%)',
        }}
      />

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={loaded ? 'visible' : 'hidden'}
        >
          {/* Overline label */}
          <motion.p
            variants={subtitleVariants}
            className="font-['Inter'] text-xs md:text-sm tracking-[0.35em] uppercase text-[#F2B705] mb-6 opacity-90"
          >
            ✦ Addis Ababa, Ethiopia ✦
          </motion.p>

          {/* LUXSTAY wordmark */}
          <div className="overflow-hidden mb-4">
            <motion.h1
              variants={wordVariants}
              className="font-['Playfair_Display'] font-bold text-[#F2B705] leading-none tracking-[0.18em]"
              style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}
            >
              LUXSTAY
            </motion.h1>
          </div>

          {/* Gold divider */}
          <motion.div
            variants={subtitleVariants}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#F2B705]" />
            <div className="w-2 h-2 rounded-full bg-[#F2B705]" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#F2B705]" />
          </motion.div>

          {/* Tagline */}
          <div className="overflow-hidden mb-3">
            <motion.p
              variants={wordVariants}
              className="font-['Playfair_Display'] italic text-white font-light"
              style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)' }}
            >
              Where Luxury Meets Serenity
            </motion.p>
          </div>

          {/* Sub-tagline */}
          <motion.p
            variants={subtitleVariants}
            className="font-['Inter'] text-white/60 text-sm md:text-base tracking-widest uppercase mt-2 mb-12"
          >
            Hotels &amp; Resorts · Est. 2010
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={subtitleVariants}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              onClick={handleBookNow}
              whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(242,183,5,0.55)' }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden bg-[#F2B705] text-[#0F5B4F] font-['Inter'] font-bold text-sm tracking-[0.1em] uppercase px-10 py-4 rounded-full shadow-glow-gold cursor-pointer"
            >
              <span className="relative z-10">Reserve Your Suite</span>
              {/* shimmer sweep */}
              <span
                className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700"
                style={{
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)',
                }}
              />
            </motion.button>

            <motion.button
              onClick={handleExplore}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="border border-white/30 text-white font-['Inter'] font-medium text-sm tracking-widest uppercase px-10 py-4 rounded-full backdrop-blur-sm hover:border-[#F2B705] hover:text-[#F2B705] transition-all duration-300 cursor-pointer"
            >
              Explore Now
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll Indicator ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="font-['Inter'] text-white/40 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={22} className="text-[#F2B705] opacity-80" />
        </motion.div>
      </motion.div>

      {/* ── Corner accent lines ───────────────────────────────────────────────── */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-[#F2B705]/40 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-[#F2B705]/40 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-[#F2B705]/40 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-[#F2B705]/40 pointer-events-none" />
    </section>
  );
}