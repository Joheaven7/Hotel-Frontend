import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiArrowLeft,
} from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../services/toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import ThemeToggle from '../components/common/ThemeToggle';

const LoginPage = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    apple: false,
  });

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
    const toastId = toast.loading('Authenticating...', {
      style: { background: '#111', color: '#fff', border: '1px solid rgba(242,183,5,0.3)' },
    });
    try {
      const response = await apiClient.post('/auth/login', formData);
      toast.dismiss(toastId);
      setAuth(response.data.token, response.data.user);
      showToast.success('Login successful! Redirecting...');
      setTimeout(() => {
        navigate(roleRoutes[response.data.user.role] || '/dashboard/customer');
      }, 1000);
    } catch (error) {
      toast.dismiss(toastId);
      const errorMessage = error.response?.data?.message || 'Login failed';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(true);
      showToast.success('Password reset link sent to your email');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link';
      showToast.error(errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
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
        {!showForgotPassword && (
          <div className="flex bg-gray-100/50 dark:bg-black/40 rounded-full p-1 mb-10 border border-gray-200/50 dark:border-white/5 transition-colors duration-500">
            <Link
              to="/login"
              className="flex-1 text-center py-2.5 rounded-full text-xs font-['Inter'] tracking-widest uppercase font-semibold transition-all duration-300 bg-[#F2B705] text-[#0A0A0A] shadow-sm"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="flex-1 text-center py-2.5 rounded-full text-xs font-['Inter'] tracking-widest uppercase font-semibold transition-all duration-300 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white"
            >
              Sign Up
            </Link>
          </div>
        )}

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* ── FORGOT PASSWORD VIEW ── */}
            {showForgotPassword ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); }}
                  className="flex items-center gap-2 text-xs font-['Inter'] tracking-widest uppercase text-[#F2B705] hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
                >
                  <FiArrowLeft size={14} /> Back to Login
                </button>

                <h2 className="text-3xl font-['Playfair_Display'] font-bold text-gray-900 dark:text-white mb-3">
                  Reset Password
                </h2>
                <p className="font-['Inter'] text-gray-600 dark:text-white/50 text-sm mb-8 leading-relaxed">
                  Enter your email address to receive a secure link to reset your credentials.
                </p>

                {forgotSuccess ? (
                  <div className="p-6 bg-yellow-50 dark:bg-[#F2B705]/10 border border-yellow-200 dark:border-[#F2B705]/20 rounded-2xl text-center">
                    <div className="text-[#F2B705] mb-4 flex justify-center"><FiMail size={32} /></div>
                    <h3 className="text-lg font-['Playfair_Display'] text-gray-900 dark:text-white mb-2">Check your inbox</h3>
                    <p className="text-xs font-['Inter'] text-gray-600 dark:text-white/60 leading-relaxed mb-6">
                      We've sent a secure recovery link. Please check your spam folder if it doesn't appear shortly.
                    </p>
                    <button
                      onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotEmail(''); }}
                      className="text-xs font-['Inter'] tracking-widest uppercase text-[#F2B705] hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Return to login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                        <FiMail className="text-gray-400 dark:text-white/40 group-focus-within:text-[#F2B705] transition-colors duration-300" size={18} />
                      </div>
                      <input
                        type="email"
                        id="forgot-email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder=" "
                        required
                        className="peer block w-full h-[56px] pl-11 pr-4 pt-5 pb-1 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#F2B705]/10 focus:border-[#F2B705] transition-all text-sm font-medium shadow-sm"
                      />
                      <label
                        htmlFor="forgot-email"
                        className="absolute text-sm font-['Inter'] text-gray-500 dark:text-white/50 duration-300 transform -translate-y-1.5 scale-[0.8] top-4 z-10 origin-[0] left-11 peer-focus:text-[#F2B705] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-focus:scale-[0.8] peer-focus:-translate-y-1.5 cursor-text pointer-events-none"
                      >
                        Email Address
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full relative overflow-hidden bg-[#F2B705] text-[#0A0A0A] font-['Inter'] font-bold text-xs tracking-widest uppercase py-4 rounded-full shadow-glow-gold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              
              /* ── LOGIN VIEW ── */
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl font-['Playfair_Display'] font-bold text-gray-900 dark:text-white mb-2">
                  Welcome Back
                </h2>
                <p className="font-['Inter'] text-gray-600 dark:text-white/50 text-sm mb-8">
                  Sign in to access your luxury concierge.
                </p>

                {/* Social Login */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
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
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                      <FiMail className="text-gray-400 dark:text-white/40 group-focus-within:text-[#F2B705] transition-colors duration-300" size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="login-email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      className="peer block w-full h-[56px] pl-11 pr-4 pt-5 pb-1 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#F2B705]/10 focus:border-[#F2B705] transition-all text-sm font-medium shadow-sm"
                    />
                    <label
                      htmlFor="login-email"
                      className="absolute text-sm font-['Inter'] text-gray-500 dark:text-white/50 duration-300 transform -translate-y-1.5 scale-[0.8] top-4 z-10 origin-[0] left-11 peer-focus:text-[#F2B705] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-focus:scale-[0.8] peer-focus:-translate-y-1.5 cursor-text pointer-events-none"
                    >
                      Email Address
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                      <FiLock className="text-gray-400 dark:text-white/40 group-focus-within:text-[#F2B705] transition-colors duration-300" size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="login-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      className="peer block w-full h-[56px] pl-11 pr-12 pt-5 pb-1 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#F2B705]/10 focus:border-[#F2B705] transition-all text-sm font-medium shadow-sm"
                    />
                    <label
                      htmlFor="login-password"
                      className="absolute text-sm font-['Inter'] text-gray-500 dark:text-white/50 duration-300 transform -translate-y-1.5 scale-[0.8] top-4 z-10 origin-[0] left-11 peer-focus:text-[#F2B705] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-focus:scale-[0.8] peer-focus:-translate-y-1.5 cursor-text pointer-events-none"
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

                  <div className="flex items-center justify-between mt-2 mb-8">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="rounded border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/5 text-[#F2B705] focus:ring-[#F2B705] focus:ring-offset-0" />
                      <span className="font-['Inter'] text-xs text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setForgotEmail(formData.email); }}
                      className="font-['Inter'] text-xs text-[#F2B705] hover:text-yellow-600 dark:hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative overflow-hidden flex items-center justify-center gap-3 bg-[#F2B705] text-[#0A0A0A] font-['Inter'] font-bold text-xs tracking-widest uppercase py-4 rounded-full shadow-glow-gold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Authenticating...' : <>Sign In <FiArrowRight size={16} /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;