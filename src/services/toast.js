import toast from 'react-hot-toast';

export const showToast = {
  // Success notifications
  success: (message, options = {}) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      icon: '✅',
      ...options,
    });
  },

  // Error notifications
  error: (message, options = {}) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      icon: '❌',
      ...options,
    });
  },

  // Info notifications
  info: (message, options = {}) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      icon: 'ℹ️',
      ...options,
    });
  },

  // Warning notifications
  warning: (message, options = {}) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      icon: '⚠️',
      ...options,
    });
  },

  // Loading notifications
  loading: (message, options = {}) => {
    return toast.loading(message, {
      duration: Infinity,
      position: 'top-right',
      style: {
        background: '#6b7280',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      ...options,
    });
  },

  // Promise notifications
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: {
          title: messages.loading || 'Loading...',
          icon: '⏳',
        },
        success: {
          title: messages.success || 'Success!',
          icon: '✅',
        },
        error: {
          title: messages.error || 'Error!',
          icon: '❌',
        },
      },
      {
        style: {
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
        ...options,
      }
    );
  },
};

// Specific toast messages for hotel operations
export const hotelToasts = {
  roomBooked: () => showToast.success('✨ Room booked successfully! Check your email for confirmation.'),
  bookingCancelled: () => showToast.success('📅 Booking cancelled. Refund details sent to your email.'),
  paymentSuccess: (amount) => showToast.success(`💰 Payment of ${amount} ETB successful!`),
  paymentFailed: (reason) => showToast.error(`Payment failed: ${reason}`),
  reservationConfirmed: () => showToast.success('🎉 Reservation confirmed! Welcome to LUXSTAY Hotels'),
  checkInSuccess: () => showToast.success('🔓 Check-in successful! Enjoy your stay'),
  checkOutSuccess: () => showToast.success('👋 Thank you for staying with us. Safe travels!'),
  maintenanceCreated: () => showToast.success('🔧 Maintenance request created successfully'),
  maintenanceResolved: () => showToast.success('✅ Maintenance issue resolved'),
  profileUpdated: () => showToast.success('👤 Profile updated successfully'),
  emailSent: () => showToast.info('📧 Confirmation email sent to your inbox'),
  emailFailed: () => showToast.error('📧 Failed to send email'),
};