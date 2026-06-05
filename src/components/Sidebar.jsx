import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, BedDouble, CalendarDays, CreditCard,
  Users, Wrench, BarChart3, Tent, LogOut, Hotel,
  Banknote, UserCog, FileSearch, Tag, MessageSquare,
  MessageSquareDot, Sparkles, ClipboardList
} from 'lucide-react';

// ── Role badge config ─────────────────────────────────────────────────────────
const ROLE_BADGES = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-gold/20 text-gold' },
  ADMIN: { label: 'Admin', color: 'bg-primary/20 text-primary' },
  MANAGER: { label: 'Manager', color: 'bg-purple-500/20 text-purple-300' },
  HR: { label: 'HR', color: 'bg-indigo-500/20 text-indigo-300' },
  ACCOUNTANT: { label: 'Accountant', color: 'bg-success/20 text-success' },
  STAFF: { label: 'Staff', color: 'bg-warning/20 text-warning' },
  CUSTOMER: { label: 'Guest', color: 'bg-blue-500/20 text-blue-300' },
};

// ── Menu items per role ───────────────────────────────────────────────────────
const MENU = {
  SUPER_ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rooms', path: '/rooms', icon: BedDouble },
    { label: 'Room Types', path: '/room-types', icon: Tag },
    { label: 'Halls', path: '/halls', icon: Tent },
    { label: 'Hall Types', path: '/hall-types', icon: Tag },
    { label: 'Reservations', path: '/reservations', icon: CalendarDays },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Payroll', path: '/payroll', icon: Banknote },
    { label: 'Users', path: '/users', icon: UserCog },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'Live Chat', path: '/chat', icon: MessageSquareDot },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileSearch },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rooms', path: '/rooms', icon: BedDouble },
    { label: 'Room Types', path: '/room-types', icon: Tag },
    { label: 'Halls', path: '/halls', icon: Tent },
    { label: 'Hall Types', path: '/hall-types', icon: Tag },
    { label: 'Reservations', path: '/reservations', icon: CalendarDays },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Users', path: '/users', icon: UserCog },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'Live Chat', path: '/chat', icon: MessageSquareDot },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
  MANAGER: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rooms', path: '/rooms', icon: BedDouble },
    { label: 'Room Types', path: '/room-types', icon: Tag },
    { label: 'Halls', path: '/halls', icon: Tent },
    { label: 'Hall Types', path: '/hall-types', icon: Tag },
    { label: 'Reservations', path: '/reservations', icon: CalendarDays },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Users', path: '/users', icon: UserCog },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'Live Chat', path: '/chat', icon: MessageSquareDot },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
  HR: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', path: '/users', icon: Users },
    { label: 'Payroll', path: '/payroll', icon: Banknote },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
  ACCOUNTANT: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Payroll', path: '/payroll', icon: Banknote },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
  STAFF: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rooms', path: '/rooms', icon: BedDouble },
    { label: 'Halls', path: '/halls', icon: Tent },
    { label: 'Reservations', path: '/reservations', icon: CalendarDays },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles },
    { label: 'Complaints', path: '/complaints', icon: MessageSquare },
    { label: 'Live Chat', path: '/chat', icon: MessageSquareDot },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
  CUSTOMER: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Reservations', path: '/reservations', icon: CalendarDays },
    { label: 'My Payments', path: '/payments', icon: CreditCard },
    { label: 'Feedback', path: '/complaints', icon: MessageSquare },
    { label: 'My Profile', path: '/profile', icon: UserCog },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = MENU[user?.role] || [];
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