import { useEffect } from 'react';   // ✅ missing import
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import Booking from '../components/landing/Booking';
import Reviews from '../components/landing/Reviews';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
// LuxuryGalleryPage is not used in this file; you can import it if needed elsewhere

export default function HomePage() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F2] font-playfair-all text-[#333333]">
      <Navbar />
      <Hero />
      <section id="booking">
        <Booking />
      </section>
      <section id="services">
        <Services />
      </section>
      <section id="reviews">
        <Reviews />
      </section>
      <section id="contact">
        <Contact />
      </section>
      <Footer />
    </div>
  );
}