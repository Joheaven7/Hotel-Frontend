import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from 'react-icons/fi';
import { FaGoogle, FaApple, FaFacebookF } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { showToast } from '../services/toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    apple: false,
    facebook: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const roleRoutes = {
    SUPER_ADMIN: '/dashboard/superadmin',
    ADMIN: '/dashboard/admin',
    MANAGER: '/dashboard/manager',
    ACCOUNTANT: '/dashboard/accountant',
    STAFF: '/dashboard/staff',
    HR: '/dashboard/hr',
    CUSTOMER: '/dashboard/customer',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let params = new URLSearchParams(window.location.search);
    let rawToken = params.get('token');
    let urlUserRaw = params.get('user');

    if (!rawToken && window.location.hash) {
      const hashQuery = window.location.hash.replace('#', '?');
      params = new URLSearchParams(hashQuery);
      rawToken = params.get('token');
      urlUserRaw = params.get('user');
    }

    if (rawToken && urlUserRaw) {
      try {
        const urlToken = decodeURIComponent(rawToken);
        const decodedUser = JSON.parse(decodeURIComponent(urlUserRaw));
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify(decodedUser));
        setAuth(urlToken, decodedUser);
        window.history.replaceState({}, document.title, window.location.pathname);
        const targetRoute = roleRoutes[decodedUser.role] || '/dashboard/customer';
        navigate(targetRoute, { replace: true });
      } catch (e) {
        console.error("Failed to decode token payload data string payload", e);
      }
    }
  }, [navigate, setAuth]);

  useEffect(() => {
    if (token && user?.role) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('token')) {
        navigate(roleRoutes[user.role] || '/dashboard/customer', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showToast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Logging in...', {
      style: { background: '#6b7280', color: '#fff' },
    });
    try {
      const response = await apiClient.post('/auth/login', formData);
      toast.dismiss(toastId);
      setAuth(response.data.token, response.data.user);
      showToast.success('✅ Login successful! Redirecting...');
      setTimeout(() => {
        navigate(roleRoutes[response.data.user.role] || '/dashboard/customer');
      }, 1000);
    } catch (error) {
      toast.dismiss(toastId);
      const errorMessage = error.response?.data?.message || 'Login failed';
      showToast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setSocialLoading((prev) => ({ ...prev, [provider]: true }));
    window.location.href = `${apiClient.defaults.baseURL}/auth/${provider}`;
  };

  const isSocialLoading = (provider) => socialLoading[provider];

  return (
    <div
      className="h-screen overflow-hidden flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')",
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
        {/* ========== LEFT – Authentication Form ========== */}
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
              Welcome Back
            </h2>
            <p className="text-gray-500 mb-6">Sign in to your luxury concierge account.</p>

            {/* Social Login Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isSocialLoading('google')}
                className="flex-1 min-w-[80px] flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60 bg-white"
              >
                {isSocialLoading('google') ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <FaGoogle className="text-red-500" />
                )}
                <span className="hidden sm:inline font-['Poppins'] text-gray-600">Google</span>
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
                  <FiMail className="inline mr-2 text-gray-400" size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hotel.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2 text-gray-400" size={16} />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                  Remember me
                </label>
                <a href="#" className="text-gray-600 hover:text-black font-medium">
                  Forgot password?
                </a>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FiArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            {/* <div className="mt-6 p-4 rounded-xl bg-gray-200 text-center">
              <p className="text-xs text-gray-500">
                👤 Demo: <span className="font-medium">admin@hotel.com</span> / <span className="font-medium">password123</span>
              </p>
            </div> */}
          </div>
        </div>

        {/* ========== RIGHT – Immersive Image Panel ========== */}
        <div className="relative w-full lg:w-1/2 h-48 sm:h-64 lg:h-full bg-gradient-to-br from-[#0F5B4F] to-[#0A3D34] overflow-hidden order-first lg:order-last">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
            alt="Luxury Resort"
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

export default LoginPage;