import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    quote: "An absolute masterpiece of hospitality. The attention to detail in the Presidential Suite left us speechless. We have found our forever home in Addis Ababa.",
    author: "Eleanor Vance",
    location: "London, UK",
    rating: 5,
  },
  {
    id: 2,
    quote: "From the seamless airport transfer to the Michelin-star dining, every moment was curated to perfection. The rooftop pool offers the most breathtaking sunsets.",
    author: "Marcus Thorne",
    location: "New York, USA",
    rating: 5,
  },
  {
    id: 3,
    quote: "The spa treatments are transformative. We hosted our corporate retreat here, and the conference facilities paired with their warmth made it unforgettable.",
    author: "Sarah Jenkins",
    location: "Nairobi, Kenya",
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonials" className="section-dark-2 py-24 md:py-32 relative overflow-hidden">
      
      {/* ── Background styling ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(var(--color-lux-gold) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

        {/* ── Small title ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="font-['Inter'] text-[#F2B705] text-xs tracking-[0.3em] uppercase">
            Guest Experiences
          </span>
        </motion.div>

        {/* ── Carousel ──────────────────────────────────────────────────────── */}
        <div className="relative min-h-[280px] md:min-h-[240px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute w-full px-4"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} size={18} className="fill-[#F2B705] text-[#F2B705]" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-['Playfair_Display'] italic text-text-primary/95 dark:text-white/90 text-2xl md:text-3xl lg:text-4xl leading-relaxed max-w-4xl mx-auto mb-8">
                "{testimonials[currentIndex].quote}"
              </p>

              {/* Author */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-px bg-[#F2B705]/50 mb-4" />
                <h4 className="font-['Inter'] font-semibold text-text-primary dark:text-white tracking-wider uppercase text-sm mb-1">
                  {testimonials[currentIndex].author}
                </h4>
                <span className="font-['Inter'] text-text-secondary dark:text-white/40 text-xs">
                  {testimonials[currentIndex].location}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Navigation dots ───────────────────────────────────────────────── */}
        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="relative p-2 cursor-pointer group"
              aria-label={`Go to testimonial ${i + 1}`}
            >
              <span 
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === currentIndex ? 'w-8 bg-[#F2B705]' : 'w-2 bg-black/20 dark:bg-white/20 group-hover:bg-black/40 dark:group-hover:bg-white/40'
                }`}
              />
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
