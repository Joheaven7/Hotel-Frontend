import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="footer-contact" className="bg-[#F5F5F2] dark:bg-[#0A0A0A] border-t border-black/5 dark:border-white/10 pt-20 pb-8 overflow-hidden relative transition-colors duration-300">

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-[#F2B705]/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-[#F2B705]/5 blur-[100px] pointer-events-none transition-all duration-300 opacity-50 dark:opacity-100" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

          {/* ── Brand & About ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <Link to="/" onClick={() => window.scrollTo({ top: 0 })} className="inline-flex items-center gap-2 mb-6 group">
              <span className="font-['Playfair_Display'] text-2xl font-bold tracking-tight">
                <span className="text-[#0F5B4F] dark:text-white">LUX</span>
                <span className="text-[#F2B705]">STAY</span>
              </span>
            </Link>
            <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-sm leading-relaxed mb-6 pr-4">
              A sanctuary where world-class luxury meets the warmth of Ethiopian hospitality. Experience the extraordinary with every stay.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-text-secondary dark:text-white/60 hover:text-[#F2B705] hover:border-[#F2B705]/50 transition-all duration-300">
                <FaInstagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-text-secondary dark:text-white/60 hover:text-[#F2B705] hover:border-[#F2B705]/50 transition-all duration-300">
                <FaFacebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-text-secondary dark:text-white/60 hover:text-[#F2B705] hover:border-[#F2B705]/50 transition-all duration-300">
                <FaTwitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-text-secondary dark:text-white/60 hover:text-[#F2B705] hover:border-[#F2B705]/50 transition-all duration-300">
                <FaLinkedin size={16} />
              </a>
            </div>
          </div>

          {/* ── Quick Links ─────────────────────────────────────────────────────── */}
          <div>
            <h4 className="font-['Playfair_Display'] text-text-primary dark:text-white text-lg font-semibold mb-6">Discover</h4>
            <ul className="space-y-3 font-['Inter']">
              <li><button onClick={() => handleScrollTo('home')} className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Our Story</button></li>
              <li><button onClick={() => handleScrollTo('rooms')} className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Accommodations</button></li>
              <li><button onClick={() => handleScrollTo('amenities')} className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Amenities & Spa</button></li>
              <li><button onClick={() => handleScrollTo('halls')} className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Meetings & Events</button></li>
              <li><Link to="/gallery" className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Gallery</Link></li>
            </ul>
          </div>

          {/* ── Information ─────────────────────────────────────────────────────── */}
          <div>
            <h4 className="font-['Playfair_Display'] text-text-primary dark:text-white text-lg font-semibold mb-6">Information</h4>
            <ul className="space-y-3 font-['Inter']">
              <li><Link to="/login" className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Guest Portal</Link></li>
              <li><Link to="/register" className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Become a Member</Link></li>
              <li><a href="#" className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">Terms & Conditions</a></li>
              <li><a href="#" className="text-text-secondary dark:text-white/50 hover:text-[#F2B705] dark:hover:text-[#F2B705] text-sm transition-colors duration-300">FAQ</a></li>
            </ul>
          </div>

          {/* ── Contact ─────────────────────────────────────────────────────────── */}
          <div>
            <h4 className="font-['Playfair_Display'] text-text-primary dark:text-white text-lg font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 font-['Inter']">
              <li className="flex items-start gap-3 text-text-secondary dark:text-white/50 text-sm">
                <MapPin size={18} className="text-[#F2B705] shrink-0 mt-0.5" />
                <span>Bole Road, P.O. Box 1234<br />Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary dark:text-white/50 text-sm hover:text-[#F2B705] dark:hover:text-[#F2B705] transition-colors">
                <Phone size={18} className="text-[#F2B705] shrink-0" />
                <a href="tel:+251907070601">+251 907 070 601</a>
              </li>
              <li className="flex items-center gap-3 text-text-secondary dark:text-white/50 text-sm hover:text-[#F2B705] dark:hover:text-[#F2B705] transition-colors">
                <Mail size={18} className="text-[#F2B705] shrink-0" />
                <a href="mailto:luxstay@hotel.com">luxstay@hotel.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar ──────────────────────────────────────────────────────── */}
        <div className="border-t border-black/10 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-['Inter'] text-text-secondary/65 dark:text-white/40 text-xs">
            © {currentYear} LuxStay Hotels & Resorts. All rights reserved.
          </p>
          <p className="font-['Inter'] text-text-secondary/65 dark:text-white/40 text-xs flex items-center gap-1.5">
            Built with <span className="text-[#F2B705]">♥</span> in Addis Ababa
          </p>
        </div>
      </div>
    </footer>
  );
}