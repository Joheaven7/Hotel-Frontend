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
  FiArrowLeft,
} from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { showToast } from '../services/toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import ThemeToggle from '../components/common/ThemeToggle';

const RegisterPage = () => {
  const { theme, toggleTheme } = useThemeStore();
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
        showToast.success('Social signup successful!');
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
    const toastId = toast.loading('Creating your account...', {
      style: { background: '#111', color: '#fff', border: '1px solid rgba(242,183,5,0.3)' },
    });
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
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gray-900 selection:bg-[#F2B705]/30 selection:text-white overflow-hidden transition-colors duration-500">
      
      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=60')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Subtle Overlay instead of heavy blur */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50 transition-colors duration-700" />
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 group hover:opacity-80 transition-all"
      >
        <FiArrowLeft className="text-gray-600 dark:text-[#F2B705] group-hover:-translate-x-1 transition-transform" />
        <span className="font-['Playfair_Display'] text-xl font-bold tracking-widest text-gray-900 dark:text-white uppercase">
          LUX<span className="text-[#F2B705]">STAY</span>
        </span>
      </Link>

      {/* ── Main Glass Card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-[480px] p-8 md:p-10 rounded-[32px] bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 shadow-xl"
      >
        {/* Auth Toggle */}
        <div className="flex bg-gray-100/50 dark:bg-black/40 rounded-full p-1 mb-8 border border-gray-200/50 dark:border-white/5 transition-colors duration-500">
          <Link
            to="/login"
            className="flex-1 text-center py-2.5 rounded-full text-xs font-['Inter'] tracking-widest uppercase font-semibold transition-all duration-300 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="flex-1 text-center py-2.5 rounded-full text-xs font-['Inter'] tracking-widest uppercase font-semibold transition-all duration-300 bg-[#F2B705] text-[#0A0A0A] shadow-sm"
          >
            Sign Up
          </Link>
        </div>

        <h2 className="text-3xl font-['Playfair_Display'] font-bold text-gray-900 dark:text-white mb-2">
          Journey Begins
        </h2>
        <p className="font-['Inter'] text-gray-600 dark:text-white/50 text-sm mb-8">
          Create an account to unlock exclusive experiences.
        </p>

        {/* Social Signup */}
        <button
          type="button"
          onClick={() => handleSocialSignup('google')}
          disabled={isSocialLoading('google')}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white font-['Inter'] text-sm font-medium disabled:opacity-50"
        >
          {isSocialLoading('google') ? 'Loading...' : <><FaGoogle className="text-gray-900 dark:text-white" size={16} /> Continue with Google</>}
        </button>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="font-['Inter'] text-[10px] tracking-widest uppercase text-gray-400 dark:text-white/30">Or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                <FiUser className={`transition-colors duration-300 ${errors.fullName ? 'text-red-500' : 'text-gray-400 dark:text-white/40 group-focus-within:text-[#F2B705]'}`} size={18} />
              </div>
              <input
                type="text"
                name="fullName"
                id="register-fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder=" "
                className={`peer block w-full h-[56px] pl-11 pr-4 pt-5 pb-1 rounded-2xl bg-white dark:bg-white/10 border ${errors.fullName ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:ring-[#F2B705]/10 focus:border-[#F2B705]'} text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all text-sm font-medium shadow-sm`}
              />
              <label
                htmlFor="register-fullName"
                className={`absolute text-sm font-['Inter'] duration-300 transform -translate-y-1.5 scale-[0.8] top-4 z-10 origin-[0] left-11 ${errors.fullName ? 'text-red-500' : 'text-gray-500 dark:text-white/50 peer-focus:text-[#F2B705]'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-focus:scale-[0.8] peer-focus:-translate-y-1.5 cursor-text pointer-events-none`}
              >
                Full Name
              </label>
            </div>
            {errors.fullName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 pl-4 font-['Inter']">{errors.fullName}</p>}
          </div>

          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                <FiMail className={`transition-colors duration-300 ${errors.email ? 'text-red-500' : 'text-gray-400 dark:text-white/40 group-focus-within:text-[#F2B705]'}`} size={18} />
              </div>
              <input
                type="email"
                name="email"
                id="register-email"
                value={formData.email}
                onChange={handleChange}
                placeholder=" "
                className={`peer block w-full h-[56px] pl-11 pr-4 pt-5 pb-1 rounded-2xl bg-white dark:bg-white/10 border ${errors.email ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:ring-[#F2B705]/10 focus:border-[#F2B705]'} text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all text-sm font-medium shadow-sm`}
              />
              <label
                htmlFor="register-email"
                className={`absolute text-sm font-['Inter'] duration-300 transform -translate-y-1.5 scale-[0.8] top-4 z-10 origin-[0] left-11 ${errors.email ? 'text-red-500' : 'text-gray-500 dark:text-white/50 peer-focus:text-[#F2B705]'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-focus:scale-[0.8] peer-focus:-translate-y-1.5 cursor-text pointer-events-none`}
              >
                Email Address
              </label>
            </div>
            {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 pl-4 font-['Inter']">{errors.email}</p>}
          </div>

          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                <FiLock className={`transition-colors duration-300 ${errors.password ? 'text-red-500' : 'text-gray-400 dark:text-white/40 group-focus-within:text-[#F2B705]'}`} size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="register-password"
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                className={`peer block w-full h-[56px] pl-11 pr-12 pt-5 pb-1 rounded-2xl bg-white dark:bg-white/10 border ${errors.password ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:ring-[#F2B705]/10 focus:border-[#F2B705]'} text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all text-sm font-medium shadow-sm`}
              />
              <label
                htmlFor="register-password"
                className={`absolute text-sm font-['Inter'] duration-300 transform -translate-y-1.5 scale-[0.8] top-4 z-10 origin-[0] left-11 ${errors.password ? 'text-red-500' : 'text-gray-500 dark:text-white/50 peer-focus:text-[#F2B705]'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-focus:scale-[0.8] peer-focus:-translate-y-1.5 cursor-text pointer-events-none`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-[#F2B705] dark:hover:text-[#F2B705] transition-colors z-20"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 pl-1">{errors.password}</p>
            ) : (
              <p className="text-gray-500 dark:text-white/30 text-[10px] mt-1.5 pl-1 tracking-wide">At least 6 characters</p>
            )}
          </div>

          <div className="flex items-start gap-3 mt-4 mb-8">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 rounded border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/5 text-[#F2B705] focus:ring-[#F2B705] focus:ring-offset-0"
              required
            />
            <label htmlFor="terms" className="text-xs text-gray-500 dark:text-white/40 font-['Inter'] leading-relaxed">
              I agree to the <a href="#" className="text-[#F2B705] hover:text-yellow-600 dark:hover:text-white transition-colors">Terms & Conditions</a> and <a href="#" className="text-[#F2B705] hover:text-yellow-600 dark:hover:text-white transition-colors">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden flex items-center justify-center gap-3 bg-[#F2B705] text-[#0A0A0A] font-['Inter'] font-bold text-xs tracking-widest uppercase py-4 rounded-full shadow-glow-gold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : <>Create Account <FiArrowRight size={16} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
