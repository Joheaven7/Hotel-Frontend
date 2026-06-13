import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function CTASection() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);

  // Parallax effect for the background image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  const handleReserve = () => {
    if (!user) navigate('/register');
    else navigate('/reservations');
  };

  return (
    <section 
      id="cta"
      ref={containerRef} 
      className="relative w-full h-[80vh] min-h-[600px] overflow-hidden flex items-center justify-center bg-black"
    >
      {/* ── Parallax Background Image ─────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 w-full h-[130%]"
        style={{ 
          y,
          backgroundImage: 'url("https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* ── Gradient Overlays ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-90" />
      
      {/* ── Floating Particles (CSS Animation) ────────────────────────────────── */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="particle bg-[#F2B705]"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            '--duration': (Math.random() * 3 + 4) + 's',
            '--delay': (Math.random() * 2) + 's',
          }}
        />
      ))}

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass-card rounded-[32px] p-10 md:p-16 border border-black/5 dark:border-white/10 shadow-2xl transition-all duration-300"
          style={{ 
            background: theme === 'dark' ? 'rgba(10,10,10,0.4)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)' 
          }}
        >
          <span className="font-['Inter'] text-[#F2B705] text-sm tracking-[0.25em] uppercase mb-4 block">
            Begin Your Journey
          </span>
          
          <h2 className="font-['Playfair_Display'] font-bold text-text-primary dark:text-white text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
            Your Extraordinary <br/><span className="italic font-light">Stay Awaits</span>
          </h2>
          
          <p className="font-['Inter'] text-text-secondary dark:text-white/70 text-base md:text-lg mb-10 max-w-xl mx-auto">
            Step into a world where absolute luxury meets timeless elegance. Reserve your suite today and experience hospitality redefined.
          </p>

          {/* Animated Gold Border Button */}
          <button 
            onClick={handleReserve}
            className="btn-gold-border-animated"
          >
            {user ? 'Book Your Suite' : 'Become a Guest'}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
