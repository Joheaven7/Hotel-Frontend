import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Shield, Copy, ToggleLeft, ToggleRight,
  RefreshCw, Loader2, Search, ChevronDown, ChevronRight, Lock, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatCard from '../components/ui/StatCard';

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Clone state
  const [cloneTarget, setCloneTarget] = useState(null);
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Expanded role
  const [expandedRole, setExpandedRole] = useState(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/roles');
      setRoles(res.data);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await apiClient.get('/permissions');
      setPermissions(res.data);
    } catch (err) {
      toast.error('Failed to load permissions');
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return toast.error('Role name is required');
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/roles/${editing._id}`, {
          name: formName.trim(),
          permissions: formPermissions,
        });
        toast.success('Role updated');
      } else {
        await apiClient.post('/roles', {
          name: formName.trim(),
          permissions: formPermissions,
        });
        toast.success('Role created');
      }
      setShowForm(false);
      setEditing(null);
      setFormName('');
      setFormPermissions([]);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (role) => {
    try {
      await apiClient.patch(`/roles/${role._id}`, { isActive: !role.isActive });
      toast.success(`Role ${role.isActive ? 'disabled' : 'enabled'}`);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle role');
    }
  };

  const handleClone = async () => {
    if (!cloneName.trim()) return toast.error('New role name is required');
    setCloning(true);
    try {
      await apiClient.post(`/roles/${cloneTarget._id}/clone`, { newName: cloneName.trim() });
      toast.success('Role cloned successfully');
      setCloneTarget(null);
      setCloneName('');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clone role');
    } finally {
      setCloning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/roles/${deleteTarget._id}`);
      toast.success('Role deleted');
      setDeleteTarget(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (role) => {
    setEditing(role);
    setFormName(role.name);
    setFormPermissions(role.permissions || []);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormPermissions([]);
    setShowForm(true);
  };

  const togglePermission = (key) => {
    setFormPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleModuleAll = (modulePerms) => {
    const keys = modulePerms.map(p => p.key);
    const allSelected = keys.every(k => formPermissions.includes(k));
    if (allSelected) {
      setFormPermissions(prev => prev.filter(p => !keys.includes(p)));
    } else {
      setFormPermissions(prev => [...new Set([...prev, ...keys])]);
    }
  };

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: roles.length,
    active: roles.filter(r => r.isActive).length,
    inactive: roles.filter(r => !r.isActive).length,
  };

  const isSuperAdminRole = (r) => r.name === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Role Management"
        subtitle="Create, edit, clone, and manage user roles with custom permissions"
        breadcrumbs={[{ label: 'Home' }, { label: 'Administration' }, { label: 'Roles' }]}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all shadow-soft">
            <Plus size={18} /> New Role
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Roles" value={stats.total} icon={Shield} color="primary" />
        <StatCard title="Active" value={stats.active} icon={ToggleRight} color="success" />
        <StatCard title="Inactive" value={stats.inactive} icon={ToggleLeft} color="warning" />
      </div>

      {/* Search */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" />
          </div>
          <button onClick={fetchRoles} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Role List */}
      <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p>No roles found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(role => (
              <div key={role._id}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setExpandedRole(expandedRole === role._id ? null : role._id)} className="p-1 hover:bg-background rounded">
                      {expandedRole === role._id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${isSuperAdminRole(role) ? 'bg-gold/10 text-gold' : role.isActive ? 'bg-primary/10 text-primary' : 'bg-text-secondary/10 text-text-secondary'}`}>
                      {isSuperAdminRole(role) ? <Lock size={16} /> : role.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${!role.isActive && 'text-text-secondary line-through'}`}>{role.name.replace(/_/g, ' ')}</p>
                        {isSuperAdminRole(role) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-gold font-semibold">PROTECTED</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        {role.permissions?.includes('*') ? 'All permissions' : `${role.permissions?.length || 0} permissions`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${role.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-text-secondary/10 text-text-secondary border-border'}`}>
                      {role.isActive ? 'Active' : 'Disabled'}
                    </span>
                    {!isSuperAdminRole(role) && (
                      <button onClick={() => handleToggle(role)} className={`p-1.5 rounded-lg transition-colors ${role.isActive ? 'hover:bg-warning/10 text-warning' : 'hover:bg-success/10 text-success'}`} title={role.isActive ? 'Disable' : 'Enable'}>
                        {role.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    )}
                    <button onClick={() => openEdit(role)} className="p-1.5 hover:bg-background rounded-lg text-text-secondary hover:text-text-primary transition-colors" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { setCloneTarget(role); setCloneName(''); }} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Clone">
                      <Copy size={14} />
                    </button>
                    {!isSuperAdminRole(role) && (
                      <button onClick={() => setDeleteTarget(role)} className="p-1.5 hover:bg-error/10 rounded-lg text-error transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Permissions */}
                {expandedRole === role._id && (
                  <div className="px-6 pb-4 ml-14">
                    <div className="bg-background rounded-xl border border-border p-4">
                      {role.permissions?.includes('*') ? (
                        <p className="text-sm text-gold font-semibold">★ Full system access (all permissions)</p>
                      ) : role.permissions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions.map(p => (
                            <span key={p} className="text-xs px-2 py-1 rounded-md bg-primary/5 text-primary border border-primary/10 font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-secondary">No permissions assigned.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal with Permission Matrix */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? `Edit Role: ${editing.name}` : 'Create Role'}
        size="xl"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || (editing && isSuperAdminRole(editing))} className="px-4 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : editing ? 'Update Role' : 'Create Role'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <FormField label="Role Name" name="name" placeholder="e.g. RECEPTIONIST" value={formName} onChange={(e) => setFormName(e.target.value)} required disabled={editing && isSuperAdminRole(editing)} />

          {/* Permission Matrix */}
          {!(editing && isSuperAdminRole(editing)) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-text-primary">Permissions</label>
                <span className="text-xs text-text-secondary">{formPermissions.length} selected</span>
              </div>
              <div className="bg-background rounded-xl border border-border p-4 max-h-96 overflow-y-auto space-y-4">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-sm text-text-secondary">No permissions defined. Create permissions first.</p>
                ) : (
                  Object.entries(groupedPermissions).map(([module, perms]) => {
                    const allSelected = perms.every(p => formPermissions.includes(p.key));
                    const someSelected = perms.some(p => formPermissions.includes(p.key));
                    return (
                      <div key={module} className="bg-surface rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <button type="button" onClick={() => toggleModuleAll(perms)} className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary transition-colors">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allSelected ? 'bg-primary border-primary text-white' : someSelected ? 'bg-primary/30 border-primary' : 'border-border'}`}>
                              {allSelected && <Check size={10} />}
                            </div>
                            {module}
                          </button>
                          <span className="text-xs text-text-secondary">{perms.filter(p => formPermissions.includes(p.key)).length}/{perms.length}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {perms.map(perm => (
                            <label key={perm._id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-xs ${formPermissions.includes(perm.key) ? 'bg-primary/5 border-primary/20 text-primary' : 'border-transparent hover:bg-background text-text-secondary'}`}>
                              <input type="checkbox" checked={formPermissions.includes(perm.key)} onChange={() => togglePermission(perm.key)} className="sr-only" />
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${formPermissions.includes(perm.key) ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                                {formPermissions.includes(perm.key) && <Check size={8} />}
                              </div>
                              {perm.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {editing && isSuperAdminRole(editing) && (
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-gold text-sm">
              ★ The SUPER_ADMIN role has full system access and cannot be modified.
            </div>
          )}
        </form>
      </Modal>

      {/* Clone Modal */}
      <Modal
        isOpen={!!cloneTarget}
        onClose={() => setCloneTarget(null)}
        title={`Clone Role: ${cloneTarget?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setCloneTarget(null)} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium transition-colors">Cancel</button>
            <button onClick={handleClone} disabled={cloning} className="px-4 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 text-sm font-semibold transition-colors disabled:opacity-60">
              {cloning ? 'Cloning...' : 'Clone Role'}
            </button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleClone(); }}>
          <FormField label="New Role Name" name="cloneName" placeholder="e.g. SENIOR_RECEPTIONIST" value={cloneName} onChange={(e) => setCloneName(e.target.value)} required />
          <p className="text-xs text-text-secondary mt-2">All permissions from <strong>{cloneTarget?.name}</strong> will be copied to the new role.</p>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Role"
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
          Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.name}</strong>? Roles with assigned users cannot be deleted.
        </p>
      </Modal>
    </div>
  );
};

export default RolesPage;
