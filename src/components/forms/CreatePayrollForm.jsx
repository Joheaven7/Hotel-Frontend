import React, { useState, useEffect } from 'react';
import { Percent, ShieldAlert, Save, ArrowLeft, Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api';
import { useAuthStore } from '../../store/authStore'; // Assuming this is where your user session lives

const CreatePayrollForm = ({ onCancel, onSuccess, defaultMonth }) => {
    const { user: currentUser } = useAuthStore();

    const [month, setMonth] = useState(defaultMonth || new Date().toISOString().slice(0, 7));
    const [employeeList, setEmployeeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic states based on user action types
    const [baseSalaryMap, setBaseSalaryMap] = useState({});
    const [bonusMap, setBonusMap] = useState({});
    const [deductionsMap, setDeductionsMap] = useState({});
    const [payrollStatus, setPayrollStatus] = useState('DRAFT'); // DRAFT, PENDING_APPROVAL, APPROVED, PAID

    // Role verification helpers
    const isHR = currentUser?.role === 'HR';
    const isManagerOrSuperAdmin = ['MANAGER', 'SUPER_ADMIN'].includes(currentUser?.role);
    const isAccountant = currentUser?.role === 'ACCOUNTANT';

    useEffect(() => {
        fetchEligibleEmployeesAndLedger();
    }, [month]);

    const fetchEligibleEmployeesAndLedger = async () => {
        try {
            setLoading(true);

            // 1. Fetch existing ledger record for this month if it exists
            let existingLedger = null;
            try {
                const ledgerRes = await apiClient.get(`/payroll/monthly/${month}`);
                existingLedger = ledgerRes.data;
                setPayrollStatus(existingLedger.status || 'DRAFT');
            } catch (e) {
                // If 404, no ledger exists for this month yet. Fallback to DRAFT.
                setPayrollStatus('DRAFT');
            }

            // 2. Fetch all internal operations/corporate system users
            const response = await apiClient.get('/users?excludeRole=CUSTOMER&isActive=true');
            const employees = response.data.users || response.data || [];
            setEmployeeList(employees);

            // 3. Initialize state maps mapping user IDs to values
            const salaries = {};
            const bonuses = {};
            const deductions = {};

            employees.forEach(emp => {
                if (existingLedger) {
                    // Populate fields using historical compiled metrics
                    salaries[emp._id] = existingLedger.baseSalaryMap?.[emp._id] ?? emp.baseSalary ?? 0;
                    bonuses[emp._id] = existingLedger.bonusMap?.[emp._id] ?? 0;
                    deductions[emp._id] = existingLedger.deductionsMap?.[emp._id] ?? 0;
                } else {
                    // Fresh draft initialization
                    salaries[emp._id] = emp.baseSalary || 0;
                    bonuses[emp._id] = 0;
                    deductions[emp._id] = 0;
                }
            });

            setBaseSalaryMap(salaries);
            setBonusMap(bonuses);
            setDeductionsMap(deductions);
        } catch (err) {
            toast.error('Failed to orchestrate and parse active organization rosters.');
        } finally {
            setLoading(false);
        }
    };

    const handleNumericChange = (empId, field, value) => {
        // Validation: Prevent entry modifications if unauthorized or already lock-grouped
        if (!isHR || payrollStatus !== 'DRAFT') return;

        const numericValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);

        if (field === 'salary') {
            setBaseSalaryMap(prev => ({ ...prev, [empId]: numericValue }));
        } else if (field === 'bonus') {
            setBonusMap(prev => ({ ...prev, [empId]: numericValue }));
        } else {
            setDeductionsMap(prev => ({ ...prev, [empId]: numericValue }));
        }
    };

    const calculateNetPay = (empId) => {
        const base = baseSalaryMap[empId] || 0;
        const bonus = bonusMap[empId] || 0;
        const deduction = deductionsMap[empId] || 0;
        return base + bonus - deduction;
    };

    // ACTION: HR saves run configuration and submits to management queue
    const handleHRSubmit = async (e) => {
        e.preventDefault();
        if (!isHR) return;
        setSubmitting(true);
        const toastId = toast.loading('Saving and submitting ledger for verification...');

        try {
            await apiClient.post('/payroll/monthly/save', {
                month,
                baseSalaryMap,
                bonusMap,
                deductionsMap,
                status: 'PENDING_APPROVAL' // Advance state machine to management pipeline
            });
            toast.success('Ledger successfully compiled and queued for Approval.', { id: toastId });
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit payroll metrics.', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION: Manager / Super Admin Approves or Rejects
    const handleApprovalAction = async (decision) => {
        if (!isManagerOrSuperAdmin) return;
        setSubmitting(true);
        const toastId = toast.loading(`Processing layout registration status: ${decision}...`);

        try {
            await apiClient.post(`/payroll/monthly/review`, {
                month,
                status: decision // 'APPROVED' or 'DRAFT' (Sent back for edits)
            });
            toast.success(`Payroll ledger state flag set to: ${decision}`, { id: toastId });
            onSuccess();
        } catch (err) {
            toast.error('Failed to record matrix authentication decision.', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION: Accountant signs off payment disbursements
    const handleExecutePayment = async () => {
        if (!isAccountant) return;
        setSubmitting(true);
        const toastId = toast.loading('Authorizing bank wires and execution entries...');

        try {
            await apiClient.post(`/payroll/monthly/disburse`, { month });
            toast.success(`Disbursements verified. Period ${month} marked as PAID.`, { id: toastId });
            onSuccess();
        } catch (err) {
            toast.error('Financial runtime engine refused ledger balancing properties.', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-surface rounded-card border border-border p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm text-text-secondary font-medium">Assembling multi-role organizational hierarchy matrices...</p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
            {/* Header section code remains highly structured */}
            <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 hover:bg-border/60 rounded-lg text-text-secondary">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-text-primary">Corporate Payroll Control Room</h2>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wider ${payrollStatus === 'PAID' ? 'bg-success/20 text-success' :
                                    payrollStatus === 'APPROVED' ? 'bg-info/20 text-info' :
                                        payrollStatus === 'PENDING_APPROVAL' ? 'bg-warning/20 text-warning' : 'bg-muted text-text-secondary'
                                }`}>
                                {payrollStatus}
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary">Cross-department structural ledgers encompassing all roles & authentication bounds.</p>
                    </div>
                </div>

                <div className="w-44">
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Target Pay Period</label>
                    <input
                        type="month"
                        value={month}
                        disabled={payrollStatus !== 'DRAFT'}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-sm font-medium focus:outline-none bg-surface disabled:opacity-60"
                    />
                </div>
            </div>

            <form onSubmit={handleHRSubmit}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                                <th className="p-4">Staff</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 w-44">Base Salary ($)</th>
                                <th className="p-4 w-44">Bonus Amount ($)</th>
                                <th className="p-4 w-44">Deductions ($)</th>
                                <th className="p-4 text-right">Net Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {employeeList.map((emp) => (
                                <tr key={emp._id} className="hover:bg-muted/10 transition-colors">
                                    {/* Employee Profile Metadata */}
                                    <td className="p-4">
                                        <p className="font-semibold text-text-primary">{emp.firstName} {emp.lastName}</p>
                                        <p className="text-xs text-text-secondary">{emp.email}</p>
                                    </td>
                                    <td className="p-4 text-slate-600">{emp.department || 'N/A'}</td>
                                    <td className="p-4">
                                        <span className="text-xs font-mono px-2 py-1 bg-muted rounded border border-border text-text-primary">
                                            {emp.role}
                                        </span>
                                    </td>
                                    {/* Editable Fields Protected by HR Context Assertions */}
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={!isHR || payrollStatus !== 'DRAFT'}
                                            value={baseSalaryMap[emp._id] ?? ''}
                                            onChange={(e) => handleNumericChange(emp._id, 'salary', e.target.value)}
                                            className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-surface disabled:bg-muted/30 disabled:cursor-not-allowed font-medium text-text-primary"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="relative flex items-center">
                                            <Percent size={14} className="absolute left-3 text-success z-10" />
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={!isHR || payrollStatus !== 'DRAFT'}
                                                value={bonusMap[emp._id] ?? ''}
                                                onChange={(e) => handleNumericChange(emp._id, 'bonus', e.target.value)}
                                                className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm bg-surface disabled:bg-muted/30 disabled:cursor-not-allowed font-medium text-success"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="relative flex items-center">
                                            <ShieldAlert size={14} className="absolute left-3 text-error z-10" />
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={!isHR || payrollStatus !== 'DRAFT'}
                                                value={deductionsMap[emp._id] ?? ''}
                                                onChange={(e) => handleNumericChange(emp._id, 'deductions', e.target.value)}
                                                className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm bg-surface disabled:bg-muted/30 disabled:cursor-not-allowed font-medium text-error"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-text-primary text-base">
                                        ${calculateNetPay(emp._id).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-border bg-slate-50 grid gap-3 sm:grid-cols-3">
                    <div className="text-sm text-slate-700">
                        <p className="font-semibold">Approval</p>
                        <p className="text-xs text-slate-500">{payrollStatus}</p>
                    </div>
                    <div className="text-sm text-slate-700">
                        <p className="font-semibold">Paid</p>
                        <p className="text-xs text-slate-500">{payrollStatus === 'PAID' ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="text-sm text-slate-700">
                        <p className="font-semibold">Actions</p>
                        <p className="text-xs text-slate-500">Submit for approval is available in draft mode.</p>
                    </div>
                </div>

                {/* State Machine Action Toolbars */}
                <div className="p-4 bg-muted/10 border-t border-border flex items-center justify-between gap-3">
                    <p className="text-xs text-text-secondary italic">
                        Current Profile Role Authorization: <strong className="text-primary font-bold">{currentUser?.role}</strong>
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-semibold border border-border text-text-secondary hover:bg-muted rounded-xl transition-all"
                        >
                            Back
                        </button>

                        {/* HR Tooling: Save and Push to Queue */}
                        {isHR && payrollStatus === 'DRAFT' && (
                            <button
                                type="submit"
                                disabled={submitting || employeeList.length === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all shadow-soft text-sm disabled:opacity-50"
                            >
                                <Save size={16} />
                                Submit for Approval
                            </button>
                        )}

                        {/* Manager / Admin Tooling: Approve or Reject */}
                        {isManagerOrSuperAdmin && payrollStatus === 'PENDING_APPROVAL' && (
                            <>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => handleApprovalAction('DRAFT')}
                                    className="flex items-center gap-2 px-4 py-2 bg-error hover:bg-error/95 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    <XCircle size={16} />
                                    Reject (Send Back)
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => handleApprovalAction('APPROVED')}
                                    className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/95 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    <CheckCircle size={16} />
                                    Approve Ledger Run
                                </button>
                            </>
                        )}

                        {/* Accountant Tooling: Complete Run Execution */}
                        {isAccountant && payrollStatus === 'APPROVED' && (
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleExecutePayment}
                                className="flex items-center gap-2 px-5 py-2.5 bg-info hover:bg-info/95 text-white rounded-xl font-semibold text-sm transition-all shadow-soft"
                            >
                                <CreditCard size={16} />
                                Execute Wire Disbursals
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreatePayrollForm;