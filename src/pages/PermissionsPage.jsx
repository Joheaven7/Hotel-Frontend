import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, KeyRound, ToggleLeft, ToggleRight,
  RefreshCw, Loader2, Search, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatCard from '../components/ui/StatCard';

const PermissionsPage = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ key: '', name: '', module: '' });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchPermissions(); }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/permissions');
      setPermissions(res.data);
    } catch (err) {
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const modules = [...new Set(permissions.map(p => p.module))].sort();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.key.trim() || !formData.name.trim() || !formData.module.trim()) {
      return toast.error('All fields are required');
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/permissions/${editing._id}`, {
          name: formData.name.trim(),
          module: formData.module.trim(),
        });
        toast.success('Permission updated');
      } else {
        await apiClient.post('/permissions', {
          key: formData.key.trim(),
          name: formData.name.trim(),
          module: formData.module.trim(),
        });
        toast.success('Permission created');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ key: '', name: '', module: '' });
      fetchPermissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save permission');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (perm) => {
    try {
      await apiClient.patch(`/permissions/${perm._id}`, { isActive: !perm.isActive });
      toast.success(`Permission ${perm.isActive ? 'disabled' : 'enabled'}`);
      fetchPermissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle permission');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/permissions/${deleteTarget._id}`);
      toast.success('Permission deleted');
      setDeleteTarget(null);
      fetchPermissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete permission');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (perm) => {
    setEditing(perm);
    setFormData({ key: perm.key, name: perm.name, module: perm.module });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ key: '', name: '', module: '' });
    setShowForm(true);
  };

  const filtered = permissions.filter(p => {
    const matchSearch = p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());
    const matchModule = !filterModule || p.module === filterModule;
    return matchSearch && matchModule;
  });

  // Group by module for display
  const grouped = filtered.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const stats = {
    total: permissions.length,
    active: permissions.filter(p => p.isActive).length,
    modules: modules.length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Permission Management"
        subtitle="Define and organize system permissions by module"
        breadcrumbs={[{ label: 'Home' }, { label: 'Administration' }, { label: 'Permissions' }]}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all shadow-soft">
            <Plus size={18} /> New Permission
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Permissions" value={stats.total} icon={KeyRound} color="primary" />
        <StatCard title="Active" value={stats.active} icon={ToggleRight} color="success" />
        <StatCard title="Modules" value={stats.modules} icon={KeyRound} color="warning" />
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" />
          </div>
          <div className="w-44">
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background">
              <option value="">All Modules</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={fetchPermissions} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Permission Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-surface rounded-card border border-border shadow-soft text-center py-16 text-text-secondary">
          <KeyRound size={40} className="mx-auto mb-3 opacity-30" />
          <p>No permissions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([module, perms]) => (
            <div key={module} className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
              <div className="px-6 py-3 bg-background/50 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm text-text-primary">{module}</h3>
                <span className="text-xs text-text-secondary">{perms.length} permission{perms.length !== 1 && 's'}</span>
              </div>
              <div className="divide-y divide-border">
                {perms.map(perm => (
                  <div key={perm._id} className="flex items-center justify-between px-6 py-3 hover:bg-background/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${perm.isActive ? 'bg-success' : 'bg-text-secondary/30'}`} />
                      <div>
                        <p className={`text-sm font-medium ${!perm.isActive && 'text-text-secondary line-through'}`}>{perm.name}</p>
                        <p className="text-xs text-text-secondary font-mono">{perm.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggle(perm)} className={`p-1.5 rounded-lg transition-colors ${perm.isActive ? 'hover:bg-warning/10 text-warning' : 'hover:bg-success/10 text-success'}`} title={perm.isActive ? 'Disable' : 'Enable'}>
                        {perm.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => openEdit(perm)} className="p-1.5 hover:bg-background rounded-lg text-text-secondary hover:text-text-primary transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(perm)} className="p-1.5 hover:bg-error/10 rounded-lg text-error transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Edit Permission' : 'Create Permission'}
        size="sm"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Permission Key" name="key" placeholder="e.g. rooms.create" value={formData.key} onChange={(e) => setFormData(p => ({ ...p, key: e.target.value }))} required disabled={!!editing} />
          <FormField label="Display Name" name="name" placeholder="e.g. Create Rooms" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
          <FormField label="Module" name="module" placeholder="e.g. Rooms" value={formData.module} onChange={(e) => setFormData(p => ({ ...p, module: e.target.value }))} required />
          {editing && (
            <p className="text-xs text-text-secondary">Permission key cannot be changed after creation.</p>
          )}
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Permission"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-btn bg-error text-white hover:bg-error/90 text-sm font-semibold transition-colors disabled:opacity-60">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.name}</strong> (<code className="text-xs">{deleteTarget?.key}</code>)? Permissions assigned to roles or users cannot be deleted.
        </p>
      </Modal>
    </div>
  );
};

export default PermissionsPage;
