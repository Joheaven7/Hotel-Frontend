import React, { useState } from 'react';
import { Send, AlertTriangle, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import FormField from './ui/FormField';

const CATEGORIES = [
    { value: 'ROOM_SERVICE', label: '🛎  Room Service' },
    { value: 'MAINTENANCE', label: '🔧  Maintenance' },
    { value: 'HOUSEKEEPING', label: '🧹  Housekeeping' },
    { value: 'BILLING', label: '💳  Billing / Payment' },
    { value: 'STAFF_CONDUCT', label: '👤  Staff Conduct' },
    { value: 'FOOD', label: '🍽  Food & Beverage' },
    { value: 'NOISE', label: '🔊  Noise Complaint' },
    { value: 'EMERGENCY', label: '🚨  Emergency' },
    { value: 'COMPLIMENT', label: '⭐  Compliment / Praise' },
    { value: 'GENERAL', label: '💬  General Feedback' },
];

const ComplaintForm = ({ onSuccess, onClose, reservationId }) => {
    const [form, setForm] = useState({
        category: '',
        subject: '',
        description: '',
        priority: 'MEDIUM',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.category) e.category = 'Please select a category';
        if (!form.subject?.trim()) e.subject = 'Subject is required';
        if (!form.description?.trim()) e.description = 'Please describe your issue';
        if (form.description?.length > 2000) e.description = 'Max 2000 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const res = await apiClient.post('/complaints', {
                ...form,
                reservationId: reservationId || null,
            });
            setSubmitted(res.data.complaint);
            toast.success(`Ticket ${res.data.complaint.ticketNumber} submitted`);
            onSuccess?.();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    // Success screen
    if (submitted) {
        return (
            <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <Star size={28} className="text-success" />
                </div>
                <div>
                    <h3 className="font-bold text-text-primary text-lg">Thank you!</h3>
                    <p className="text-text-secondary text-sm mt-1">Your complaint has been received.</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-4 text-left">
                    <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-2">Ticket Details</p>
                    <p className="text-sm font-mono font-bold text-primary">{submitted.ticketNumber}</p>
                    <p className="text-xs text-text-secondary mt-1">We'll get back to you shortly. You can track progress in My Complaints.</p>
                </div>
                {onClose && (
                    <button onClick={onClose}
                        className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors">
                        Close
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
                label="Category" name="category" type="select"
                options={[{ value: '', label: 'Select a category...' }, ...CATEGORIES]}
                value={form.category} onChange={handleChange}
                error={errors.category} required
            />

            {form.category === 'EMERGENCY' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-error/5 border border-error/20 text-error text-sm font-medium">
                    <AlertTriangle size={16} />
                    Emergency tickets are automatically marked URGENT and prioritized immediately
                </div>
            )}

            {form.category !== 'EMERGENCY' && (
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { val: 'LOW', label: 'Low', color: 'border-border text-text-secondary' },
                            { val: 'MEDIUM', label: 'Medium', color: 'border-primary/30 text-primary' },
                            { val: 'HIGH', label: 'High', color: 'border-warning/30 text-warning' },
                        ].map(({ val, label, color }) => (
                            <label key={val} className={`flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${form.priority === val ? `${color} bg-primary/5` : 'border-border text-text-secondary hover:border-border/60'
                                }`}>
                                <input type="radio" name="priority" value={val}
                                    checked={form.priority === val} onChange={handleChange} className="sr-only" />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <FormField
                label="Subject" name="subject" placeholder="Brief summary of your issue"
                value={form.subject} onChange={handleChange}
                error={errors.subject} required
            />

            <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                    Description <span className="text-error">*</span>
                </label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Please describe your issue in detail..."
                    rows={4}
                    maxLength={2000}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-colors ${errors.description ? 'border-error' : 'border-border'
                        }`}
                />
                <div className="flex justify-between mt-1">
                    {errors.description
                        ? <p className="text-xs text-error">{errors.description}</p>
                        : <span />}
                    <span className="text-xs text-text-secondary">{form.description.length}/2000</span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                {onClose && (
                    <button type="button" onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-border rounded-btn text-sm font-medium text-text-primary hover:bg-background transition-colors">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-btn text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                    <Send size={15} />
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
            </div>
        </form>
    );
};

export default ComplaintForm;