import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleCheck, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showToast } from '../../services/toast';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { label: 'Home', type: 'route', to: '/' },
  { label: 'Booking', type: 'section', id: 'booking' },
  { label: 'Services', type: 'section', id: 'services' },
  { label: 'Reviews', type: 'section', id: 'reviews' },
  { label: 'Gallery', type: 'route', to: '/gallery' },
  { label: 'Contact', type: 'section', id: 'contact' },
];

export default function Navbar() {
  const [active, setActive] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Intersection Observer for active section
  useEffect(() => {
    const sectionIds = ['home', 'services', 'booking', 'reviews', 'contact'];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -50% 0px',
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookNow = () => {
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }
    navigate('/rooms');
  };

  const handleNavClick = (item) => {
    if (item.label === 'Home' && location.pathname === '/') {
      const el = document.getElementById('home');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      /* UPDATED: Changed from transparent variations to a solid, clean opaque background */
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-neutral-100 ${scrolled ? 'shadow-lg shadow-[#0F5B4F]/5' : 'shadow-sm shadow-[#0F5B4F]/5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-[#0F5B4F] rounded-full flex items-center justify-center shadow-md">
              <CircleCheck size={18} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-['Playfair_Display'] text-xl md:text-2xl font-bold tracking-tight">
              <span className="text-[#0F5B4F]">LUX</span>{' '}
              <span className="text-[#F2B705]">STAY</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => {
              const isActive =
                item.label === 'Home'
                  ? location.pathname === '/' && (active === 'home' || !active)
                  : item.type === 'route'
                    ? location.pathname === item.to
                    : active === item.id;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`group relative font-['Poppins'] font-medium text-sm tracking-wide transition-colors duration-300 ${isActive ? 'text-[#0F5B4F]' : 'text-[#333333] hover:text-[#0F5B4F]'
                    }`}
                >
                  {item.label}

                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#F2B705] rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden lg:block">
            <motion.button
              onClick={handleBookNow}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 4px 20px rgba(15,91,79,0.4)',
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#0F5B4F] text-white px-6 py-2.5 rounded-full font-['Poppins'] font-semibold text-sm tracking-wide shadow-lg shadow-[#0F5B4F]/20 hover:bg-[#0F5B4F]/90 transition-colors cursor-pointer"
            >
              {user ? 'Book Now' : 'Login'}
            </motion.button>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors z-50 relative"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} color="#333333" /> : <Menu size={24} color="#333333" />}
          </button>
        </div>
      </div>

      {/* Right-to-Left Sliding Half-Screen Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Darkened Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
            />

            {/* Right-Aligned Solid Drawer Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[60vw] max-w-[300px] bg-white z-40 shadow-2xl border-l border-neutral-100 flex flex-col pt-24 px-6 pb-8"
            >
              <div className="flex flex-col items-center gap-6 w-full my-auto">
                {navLinks.map((item) => {
                  const isActive =
                    item.label === 'Home'
                      ? location.pathname === '/' && (active === 'home' || !active)
                      : item.type === 'route'
                        ? location.pathname === item.to
                        : active === item.id;

                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        handleNavClick(item);
                        setIsOpen(false);
                      }}
                      className={`group relative font-['Poppins'] font-semibold text-base tracking-wide py-2 text-center transition-colors duration-300 w-fit ${isActive ? 'text-[#0F5B4F]' : 'text-[#333333] hover:text-[#0F5B4F]'
                        }`}
                    >
                      {item.label}

                      {/* Dynamic gold active tracking lines */}
                      <span
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#F2B705] rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                      />
                    </button>
                  );
                })}

                {/* Centered Mobile CTA Action Button */}
                <button
                  onClick={() => {
                    handleBookNow();
                    setIsOpen(false);
                  }}
                  className="bg-[#0F5B4F] text-white px-8 py-3 rounded-full font-['Poppins'] font-semibold text-sm tracking-wide text-center w-full mt-4 hover:bg-[#0F5B4F]/90 transition-colors shadow-md shadow-[#0F5B4F]/20 cursor-pointer"
                >
                  {user ? 'Book Now' : 'Login'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}