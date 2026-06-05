import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, Lock, Eye, EyeOff,
    Camera, Save, Shield, CalendarDays, Briefcase,
    Star, Award, CreditCard, CheckCircle,
    AlertCircle, Loader2, Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

// ── Role display config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
    SUPER_ADMIN: { label: 'Super Administrator', color: 'bg-error/10 text-error border-error/20' },
    ADMIN: { label: 'Administrator', color: 'bg-primary/10 text-primary border-primary/20' },
    MANAGER: { label: 'Manager', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    HR: { label: 'HR Specialist', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    ACCOUNTANT: { label: 'Accountant', color: 'bg-success/10 text-success border-success/20' },
    STAFF: { label: 'Staff', color: 'bg-warning/10 text-warning border-warning/20' },
    CUSTOMER: { label: 'Guest', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'HR', 'ACCOUNTANT', 'STAFF'];

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-card border border-border shadow-soft overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background/50">
            <div className="p-2 rounded-lg bg-primary/10">
                <Icon size={16} className="text-primary" />
            </div>
            <h3 className="font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ── Input field ────────────────────────────────────────────────────────────────
const Field = ({ label, name, type = 'text', value, onChange, error, disabled, placeholder, children }) => (
    <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">{label}</label>
        {children || (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${disabled
                    ? 'bg-background text-text-secondary cursor-not-allowed border-border'
                    : error
                        ? 'border-error bg-error/5 focus:ring-error/20'
                        : 'border-border bg-white focus:border-primary'
                    }`}
            />
        )}
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = () => {
    const { user, setAuth, token } = useAuthStore();
    const fileInputRef = useRef(null);

    // ── Personal info form ───────────────────────────────────────────────────
    const [info, setInfo] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [infoErrors, setInfoErrors] = useState({});
    const [savingInfo, setSavingInfo] = useState(false);
    const [infoSaved, setInfoSaved] = useState(false);

    // ── Password form ────────────────────────────────────────────────────────
    const [pwd, setPwd] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [pwdErrors, setPwdErrors] = useState({});
    const [savingPwd, setSavingPwd] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ── Avatar ───────────────────────────────────────────────────────────────
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // ── Stats (customer loyalty / staff info) ────────────────────────────────
    const [stats, setStats] = useState(null);

    // ── Populate form from store ─────────────────────────────────────────────
    useEffect(() => {
        if (user) {
            setInfo({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
            });
            setAvatarUrl(user.avatar || null);
        }
    }, [user]);

    // ── Load stats ───────────────────────────────────────────────────────────
    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await apiClient.get('/dashboards');
                setStats(res.data);
            } catch { }
        };
        loadStats();
    }, []);

    // ── Avatar upload ─────────────────────────────────────────────────────────
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB');
            return;
        }

        // Preview immediately
        const objectUrl = URL.createObjectURL(file);
        setAvatarUrl(objectUrl);

        setUploadingAvatar(true);
        const toastId = toast.loading('Uploading photo...');
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await apiClient.post('/upload/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newUrl = res.data.avatarUrl;
            setAvatarUrl(newUrl);
            // Update store
            const updatedUser = { ...user, avatar: newUrl };
            setAuth(token, updatedUser);
            toast.success('Profile photo updated', { id: toastId });
        } catch (err) {
            // Revert preview on failure
            setAvatarUrl(user?.avatar || null);
            toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── Save personal info ────────────────────────────────────────────────────
    const validateInfo = () => {
        const e = {};
        if (!info.firstName?.trim()) e.firstName = 'First name is required';
        if (!info.lastName?.trim()) e.lastName = 'Last name is required';
        setInfoErrors(e);
        return Object.keys(e).length === 0;
    };

    const getUserId = () => user?.id || user?._id;

    const handleSaveInfo = async () => {
        if (!validateInfo()) return;
        const userId = getUserId();
        if (!userId) {
            toast.error('Unable to update profile. Please sign in again.');
            return;
        }

        setSavingInfo(true);
        try {
            const res = await apiClient.patch(`/users/${userId}`, {
                firstName: info.firstName.trim(),
                lastName: info.lastName.trim(),
                phone: info.phone.trim(),
            });
            const updated = res.data.user;
            setAuth(token, { ...user, ...updated });
            setInfoSaved(true);
            setTimeout(() => setInfoSaved(false), 3000);
            toast.success('Profile updated');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingInfo(false);
        }
    };

    // ── Change password ───────────────────────────────────────────────────────
    const validatePwd = () => {
        const e = {};
        if (!pwd.currentPassword) e.currentPassword = 'Current password is required';
        if (!pwd.newPassword) e.newPassword = 'New password is required';
        if (pwd.newPassword.length < 6) e.newPassword = 'Minimum 6 characters';
        if (pwd.newPassword === pwd.currentPassword)
            e.newPassword = 'New password must differ from current';
        if (pwd.newPassword !== pwd.confirmPassword)
            e.confirmPassword = 'Passwords do not match';
        setPwdErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSavePwd = async () => {
        if (!validatePwd()) return;
        const userId = getUserId();
        if (!userId) {
            toast.error('Unable to update password. Please sign in again.');
            return;
        }

        setSavingPwd(true);
        try {
            await apiClient.patch(`/users/${userId}`, {
                currentPassword: pwd.currentPassword,
                password: pwd.newPassword,
            });
            setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPwdErrors({});
            toast.success('Password changed successfully');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to change password';
            if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
                setPwdErrors({ currentPassword: 'Current password is incorrect' });
            } else {
                toast.error(msg);
            }
        } finally {
            setSavingPwd(false);
        }
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const roleConfig = ROLE_CONFIG[user?.role] || { label: user?.role, color: 'bg-gray-100 text-gray-700' };
    const isStaff = STAFF_ROLES.includes(user?.role);
    const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` || 'U';

    // Customer loyalty tier
    const totalRes = stats?.totalReservations || 0;
    const tier = totalRes >= 10 ? 'Platinum' : totalRes >= 5 ? 'Gold' : totalRes >= 2 ? 'Silver' : 'Member';
    const tierColors = {
        Platinum: 'text-purple-600 bg-purple-50 border-purple-200',
        Gold: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        Silver: 'text-gray-600 bg-gray-50 border-gray-200',
        Member: 'text-primary bg-primary/5 border-primary/20',
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in pb-10 relative z-0 bg-transparent">

            {/* ── Hero card ── */}
            <div className="bg-white rounded-card border border-border shadow-soft overflow-hidden">
                {/* Cover band */}
                <div className="h-24 bg-gradient-to-r from-primary to-primary/70" />

                <div className="px-6 pb-6">
                    {/* Avatar row */}
                    <div className="flex items-end justify-between -mt-12 mb-4">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-soft overflow-hidden bg-primary/10 flex items-center justify-center">
                                {uploadingAvatar ? (
                                    <Loader2 size={28} className="text-primary animate-spin" />
                                ) : avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarUrl(null)}
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-primary">{initials}</span>
                                )}
                            </div>

                            {/* Camera button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-60"
                                title="Change photo"
                            >
                                <Camera size={14} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarChange}
                                className="sr-only"
                            />
                        </div>

                        {/* Role badge */}
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${roleConfig.color}`}>
                            {roleConfig.label}
                        </span>
                    </div>

                    {/* Name + meta */}
                    <h2 className="text-xl font-bold text-text-primary">
                        {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-text-secondary text-sm mt-0.5">{user?.email}</p>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-secondary">
                        {user?.employeeId && (
                            <span className="flex items-center gap-1.5 font-mono bg-background px-2.5 py-1 rounded-lg border border-border">
                                <Shield size={11} className="text-primary" />
                                {user.employeeId}
                            </span>
                        )}
                        {user?.department && (
                            <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border">
                                <Briefcase size={11} className="text-primary" />
                                {user.department}
                                {user.position ? ` · ${user.position}` : ''}
                            </span>
                        )}
                        {user?.hireDate && (
                            <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border">
                                <CalendarDays size={11} className="text-primary" />
                                Since {new Date(user.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                            </span>
                        )}
                        {user?.lastLoginAt && (
                            <span className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border">
                                <CheckCircle size={11} className="text-success" />
                                Last login {new Date(user.lastLoginAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats row ── */}
            {user?.role === 'CUSTOMER' && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Loyalty Tier',
                            value: tier,
                            icon: Award,
                            color: tierColors[tier],
                        },
                        {
                            label: 'Total Stays',
                            value: stats.totalReservations || 0,
                            icon: CalendarDays,
                            color: 'text-primary bg-primary/5 border-primary/20',
                        },
                        {
                            label: 'Loyalty Points',
                            value: ((stats.totalPayments || 0) * 10).toLocaleString(),
                            icon: Star,
                            color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                        },
                        {
                            label: 'Payments',
                            value: stats.totalPayments || 0,
                            icon: CreditCard,
                            color: 'text-success bg-success/5 border-success/20',
                        },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className={`rounded-card border p-4 text-center ${color}`}>
                            <Icon size={20} className="mx-auto mb-1.5 opacity-70" />
                            <p className="text-xl font-bold">{value}</p>
                            <p className="text-xs mt-0.5 opacity-70 font-medium">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {isStaff && user?.workDescription && (
                <div className="bg-white rounded-card border border-border shadow-soft p-5">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                        Work Description
                    </p>
                    <p className="text-sm text-text-primary leading-relaxed">{user.workDescription}</p>
                </div>
            )}

            {/* ── Personal info ── */}
            <Section title="Personal Information" icon={User}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="First Name"
                            name="firstName"
                            placeholder="John"
                            value={info.firstName}
                            onChange={(e) => { setInfo((p) => ({ ...p, firstName: e.target.value })); setInfoErrors((p) => ({ ...p, firstName: '' })); }}
                            error={infoErrors.firstName}
                        />
                        <Field
                            label="Last Name"
                            name="lastName"
                            placeholder="Doe"
                            value={info.lastName}
                            onChange={(e) => { setInfo((p) => ({ ...p, lastName: e.target.value })); setInfoErrors((p) => ({ ...p, lastName: '' })); }}
                            error={infoErrors.lastName}
                        />
                    </div>

                    <Field
                        label="Email Address"
                        name="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                    >
                        <div className="relative">
                            <Mail size={15} className="absolute left-3 top-3 text-text-secondary" />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background text-text-secondary cursor-not-allowed"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-success flex items-center gap-1">
                                <CheckCircle size={11} /> Verified
                            </span>
                        </div>
                    </Field>

                    <Field label="Phone Number" name="phone" type="tel" placeholder="+251 9XX XXX XXX"
                        value={info.phone}
                        onChange={(e) => setInfo((p) => ({ ...p, phone: e.target.value }))}
                    />

                    {/* Read-only employment fields */}
                    {isStaff && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                            {[
                                { label: 'Employee ID', value: user?.employeeId },
                                { label: 'Department', value: user?.department },
                                { label: 'Position', value: user?.position },
                                { label: 'Base Salary', value: user?.baseSalary ? `ETB ${user.baseSalary.toLocaleString()}` : null },
                                { label: 'Hire Date', value: user?.hireDate ? new Date(user.hireDate).toLocaleDateString() : null },
                                { label: 'Employment', value: user?.employmentStatus },
                            ].filter((f) => f.value).map(({ label, value }) => (
                                <Field key={label} label={label} disabled value={value || ''} />
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        {infoSaved && (
                            <span className="flex items-center gap-1.5 text-success text-sm font-medium">
                                <CheckCircle size={15} /> Saved
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSaveInfo}
                            disabled={savingInfo}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-soft disabled:opacity-60"
                        >
                            {savingInfo
                                ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                : <><Save size={15} /> Save Changes</>
                            }
                        </button>
                    </div>
                </div>
            </Section>

            {/* ── Change password ── */}
            <Section title="Change Password" icon={Lock}>
                <div className="space-y-4">
                    {/* Current password */}
                    <Field
                        label="Current Password"
                        name="currentPassword"
                        error={pwdErrors.currentPassword}
                    >
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                name="currentPassword"
                                value={pwd.currentPassword}
                                onChange={(e) => { setPwd((p) => ({ ...p, currentPassword: e.target.value })); setPwdErrors((p) => ({ ...p, currentPassword: '' })); }}
                                placeholder="Your current password"
                                className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${pwdErrors.currentPassword ? 'border-error bg-error/5' : 'border-border'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((p) => !p)}
                                className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
                            >
                                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {pwdErrors.currentPassword && (
                            <p className="mt-1 text-xs text-error">{pwdErrors.currentPassword}</p>
                        )}
                    </Field>

                    {/* New password */}
                    <Field label="New Password" error={pwdErrors.newPassword}>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={pwd.newPassword}
                                onChange={(e) => { setPwd((p) => ({ ...p, newPassword: e.target.value })); setPwdErrors((p) => ({ ...p, newPassword: '' })); }}
                                placeholder="Minimum 6 characters"
                                className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${pwdErrors.newPassword ? 'border-error bg-error/5' : 'border-border'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew((p) => !p)}
                                className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
                            >
                                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {pwdErrors.newPassword && (
                            <p className="mt-1 text-xs text-error">{pwdErrors.newPassword}</p>
                        )}
                    </Field>

                    {/* Password strength indicator */}
                    {pwd.newPassword && (
                        <PasswordStrength password={pwd.newPassword} />
                    )}

                    {/* Confirm password */}
                    <Field label="Confirm New Password" error={pwdErrors.confirmPassword}>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={pwd.confirmPassword}
                                onChange={(e) => { setPwd((p) => ({ ...p, confirmPassword: e.target.value })); setPwdErrors((p) => ({ ...p, confirmPassword: '' })); }}
                                placeholder="Re-enter new password"
                                className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${pwdErrors.confirmPassword ? 'border-error bg-error/5' : 'border-border'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((p) => !p)}
                                className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
                            >
                                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            {pwd.confirmPassword && pwd.newPassword === pwd.confirmPassword && (
                                <CheckCircle size={15} className="absolute right-10 top-3 text-success" />
                            )}
                        </div>
                        {pwdErrors.confirmPassword && (
                            <p className="mt-1 text-xs text-error">{pwdErrors.confirmPassword}</p>
                        )}
                    </Field>

                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            onClick={handleSavePwd}
                            disabled={savingPwd || !pwd.currentPassword || !pwd.newPassword || !pwd.confirmPassword}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-soft disabled:opacity-50"
                        >
                            {savingPwd
                                ? <><Loader2 size={15} className="animate-spin" /> Updating...</>
                                : <><Lock size={15} /> Update Password</>
                            }
                        </button>
                    </div>
                </div>
            </Section>

            {/* ── Account info (read-only) ── */}
            <Section title="Account Information" icon={Shield}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        {
                            label: 'Account Status', value: user?.isActive ? 'Active' : 'Deactivated',
                            badge: user?.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'
                        },
                        { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                        { label: 'Last Login', value: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A' },
                        { label: 'Role', value: ROLE_CONFIG[user?.role]?.label || user?.role || 'N/A' },
                    ].map(({ label, value, badge }) => (
                        <div key={label} className="p-4 rounded-xl bg-background border border-border">
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1.5">{label}</p>
                            {badge ? (
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badge}`}>{value}</span>
                            ) : (
                                <p className="text-sm font-semibold text-text-primary">{value}</p>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

        </div>
    );
};

// ── Password strength meter ────────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
    const checks = [
        { label: '6+ characters', pass: password.length >= 6 },
        { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
        { label: 'Number', pass: /\d/.test(password) },
        { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = checks.filter((c) => c.pass).length;
    const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const colors = ['bg-error', 'bg-error', 'bg-warning', 'bg-success', 'bg-success'];
    const textCol = ['text-error', 'text-error', 'text-warning', 'text-success', 'text-success'];

    return (
        <div className="space-y-2">
            {/* Bar */}
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all ${i < score ? colors[score] : 'bg-border'
                            }`}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <p className={`text-xs font-medium ${textCol[score]}`}>{labels[score]}</p>
                <div className="flex gap-3">
                    {checks.map((c) => (
                        <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.pass ? 'text-success' : 'text-text-secondary'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.pass ? 'bg-success' : 'bg-border'}`} />
                            {c.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;