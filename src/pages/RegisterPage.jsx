// RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from 'react-icons/fi';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { showToast } from '../services/toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    apple: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUserRaw = params.get('user');

    if (urlToken && urlUserRaw) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(urlUserRaw));
        setAuth(urlToken, decodedUser);
        showToast.success('✅ Social signup successful!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse social user data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (token && user?.role) {
      const roleRoutes = {
        SUPER_ADMIN: '/dashboard/superadmin',
        ADMIN: '/dashboard/admin',
        ACCOUNTANT: '/dashboard/accountant',
        STAFF: '/dashboard/staff',
        HR: '/dashboard/hr',
        CUSTOMER: '/dashboard/customer',
      };
      navigate(roleRoutes[user.role] || '/dashboard/customer', { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const toastId = toast.loading('Creating your account...');
    try {
      const nameParts = (formData.fullName || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await apiClient.post('/auth/register', {
        firstName,
        lastName,
        email: formData.email,
        password: formData.password,
      });

      toast.dismiss(toastId);
      setAuth(response.data.token, response.data.user);
      showToast.success('Account created! Welcome to LuxStay.');

      const roleRoutes = {
        SUPER_ADMIN: '/dashboard/superadmin',
        ADMIN: '/dashboard/admin',
        ACCOUNTANT: '/dashboard/accountant',
        STAFF: '/dashboard/staff',
        HR: '/dashboard/hr',
        CUSTOMER: '/dashboard/customer',
      };

      setTimeout(() => {
        navigate(roleRoutes[response.data.user.role] || '/dashboard/customer', { replace: true });
      }, 500);
    } catch (error) {
      toast.dismiss(toastId);
      const msg = error.response?.data?.message || 'Registration failed';
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    setSocialLoading((prev) => ({ ...prev, [provider]: true }));
    window.location.href = `${apiClient.defaults.baseURL}/auth/${provider}`;
  };

  const isSocialLoading = (provider) => socialLoading[provider];

  return (
    <div
      className="h-screen overflow-hidden flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1540541338287-41700207dee6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl shadow-black/10 overflow-hidden flex flex-col lg:flex-row max-h-[calc(100vh-2rem)] h-full"
      >
        {/* ========== LEFT – Registration Form ========== */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-14 flex flex-col h-full overflow-hidden bg-gray-100">
          {/* Branding */}
          <div className="mb-6 lg:mb-10 shrink-0">
            <Link to="/" className="inline-block hover:opacity-85 transition-opacity">
              <h1 className="text-2xl sm:text-3xl font-['Playfair_Display'] font-bold text-gray-900 tracking-tight">
                LUXSTAY
              </h1>
            </Link>
            <p className="text-sm text-gray-500 mt-1">Luxury Hotels & Resorts</p>
          </div>

          {/* Auth Toggle Buttons */}
          <div className="flex rounded-full bg-gray-200 p-1 mb-6 lg:mb-10 shrink-0">
            <Link
              to="/login"
              className={`flex-1 text-center py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${location.pathname === '/login'
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 hover:text-black'
                }`}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className={`flex-1 text-center py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${location.pathname === '/register'
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 hover:text-black'
                }`}
            >
              Sign Up
            </Link>
          </div>

          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
            <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] font-bold text-gray-900 mb-2">
              Journey Begins
            </h2>
            <p className="text-gray-500 mb-6">Create your account and unlock exclusive luxury experiences.</p>

            {/* Social Signup Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleSocialSignup('google')}
                disabled={isSocialLoading('google')}
                className="flex-1 min-w-[80px] flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60 bg-white"
              >
                {isSocialLoading('google') ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <FaGoogle className="text-red-500" />
                )}
                <span className="hidden sm:inline">Google</span>
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-2 text-gray-400" size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 rounded-xl border bg-white ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMail className="inline mr-2 text-gray-400" size={16} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-3 rounded-xl border bg-white ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2 text-gray-400" size={16} />
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border pr-12 bg-white ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">At least 6 characters</p>
                )}
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 rounded border-gray-300 text-black focus:ring-black"
                  required
                />
                <label htmlFor="terms" className="text-xs text-gray-500">
                  I agree to the{' '}
                  <a href="#" className="text-gray-900 font-medium hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-gray-900 font-medium hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <FiArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 p-4 rounded-xl bg-gray-200 text-center">
              <p className="text-xs text-gray-500">
                👤 Demo: <span className="font-medium">guest@hotel.com</span> / <span className="font-medium">password123</span>
              </p>
            </div>
          </div>
        </div>

        {/* ========== RIGHT – Immersive Image Panel ========== */}
        <div className="relative w-full lg:w-1/2 h-48 sm:h-64 lg:h-full bg-gradient-to-br from-[#0F5B4F] to-[#0A3D34] overflow-hidden order-first lg:order-last">
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
            alt="Luxury Travel"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />

          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 text-white">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-['Playfair_Display'] font-bold leading-tight">
              Escape the Ordinary,<br />Embrace the Journey!
            </h3>
            <Link
              to="/gallery"
              className="mt-2 sm:mt-4 inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs sm:text-sm font-medium text-white hover:bg-white/30 transition-all"
            >
              Discover More
            </Link>
          </div>

          <Link
            to="/"
            state={{ from: null }}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 inline-flex items-center gap-1.5 text-white/90 hover:text-white text-xs sm:text-sm font-medium transition-all backdrop-blur-md bg-black/35 px-4 py-2 rounded-full border border-white/20 shadow-lg"
          >
            <FiArrowRight className="rotate-180" size={14} />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;