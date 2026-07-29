import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Building2, Users, ToggleLeft, ToggleRight,
  RefreshCw, Loader2, Search, ChevronDown, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatCard from '../components/ui/StatCard';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedDept, setExpandedDept] = useState(null);
  const [deptUsers, setDeptUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return toast.error('Department name is required');
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/departments/${editing._id}`, { name: formName.trim() });
        toast.success('Department updated');
      } else {
        await apiClient.post('/departments', { name: formName.trim() });
        toast.success('Department created');
      }
      setShowForm(false);
      setEditing(null);
      setFormName('');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (dept) => {
    try {
      await apiClient.patch(`/departments/${dept._id}`, { isActive: !dept.isActive });
      toast.success(`Department ${dept.isActive ? 'disabled' : 'enabled'}`);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle department');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/departments/${deleteTarget._id}`);
      toast.success('Department deleted');
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  const toggleUsersList = async (dept) => {
    if (expandedDept === dept._id) {
      setExpandedDept(null);
      setDeptUsers([]);
      return;
    }
    setExpandedDept(dept._id);
    setLoadingUsers(true);
    try {
      const res = await apiClient.get(`/departments/${dept._id}/users`);
      setDeptUsers(res.data);
    } catch (err) {
      toast.error('Failed to load department users');
      setDeptUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: departments.length,
    active: departments.filter(d => d.isActive).length,
    inactive: departments.filter(d => !d.isActive).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Department Management"
        subtitle="Create, manage, and organize hotel departments"
        breadcrumbs={[{ label: 'Home' }, { label: 'Administration' }, { label: 'Departments' }]}
        action={
          <button
            onClick={() => { setEditing(null); setFormName(''); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all shadow-soft"
          >
            <Plus size={18} /> New Department
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Departments" value={stats.total} icon={Building2} color="primary" />
        <StatCard title="Active" value={stats.active} icon={ToggleRight} color="success" />
        <StatCard title="Inactive" value={stats.inactive} icon={ToggleLeft} color="warning" />
      </div>

      {/* Search */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
            />
          </div>
          <button onClick={fetchDepartments} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Department List */}
      <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No departments found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(dept => (
              <div key={dept._id}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleUsersList(dept)} className="p-1 hover:bg-background rounded">
                      {expandedDept === dept._id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${dept.isActive ? 'bg-primary/10 text-primary' : 'bg-text-secondary/10 text-text-secondary'}`}>
                      {dept.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${!dept.isActive && 'text-text-secondary line-through'}`}>{dept.name}</p>
                      <p className="text-xs text-text-secondary">
                        Created {new Date(dept.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${dept.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-text-secondary/10 text-text-secondary border-border'}`}>
                      {dept.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleToggle(dept)}
                      className={`p-1.5 rounded-lg transition-colors ${dept.isActive ? 'hover:bg-warning/10 text-warning' : 'hover:bg-success/10 text-success'}`}
                      title={dept.isActive ? 'Disable' : 'Enable'}
                    >
                      {dept.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => { setEditing(dept); setFormName(dept.name); setShowForm(true); }}
                      className="p-1.5 hover:bg-background rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(dept)}
                      className="p-1.5 hover:bg-error/10 rounded-lg text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Users */}
                {expandedDept === dept._id && (
                  <div className="px-6 pb-4 ml-14">
                    {loadingUsers ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-text-secondary">
                        <Loader2 size={14} className="animate-spin" /> Loading users...
                      </div>
                    ) : deptUsers.length === 0 ? (
                      <p className="text-sm text-text-secondary py-2">No users in this department.</p>
                    ) : (
                      <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                          {deptUsers.length} user{deptUsers.length !== 1 && 's'}
                        </p>
                        {deptUsers.map(u => (
                          <div key={u._id} className="flex items-center gap-3 text-sm">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <span className="font-medium">{u.firstName} {u.lastName}</span>
                            <span className="text-text-secondary">— {u.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Rename Department' : 'Create Department'}
        size="sm"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <FormField
            label="Department Name"
            name="name"
            placeholder="e.g. Housekeeping"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Department"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-btn bg-error text-white hover:bg-error/90 text-sm font-semibold transition-colors disabled:opacity-60">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.name}</strong>? This cannot be undone. Departments with assigned users cannot be deleted.
        </p>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;
