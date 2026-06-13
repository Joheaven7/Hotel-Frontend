import { motion } from 'framer-motion';
import { Wine, Waves, Sparkles, ConciergeBell, Presentation, Car } from 'lucide-react';

const amenities = [
  {
    id: 1,
    title: 'Fine Dining',
    description: 'Michelin-starred chefs crafting culinary masterpieces from seasonal ingredients.',
    icon: <Wine size={28} strokeWidth={1.5} />,
  },
  {
    id: 2,
    title: 'Rooftop Pool',
    description: 'Infinity pool merging seamlessly with the skyline, offering an oasis above the city.',
    icon: <Waves size={28} strokeWidth={1.5} />,
  },
  {
    id: 3,
    title: 'Spa & Wellness',
    description: 'Rejuvenate your senses with bespoke holistic treatments and therapies.',
    icon: <Sparkles size={28} strokeWidth={1.5} />,
  },
  {
    id: 4,
    title: '24/7 Concierge',
    description: 'Personalized service to cater to your every desire, day or night.',
    icon: <ConciergeBell size={28} strokeWidth={1.5} />,
  },
  {
    id: 5,
    title: 'Conference Halls',
    description: 'State-of-the-art facilities designed for grand events and intimate gatherings.',
    icon: <Presentation size={28} strokeWidth={1.5} />,
  },
  {
    id: 6,
    title: 'Airport Transfer',
    description: 'Seamless luxury transportation from the airport directly to our doors.',
    icon: <Car size={28} strokeWidth={1.5} />,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function Amenities() {
  return (
    <section id="amenities" className="section-dark py-24 md:py-32 relative overflow-hidden">
      
      {/* ── Background accents ────────────────────────────────────────────────── */}
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-[0.03] blur-3xl" style={{ background: 'var(--color-lux-gold)' }} />
      <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-[0.02] blur-3xl" style={{ background: 'var(--color-lux-green)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Heading ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="font-['Inter'] text-[#F2B705] text-xs tracking-[0.3em] uppercase">
            The LuxStay Experience
          </span>
          <h2
            className="font-['Playfair_Display'] font-bold text-text-primary dark:text-white mt-3 mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}
          >
            Refined Amenities
          </h2>
          <div className="gold-line-center" />
          <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-base max-w-xl mx-auto mt-4">
            Immerse yourself in world-class facilities designed to anticipate and exceed your every expectation.
          </p>
        </motion.div>

        {/* ── Icon Grid ───────────────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {amenities.map((item) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="gold-border-sweep glass-card rounded-[24px] p-8 md:p-10 text-center flex flex-col items-center group cursor-default transition-all duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.06]"
            >
              {/* Icon Container */}
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-black/[0.03] dark:from-white/[0.08] to-transparent border border-black/5 dark:border-white/10 group-hover:border-[#F2B705]/50 group-hover:shadow-glow-gold-sm transition-all duration-500">
                <div className="text-[#F2B705] group-hover:scale-110 transition-transform duration-500">
                  {item.icon}
                </div>
              </div>

              {/* Text Content */}
              <h3 className="font-['Playfair_Display'] text-xl font-semibold text-text-primary dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="font-['Inter'] text-text-secondary dark:text-white/50 text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
