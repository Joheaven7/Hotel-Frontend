import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { showToast } from '../services/toast';
import apiClient from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast.error('Invalid or missing reset token');
      return;
    }

    if (password.length < 6) {
      showToast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      showToast.success('✅ Password reset successful!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      showToast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className="h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-['Playfair_Display'] font-bold text-gray-900 mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            This password reset link is invalid or has expired. Please request a new one from the login page.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
          >
            Go to Login
            <FiArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-85 transition-opacity">
            <h1 className="text-2xl sm:text-3xl font-['Playfair_Display'] font-bold text-gray-900 tracking-tight">
              LUXSTAY
            </h1>
          </Link>
          <p className="text-sm text-gray-500 mt-1">Luxury Hotels & Resorts</p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-['Playfair_Display'] font-bold text-gray-900 mb-2">
              Password Reset Complete
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <button
              id="back-to-login-btn"
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              Go to Login
              <FiArrowRight size={18} />
            </button>
          </motion.div>
        ) : (
          <>
            <h2 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900 mb-2 text-center">
              Set New Password
            </h2>
            <p className="text-gray-500 mb-6 text-center text-sm">
              Enter your new password below. Make sure it's at least 6 characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2 text-gray-400" size={16} />
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm pr-12"
                    required
                    minLength={6}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2 text-gray-400" size={16} />
                  Confirm Password
                </label>
                <input
                  id="confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B42]/30 focus:border-transparent transition-all duration-200 text-sm"
                  required
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <motion.button
                id="reset-submit-btn"
                type="submit"
                disabled={loading || password !== confirmPassword}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <FiArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
