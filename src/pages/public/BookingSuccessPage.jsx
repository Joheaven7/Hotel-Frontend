import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../../services/api';

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!txRef) {
      navigate('/', { replace: true });
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await apiClient.post('/payments/public/verify', { txRef });
        if (response.data.status === 'success') {
          setStatus('success');
          setDetails(response.data.payment);
        } else {
          setStatus('failed');
          setDetails(response.data.payment);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [txRef, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-24 pb-12 px-6">
      <div className="max-w-md w-full">
        {status === 'verifying' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-10 text-center shadow-xl border border-black/5"
          >
            <div className="w-20 h-20 bg-[#F2B705]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={40} className="text-[#F2B705] animate-spin" />
            </div>
            <h2 className="font-['Playfair_Display'] text-2xl text-text-primary mb-3">Verifying Payment</h2>
            <p className="text-text-secondary font-['Inter'] text-sm">Please wait while we confirm your transaction securely with Chapa.</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-10 text-center shadow-xl border border-[#0F5B4F]/10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0F5B4F] to-[#F2B705]" />
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl text-text-primary mb-3">Booking Confirmed!</h2>
            <p className="text-text-secondary font-['Inter'] text-sm mb-8">
              Your payment of ETB {details?.amount?.toLocaleString()} was successful. We've sent a confirmation email with your booking details.
            </p>
            
            <div className="bg-black/5 rounded-2xl p-5 text-left mb-8 space-y-3 font-['Inter'] text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Reference</span>
                <span className="font-semibold text-text-primary">{txRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Guest Name</span>
                <span className="font-semibold text-text-primary">{details?.customerName}</span>
              </div>
            </div>

            <Link 
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] text-white font-['Inter'] font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-[#111] transition-all w-full group"
            >
              Return Home <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-10 text-center shadow-xl border border-rose-100"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={44} className="text-rose-500" />
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl text-text-primary mb-3">Payment Failed</h2>
            <p className="text-text-secondary font-['Inter'] text-sm mb-8">
              Unfortunately, we couldn't process your payment. Your reservation is pending.
            </p>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 bg-[#F2B705] text-[#0A0A0A] font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl transition-all"
              >
                Try Again
              </button>
              <Link 
                to="/contact"
                className="text-text-secondary text-sm hover:text-text-primary transition-colors underline"
              >
                Contact Support
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
