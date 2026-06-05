import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// ── Loading spinner ────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Access Denied screen ───────────────────────────────────────────────────────
const AccessDenied = ({ userRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center max-w-sm">
      <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🔒</span>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h2>
      <p className="text-text-secondary mb-2">
        Your role <span className="font-semibold text-text-primary">({userRole})</span> does not have
        permission to view this page.
      </p>
      <p className="text-text-secondary text-sm mb-6">
        If you believe this is a mistake, contact your administrator.
      </p>

      <a href="/dashboard"
        className="inline-block px-6 py-2.5 bg-primary text-white rounded-btn font-semibold hover:bg-primary/90 transition-colors"
      >
        Go to My Dashboard
      </a>
    </div>
  </div>
);

// ── ProtectedRoute — checks only: is user logged in? ──────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, token, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <Spinner />;

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ── RoleRoute — checks: logged in AND role is in allowedRoles ─────────────────
export const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <Spinner />;

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role not permitted — show access denied, NOT a redirect to /dashboard
  // A redirect would cause an infinite loop if /dashboard itself is also role-gated
  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied userRole={user.role} />;
  }

  return children;
};

export default ProtectedRoute;