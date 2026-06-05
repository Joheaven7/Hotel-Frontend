import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * RoleRoute checks if the currently logged-in user has the right
 * permissions to see specific dashboards (e.g., preventing a Customer 
 * from viewing the internal Staff Chat Hub).
 */
const RoleRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useAuthStore();

    // 1. If the user isn't logged in at all, redirect to the login screen
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // 2. If their role isn't in the allowed array, redirect to unauthorized page
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. Authorized! Render the requested page components (via the Router Outlet)
    return <Outlet />;
};

export default RoleRoute;