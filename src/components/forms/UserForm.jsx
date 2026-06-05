import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import FormField from '../ui/FormField';
import { Loader2 } from 'lucide-react';

const STAFF_ROLES = ['STAFF', 'ACCOUNTANT', 'HR', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'];

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

const UserForm = ({ user, onSuccess, onClose }) => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role);
  const isManager = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser?.role);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
      });
    }
  }, [user]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive,
      };

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

  const roleOptions = isSuperAdmin
    ? [
      { value: 'CUSTOMER', label: 'Customer / Guest' },
      { value: 'STAFF', label: 'Staff' },
      { value: 'MANAGER', label: 'Manager' },
      { value: 'HR', label: 'HR Specialist' },
      { value: 'ACCOUNTANT', label: 'Accountant' },
      { value: 'ADMIN', label: 'Administrator' },
      { value: 'SUPER_ADMIN', label: 'Super Admin' },
    ]
    : isAdmin
      ? [
        { value: 'CUSTOMER', label: 'Customer / Guest' },
        { value: 'STAFF', label: 'Staff' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'HR', label: 'HR Specialist' },
        { value: 'ACCOUNTANT', label: 'Accountant' },
      ]
      : isManager
        ? [
          { value: 'CUSTOMER', label: 'Customer / Guest' },
          { value: 'STAFF', label: 'Staff' },
        ]
        : [
          { value: 'CUSTOMER', label: 'Customer / Guest' },
          { value: 'STAFF', label: 'Staff' },
        ];

  const showStaffFields = STAFF_ROLES.includes(formData.role);
  const positionOptions = (POSITION_BY_DEPARTMENT[formData.department] || []).map(
    (p) => ({ value: p, label: p })
  );

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

      {/* Phone */}
      <FormField label="Phone" name="phone" type="tel" placeholder="+251 9XX XXX XXX"
        value={formData.phone} onChange={handleChange} />

      {/* Role */}
      <FormField label="Role" name="role" type="select" value={formData.role}
        onChange={handleChange} options={roleOptions} required />

      {/* ── Employment Details — staff-level roles ── */}
      {showStaffFields && (
        <div className="p-4 rounded-xl bg-background border border-border space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Employment Details
          </p>

          {/* Department + Position side by side */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department" name="department" type="select"
              options={DEPARTMENT_OPTIONS} placeholder="Select department"
              value={formData.department} onChange={handleChange}
              error={formErrors.department} required />

            <FormField
              label="Position / Job Title" name="position"
              type={positionOptions.length > 0 ? 'select' : 'text'}
              options={positionOptions.length > 0 ? [{ value: '', label: 'Select position' }, ...positionOptions] : undefined}
              placeholder="e.g. Receptionist"
              value={formData.position} onChange={handleChange}
              error={formErrors.position} required />
          </div>

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