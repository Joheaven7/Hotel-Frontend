import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ── Animated counter hook ──────────────────────────────────────────────────────
function useCounter(target, duration = 2000) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startTime = null;
    let rafId;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return ref;
}

const stats = [
  { value: 247,   suffix: '',  label: 'Luxury Rooms'   },
  { value: 5,     suffix: '★', label: 'Star Rated'      },
  { value: 14,    suffix: '+', label: 'Years of Legacy'  },
  { value: 50000, suffix: '+', label: 'Happy Guests'     },
];

const slideVariants = {
  hiddenLeft:  { opacity: 0, x: -80 },
  hiddenRight: { opacity: 0, x:  80 },
  visible:     { opacity: 1, x:   0, transition: { duration: 0.9, ease: [0.25,0.46,0.45,0.94] } },
};

function StatCard({ value, suffix, label, delay }) {
  const ref = useCounter(value, 2200);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="flex items-baseline justify-center gap-1">
        <span
          ref={ref}
          className="font-['Playfair_Display'] font-bold text-[#F2B705]"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
        >
          0
        </span>
        <span className="font-['Playfair_Display'] font-bold text-[#F2B705] text-2xl md:text-3xl">
          {suffix}
        </span>
      </div>
      <p className="font-['Inter'] text-text-secondary dark:text-white/60 text-sm tracking-widest uppercase mt-1">
        {label}
      </p>
    </motion.div>
  );
}

export default function Brand() {
  return (
    <section id="about" className="section-dark py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Two-column layout ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">

          {/* Left: image with gold frame */}
          <motion.div
            variants={slideVariants}
            initial="hiddenLeft"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative gold-frame"
          >
            <div className="relative overflow-hidden rounded-[24px] shadow-luxury">
              <img
                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"
                alt="LuxStay Hotel lobby"
                loading="lazy"
                className="w-full h-[500px] lg:h-[600px] object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80';
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 glass rounded-2xl px-5 py-3">
                <p className="font-['Playfair_Display'] text-[#F2B705] text-sm font-semibold">Est. 2010</p>
                <p className="font-['Inter'] text-white/70 text-xs">Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </motion.div>

          {/* Right: text content */}
          <motion.div
            variants={slideVariants}
            initial="hiddenRight"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="flex flex-col"
          >
            {/* Overline */}
            <span className="font-['Inter'] text-[#F2B705] text-xs tracking-[0.3em] uppercase mb-4">
              Our Story
            </span>

            {/* Heading */}
            <h2
              className="font-['Playfair_Display'] font-bold text-text-primary dark:text-white leading-tight mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}
            >
              A Legacy of <span className="text-[#F2B705]">Extraordinary</span> Hospitality
            </h2>

            {/* Gold accent line */}
            <div className="gold-line mb-6" />

            {/* Body text */}
            <div className="space-y-4 font-['Inter'] text-text-secondary dark:text-white/65 text-base leading-relaxed">
              <p>
                Nestled in the heart of Addis Ababa, LuxStay Hotels & Resorts was born from a singular vision — to create a sanctuary where world-class luxury and Ethiopian warmth converge seamlessly.
              </p>
              <p>
                Every corner of our resort tells a story of meticulous craftsmanship, from the hand-carved stone lobbies to the bespoke bedding sourced from the finest artisans across the continent. Our philosophy is simple: every guest deserves to feel extraordinary.
              </p>
              <p>
                For over 14 years, we have been the preferred destination for discerning travellers, heads of state, and those who believe that a hotel stay should be a transformative experience, not just accommodation.
              </p>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.04, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 self-start flex items-center gap-3 font-['Inter'] font-semibold text-[#F2B705] text-sm tracking-wide group"
            >
              <span>Discover Our Heritage</span>
              <span className="w-8 h-px bg-[#F2B705] group-hover:w-14 transition-all duration-300" />
              <span className="text-lg leading-none">→</span>
            </motion.button>
          </motion.div>
        </div>

        {/* ── Animated stats bar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-[24px] overflow-hidden"
          style={{
            background: 'rgba(242,183,5,0.06)',
            border: '1px solid rgba(242,183,5,0.15)',
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#F2B705]/10 py-10 px-6">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} {...stat} delay={i * 0.12} />
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
