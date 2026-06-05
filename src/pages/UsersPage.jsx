import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Users, ShieldAlert, Award, Star,
  RefreshCw, RotateCcw, ShieldCheck, Clock, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import UserForm from '../components/forms/UserForm';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import FormField from '../components/ui/FormField';
import StatCard from '../components/ui/StatCard';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'CUSTOMER'];

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-error/10 text-error border-error/20',
  ADMIN: 'bg-primary/10 text-primary border-primary/20',
  ACCOUNTANT: 'bg-success/10 text-success border-success/20',
  STAFF: 'bg-warning/10 text-warning border-warning/20',
  CUSTOMER: 'bg-blue-100 text-blue-700 border-blue-200',
};

const UsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const canManage = isSuperAdmin || isAdmin;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Role assignment modal state
  const [roleModal, setRoleModal] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [assigningRole, setAssigningRole] = useState(false);

  useEffect(() => { fetchUsers(); }, [filterRole, showDeleted]);

  const location = useLocation();
  const [urlSearch, setUrlSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setUrlSearch(q);
  }, [location.search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole) params.role = filterRole;
      if (showDeleted && isSuperAdmin) params.includeDeleted = 'true';
      const response = await apiClient.get('/users', { params });
      setUsers(response.data.users || response.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    setDeletingId(userId);
    try {
      await apiClient.delete(`/users/${userId}`);
      toast.success('User deactivated successfully');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (userId) => {
    try {
      await apiClient.post(`/users/${userId}/restore`);
      toast.success('User restored successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore user');
    }
  };

  const handleAssignRole = async () => {
    if (!newRole || !roleTarget) return;
    setAssigningRole(true);
    try {
      await apiClient.post(`/users/${roleTarget._id}/assign-role`, { newRole });
      toast.success(`Role updated to ${newRole}`);
      setRoleModal(false);
      setRoleTarget(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const openRoleModal = (u) => {
    setRoleTarget(u);
    setNewRole(u.role);
    setRoleModal(true);
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(u.role)).length,
    staff: users.filter((u) => ['STAFF', 'ACCOUNTANT', 'HR'].includes(u.role)).length,
    customers: users.filter((u) => u.role === 'CUSTOMER').length,
  };

  const ROLE_COLORS = {
    SUPER_ADMIN: 'bg-error/10 text-error border-error/20',
    ADMIN: 'bg-primary/10 text-primary border-primary/20',
    MANAGER: 'bg-purple-100 text-purple-700 border-purple-200',
    HR: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ACCOUNTANT: 'bg-success/10 text-success border-success/20',
    STAFF: 'bg-warning/10 text-warning border-warning/20',
    CUSTOMER: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const EMPLOYMENT_COLORS = {
    ACTIVE: 'bg-success/10 text-success',
    ON_LEAVE: 'bg-warning/10 text-warning',
    SUSPENDED: 'bg-error/10 text-error',
    TERMINATED: 'bg-text-secondary/10 text-text-secondary',
  };


  const columns = [
    {
      header: 'Staff ID',
      accessor: (row) => (
        <span className="font-mono text-xs text-text-secondary bg-background px-2 py-1 rounded border border-border whitespace-nowrap">
          {row.employeeId || '—'}
        </span>
      ),
    },
    {
      header: 'User',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${row.deletedAt ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
            {row.firstName?.charAt(0) || 'U'}{row.lastName?.charAt(0) || ''}
          </div>
          <div>
            <p className={`font-semibold text-sm ${row.deletedAt ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-text-secondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: (row) => <span className="text-sm text-text-secondary">{row.phone || '—'}</span>,
    },
    {
      header: 'Role',
      accessor: (row) => (
        <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${ROLE_COLORS[row.role] || 'bg-gray-100 text-gray-600'}`}>
          {row.role?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <div className="space-y-1">
          <StatusBadge type={row.deletedAt ? 'cancelled' : row.isActive ? 'active' : 'inactive'} />
          {row.employmentStatus && row.employmentStatus !== 'ACTIVE' && (
            <span className={`block text-[10px] px-1.5 py-0.5 rounded font-medium w-fit ${EMPLOYMENT_COLORS[row.employmentStatus] || ''}`}>
              {row.employmentStatus.replace('_', ' ')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Last Login',
      accessor: (row) => (
        <span className="text-xs text-text-secondary">
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => {
        if (!canManage) return null;
        const isSelf = row._id === currentUser?._id;
        const isDeleted = !!row.deletedAt;

        return (
          <div className="flex items-center gap-1.5">
            {/* Edit */}
            {!isDeleted && (
              <button
                onClick={() => { setEditingUser(row); setShowForm(true); }}
                className="p-1.5 hover:bg-background rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
            )}

            {/* Assign Role — SUPER_ADMIN only, not self */}
            {isSuperAdmin && !isSelf && !isDeleted && (
              <button
                onClick={() => openRoleModal(row)}
                className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                title="Assign Role"
              >
                <ShieldCheck size={14} />
              </button>
            )}

            {/* Restore — deleted users only */}
            {isDeleted && (isSuperAdmin || isAdmin) && (
              <button
                onClick={() => handleRestore(row._id)}
                className="p-1.5 hover:bg-success/10 rounded-lg text-success transition-colors"
                title="Restore user"
              >
                <RotateCcw size={14} />
              </button>
            )}

            {/* Delete — not self, not already deleted */}
            {!isSelf && !isDeleted && (
              <>
                {deleteTarget === row._id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(row._id)}
                      disabled={deletingId === row._id}
                      className="px-2 py-1 text-xs bg-error text-white rounded-lg hover:bg-error/90 font-medium disabled:opacity-60"
                    >
                      {deletingId === row._id ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(null)}
                      className="px-2 py-1 text-xs bg-background border border-border rounded-lg hover:bg-border/30 font-medium"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteTarget(row._id)}
                    className="p-1.5 hover:bg-error/10 rounded-lg text-error transition-colors"
                    title="Deactivate"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage administrators, staff, accountants, and registered guests"
        breadcrumbs={[{ label: 'Home' }, { label: 'Users' }]}
        action={
          canManage && (
            <button
              onClick={() => { setEditingUser(null); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all shadow-soft"
            >
              <Plus size={18} /> Add User
            </button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.total} icon={Users} color="primary" />
        <StatCard title="Admins & Super" value={stats.admins} icon={ShieldAlert} color="error" />
        <StatCard title="Staff & Accounts" value={stats.staff} icon={Award} color="warning" />
        <StatCard title="Registered Guests" value={stats.customers} icon={Star} color="success" />
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-52">
            <FormField
              label="Filter by Role"
              name="filterRole"
              type="select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'SUPER_ADMIN', label: 'Super Admins' },
                { value: 'ADMIN', label: 'Admins' },
                { value: 'MANAGER', label: 'Managers' },
                { value: 'HR', label: 'HR Specialists' },
                { value: 'ACCOUNTANT', label: 'Accountants' },
                { value: 'STAFF', label: 'Staff' },
                { value: 'CUSTOMER', label: 'Customers' },
              ]}
            />
          </div>

          {/* Show deleted toggle — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowDeleted((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showDeleted
                ? 'bg-error/10 border-error/30 text-error'
                : 'bg-background border-border text-text-secondary hover:text-text-primary'
                }`}
            >
              {showDeleted ? <EyeOff size={15} /> : <Eye size={15} />}
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </button>
          )}

          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          searchPlaceholder="Search by name or email..."
          searchValue={urlSearch}
          onSearchChange={setUrlSearch}
          emptyMessage="No users found."
          pageSize={15}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="lg"
      >
        <UserForm
          user={editingUser}
          onSuccess={() => { setShowForm(false); setEditingUser(null); fetchUsers(); }}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
        />
      </Modal>

      {/* Assign Role Modal — SUPER_ADMIN only */}
      <Modal
        isOpen={roleModal}
        onClose={() => { setRoleModal(false); setRoleTarget(null); }}
        title="Assign Role"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setRoleModal(false); setRoleTarget(null); }}
              className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignRole}
              disabled={assigningRole || newRole === roleTarget?.role}
              className="px-4 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {assigningRole ? 'Assigning...' : 'Assign Role'}
            </button>
          </>
        }
      >
        {roleTarget && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-background border border-border">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">User</p>
              <p className="font-semibold text-text-primary">{roleTarget.firstName} {roleTarget.lastName}</p>
              <p className="text-xs text-text-secondary">{roleTarget.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-background border border-border">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">Current Role</p>
              <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${ROLE_COLORS[roleTarget.role]}`}>
                {roleTarget.role?.replace('_', ' ')}
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">New Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            {newRole !== roleTarget.role && (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-warning text-sm">
                This will change the user's access level immediately.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;