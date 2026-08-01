import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';
import { useAuthStore } from './store/authStore';
import { setupSocketConnection, disconnectSocket } from './services/socket';

// ── Public pages (Eagerly loaded for fast LCP) ────────────────────────────────
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';

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

// ── Admin & Staff Dashboards ──────────────────────────────────────────────────
const SuperAdminDashboard = React.lazy(() => import('./pages/dashboards/SuperAdminDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/dashboards/AdminDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/dashboards/ManagerDashboard'));
const AccountantDashboard = React.lazy(() => import('./pages/dashboards/AccountantDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/dashboards/StaffDashboard'));
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
const DepartmentsPage = React.lazy(() => import('./pages/DepartmentsPage'));
const RolesPage = React.lazy(() => import('./pages/RolesPage'));
const PermissionsPage = React.lazy(() => import('./pages/PermissionsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const AuditLogsPage = React.lazy(() => import('./pages/AuditLogsPage'));
const ComplaintsPage = React.lazy(() => import('./pages/ComplaintsPage'));
const InvoicePage = React.lazy(() => import('./pages/InvoicePage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const HousekeepingPage = React.lazy(() => import('./pages/HousekeepingPage'));

// Restaurant / Kitchen / Room Service
const RestaurantPage = React.lazy(() => import('./pages/RestaurantPage'));
const KitchenDashboard = React.lazy(() => import('./pages/dashboards/KitchenDashboard'));
const RoomServiceDashboard = React.lazy(() => import('./pages/dashboards/RoomServiceDashboard'));

// ── Layout & guards ───────────────────────────────────────────────────────────
import ProtectedRoute, { RoleRoute, PermissionRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

const ALL_STAFF = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'HR', 'ACCOUNTANT', 'STAFF'];
const MGMT = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
const OPS = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
const FIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'];

const W = ({ roles, children }) => (
  <RoleRoute allowedRoles={roles}>
    <DashboardLayout>{children}</DashboardLayout>
  </RoleRoute>
);

const WP = ({ permission, children }) => (
  <PermissionRoute permission={permission}>
    <DashboardLayout>{children}</DashboardLayout>
  </PermissionRoute>
);

function DashboardRouter() {
  const { user } = useAuthStore();
  switch (user?.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    case 'MANAGER': return <ManagerDashboard />;
    case 'HR': return <HRDashboard />;
    case 'ACCOUNTANT': return <AccountantDashboard />;
    case 'STAFF': return <StaffDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

function App() {
  const { token, loadUser } = useAuthStore();

  useEffect(() => {
    if (loadUser) loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (token) {
      setupSocketConnection(token);
    } else {
      disconnectSocket();
    }
  }, [token]);

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
        <Route path="/login" element={<LoginPage />} />
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

        {/* ── Staff / Admin Portal Routes ──────────────────────────────────── */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardRouter /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/superadmin" element={<W roles={['SUPER_ADMIN']}><SuperAdminDashboard /></W>} />
        <Route path="/dashboard/admin" element={<W roles={MGMT}><AdminDashboard /></W>} />
        <Route path="/dashboard/manager" element={<W roles={MGMT}><ManagerDashboard /></W>} />
        <Route path="/dashboard/hr" element={<W roles={['SUPER_ADMIN', 'HR']}><HRDashboard /></W>} />
        <Route path="/dashboard/accountant" element={<W roles={FIN}><AccountantDashboard /></W>} />
        <Route path="/dashboard/staff" element={<W roles={OPS}><StaffDashboard /></W>} />

        <Route path="/admin/rooms" element={<WP permission="rooms.view"><RoomsPage /></WP>} />
        <Route path="/admin/halls" element={<WP permission="halls.view"><HallsPage /></WP>} />
        <Route path="/room-types" element={<WP permission="rooms.view"><RoomTypesPage /></WP>} />
        <Route path="/hall-types" element={<WP permission="halls.view"><HallTypesPage /></WP>} />
        <Route path="/reservations" element={<WP permission="reservations.view"><ReservationsPage /></WP>} />
        <Route path="/payments" element={<WP permission="payments.view"><PaymentsPage /></WP>} />
        <Route path="/payroll" element={<WP permission="payroll.view"><PayrollPage /></WP>} />
        <Route path="/users" element={<WP permission="users.view"><UsersPage /></WP>} />
        <Route path="/departments" element={<WP permission="users.view"><DepartmentsPage /></WP>} />
        <Route path="/roles" element={<WP permission="users.view"><RolesPage /></WP>} />
        <Route path="/permissions" element={<WP permission="users.managePermissions"><PermissionsPage /></WP>} />
        <Route path="/maintenance" element={<WP permission="maintenance.view"><MaintenancePage /></WP>} />
        <Route path="/housekeeping" element={<WP permission="rooms.view"><HousekeepingPage /></WP>} />
        <Route path="/reports" element={<WP permission="reports.view"><ReportsPage /></WP>} />
        <Route path="/audit-logs" element={<WP permission="system.auditLogs"><AuditLogsPage /></WP>} />
        <Route path="/complaints" element={<WP permission="dashboard.view"><ComplaintsPage /></WP>} />
        <Route path="/invoices/:paymentId" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
        <Route path="/chat" element={<PermissionRoute permission="chat.private"><DashboardLayout><ChatPage /></DashboardLayout></PermissionRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />

        <Route path="/restaurant" element={<WP permission="dashboard.view"><RestaurantPage /></WP>} />
        <Route path="/kitchen" element={<WP permission="dashboard.view"><KitchenDashboard /></WP>} />
        <Route path="/room-service" element={<WP permission="dashboard.view"><RoomServiceDashboard /></WP>} />

        {/* ── 404 ────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;