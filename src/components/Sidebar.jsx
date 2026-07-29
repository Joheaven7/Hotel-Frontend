import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../../../portal/src/utils/permissions';
import {
  LayoutDashboard, BedDouble, CalendarDays, CreditCard,
  Users, Wrench, BarChart3, Tent, LogOut, Hotel,
  Banknote, UserCog, FileSearch, Tag, MessageSquare,
  MessageSquareDot, Sparkles, ClipboardList,
  Building2, Shield, KeyRound, Utensils, ChefHat, Truck
} from 'lucide-react';

const ROLE_BADGES = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-gold/20 text-gold' },
  ADMIN: { label: 'Admin', color: 'bg-primary/20 text-primary' },
  MANAGER: { label: 'Manager', color: 'bg-purple-500/20 text-purple-300' },
  HR: { label: 'HR', color: 'bg-indigo-500/20 text-indigo-300' },
  ACCOUNTANT: { label: 'Accountant', color: 'bg-success/20 text-success' },
  STAFF: { label: 'Staff', color: 'bg-warning/20 text-warning' },
};

const MENU_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'Rooms', path: '/rooms', icon: BedDouble, permission: 'rooms.view' },
  { label: 'Room Types', path: '/room-types', icon: Tag, permission: 'rooms.view' },
  { label: 'Halls', path: '/halls', icon: Tent, permission: 'halls.view' },
  { label: 'Hall Types', path: '/hall-types', icon: Tag, permission: 'halls.view' },
  { label: 'Reservations', path: '/reservations', icon: CalendarDays, permission: 'reservations.view' },
  { label: 'Payments', path: '/payments', icon: CreditCard, permission: 'payments.view' },
  { label: 'Payroll', path: '/payroll', icon: Banknote, permission: 'payroll.view' },
  { label: 'Users', path: '/users', icon: UserCog, permission: 'users.view' },
  { label: 'Departments', path: '/departments', icon: Building2, permission: 'users.view' },
  { label: 'Roles', path: '/roles', icon: Shield, permission: 'users.view' },
  { label: 'Permissions', path: '/permissions', icon: KeyRound, permission: 'users.managePermissions' },
  { label: 'Restaurant', path: '/restaurant', icon: Utensils, permission: 'dashboard.view' },
  { label: 'Kitchen Station', path: '/kitchen', icon: ChefHat, permission: 'dashboard.view' },
  { label: 'Room Service', path: '/room-service', icon: Truck, permission: 'dashboard.view' },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, permission: 'maintenance.view' },
  { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles, permission: 'rooms.view' },
  { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
  { label: 'Complaints', path: '/complaints', icon: MessageSquare, permission: 'dashboard.view' },
  { label: 'Live Chat', path: '/chat', icon: MessageSquareDot, permission: 'chat.private' },
  { label: 'Audit Logs', path: '/audit-logs', icon: FileSearch, permission: 'system.auditLogs' },
  { label: 'My Profile', path: '/profile', icon: UserCog, permission: 'dashboard.view' },
];

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = MENU_ITEMS.filter(item => hasPermission(item.permission));
  const badge = ROLE_BADGES[user?.role] || { label: user?.role, color: 'bg-white/10 text-white' };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-primary text-white z-40 flex flex-col transition-all duration-300 ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-white/10 px-4 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2 text-gold">
          <Hotel size={isOpen ? 28 : 24} className="transition-all duration-300 shrink-0" />
          {isOpen && (
            <span className="font-heading font-bold text-xl tracking-wide whitespace-nowrap overflow-hidden">
              LuxStay
            </span>
          )}
        </Link>
      </div>

      {/* User info */}
      {isOpen && user && (
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <p className="text-sm font-semibold text-white truncate">
            {user.firstName} {user.lastName}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
          {user.employeeId && (
            <p className="text-[10px] text-white/40 mt-0.5 font-mono">{user.employeeId}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${active
                ? 'bg-white/10 text-gold shadow-soft'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon
                size={20}
                className={`shrink-0 transition-colors ${active ? 'text-gold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
              />
              {isOpen && (
                <span className={`font-medium text-sm whitespace-nowrap truncate ${active ? 'text-white' : ''
                  }`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-error/20 hover:text-error transition-all duration-150 w-full group ${!isOpen && 'justify-center'
            }`}
        >
          <LogOut size={20} className="shrink-0 group-hover:text-error transition-colors" />
          {isOpen && <span className="font-medium text-sm whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;