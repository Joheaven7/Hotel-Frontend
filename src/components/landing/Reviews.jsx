import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { showToast } from "../../services/toast";
import apiClient from "../../services/api";
import { useAuthStore } from '../../store/authStore';

const Stars = () => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={15} fill="#F2B705" stroke="#F2B705" />
    ))}
  </div>
);

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(1);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reservations/reviews');

      // Set reviews with default values if API doesn't return enough
      const fetchedReviews = response.data.reviews || [];

      // If no reviews from API, use static fallback
      if (fetchedReviews.length === 0) {
        setReviews([
          {
            id: 1,
            text: 'An absolutely breathtaking experience. The attention to detail, the impeccable service, and the stunning ambiance made our anniversary truly unforgettable.',
            name: 'James Thornton',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            fallbackAvatar: 'https://i.pravatar.cc/100?img=11',
            dark: true,
            rating: 5,
          },
          {
            id: 2,
            text: 'From the gourmet dining to the infinity pool, every moment was perfection. LUXSTAY Hotels redefines what a luxury hotel should be. We cannot wait to return.',
            name: 'Sophia Laurent',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            fallbackAvatar: 'https://i.pravatar.cc/100?img=5',
            dark: false,
            rating: 5,
          },
        ]);
      } else {
        setReviews(
          fetchedReviews.map((review, idx) => ({
            id: review._id || idx,
            text: review.message || review.text || '',
            name: review.guestName || review.name || 'Guest',
            avatar: review.avatar || `https://i.pravatar.cc/100?img=${idx}`,
            fallbackAvatar: `https://i.pravatar.cc/100?img=${idx}`,
            dark: idx % 2 === 0,
            rating: review.rating || 5,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);

      // Set fallback reviews on error
      setReviews([
        {
          id: 1,
          text: 'An absolutely breathtaking experience. The attention to detail, the impeccable service, and the stunning ambiance made our anniversary truly unforgettable.',
          name: 'James Thornton',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
          fallbackAvatar: 'https://i.pravatar.cc/100?img=11',
          dark: true,
          rating: 5,
        },
        {
          id: 2,
          text: 'From the gourmet dining to the infinity pool, every moment was perfection. LUXSTAY Hotels redefines what a luxury hotel should be. We cannot wait to return.',
          name: 'Sophia Laurent',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
          fallbackAvatar: 'https://i.pravatar.cc/100?img=5',
          dark: false,
          rating: 5,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAll = () => {
    if (!user) {
      showToast.info('Please login to see all reviews');
      navigate('/login');
      return;
    }
    navigate('/reservations');
  };

  const handleSlideChange = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const getDisplayedReviews = () => {
    // Show 2 reviews at a time on desktop, 1 on mobile
    const reviewsPerPage = window.innerWidth >= 1024 ? 2 : 1;
    const startIdx = (currentSlide - 1) * reviewsPerPage;
    return reviews.slice(startIdx, startIdx + reviewsPerPage);
  };

  const totalSlides = Math.ceil(reviews.length / (window.innerWidth >= 1024 ? 2 : 1));

  return (
    <section id="reviews" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 md:mb-16"
        >
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-text-dark mb-3">
              Guest Reviews
            </h2>
            <p className="text-text-dark/65 text-base md:text-lg max-w-lg">
              Hear what our cherished guests have to say about their LUXSTAY Hotels experience.
            </p>
          </div>
          <motion.button
            onClick={handleSeeAll}
            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(242,183,5,0.5)' }}
            whileTap={{ scale: 0.98 }}
            className="bg-gold text-[#0F5B4F] px-7 py-3 rounded-full font-semibold text-sm tracking-wide self-start sm:self-auto cursor-pointer"
          >
            See All
          </motion.button>
        </motion.div>

        {/* Review Cards */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-dark/60">⏳ Loading reviews...</p>
          </div>
        ) : reviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
              {getDisplayedReviews().map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: idx * 0.15, duration: 0.7 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`rounded-2xl p-7 md:p-9 shadow-lg h-full flex flex-col ${review.dark
                      ? 'bg-gradient-to-br from-[#0F5B4F] to-[#0A3B34]'
                      : 'bg-white'
                    }`}
                >
                  <div className="mb-5">
                    <Quote
                      size={36}
                      color={review.dark ? '#F2B705' : '#0F5B4F'}
                      strokeWidth={1.5}
                    />
                  </div>
                  <p
                    className={`text-base md:text-lg leading-relaxed mb-7 flex-grow italic ${review.dark ? 'text-white/90' : 'text-text-dark/75'
                      }`}
                  >
                    "{review.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                      onError={(e) => {
                        e.target.src = review.fallbackAvatar;
                      }}
                    />
                    <div>
                      <h4
                        className={`font-heading font-bold text-lg ${review.dark ? 'text-white' : 'text-[#0F5B4F]'
                          }`}
                      >
                        {review.name}
                      </h4>
                      <Stars />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Slider Dots */}
            <div className="flex justify-center gap-3">
              {[...Array(totalSlides)].map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSlideChange(idx + 1)}
                  whileHover={{ scale: 1.3 }}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${currentSlide === idx + 1
                      ? 'bg-[#0F5B4F] shadow-md'
                      : 'bg-[#0F5B4F]/25 hover:bg-[#0F5B4F]/40'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-dark/60">No reviews available yet</p>
          </div>
        )}
      </div>
    </section>
  );
}