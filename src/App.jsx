import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';

// ── Public pages (Eagerly loaded for fast LCP) ────────────────────────────────
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// ── Lazy-loaded pages (Code-splitting to reduce bundle size) ──────────────────
const PaymentCallback = React.lazy(() => import('./pages/PaymentCallback'));
const LuxuryGalleryPage = React.lazy(() => import('./components/landing/GalleryPage'));

// ── New Public Pages ────────────────────────────────────────────────────────
const RoomListingPage = React.lazy(() => import('./pages/public/RoomListingPage'));
const RoomDetailPage = React.lazy(() => import('./pages/public/RoomDetailPage'));
const HallListingPage = React.lazy(() => import('./pages/public/HallListingPage'));
const HallDetailPage = React.lazy(() => import('./pages/public/HallDetailPage'));
const AboutPage = React.lazy(() => import('./pages/public/AboutPage'));
const ServicesPage = React.lazy(() => import('./pages/public/ServicesPage'));
const ContactPage = React.lazy(() => import('./pages/public/ContactPage'));
const FAQPage = React.lazy(() => import('./pages/public/FAQPage'));
const BookingConfirmPage = React.lazy(() => import('./pages/public/BookingConfirmPage'));
const BookingSuccessPage = React.lazy(() => import('./pages/public/BookingSuccessPage'));

// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <ToastProvider />

      <React.Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-dark-bg transition-colors duration-300">
          <div className="w-12 h-12 border-4 border-[#F2B705]/20 border-t-[#F2B705] rounded-full animate-spin mb-4" />
          <p className="text-text-secondary/60 dark:text-white/50 font-['Inter'] text-xs tracking-widest uppercase animate-pulse">Loading...</p>
        </div>
      }>
        <Routes>

        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<LuxuryGalleryPage />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />
        <Route path="/payment-success" element={<PaymentCallback />} />
        
        {/* ── New Public Routes ───────────────────────────────────────────── */}
        <Route path="/rooms" element={<RoomListingPage />} />
        <Route path="/rooms/:typeId" element={<RoomDetailPage />} />
        <Route path="/halls" element={<HallListingPage />} />
        <Route path="/halls/:typeId" element={<HallDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/booking/confirm" element={<BookingConfirmPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />

        {/* ── 404 ────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;