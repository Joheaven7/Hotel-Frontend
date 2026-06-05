import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleCheck, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/#services' },
  { label: 'Booking', to: '/#booking' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'Contact', to: '/#contact' },
];

// Inline SVG components to avoid import issues
const IconFacebook = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconInstagram = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const IconWhatsApp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const socials = [
  { icon: <IconFacebook />, label: 'Facebook', url: 'https://facebook.com' },
  { icon: <IconInstagram />, label: 'Instagram', url: 'https://instagram.com' },
  { icon: <IconWhatsApp />, label: 'WhatsApp', url: 'https://wa.me/15551234567' },
];

const hotelContact = {
  email: 'luxstay@hotel.com',
  phone: '+251912345678',
  address: 'Addis Ababa, Ethiopia',
};

export default function Footer() {
  const [hoveredSocial, setHoveredSocial] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLinkClick = (link, e) => {
    e.preventDefault();
    if (link.to === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
      return;
    }

    if (link.to.startsWith('/#')) {
      const id = link.to.replace('/#', '');
      if (location.pathname !== '/') {
        navigate(link.to);
      } else {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, null, link.to);
        }
      }
    }
  };

  const handleSocialClick = (url, e) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-[#0F5B4F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Column 1: Logo & Social */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-2.5 mb-4 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center">
                <CircleCheck size={18} color="#0F5B4F" strokeWidth={2.5} />
              </div>
              <span className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight">
                LUX <span className='text-gold'>STAY</span>
              </span>
            </Link>
            <p className="text-white/65 text-sm leading-relaxed mb-6 max-w-xs">
              Where timeless elegance meets modern comfort. Experience the pinnacle of luxury
              hospitality in the world's most exquisite destinations.
            </p>
            <div className="flex gap-3">
              {socials.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.url}
                  onClick={(e) => handleSocialClick(social.url, e)}
                  aria-label={social.label}
                  onMouseEnter={() => setHoveredSocial(i)}
                  onMouseLeave={() => setHoveredSocial(null)}
                  whileHover={{ scale: 1.15 }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${hoveredSocial === i
                    ? 'bg-gold text-[#0F5B4F] border-gold'
                    : 'border-white/25 text-white/70 hover:text-gold'
                    }`}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Column 2: Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h4 className="font-heading text-lg font-bold text-white mb-5">Important Links</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={(e) => handleLinkClick(link, e)}
                    className="text-white/60 hover:text-gold transition-colors duration-200 text-sm tracking-wide flex items-center gap-2 group cursor-pointer bg-transparent border-none outline-none p-0 text-left"
                  >
                    <span className="w-1 h-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-heading text-lg font-bold text-white mb-5">Reach Us</h4>
            <ul className="space-y-4">
              {/* Email */}
              <li className="flex items-start gap-3 text-white/60 text-sm group hover:text-gold transition-colors">
                <Mail size={15} className="mt-0.5 text-gold flex-shrink-0" />
                <a href={`mailto:${hotelContact.email}`} className="hover:text-gold transition-colors">
                  {hotelContact.email}
                </a>
              </li>

              {/* Phone */}
              <li className="flex items-start gap-3 text-white/60 text-sm group hover:text-gold transition-colors">
                <Phone size={15} className="mt-0.5 text-gold flex-shrink-0" />
                <a href={`tel:${hotelContact.phone.replace(/\s/g, '')}`} className="hover:text-gold transition-colors">
                  {hotelContact.phone}
                </a>
              </li>

              {/* Address */}
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <MapPin size={15} className="mt-0.5 text-gold flex-shrink-0" />
                <span>{hotelContact.address}</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 mt-12 pt-8">
          <p className="text-center text-white/40 text-xs tracking-wider">
            &copy; {new Date().getFullYear()} LuxStay. All rights reserved. Crafted with elegance.
          </p>
        </div>
      </div>
    </footer>
  );
}