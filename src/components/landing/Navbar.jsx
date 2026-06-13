import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { showToast } from '../../services/toast';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ThemeToggle from '../common/ThemeToggle';

const navLinks = [
  { label: 'Home',     type: 'route',   to: '/' },
  { label: 'Rooms',    type: 'section', id: 'rooms' },
  { label: 'Services', type: 'section', id: 'amenities' },
  { label: 'Gallery',  type: 'route',   to: '/gallery' },
  { label: 'Contact',  type: 'section', id: 'footer-contact' },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [isOpen,    setIsOpen]    = useState(false);
  const [activeId,  setActiveId]  = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAuthStore((s) => s.user);
  const { theme, toggleTheme } = useThemeStore();

  // ── Scroll → solid nav ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Section active tracking ──────────────────────────────────────────────────
  useEffect(() => {
    const ids = ['home', 'booking', 'about', 'rooms', 'amenities', 'testimonials', 'halls', 'cta'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // ── Close drawer on resize ───────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setIsOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleNavClick = (item) => {
    setIsOpen(false);
    if (item.type === 'route') {
      navigate(item.to);
      return;
    }
    if (location.pathname !== '/') {
      navigate(`/#${item.id}`);
    } else {
      const el = document.getElementById(item.id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookNow = () => {
    setIsOpen(false);
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }
    navigate('/reservations');
  };

  const isActive = (item) => {
    if (item.type === 'route') return location.pathname === item.to;
    return activeId === item.id;
  };

  // ── Navbar background logic ──────────────────────────────────────────────────
  // On hero (dark bg): glassmorphism dark → solid dark on scroll
  // On light pages (gallery, login, etc.): always solid white
  const isLandingHero = location.pathname === '/' && !scrolled;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isLandingHero
            ? 'glass-nav'
            : 'bg-white/98 dark:bg-[#0A0A0A]/98 backdrop-blur-glass border-b border-neutral-100 dark:border-white/10 shadow-sm dark:shadow-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ── Logo ────────────────────────────────────────────────────────── */}
            <Link
              to="/"
              className="flex items-center gap-2 group"
              aria-label="LuxStay Home"
            >
              {/* Animated diamond icon */}
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div
                  className={`absolute w-7 h-7 rotate-45 border-2 transition-all duration-300 group-hover:scale-110 ${
                    isLandingHero ? 'border-[#F2B705]' : 'border-[#0F5B4F] dark:border-[#F2B705]'
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isLandingHero ? 'bg-[#F2B705]' : 'bg-[#F2B705]'
                  }`}
                />
              </div>
              <span className="font-['Playfair_Display'] text-xl md:text-2xl font-bold tracking-tight leading-none">
                <span className={isLandingHero ? 'text-white' : 'text-[#0F5B4F] dark:text-white'}>LUX</span>
                <span className="text-[#F2B705]">STAY</span>
              </span>
            </Link>

            {/* ── Desktop Nav Links ────────────────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`relative font-['Inter'] font-medium text-sm tracking-wide transition-colors duration-300 group ${
                    isActive(item)
                      ? isLandingHero ? 'text-[#F2B705]' : 'text-[#0F5B4F] dark:text-[#F2B705]'
                      : isLandingHero
                        ? 'text-white/80 hover:text-[#F2B705]'
                        : 'text-[#444] dark:text-white/80 hover:text-[#0F5B4F] dark:hover:text-[#F2B705]'
                  }`}
                >
                  {item.label}
                  {/* Underline draw */}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#F2B705] rounded-full transition-all duration-300 ${
                      isActive(item) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* ── Desktop CTA ──────────────────────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-4 ml-6">
                <ThemeToggle className="hover:scale-105" />
                
                {!user && (
                <Link
                  to="/login"
                  className={`font-['Inter'] font-medium text-sm transition-colors duration-300 ${
                    isLandingHero ? 'text-white/70 hover:text-white' : 'text-[#555] dark:text-white/70 hover:text-[#0F5B4F] dark:hover:text-[#F2B705]'
                  }`}
                >
                  Sign In
                </Link>
              )}
              <motion.button
                onClick={handleBookNow}
                whileHover={{ scale: 1.05, boxShadow: '0 6px 25px rgba(242,183,5,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden bg-[#F2B705] text-[#0F5B4F] font-['Inter'] font-bold text-xs tracking-[0.12em] uppercase px-6 py-2.5 rounded-full shadow-glow-gold-sm cursor-pointer"
              >
                <span className="relative z-10">{user ? 'My Bookings' : 'Book Now'}</span>
              </motion.button>
            </div>

            {/* ── Mobile Actions ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isLandingHero ? 'text-white hover:bg-white/10' : 'text-[#333] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-[#0A0A0A] z-50 border-l border-neutral-150 dark:border-white/10 flex flex-col pt-24 px-8 pb-10 shadow-2xl transition-colors duration-300"
            >
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-text-secondary dark:text-white/60 hover:text-text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>

              {/* Logo in drawer */}
              <div className="absolute top-5 left-6 flex items-center gap-2">
                <span className="font-['Playfair_Display'] text-lg font-bold">
                  <span className="text-text-primary dark:text-white">LUX</span>
                  <span className="text-[#F2B705]">STAY</span>
                </span>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-2">
                {navLinks.map((item, i) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => handleNavClick(item)}
                    className={`text-left py-3 px-4 rounded-xl font-['Inter'] font-medium text-base transition-all duration-200 ${
                      isActive(item)
                        ? 'text-[#F2B705] bg-[#F2B705]/10'
                        : 'text-text-secondary dark:text-white/70 hover:text-text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-6 h-px bg-black/10 dark:bg-white/10" />

              {/* Mobile CTAs */}
              <div className="flex flex-col gap-3">
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center py-3 px-6 rounded-full border border-black/20 dark:border-white/20 text-text-primary dark:text-white font-['Inter'] font-medium text-sm hover:border-black/50 dark:hover:border-white/50 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
                <button
                  onClick={handleBookNow}
                  className="bg-[#F2B705] text-[#0F5B4F] font-['Inter'] font-bold text-sm tracking-wide uppercase py-3 px-6 rounded-full shadow-glow-gold cursor-pointer"
                >
                  {user ? 'My Bookings' : 'Book Now'}
                </button>
              </div>

              {/* Bottom tag */}
              <p className="mt-auto text-text-secondary/65 dark:text-white/25 text-xs font-['Inter'] text-center">
                LuxStay Hotels &amp; Resorts<br />Addis Ababa, Ethiopia
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}