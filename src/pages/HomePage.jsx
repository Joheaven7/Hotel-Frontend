import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Booking from '../components/landing/Booking';
import Brand from '../components/landing/Brand';
import RoomTypes from '../components/landing/RoomTypes';
import Amenities from '../components/landing/Amenities';
import Testimonials from '../components/landing/Testimonials';
import HallShowcase from '../components/landing/HallShowcase';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

export default function HomePage() {
  // Handle direct anchor links on initial load
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg font-sans selection:bg-[#F2B705]/30 selection:text-white transition-colors duration-300">
      <Navbar />
      <Hero />
      <Booking />
      <Brand />
      <RoomTypes />
      <Amenities />
      <Testimonials />
      <HallShowcase />
      <CTASection />
      <Footer />
    </div>
  );
}