import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, RefreshCw, AlertCircle, Clock, User } from 'lucide-react';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';

const ACTION_COLORS = {
  LOGIN: 'bg-success/10 text-success',
  LOGOUT: 'bg-text-secondary/10 text-text-secondary',
  ROLE_CHANGE: 'bg-purple-100 text-purple-700',
  USER_CREATE: 'bg-primary/10 text-primary',
  USER_UPDATE: 'bg-warning/10 text-warning',
  USER_DELETE: 'bg-error/10 text-error',
  USER_RESTORE: 'bg-success/10 text-success',
  RESERVATION_CREATE: 'bg-primary/10 text-primary',
  RESERVATION_CANCEL: 'bg-error/10 text-error',
  RESERVATION_CONFIRM: 'bg-success/10 text-success',
  RESERVATION_CHECKIN: 'bg-success/10 text-success',
  RESERVATION_CHECKOUT: 'bg-warning/10 text-warning',
  PAYMENT_PROCESS: 'bg-success/10 text-success',
  PAYMENT_REFUND: 'bg-error/10 text-error',
  ROOM_CRUD: 'bg-primary/10 text-primary',
  HALL_CRUD: 'bg-warning/10 text-warning',
  PAYROLL_CREATE: 'bg-primary/10 text-primary',
  PAYROLL_PAID: 'bg-success/10 text-success',
  MAINTENANCE_CREATE: 'bg-warning/10 text-warning',
  MAINTENANCE_UPDATE: 'bg-warning/10 text-warning',
  SETTINGS_UPDATE: 'bg-purple-100 text-purple-700',
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    actionType: '',
    startDate: '',
    endDate: '',
    userId: '',
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const response = await apiClient.get('/auditlogs', { params });
      setLogs(response.data.logs || []);
      setTotal(response.data.total || 0);
      setPages(response.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value, page: 1 }));
  };

  const ACTION_TYPES = [
    'LOGIN', 'LOGOUT', 'ROLE_CHANGE',
    'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
    'RESERVATION_CREATE', 'RESERVATION_CANCEL', 'RESERVATION_CONFIRM',
    'PAYMENT_PROCESS', 'PAYMENT_REFUND',
    'ROOM_CRUD', 'HALL_CRUD', 'PAYROLL_CREATE', 'PAYROLL_PAID',
    'MAINTENANCE_CREATE', 'MAINTENANCE_UPDATE', 'SETTINGS_UPDATE',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activities and user actions"
        breadcrumbs={[{ label: 'Home' }, { label: 'Audit Logs' }]}
        action={
          <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft">
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Action Type</label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Start Date</label>
            <input
              type="date" value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">End Date</label>
            <input
              type="date" value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Results per page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-card flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-card shadow-soft border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">
            {total.toLocaleString()} total records
          </p>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Shield size={15} className="text-primary" />
            SUPER_ADMIN view only
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  {['Timestamp', 'User', 'Role', 'Action', 'Resource', 'IP Address'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {log.userId?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {log.userId?.firstName} {log.userId?.lastName}
                          </p>
                          <p className="text-xs text-text-secondary">{log.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {log.userId?.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLORS[log.actionType] || 'bg-gray-100 text-gray-600'}`}>
                        {log.actionType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{log.resource}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{log.ipAddress || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background">
            <p className="text-sm text-text-secondary">Page {filters.page} of {pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-surface disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', Math.min(pages, filters.page + 1))}
                disabled={filters.page === pages}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-surface disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;