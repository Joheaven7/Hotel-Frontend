import { useAuthStore } from '../store/authStore';

// Role mappings matched exactly from the implementation plan
export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // All permissions, always
  ADMIN: [
    'dashboard.view', 'dashboard.analytics', 'dashboard.revenue',
    'rooms.view', 'rooms.create', 'rooms.edit', 'rooms.delete',
    'halls.view', 'halls.create', 'halls.edit', 'halls.delete',
    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel', 'reservations.approve',
    'payments.view', 'payments.process', 'payments.refund',
    'payroll.view', 'payroll.create', 'payroll.edit', 'payroll.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assignRoles', 'users.managePermissions',
    'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.resolve',
    'reports.view', 'reports.export',
    'notifications.send', 'notifications.manage',
    'chat.private', 'chat.department', 'chat.broadcast'
  ],
  MANAGER: [
    'dashboard.view', 'dashboard.analytics',
    'rooms.view', 'rooms.create', 'rooms.edit',
    'halls.view', 'halls.create', 'halls.edit',
    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.approve',
    'payments.view',
    'payroll.view',
    'users.view', 'users.create', 'users.edit',
    'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.resolve',
    'reports.view',
    'chat.private', 'chat.department'
  ],
  HR: [
    'dashboard.view',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assignRoles',
    'payroll.view', 'payroll.create', 'payroll.edit', 'payroll.delete',
    'reports.view',
    'chat.private', 'chat.department'
  ],
  ACCOUNTANT: [
    'dashboard.view', 'dashboard.revenue',
    'payments.view', 'payments.process', 'payments.refund',
    'payroll.view', 'payroll.create', 'payroll.edit',
    'reports.view', 'reports.export',
    'chat.private', 'chat.department'
  ],
  STAFF: [
    'dashboard.view',
    'rooms.view',
    'halls.view',
    'reservations.view', 'reservations.create',
    'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.resolve',
    'chat.private', 'chat.department'
  ]
};

export const usePermissions = () => {
  const user = useAuthStore(s => s.user);

  const hasPermission = (permission) => {
    if (user?.role === 'SUPER_ADMIN') return true;

    const perms = user?.permissions?.length > 0
      ? user.permissions
      : DEFAULT_ROLE_PERMISSIONS[user?.role] || [];

    if (perms.includes('*')) return true;
    return perms.includes(permission);
  };

  const hasAnyPermission = (permissions = []) => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions = []) => {
    return permissions.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
