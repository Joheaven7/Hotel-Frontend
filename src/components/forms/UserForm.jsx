import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import FormField from '../ui/FormField';
import { Loader2, Check, RotateCcw, CheckSquare, Square } from 'lucide-react';

const STAFF_ROLES = ['STAFF', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'];

const DEPARTMENT_OPTIONS = [
  { value: 'Administration', label: 'Administration' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Front Desk', label: 'Front Desk' },
  { value: 'Housekeeping', label: 'Housekeeping' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Security', label: 'Security' },
];

const POSITION_BY_DEPARTMENT = {
  'Administration': ['Super Administrator', 'Hotel Manager', 'Assistant Manager'],
  'Finance': ['Accountant', 'Finance Officer', 'Junior Accountant'],
  'Human Resources': ['HR Specialist', 'HR Officer', 'HR Assistant'],
  'Front Desk': ['Receptionist', 'Desk Staff', 'Night Auditor'],
  'Housekeeping': ['Head Housekeeper', 'Cleaning Staff', 'Laundry Staff'],
  'Maintenance': ['Technician', 'Maintenance Staff', 'Electrician'],
  'Security': ['Security Supervisor', 'Security Guard'],
};

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
];

// ── Static Permission Matrix (matches backend PERMISSIONS constant) ────────
const PERMISSION_MODULES = [
  {
    module: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard' },
      { key: 'dashboard.analytics', label: 'View Analytics' },
      { key: 'dashboard.revenue', label: 'View Revenue' },
    ],
  },
  {
    module: 'Rooms',
    permissions: [
      { key: 'rooms.view', label: 'View' },
      { key: 'rooms.create', label: 'Create' },
      { key: 'rooms.edit', label: 'Edit' },
      { key: 'rooms.delete', label: 'Delete' },
    ],
  },
  {
    module: 'Halls',
    permissions: [
      { key: 'halls.view', label: 'View' },
      { key: 'halls.create', label: 'Create' },
      { key: 'halls.edit', label: 'Edit' },
      { key: 'halls.delete', label: 'Delete' },
    ],
  },
  {
    module: 'Reservations',
    permissions: [
      { key: 'reservations.view', label: 'View' },
      { key: 'reservations.create', label: 'Create' },
      { key: 'reservations.edit', label: 'Edit' },
      { key: 'reservations.cancel', label: 'Cancel' },
      { key: 'reservations.approve', label: 'Approve' },
    ],
  },
  {
    module: 'Payments',
    permissions: [
      { key: 'payments.view', label: 'View' },
      { key: 'payments.process', label: 'Process' },
      { key: 'payments.refund', label: 'Refund' },
      { key: 'payments.approve', label: 'Approve' },
    ],
  },
  {
    module: 'Payroll',
    permissions: [
      { key: 'payroll.view', label: 'View' },
      { key: 'payroll.create', label: 'Create' },
      { key: 'payroll.edit', label: 'Edit' },
      { key: 'payroll.delete', label: 'Delete' },
      { key: 'payroll.approve', label: 'Approve' },
    ],
  },
  {
    module: 'Users',
    permissions: [
      { key: 'users.view', label: 'View' },
      { key: 'users.create', label: 'Create' },
      { key: 'users.edit', label: 'Edit' },
      { key: 'users.delete', label: 'Delete' },
      { key: 'users.assignRoles', label: 'Assign Roles' },
      { key: 'users.managePermissions', label: 'Manage Permissions' },
    ],
  },
  {
    module: 'Maintenance',
    permissions: [
      { key: 'maintenance.view', label: 'View' },
      { key: 'maintenance.create', label: 'Create' },
      { key: 'maintenance.update', label: 'Update' },
      { key: 'maintenance.resolve', label: 'Resolve' },
    ],
  },
  {
    module: 'Complaints',
    permissions: [
      { key: 'complaints.view', label: 'View' },
      { key: 'complaints.edit', label: 'Edit' },
    ],
  },
  {
    module: 'Reports',
    permissions: [
      { key: 'reports.view', label: 'View' },
      { key: 'reports.export', label: 'Export' },
    ],
  },
  {
    module: 'Notifications',
    permissions: [
      { key: 'notifications.send', label: 'Send' },
      { key: 'notifications.manage', label: 'Manage' },
    ],
  },
  {
    module: 'Chat',
    permissions: [
      { key: 'chat.private', label: 'Private Chat' },
      { key: 'chat.department', label: 'Department Chat' },
      { key: 'chat.broadcast', label: 'Broadcast' },
    ],
  },
  {
    module: 'System',
    permissions: [
      { key: 'system.auditLogs', label: 'Audit Logs' },
      { key: 'system.restoreData', label: 'Restore Data' },
      { key: 'system.settings', label: 'System Settings' },
    ],
  },
];

// ── Default permissions per role (matches backend DEFAULT_ROLE_PERMISSIONS) ─
const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'dashboard.view', 'dashboard.analytics', 'dashboard.revenue',
    'rooms.view', 'rooms.create', 'rooms.edit', 'rooms.delete',
    'halls.view', 'halls.create', 'halls.edit', 'halls.delete',
    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel', 'reservations.approve',
    'payments.view', 'payments.process', 'payments.refund', 'payments.approve',
    'users.view', 'users.create', 'users.edit',
    'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.resolve',
    'complaints.view', 'complaints.edit',
    'reports.view', 'reports.export',
    'notifications.send', 'notifications.manage',
    'chat.private', 'chat.department', 'chat.broadcast',
  ],
  ACCOUNTANT: [
    'dashboard.view', 'dashboard.revenue',
    'payments.view', 'payments.process', 'payments.refund', 'payments.approve',
    'payroll.view', 'payroll.create', 'payroll.edit', 'payroll.approve',
    'reports.view', 'reports.export',
  ],
  STAFF: [
    'dashboard.view',
    'rooms.view',
    'halls.view',
    'reservations.view', 'reservations.create', 'reservations.edit',
    'maintenance.view', 'maintenance.create', 'maintenance.update',
    'complaints.view', 'complaints.edit',
    'chat.private', 'chat.department',
  ],
  CUSTOMER: [
    'reservations.view',
    'payments.view',
  ],
};

// Get all permission keys from all modules
const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key));

const UserForm = ({ user, onSuccess, onClose }) => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
    department: '',
    position: '',
    workDescription: '',
    baseSalary: '',
    hireDate: '',
    employmentStatus: 'ACTIVE',
    isActive: true,
    permissions: DEFAULT_ROLE_PERMISSIONS['CUSTOMER'] || [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'CUSTOMER',
        department: user.department || '',
        position: user.position || '',
        workDescription: user.workDescription || '',
        baseSalary: user.baseSalary || '',
        hireDate: user.hireDate ? user.hireDate.slice(0, 10) : '',
        employmentStatus: user.employmentStatus || 'ACTIVE',
        isActive: user.isActive !== false,
        permissions: user.permissions || [],
      });
    }
  }, [user]);

  // Auto-populate permissions from role defaults when role changes (only for new users)
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData((prev) => {
      const defaults = DEFAULT_ROLE_PERMISSIONS[newRole] || [];
      // For SUPER_ADMIN role, select all permissions
      const newPermissions = defaults.includes('*') ? [...ALL_PERMISSION_KEYS] : [...defaults];
      return { ...prev, role: newRole, permissions: newPermissions };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!user && !formData.password) errors.password = 'Password is required';
    if (formData.password?.length > 0 && formData.password.length < 6)
      errors.password = 'Min 6 characters';
    if (formData.password && formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    if (STAFF_ROLES.includes(formData.role)) {
      if (!formData.department?.trim()) errors.department = 'Department is required';
      if (!formData.position?.trim()) errors.position = 'Position is required';
      if (!formData.baseSalary || Number(formData.baseSalary) <= 0)
        errors.baseSalary = 'Valid salary required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  // ── Permission toggling ──────────────────────────────────────────────────
  const togglePermission = (key) => {
    setFormData((prev) => {
      const updated = prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions: updated };
    });
  };

  const selectAllModule = (modulePerms) => {
    setFormData((prev) => {
      const keys = modulePerms.map((p) => p.key);
      const merged = [...new Set([...prev.permissions, ...keys])];
      return { ...prev, permissions: merged };
    });
  };

  const clearAllModule = (modulePerms) => {
    setFormData((prev) => {
      const keys = new Set(modulePerms.map((p) => p.key));
      return { ...prev, permissions: prev.permissions.filter((p) => !keys.has(p)) };
    });
  };

  const resetPermissions = () => {
    const defaults = DEFAULT_ROLE_PERMISSIONS[formData.role] || [];
    const newPermissions = defaults.includes('*') ? [...ALL_PERMISSION_KEYS] : [...defaults];
    setFormData((prev) => ({ ...prev, permissions: newPermissions }));
    toast.success('Permissions reset to role defaults');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        username: formData.username || undefined,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (isSuperAdmin) {
        payload.permissions = formData.permissions;
      }

      if (STAFF_ROLES.includes(formData.role)) {
        payload.department = formData.department;
        payload.position = formData.position;
        payload.workDescription = formData.workDescription;
        payload.baseSalary = Number(formData.baseSalary);
        payload.employmentStatus = formData.employmentStatus;
        if (formData.hireDate) payload.hireDate = formData.hireDate;
      }

      if (formData.password) payload.password = formData.password;

      if (user) {
        await apiClient.patch(`/users/${user._id}`, payload);
        toast.success('User updated successfully');
      } else {
        payload.email = formData.email;
        payload.password = formData.password;
        await apiClient.post('/users', payload);
        toast.success('User created successfully');
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  // ── Role options — only the 4 fixed roles ────────────────────────────────
  const roleOptions = isSuperAdmin
    ? [
      { value: 'CUSTOMER', label: 'Customer / Guest' },
      { value: 'STAFF', label: 'Staff' },
      { value: 'ACCOUNTANT', label: 'Accountant' },
      { value: 'ADMIN', label: 'Administrator' },
      { value: 'SUPER_ADMIN', label: 'Super Admin' },
    ]
    : isAdmin
      ? [
        { value: 'CUSTOMER', label: 'Customer / Guest' },
        { value: 'STAFF', label: 'Staff' },
        { value: 'ACCOUNTANT', label: 'Accountant' },
      ]
      : [
        { value: 'CUSTOMER', label: 'Customer / Guest' },
        { value: 'STAFF', label: 'Staff' },
      ];

  const showStaffFields = STAFF_ROLES.includes(formData.role);
  const positionOptions = (POSITION_BY_DEPARTMENT[formData.department] || []).map(
    (p) => ({ value: p, label: p })
  );

  // Should we show the permission matrix?
  const showPermissions = isSuperAdmin;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" name="firstName" placeholder="John"
          value={formData.firstName} onChange={handleChange} error={formErrors.firstName} required />
        <FormField label="Last Name" name="lastName" placeholder="Doe"
          value={formData.lastName} onChange={handleChange} error={formErrors.lastName} required />
      </div>

      {/* Email — locked when editing */}
      <FormField label="Email" name="email" type="email" placeholder="john@hotel.com"
        value={formData.email} onChange={handleChange} error={formErrors.email}
        disabled={!!user} required />

      {/* Phone + Username side by side */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Phone" name="phone" type="tel" placeholder="+251 9XX XXX XXX"
          value={formData.phone} onChange={handleChange} />
        <FormField label="Username" name="username" placeholder="john.doe"
          value={formData.username} onChange={handleChange} />
      </div>

      {/* Department */}
      <FormField label="Department" name="department" type="select"
        options={DEPARTMENT_OPTIONS} placeholder="Select department"
        value={formData.department} onChange={handleChange}
        error={formErrors.department} required={showStaffFields} />

      {/* Role */}
      <FormField label="Role" name="role" type="select" value={formData.role}
        onChange={handleRoleChange} options={roleOptions} required />

      {/* ── Position & Employment Details — staff-level roles ── */}
      {showStaffFields && (
        <div className="p-4 rounded-xl bg-background border border-border space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Position & Employment Details
          </p>

          <FormField
            label="Position / Job Title" name="position"
            type={positionOptions.length > 0 ? 'select' : 'text'}
            options={positionOptions.length > 0 ? [{ value: '', label: 'Select position' }, ...positionOptions] : undefined}
            placeholder="e.g. Receptionist"
            value={formData.position} onChange={handleChange}
            error={formErrors.position} required />

          {/* Work Description */}
          <FormField label="Work Description / Responsibilities" name="workDescription"
            type="textarea" rows={2}
            placeholder="Brief description of specific duties..."
            value={formData.workDescription} onChange={handleChange} />

          {/* Salary + Hire Date side by side */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Base Salary (ETB)" name="baseSalary" type="number"
              placeholder="15000" min="0"
              value={formData.baseSalary} onChange={handleChange}
              error={formErrors.baseSalary} required />

            <FormField label="Hire Date" name="hireDate" type="date"
              value={formData.hireDate} onChange={handleChange} />
          </div>

          {/* Employment Status — shown when editing */}
          {user && (
            <FormField label="Employment Status" name="employmentStatus" type="select"
              options={EMPLOYMENT_STATUS_OPTIONS}
              value={formData.employmentStatus} onChange={handleChange} />
          )}
        </div>
      )}

      {/* Account Status toggle */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Account Status</h3>
        <div className={`p-3 rounded-xl border-2 mb-3 ${formData.isActive ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${formData.isActive ? 'bg-success' : 'bg-error'}`} />
            <p className={`font-semibold text-sm ${formData.isActive ? 'text-success' : 'text-error'}`}>
              {formData.isActive ? 'Active — User can log in' : 'Deactivated — Login blocked'}
            </p>
          </div>
        </div>
        <label className="flex items-center justify-between p-3 bg-background rounded-xl border border-border cursor-pointer hover:border-primary/40 transition-colors">
          <span className="text-sm font-medium text-text-primary">
            {formData.isActive ? 'Disable this account' : 'Enable this account'}
          </span>
          <div className="relative inline-flex items-center w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: formData.isActive ? '#10b981' : '#ef4444' }}>
            <input type="checkbox" name="isActive" checked={formData.isActive}
              onChange={handleChange} className="sr-only" />
            <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: formData.isActive ? 'translateX(22px)' : 'translateX(2px)' }} />
          </div>
        </label>
      </div>

      {/* ── Permission Matrix — SUPER_ADMIN only ── */}
      {showPermissions && (
        <div className="border-t border-border pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Permission Matrix</h3>
              <p className="text-xs text-text-secondary">
                Assign individual permissions for this user
              </p>
            </div>
            <button
              type="button"
              onClick={resetPermissions}
              className="flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 font-medium px-2.5 py-1.5 bg-warning/5 rounded-lg border border-warning/10 transition-all"
            >
              <RotateCcw size={12} /> Reset to Role Defaults
            </button>
          </div>

          <div className="bg-background rounded-xl border border-border p-4 max-h-[28rem] overflow-y-auto space-y-3">
            {PERMISSION_MODULES.map(({ module, permissions: perms }) => {
              const moduleKeys = perms.map((p) => p.key);
              const checkedCount = moduleKeys.filter((k) => formData.permissions.includes(k)).length;
              const allChecked = checkedCount === moduleKeys.length;

              return (
                <div key={module} className="bg-surface rounded-lg border border-border p-3">
                  {/* Module header with Select All / Clear All */}
                  <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
                    <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                      {module}
                      <span className="text-[10px] font-normal text-text-secondary bg-background px-1.5 py-0.5 rounded-full">
                        {checkedCount}/{moduleKeys.length}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllModule(perms)}
                        className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                          allChecked
                            ? 'text-text-secondary cursor-default'
                            : 'text-primary hover:bg-primary/5 cursor-pointer'
                        }`}
                        disabled={allChecked}
                      >
                        <CheckSquare size={10} /> All
                      </button>
                      <button
                        type="button"
                        onClick={() => clearAllModule(perms)}
                        className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                          checkedCount === 0
                            ? 'text-text-secondary cursor-default'
                            : 'text-error hover:bg-error/5 cursor-pointer'
                        }`}
                        disabled={checkedCount === 0}
                      >
                        <Square size={10} /> Clear
                      </button>
                    </div>
                  </div>

                  {/* Permission checkboxes */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {perms.map((perm) => {
                      const isChecked = formData.permissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-xs ${
                            isChecked
                              ? 'bg-primary/5 border-primary/20 text-primary'
                              : 'border-transparent hover:bg-background text-text-secondary'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.key)}
                            className="sr-only"
                          />
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-primary border-primary text-white'
                                : 'border-border'
                            }`}
                          >
                            {isChecked && <Check size={8} />}
                          </div>
                          <span className="truncate" title={perm.key}>
                            {perm.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Password */}
      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">
          {user ? 'Change Password (leave empty to keep current)' : 'Password'}
        </h3>
        <FormField label="Password" name="password" type="password"
          placeholder={user ? '••••••••' : 'Min. 6 characters'}
          value={formData.password} onChange={handleChange}
          error={formErrors.password} required={!user} />
        <FormField label="Confirm Password" name="confirmPassword" type="password"
          placeholder="••••••••"
          value={formData.confirmPassword} onChange={handleChange}
          error={formErrors.confirmPassword} required={!!formData.password} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onClose || onSuccess}
          className="px-5 py-2.5 bg-background hover:bg-border/30 text-text-primary border border-border rounded-xl text-sm font-semibold transition-all">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold transition-all shadow-soft disabled:opacity-60">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;