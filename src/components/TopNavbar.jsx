import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, User, ChevronDown, Menu, X, Check, Edit2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { onSocketEvent, offSocketEvent } from '../services/socket';
import apiClient from '../services/api';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  HR: 'HR',
  ACCOUNTANT: 'Accountant',
  STAFF: 'Staff',
  CUSTOMER: 'Guest',
};

const ROLE_SEARCH_DESTINATIONS = {
  SUPER_ADMIN: '/reservations',
  ADMIN: '/reservations',
  HR: '/users',
  ACCOUNTANT: '/payments',
  STAFF: '/reservations',
  CUSTOMER: '/reservations',
};

const TYPE_COLORS = {
  RESERVATION_CREATED: 'bg-primary/10 text-primary',
  RESERVATION_CONFIRMED: 'bg-success/10 text-success',
  RESERVATION_CANCELLED: 'bg-error/10 text-error',
  RESERVATION_CHECKIN: 'bg-success/10 text-success',
  RESERVATION_CHECKOUT: 'bg-warning/10 text-warning',
  PAYMENT_CREATED: 'bg-warning/10 text-warning',
  PAYMENT_PAID: 'bg-success/10 text-success',
  PAYMENT_FAILED: 'bg-error/10 text-error',
  PAYROLL_CREATED: 'bg-primary/10 text-primary',
  PAYROLL_APPROVED: 'bg-success/10 text-success',
  PAYROLL_PAID: 'bg-success/10 text-success',
  PAYROLL_REJECTED: 'bg-error/10 text-error',
  STAFF_CREATED: 'bg-primary/10 text-primary',
  MAINTENANCE_CREATED: 'bg-warning/10 text-warning',
  MAINTENANCE_UPDATED: 'bg-warning/10 text-warning',
  SYSTEM_ALERT: 'bg-error/10 text-error',
};

const TopNavbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const response = await apiClient.get('/notifications', { params: { limit: 10 } });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (_) {
      // silent — don't break navbar on notification errors
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Real-time socket listener ────────────────────────────────────────────
  useEffect(() => {
    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
    };

    onSocketEvent('notification:new', handleNewNotification);
    return () => offSocketEvent('notification:new', handleNewNotification);
  }, []);

  // ── Mark as read ─────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) { }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) { }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      const dest = ROLE_SEARCH_DESTINATIONS[user?.role] || '/reservations';
      navigate(`${dest}?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const initials =
    `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` || 'U';

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border h-16 w-full px-4 lg:px-8 flex items-center justify-between transition-all duration-300">

      {/* Left: hamburger + search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 text-text-secondary hover:bg-background rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-input w-80 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Search size={16} className="text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search and press Enter..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent border-none outline-none w-full text-sm text-text-primary placeholder:text-text-secondary"
          />
          {searchVal && (
            <button onClick={() => setSearchVal('')} className="text-text-secondary hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right: actions + profile */}
      <div className="flex items-center gap-2">

        {/* Settings — ADMIN+ */}
        {['SUPER_ADMIN', 'ADMIN'].includes(user?.role) && (
          <button
            onClick={() => navigate('/reports')}
            className="p-2 text-text-secondary hover:bg-background rounded-full transition-colors"
            title="Reports"
          >
            <Settings size={20} />
          </button>
        )}

        {/* ── Bell / Notifications ─────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((p) => !p); if (!notifOpen) fetchNotifications(); }}
            className="relative p-2 text-text-secondary hover:bg-background rounded-full transition-colors"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-surface">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-elevated z-50 animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-primary" />
                  <span className="font-semibold text-text-primary text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-error text-white px-1.5 py-0.5 rounded-full font-medium">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center text-text-secondary">
                    <Bell size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkRead(n._id)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-background transition-colors ${!n.isRead ? 'bg-primary/3' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-border'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-semibold truncate ${!n.isRead ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {n.title}
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[n.type] || 'bg-background text-text-secondary'}`}>
                              {n.type?.split('_')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-text-secondary mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border text-center">
                <button
                  onClick={() => { setNotifOpen(false); fetchNotifications(); }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Refresh notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2.5 hover:bg-background p-1 pr-2 rounded-full transition-colors"
          >
            {user?.avatar ? (
              <img
                src={`${user.avatar}?t=${Date.now()}`}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-border"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0"
              style={{ display: user?.avatar ? 'none' : 'flex' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-text-primary leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-text-secondary leading-tight">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <ChevronDown
              size={15}
              className={`text-text-secondary transition-transform hidden sm:block ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-elevated z-50 py-1 animate-fade-in">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-text-primary text-sm truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {ROLE_LABELS[user?.role]}
                </span>
              </div>

              <div className="py-1">

                <button
                  onClick={() => { setProfileOpen(false); navigate('/dashboard'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors"
                >
                  <User size={16} className="text-text-secondary" /> My Dashboard
                </button>

                {/* ← ADD THIS */}
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors"
                >
                  <Edit2 size={16} className="text-text-secondary" /> Edit Profile
                </button>
                {user?.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/audit-logs'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors"
                  >
                    <Settings size={16} className="text-text-secondary" /> Audit Logs
                  </button>
                )}
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors font-medium"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;