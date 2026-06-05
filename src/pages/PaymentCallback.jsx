import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Calendar, Receipt, User, ArrowRight } from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your luxury reservation payment...');
  const txRef = searchParams.get('tx_ref') || searchParams.get('reference') || 'N/A';

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('tx_ref') || searchParams.get('reference');
        
        if (!reference) {
          setStatus('error');
          setMessage('Transaction reference is missing or invalid.');
          return;
        }

        // Standardize verification call
        const response = await apiClient.post('/payments/chapa/verify', {
          txRef: reference,
        });

        if (response.data.status === 'success' || response.data.verified) {
          setStatus('success');
          setMessage('Your payment has been successfully authorized and confirmed.');
          setTimeout(() => {
            if (user?.role === 'CUSTOMER') {
              navigate('/dashboard/customer');
            } else {
              navigate('/dashboard');
            }
          }, 4000);
        } else {
          setStatus('failed');
          setMessage('The payment transaction could not be completed. Please try again.');
          setTimeout(() => navigate('/reservations'), 4000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'We encountered an error verifying your payment.');
      }
    };

    // Simulate standard delay to display loader elegantly
    const timer = setTimeout(() => {
      verifyPayment();
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchParams, navigate, user]);

  return (
    <div className="min-h-screen bg-[#0B3B42] flex items-center justify-center p-4 relative overflow-hidden font-['Poppins']">
      {/* Background ambient glowing spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#0F5B4F]/30 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#F2B705]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-8 md:p-10 border border-white/10 text-center"
      >
        {/* Status Indicator Icon */}
        <div className="flex justify-center mb-6">
          {status === 'verifying' && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gold/20 animate-ping" />
              <div className="w-20 h-20 bg-[#F2B705]/10 rounded-full flex items-center justify-center text-[#F2B705]">
                <Loader2 className="animate-spin" size={40} />
              </div>
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600"
            >
              <CheckCircle2 size={44} />
            </motion.div>
          )}

          {(status === 'failed' || status === 'error') && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600"
            >
              <XCircle size={44} />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-['Playfair_Display'] font-bold text-gray-900 mb-3 tracking-tight">
          {status === 'verifying' && 'Verifying Security'}
          {status === 'success' && 'Payment Authorized'}
          {status === 'failed' && 'Authorization Failed'}
          {status === 'error' && 'Verification Alert'}
        </h2>

        {/* Description Message */}
        <p className="text-gray-500 text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>

        {/* Receipt Grid details (standardized design card) */}
        <div className="bg-[#F5F5F2] rounded-3xl p-5 mb-8 text-left border border-gray-100 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-200/50 pb-2">
            <span className="flex items-center gap-1.5"><Receipt size={14} /> Details</span>
            <span>LuxStay Invoice</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Reference ID</p>
              <p className="font-semibold text-gray-800 break-all select-all font-mono mt-0.5">
                {txRef}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Service Type</p>
              <p className="font-semibold text-gray-800 mt-0.5">Hotel Booking</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Date Authorized</p>
              <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                <Calendar size={13} className="text-[#0F5B4F]" />
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Guest Account</p>
              <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1 truncate">
                <User size={13} className="text-[#0F5B4F]" />
                {user?.name || user?.email || 'Guest Client'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3">
          {status === 'verifying' ? (
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1.5 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2B705] animate-ping" />
              Securing connection to international gateways...
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (status === 'success') {
                  navigate(user?.role === 'CUSTOMER' ? '/dashboard/customer' : '/dashboard');
                } else {
                  navigate('/reservations');
                }
              }}
              className={`w-full py-4 rounded-full font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                status === 'success'
                  ? 'bg-[#0F5B4F] text-white hover:bg-[#0b473e] shadow-emerald-950/10'
                  : 'bg-gold text-dark-green hover:bg-yellow-400 shadow-gold/20'
              }`}
            >
              <span>{status === 'success' ? 'Go to Guest Panel' : 'Return to Reservations'}</span>
              <ArrowRight size={16} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;