import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare, AlertTriangle, CheckCircle, Clock,
    ChevronDown, ChevronUp, Send, User, Shield,
    RefreshCw, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import { onSocketEvent, offSocketEvent } from '../services/socket';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';

const PRIORITY_STYLES = {
    LOW: 'bg-text-secondary/10 text-text-secondary border-border',
    MEDIUM: 'bg-primary/10 text-primary border-primary/20',
    HIGH: 'bg-warning/10 text-warning border-warning/20',
    URGENT: 'bg-error/10 text-error border-error/20 animate-pulse',
};

const CATEGORY_ICONS = {
    EMERGENCY: '🚨',
    MAINTENANCE: '🔧',
    ROOM_SERVICE: '🛎',
    HOUSEKEEPING: '🧹',
    BILLING: '💳',
    STAFF_CONDUCT: '👤',
    FOOD: '🍽',
    NOISE: '🔊',
    COMPLIMENT: '⭐',
    GENERAL: '💬',
};

const ComplaintsPage = () => {
    const { user } = useAuthStore();
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'].includes(user?.role);

    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [replying, setReplying] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [newCount, setNewCount] = useState(0);

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterCat) params.category = filterCat;
            const res = await apiClient.get('/complaints', { params });
            setComplaints(res.data.complaints || []);
        } catch {
            toast.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterCat]);

    const fetchStats = useCallback(async () => {
        if (!isStaff) return;
        try {
            const res = await apiClient.get('/complaints/stats');
            setStats(res.data);
        } catch { }
    }, [isStaff]);

    useEffect(() => {
        fetchComplaints();
        fetchStats();
    }, [fetchComplaints, fetchStats]);

    // Real-time socket
    useEffect(() => {
        const handleNew = (data) => {
            setNewCount((p) => p + 1);
            toast(`🎫 New ${data.complaint.category.replace('_', ' ')} complaint from ${data.submittedBy}`, {
                duration: 6000,
                icon: data.isUrgent ? '🚨' : '📋',
            });
            fetchComplaints();
        };
        const handleUpdated = () => fetchComplaints();
        const handleReply = (data) => {
            toast(`💬 Customer replied on ticket ${data.ticketNumber}`, { duration: 4000 });
            fetchComplaints();
        };

        onSocketEvent('complaint:new', handleNew);
        onSocketEvent('complaint:updated', handleUpdated);
        onSocketEvent('complaint:customerReply', handleReply);

        return () => {
            offSocketEvent('complaint:new', handleNew);
            offSocketEvent('complaint:updated', handleUpdated);
            offSocketEvent('complaint:customerReply', handleReply);
        };
    }, []);

    const handleExpand = (id) => {
        setExpanded((p) => p === id ? null : id);
        setReplyText('');
        setIsInternal(false);
        setNewCount(0);
    };

    const handleStatusChange = async (id, status) => {
        try {
            await apiClient.patch(`/complaints/${id}`, { status });
            toast.success(`Marked as ${status.replace('_', ' ').toLowerCase()}`);
            fetchComplaints();
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleAssign = async (id) => {
        try {
            await apiClient.patch(`/complaints/${id}`, { assignedTo: user._id });
            toast.success('Assigned to you');
            fetchComplaints();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign');
        }
    };

    const handleReply = async (complaintId) => {
        if (!replyText.trim()) { toast.error('Message cannot be empty'); return; }
        setReplying(true);
        try {
            await apiClient.post(`/complaints/${complaintId}/respond`, {
                message: replyText.trim(),
                isInternal: isInternal,
            });
            toast.success(isInternal ? 'Internal note added' : 'Reply sent to customer');
            setReplyText('');
            setIsInternal(false);
            fetchComplaints();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const openCount = complaints.filter((c) => c.status === 'OPEN').length;
    const urgentCount = complaints.filter((c) => c.priority === 'URGENT').length;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={isStaff ? 'Complaints & Feedback' : 'My Complaints'}
                subtitle={isStaff ? 'Manage guest feedback, complaints and support tickets' : 'Track your submitted complaints and get updates'}
                breadcrumbs={[{ label: 'Home' }, { label: 'Complaints' }]}
                action={
                    <button onClick={() => { fetchComplaints(); fetchStats(); setNewCount(0); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft">
                        <RefreshCw size={16} /> Refresh
                        {newCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-primary text-xs font-bold">{newCount}</span>
                        )}
                    </button>
                }
            />

            {/* Staff stats bar */}
            {isStaff && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Open', value: stats.byStatus?.find((s) => s._id === 'OPEN')?.count || 0, color: 'border-t-error' },
                        { label: 'In Progress', value: stats.byStatus?.find((s) => s._id === 'IN_PROGRESS')?.count || 0, color: 'border-t-warning' },
                        { label: 'Resolved', value: stats.byStatus?.find((s) => s._id === 'RESOLVED')?.count || 0, color: 'border-t-success' },
                        { label: 'Avg Rating', value: stats.avgRating ? `${Number(stats.avgRating).toFixed(1)} ⭐` : '—', color: 'border-t-primary' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className={`bg-white rounded-card shadow-soft p-4 border border-border border-t-4 ${color}`}>
                            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide">{label}</p>
                            <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters — staff only */}
            {isStaff && (
                <div className="flex flex-wrap gap-3 bg-surface rounded-card border border-border p-4 shadow-soft">
                    <select
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">All Statuses</option>
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <select
                        value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">All Categories</option>
                        {['EMERGENCY', 'MAINTENANCE', 'ROOM_SERVICE', 'HOUSEKEEPING', 'BILLING', 'STAFF_CONDUCT', 'FOOD', 'NOISE', 'COMPLIMENT', 'GENERAL'].map((c) => (
                            <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.replace('_', ' ')}</option>
                        ))}
                    </select>
                    {(filterStatus || filterCat) && (
                        <button
                            onClick={() => { setFilterStatus(''); setFilterCat(''); }}
                            className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                    {urgentCount > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-2 bg-error/10 text-error border border-error/20 rounded-lg text-sm font-semibold">
                            <AlertTriangle size={14} /> {urgentCount} URGENT
                        </span>
                    )}
                </div>
            )}

            {/* Complaints list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : complaints.length === 0 ? (
                <div className="bg-white rounded-card border border-border shadow-soft p-12 text-center">
                    <MessageSquare size={48} className="mx-auto mb-4 text-text-secondary opacity-30" />
                    <p className="text-text-secondary font-medium">No complaints found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {complaints.map((c) => (
                        <div key={c._id} className={`bg-white rounded-card border shadow-soft overflow-hidden transition-all ${c.priority === 'URGENT' ? 'border-error/40' : 'border-border'
                            }`}>
                            {/* Complaint header */}
                            <div
                                className="p-5 cursor-pointer hover:bg-background/50 transition-colors"
                                onClick={() => handleExpand(c._id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <span className="text-2xl shrink-0 mt-0.5">
                                            {CATEGORY_ICONS[c.category] || '💬'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-mono text-xs text-text-secondary bg-background px-2 py-0.5 rounded border border-border">
                                                    {c.ticketNumber}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[c.priority]}`}>
                                                    {c.priority}
                                                </span>
                                                <StatusBadge type={c.status?.toLowerCase()} />
                                                {c.responses?.length > 0 && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                                                        {c.responses.filter((r) => !r.isInternal).length} message{c.responses.filter((r) => !r.isInternal).length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-text-primary mb-0.5">{c.subject}</h3>
                                            <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                                                {isStaff && (
                                                    <span className="flex items-center gap-1">
                                                        <User size={11} />
                                                        {c.submittedBy?.firstName} {c.submittedBy?.lastName}
                                                    </span>
                                                )}
                                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                                {c.assignedTo && (
                                                    <span className="flex items-center gap-1 text-primary">
                                                        <Shield size={11} />
                                                        {c.assignedTo.firstName} {c.assignedTo.lastName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Quick actions — staff only */}
                                        {isStaff && (
                                            <div className="flex gap-1">
                                                {c.status === 'OPEN' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAssign(c._id); }}
                                                        className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                    >
                                                        Assign me
                                                    </button>
                                                )}
                                                {c.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(c._id, 'RESOLVED'); }}
                                                        className="px-2 py-1 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {expanded === c._id ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded body */}
                            {expanded === c._id && (
                                <div className="border-t border-border">
                                    {/* Description */}
                                    <div className="px-5 py-4 bg-background/50">
                                        <p className="text-sm text-text-primary leading-relaxed">{c.description}</p>
                                        {c.reservationId && (
                                            <p className="text-xs text-text-secondary mt-2">
                                                Reservation: <span className="font-medium">{c.reservationId.reservationNumber}</span>
                                            </p>
                                        )}
                                        {c.satisfactionRating && (
                                            <div className="mt-3 p-3 rounded-xl bg-success/5 border border-success/20">
                                                <p className="text-xs font-semibold text-success">
                                                    Customer rated: {'⭐'.repeat(c.satisfactionRating)} ({c.satisfactionRating}/5)
                                                </p>
                                                {c.satisfactionComment && (
                                                    <p className="text-xs text-text-secondary mt-1">"{c.satisfactionComment}"</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Thread */}
                                    {c.responses?.filter((r) => !r.isInternal || isStaff).length > 0 && (
                                        <div className="px-5 py-4 space-y-3 border-t border-border/50">
                                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Thread</p>
                                            {c.responses
                                                .filter((r) => !r.isInternal || isStaff)
                                                .map((r, idx) => (
                                                    <div key={idx} className={`flex gap-3 ${r.isInternal ? 'opacity-70' : ''}`}>
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${r.respondedBy?._id === c.submittedBy?._id
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-primary/10 text-primary'
                                                            }`}>
                                                            {r.respondedBy?.firstName?.charAt(0) || '?'}
                                                        </div>
                                                        <div className={`flex-1 p-3 rounded-xl text-sm ${r.isInternal
                                                            ? 'bg-warning/5 border border-warning/20'
                                                            : 'bg-background border border-border'
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-text-primary text-xs">
                                                                    {r.respondedBy?.firstName} {r.respondedBy?.lastName}
                                                                </span>
                                                                <span className="text-text-secondary text-[10px]">
                                                                    {r.respondedBy?.role}
                                                                </span>
                                                                {r.isInternal && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-warning/20 text-warning rounded font-medium">
                                                                        Internal Note
                                                                    </span>
                                                                )}
                                                                <span className="text-text-secondary text-[10px] ml-auto">
                                                                    {new Date(r.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-text-primary leading-relaxed">{r.message}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    {/* Reply box — not for CLOSED complaints */}
                                    {c.status !== 'CLOSED' && (
                                        <div className="px-5 py-4 border-t border-border/50">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder={isStaff ? 'Reply to customer or add internal note...' : 'Add a message...'}
                                                rows={3}
                                                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                            />
                                            <div className="flex items-center justify-between mt-2 gap-3">
                                                {isStaff && (
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isInternal}
                                                            onChange={(e) => setIsInternal(e.target.checked)}
                                                            className="rounded border-border"
                                                        />
                                                        <span className="text-xs text-text-secondary font-medium">
                                                            Internal note (not visible to customer)
                                                        </span>
                                                    </label>
                                                )}
                                                <div className="flex gap-2 ml-auto">
                                                    {isStaff && c.status !== 'RESOLVED' && (
                                                        <button
                                                            onClick={() => handleStatusChange(c._id, 'RESOLVED')}
                                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-success/10 text-success hover:bg-success/20 transition-colors"
                                                        >
                                                            <CheckCircle size={13} /> Mark Resolved
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleReply(c._id)}
                                                        disabled={replying || !replyText.trim()}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                                                    >
                                                        <Send size={13} />
                                                        {replying ? 'Sending...' : isInternal ? 'Add Note' : 'Send Reply'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComplaintsPage;