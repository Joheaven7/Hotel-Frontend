import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { showToast } from '../../services/toast';
import { useAuthStore } from '../../store/authStore';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

export default function Hero() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleBookNow = () => {
    if (!user) {
      showToast.info('Please login to book a room');
      navigate('/login');
      return;
    }
    navigate('/rooms');
  };

  const handleGetStarted = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    navigate('/rooms');
  };

  return (
    <section id="home" className="pt-24 md:pt-32 pb-16 md:pb-24 bg-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="order-2 lg:order-1"
          >
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-text-dark mb-6">
              Stay Where <span className="text-gold">Luxury</span>
              <br /> Feels Natural
            </h1>
            <p className="text-text-dark/70 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              Experience unparalleled elegance at <span className='8'>LUX<span className='text-gold'>STAY</span></span>  Hotels, where every moment is crafted with
              sophistication. From our breathtaking infinity pools to world‑class gourmet dining,
              indulge in the art of refined living.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button
                onClick={handleBookNow}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(242,183,5,0.5)' }}
                whileTap={{ scale: 0.98 }}
                className="bg-gold border-dark-green text-white px-9 py-3 rounded-full font-semibold text-base tracking-wide shadow-lg shadow-gold/25 cursor-pointer"
              >
                Book Now
              </motion.button>
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-[#0F5B4F] text-dark-green px-8 py-3 rounded-full font-semibold text-base tracking-wide hover:bg-dark-green  transition-colors duration-300 cursor-pointer"
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="overflow-hidden rounded-3xl shadow-xl"
            >
              <img
                src="https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWwlMjBidWlsZGluZ3xlbnwwfHwwfHx8MA%3D%3D"
                alt="Luxury resort with pool and palm trees"
                className="w-full h-[320px] sm:h-[400px] md:h-[450px] lg:h-[520px] object-cover"
                onError={(e) => {
                  e.target.src =
                    'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}