import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { showToast } from '../../services/toast';
import apiClient from '../../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Sending your message...', {
      style: {
        background: '#6b7280',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
      },
    });

    try {
      const response = await apiClient.post('/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      toast.dismiss(toastId);

      showToast.success('✅ Message sent successfully! We will respond shortly.');

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setErrors({});
    } catch (error) {
      toast.dismiss(toastId);
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';
      showToast.error(`❌ ${errorMessage}`);
      console.error('Contact form error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-text-dark mb-3">
            Get in <span className="text-gold italic">Touch</span>
          </h2>
          <p className="text-text-dark/65 text-base md:text-lg max-w-xl mx-auto">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Contact Info & Map */}
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300 flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-dark-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone size={20} className="text-dark-green" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-dark-green mb-1">Phone</h4>
                <p className="text-text-dark/70 text-sm">+251912345678</p>
                <p className="text-text-dark/50 text-xs mt-0.5">24/7 front desk</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300 flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-dark-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-dark-green" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-dark-green mb-1">Email</h4>
                <p className="text-text-dark/70 text-sm">luxstay@hotel.com</p>
                <p className="text-text-dark/50 text-xs mt-0.5">Reply within 2 hours</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300 flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-dark-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-dark-green" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-dark-green mb-1">Address</h4>
                <p className="text-text-dark/70 text-sm">
                  742 Bole, Addis Ababa, Ethiopia
                </p>
                <p className="text-text-dark/50 text-xs mt-0.5">  </p>
              </div>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl overflow-hidden shadow-card h-48 md:h-56 bg-white flex items-center justify-center"
            >
              <div className="text-center text-text-dark/40">
                <MapPin size={40} className="mx-auto mb-2" />
                <span className="text-sm">Interactive map</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-card"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-text-dark/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full bg-light-gray rounded-xl px-4 py-3 text-text-dark placeholder-text-dark/30 outline-none focus:ring-2 focus:ring-gold/50 transition-all disabled:opacity-50 ${
                    errors.name ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="James Thornton"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">❌ {errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-text-dark/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full bg-light-gray rounded-xl px-4 py-3 text-text-dark placeholder-text-dark/30 outline-none focus:ring-2 focus:ring-gold/50 transition-all disabled:opacity-50 ${
                    errors.email ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="james@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">❌ {errors.email}</p>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-text-dark/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full bg-light-gray rounded-xl px-4 py-3 text-text-dark placeholder-text-dark/30 outline-none focus:ring-2 focus:ring-gold/50 transition-all disabled:opacity-50 ${
                    errors.subject ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Reservation inquiry"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">❌ {errors.subject}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-text-dark/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full bg-light-gray rounded-xl px-4 py-3 text-text-dark placeholder-text-dark/30 outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none disabled:opacity-50 ${
                    errors.message ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Tell us about your needs..."
                />
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1">❌ {errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 8px 30px rgba(242,183,5,0.4)' }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gold text-dark-green px-6 py-4 rounded-full font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}