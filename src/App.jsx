import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { setupSocketConnection, disconnectSocket } from './services/socket';
import ToastProvider from './components/ToastProvider';

// ── Public pages (Eagerly loaded for fast LCP) ────────────────────────────────
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// ── Lazy-loaded pages (Code-splitting to reduce bundle size) ──────────────────
const PaymentCallback = React.lazy(() => import('./pages/PaymentCallback'));
const LuxuryGalleryPage = React.lazy(() => import('./components/landing/GalleryPage'));

// Dashboards
const SuperAdminDashboard = React.lazy(() => import('./pages/dashboards/SuperAdminDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/dashboards/AdminDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/dashboards/ManagerDashboard'));
const AccountantDashboard = React.lazy(() => import('./pages/dashboards/AccountantDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/dashboards/StaffDashboard'));
const CustomerDashboard = React.lazy(() => import('./pages/dashboards/CustomerDashboard'));
const HRDashboard = React.lazy(() => import('./pages/dashboards/HRDashboard'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// Management pages
const RoomsPage = React.lazy(() => import('./pages/RoomsPage'));
const HallsPage = React.lazy(() => import('./pages/HallsPage'));
const RoomTypesPage = React.lazy(() => import('./pages/RoomTypesPage'));
const HallTypesPage = React.lazy(() => import('./pages/HallTypesPage'));
const ReservationsPage = React.lazy(() => import('./pages/ReservationsPage'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));
const PayrollPage = React.lazy(() => import('./pages/PayrollPage'));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const AuditLogsPage = React.lazy(() => import('./pages/AuditLogsPage'));
const ComplaintsPage = React.lazy(() => import('./pages/ComplaintsPage'));
const InvoicePage = React.lazy(() => import('./pages/InvoicePage'));

// Phase 5 + 7 pages
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const HousekeepingPage = React.lazy(() => import('./pages/HousekeepingPage'));

// ── Layout & guards ───────────────────────────────────────────────────────────
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// ── Chat widget (customer floating button) ────────────────────────────────────
import ChatWidget from './components/chat/ChatWidget';

// ── Role groups ───────────────────────────────────────────────────────────────
const ALL_STAFF = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'HR', 'ACCOUNTANT', 'STAFF'];
const ALL_ROLES = [...ALL_STAFF, 'CUSTOMER'];
const MGMT = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
const OPS = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
const FIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'];
const CUST_FIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'CUSTOMER'];

// ── Shorthand: wrap in RoleRoute + DashboardLayout ────────────────────────────
const W = ({ roles, children }) => (
  <RoleRoute allowedRoles={roles}>
    <DashboardLayout>{children}</DashboardLayout>
  </RoleRoute>
);

// ── Shorthand: wrap in RoleRoute only (full-page, no sidebar) ─────────────────
const P = ({ roles, children }) => (
  <RoleRoute allowedRoles={roles}>
    {children}
  </RoleRoute>
);

// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const { token, loadUser, isInitialized } = useAuthStore();

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (token) {
      setupSocketConnection(token);
    } else {
      disconnectSocket();
    }
  }, [token]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <ToastProvider />
      {token && <ChatWidget />}

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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />
        <Route path="/payment-success" element={<PaymentCallback />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ── Invoice viewer (full-page, no sidebar) ─────────────────────── */}
        <Route path="/invoices/:paymentId"
          element={<ProtectedRoute><InvoicePage /></ProtectedRoute>}
        />

        {/* ── Chat (full-page, no sidebar — staff only) ──────────────────── */}
        <Route path="/chat"
          element={
            <W roles={ALL_STAFF}>
              <ChatPage />
            </W>
          }
        />

        {/* ── Housekeeping (full-page, no sidebar — mobile-first) ────────── */}
        <Route path="/housekeeping"
          element={
            <W roles={OPS}>
              <HousekeepingPage />
            </W>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout><ProfilePage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Dashboard (auto-routes by role) ────────────────────────────── */}
        <Route path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout><DashboardRouter /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Role-specific dashboard shortcuts (used by login redirect) */}
        <Route path="/dashboard/superadmin"
          element={<W roles={['SUPER_ADMIN']}><SuperAdminDashboard /></W>}
        />
        <Route path="/dashboard/admin"
          element={<W roles={MGMT}><AdminDashboard /></W>}
        />
        <Route path="/dashboard/manager"
          element={<W roles={MGMT}><ManagerDashboard /></W>}
        />
        <Route path="/dashboard/hr"
          element={<W roles={['SUPER_ADMIN', 'HR']}><HRDashboard /></W>}
        />
        <Route path="/dashboard/accountant"
          element={<W roles={FIN}><AccountantDashboard /></W>}
        />
        <Route path="/dashboard/staff"
          element={<W roles={OPS}><StaffDashboard /></W>}
        />
        <Route path="/dashboard/customer"
          element={<W roles={ALL_ROLES}><CustomerDashboard /></W>}
        />

        {/* ── Rooms ──────────────────────────────────────────────────────── */}
        <Route path="/rooms" element={<W roles={OPS}><RoomsPage /></W>} />
        <Route path="/rooms/:id" element={<W roles={OPS}><RoomsPage /></W>} />

        {/* ── Halls ──────────────────────────────────────────────────────── */}
        <Route path="/halls" element={<W roles={OPS}><HallsPage /></W>} />
        <Route path="/halls/:id" element={<W roles={OPS}><HallsPage /></W>} />

        {/* ── Room Types & Hall Types ─────────────────────────────────────── */}
        <Route path="/room-types" element={<W roles={MGMT}><RoomTypesPage /></W>} />
        <Route path="/hall-types" element={<W roles={MGMT}><HallTypesPage /></W>} />

        {/* ── Reservations ───────────────────────────────────────────────── */}
        <Route path="/reservations"
          element={<W roles={[...OPS, 'CUSTOMER']}><ReservationsPage /></W>}
        />
        <Route path="/reservations/:id"
          element={<W roles={[...OPS, 'CUSTOMER']}><ReservationsPage /></W>}
        />
        <Route path="/reservations/:id/payment"
          element={<W roles={[...OPS, 'CUSTOMER']}><ReservationsPage /></W>}
        />

        {/* ── Payments ───────────────────────────────────────────────────── */}
        <Route path="/payments"
          element={<W roles={CUST_FIN}><PaymentsPage /></W>}
        />
        <Route path="/payments/:id"
          element={<W roles={CUST_FIN}><PaymentsPage /></W>}
        />

        {/* ── Payroll ────────────────────────────────────────────────────── */}
        <Route path="/payroll"
          element={<W roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'HR', 'ACCOUNTANT']}><PayrollPage /></W>}
        />

        {/* ── Maintenance ────────────────────────────────────────────────── */}
        <Route path="/maintenance"
          element={<W roles={OPS}><MaintenancePage /></W>}
        />
        <Route path="/maintenance/:id"
          element={<W roles={OPS}><MaintenancePage /></W>}
        />

        {/* ── Users ──────────────────────────────────────────────────────── */}
        <Route path="/users"
          element={<W roles={[...MGMT, 'HR']}><UsersPage /></W>}
        />
        <Route path="/users/:id"
          element={<W roles={[...MGMT, 'HR']}><UsersPage /></W>}
        />

        {/* ── Reports ────────────────────────────────────────────────────── */}
        <Route path="/reports"
          element={<W roles={[...FIN, 'HR']}><ReportsPage /></W>}
        />

        {/* ── Audit Logs ─────────────────────────────────────────────────── */}
        <Route path="/audit-logs"
          element={<W roles={['SUPER_ADMIN']}><AuditLogsPage /></W>}
        />

        {/* ── Complaints ─────────────────────────────────────────────────── */}
        <Route path="/complaints"
          element={
            <ProtectedRoute>
              <DashboardLayout><ComplaintsPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ── 404 ────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </React.Suspense>
    </Router>
  );
}

// ── Auto-routes to the correct dashboard based on role ────────────────────────
function DashboardRouter() {
  const { user } = useAuthStore();
  switch (user?.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    case 'MANAGER': return <ManagerDashboard />;
    case 'HR': return <HRDashboard />;
    case 'ACCOUNTANT': return <AccountantDashboard />;
    case 'STAFF': return <StaffDashboard />;
    case 'CUSTOMER': return <CustomerDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

export default App;