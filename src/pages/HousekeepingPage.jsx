import React, { useState, useEffect, useCallback } from 'react';
import {
    Sparkles, ShieldAlert, Clock, CheckCircle2,
    RefreshCw, BedDouble, Search, X, Filter,
    WifiOff, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import { onSocketEvent, offSocketEvent } from '../services/socket';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
    CLEAN: {
        label: 'Clean',
        color: 'bg-success/10 text-success border-success/30',
        dot: 'bg-success',
        badge: 'bg-success text-white',
        icon: CheckCircle2,
    },
    DIRTY: {
        label: 'Needs Cleaning',
        color: 'bg-error/10 text-error border-error/30',
        dot: 'bg-error',
        badge: 'bg-error text-white',
        icon: ShieldAlert,
    },
    IN_PROGRESS: {
        label: 'Being Cleaned',
        color: 'bg-warning/10 text-warning border-warning/30',
        dot: 'bg-warning',
        badge: 'bg-warning text-white',
        icon: Sparkles,
    },
    INSPECTING: {
        label: 'Under Inspection',
        color: 'bg-primary/10 text-primary border-primary/30',
        dot: 'bg-primary',
        badge: 'bg-primary text-white',
        icon: Clock,
    },
};

// Priority order for display (DIRTY first, then IN_PROGRESS, etc.)
const PRIORITY_ORDER = ['DIRTY', 'IN_PROGRESS', 'INSPECTING', 'CLEAN'];

// ── Main Component ────────────────────────────────────────────────────────────
const HousekeepingPage = () => {
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL | DIRTY | IN_PROGRESS | CLEAN | INSPECTING
    const [updating, setUpdating] = useState(null); // roomId being updated
    const [lastRefresh, setLastRefresh] = useState(null);
    const [offline, setOffline] = useState(false);
    const [checkouts, setCheckouts] = useState([]); // rooms checking out today

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            const [roomsRes, resRes] = await Promise.allSettled([
                apiClient.get('/rooms'),
                apiClient.get('/reservations?status=CHECKED_IN'),
            ]);

            if (roomsRes.status === 'fulfilled') {
                const all = roomsRes.value.data?.rooms || roomsRes.value.data || [];
                // Sort by priority: DIRTY → IN_PROGRESS → INSPECTING → CLEAN
                const sorted = [...all].sort((a, b) => {
                    const ai = PRIORITY_ORDER.indexOf(a.housekeepingStatus || 'CLEAN');
                    const bi = PRIORITY_ORDER.indexOf(b.housekeepingStatus || 'CLEAN');
                    return ai - bi;
                });
                setRooms(sorted);
                setOffline(false);
                setLastRefresh(new Date());
            }

            if (resRes.status === 'fulfilled') {
                // Rooms with check-out today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const reservations = resRes.value.data?.reservations || [];
                const todayRooms = reservations
                    .filter((r) => {
                        const co = new Date(r.checkOutDate);
                        return co >= today && co < tomorrow;
                    })
                    .map((r) => r.roomId?._id || r.roomId)
                    .filter(Boolean)
                    .map((id) => id.toString());

                setCheckouts(todayRooms);
            }
        } catch (err) {
            if (!navigator.onLine) setOffline(true);
            toast.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    // ── Offline detection ─────────────────────────────────────────────────────
    useEffect(() => {
        const goOffline = () => setOffline(true);
        const goOnline = () => { setOffline(false); fetchRooms(); };
        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);
        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, [fetchRooms]);

    // ── Real-time socket ──────────────────────────────────────────────────────
    useEffect(() => {
        const handleDirty = (data) => {
            setRooms((prev) =>
                prev.map((r) =>
                    r._id === data.roomId?.toString() || r._id === data.roomId
                        ? { ...r, housekeepingStatus: 'DIRTY', status: 'AVAILABLE' }
                        : r
                )
            );
            // Re-sort after update
            setRooms((prev) =>
                [...prev].sort((a, b) => {
                    const ai = PRIORITY_ORDER.indexOf(a.housekeepingStatus || 'CLEAN');
                    const bi = PRIORITY_ORDER.indexOf(b.housekeepingStatus || 'CLEAN');
                    return ai - bi;
                })
            );
            toast(`🧹 Room ${data.roomNumber || ''} needs cleaning`, { duration: 5000 });
        };

        const handleStatusChanged = (data) => {
            setRooms((prev) =>
                prev.map((r) =>
                    r._id === data.roomId?.toString() || r._id === data.roomId
                        ? { ...r, status: data.status }
                        : r
                )
            );
        };

        onSocketEvent('room:dirty', handleDirty);
        onSocketEvent('room:statusChanged', handleStatusChanged);
        return () => {
            offSocketEvent('room:dirty', handleDirty);
            offSocketEvent('room:statusChanged', handleStatusChanged);
        };
    }, []);

    // ── Status update ─────────────────────────────────────────────────────────
    const updateStatus = async (roomId, roomNumber, newHousekeepingStatus) => {
        setUpdating(roomId);
        try {
            await apiClient.patch(`/rooms/${roomId}/status`, {
                housekeepingStatus: newHousekeepingStatus,
                // When marking CLEAN, set operational status back to AVAILABLE
                ...(newHousekeepingStatus === 'CLEAN' ? { status: 'AVAILABLE' } : {}),
            });

            setRooms((prev) =>
                [...prev.map((r) =>
                    r._id === roomId
                        ? {
                            ...r,
                            housekeepingStatus: newHousekeepingStatus,
                            ...(newHousekeepingStatus === 'CLEAN' ? { status: 'AVAILABLE' } : {}),
                        }
                        : r
                )].sort((a, b) => {
                    const ai = PRIORITY_ORDER.indexOf(a.housekeepingStatus || 'CLEAN');
                    const bi = PRIORITY_ORDER.indexOf(b.housekeepingStatus || 'CLEAN');
                    return ai - bi;
                })
            );

            const msgs = {
                CLEAN: `✓ Room ${roomNumber} marked clean`,
                IN_PROGRESS: `🧹 Cleaning Room ${roomNumber} started`,
                INSPECTING: `🔍 Room ${roomNumber} under inspection`,
                DIRTY: `⚠ Room ${roomNumber} flagged dirty`,
            };
            toast.success(msgs[newHousekeepingStatus] || 'Status updated');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed — check your connection');
        } finally {
            setUpdating(null);
        }
    };

    // ── Filtered rooms ─────────────────────────────────────────────────────────
    const filtered = rooms.filter((r) => {
        const matchSearch = !search
            || String(r.roomNumber).includes(search)
            || (r.type || '').toLowerCase().includes(search.toLowerCase())
            || (r.floor !== null && String(r.floor).includes(search));

        const matchFilter = filter === 'ALL' || (r.housekeepingStatus || 'CLEAN') === filter;

        return matchSearch && matchFilter;
    });

    // ── Count per status ──────────────────────────────────────────────────────
    const counts = rooms.reduce((acc, r) => {
        const s = r.housekeepingStatus || 'CLEAN';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    // ── Render ────────────────────────────────────────────────────────────────
    return (
       <div className="space-y-0 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="bg-primary text-white shadow-soft rounded-card mb-4 overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <h1 className="text-lg font-bold">Housekeeping</h1>
                            <p className="text-xs text-white/70">
                                {user?.firstName} {user?.lastName}
                                {lastRefresh && (
                                    <span className="ml-2 opacity-60">
                                        · Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={fetchRooms}
                            disabled={loading}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Status summary pills */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                        {[
                            { key: 'ALL', label: 'All', count: rooms.length },
                            { key: 'DIRTY', label: 'Dirty', count: counts.DIRTY || 0 },
                            { key: 'IN_PROGRESS', label: 'Cleaning', count: counts.IN_PROGRESS || 0 },
                            { key: 'INSPECTING', label: 'Inspect', count: counts.INSPECTING || 0 },
                            { key: 'CLEAN', label: 'Clean', count: counts.CLEAN || 0 },
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${filter === key
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'bg-white/15 text-white hover:bg-white/25'
                                    }`}
                            >
                                {label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === key ? 'bg-primary text-white' : 'bg-white/20'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search bar */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 rounded-xl">
                        <Search size={16} className="text-white/60 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Room number, type, floor..."
                            className="bg-transparent border-none outline-none text-white placeholder:text-white/50 text-sm flex-1"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-white/60 hover:text-white">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Offline banner ── */}
            {offline && (
                <div className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                    <WifiOff size={16} />
                    You are offline. Changes will not be saved until connection is restored.
                </div>
            )}

            {/* ── Today's checkouts priority banner ── */}
            {checkouts.length > 0 && filter === 'ALL' && (
                <div className="mx-4 mt-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 text-warning text-sm font-semibold mb-1">
                        <AlertCircle size={15} />
                        {checkouts.length} room{checkouts.length !== 1 ? 's' : ''} checking out today
                    </div>
                    <p className="text-xs text-text-secondary">
                        These rooms need priority cleaning after guest departure.
                    </p>
                </div>
            )}

            {/* ── Room List ── */}
            <div className="px-4 mt-4 space-y-3">
                {loading ? (
                    // Skeleton cards
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-border p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-border/50" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-border/50 rounded w-24" />
                                    <div className="h-3 bg-border/30 rounded w-36" />
                                </div>
                                <div className="w-20 h-8 bg-border/30 rounded-xl" />
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <CheckCircle2 size={48} className="mx-auto mb-3 text-success opacity-40" />
                        <p className="font-semibold text-text-primary">
                            {search || filter !== 'ALL' ? 'No rooms match your filter' : 'All rooms are clean!'}
                        </p>
                        <p className="text-text-secondary text-sm mt-1">
                            {search || filter !== 'ALL' ? 'Try clearing the search or filter' : 'Great work — nothing to clean right now'}
                        </p>
                    </div>
                ) : (
                    filtered.map((room) => {
                        const hs = room.housekeepingStatus || 'CLEAN';
                        const cfg = STATUS[hs] || STATUS.CLEAN;
                        const Icon = cfg.icon;
                        const isUpdating = updating === room._id;
                        const isCheckout = checkouts.includes(room._id?.toString());

                        return (
                            <RoomCard
                                key={room._id}
                                room={room}
                                cfg={cfg}
                                Icon={Icon}
                                hs={hs}
                                isUpdating={isUpdating}
                                isCheckout={isCheckout}
                                onUpdate={updateStatus}
                            />
                        );
                    })
                )}
            </div>

            {/* ── Bottom spacing for mobile nav ── */}
        </div>
    );
};

// ── RoomCard ──────────────────────────────────────────────────────────────────
const RoomCard = ({ room, cfg, Icon, hs, isUpdating, isCheckout, onUpdate }) => {
    const [expanded, setExpanded] = useState(false);

    // Next actions based on current status
    const actions = {
        DIRTY: [
            {
                label: 'Start Cleaning',
                next: 'IN_PROGRESS',
                style: 'bg-warning text-white hover:bg-warning/90',
                icon: Sparkles,
            },
        ],
        IN_PROGRESS: [
            {
                label: 'Mark for Inspection',
                next: 'INSPECTING',
                style: 'bg-primary text-white hover:bg-primary/90',
                icon: Clock,
            },
            {
                label: 'Mark Clean',
                next: 'CLEAN',
                style: 'bg-success text-white hover:bg-success/90',
                icon: CheckCircle2,
            },
        ],
        INSPECTING: [
            {
                label: 'Approve — Mark Clean',
                next: 'CLEAN',
                style: 'bg-success text-white hover:bg-success/90',
                icon: CheckCircle2,
            },
            {
                label: 'Needs Re-cleaning',
                next: 'IN_PROGRESS',
                style: 'bg-warning text-white hover:bg-warning/90',
                icon: Sparkles,
            },
        ],
        CLEAN: [
            {
                label: 'Flag as Dirty',
                next: 'DIRTY',
                style: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
                icon: ShieldAlert,
            },
        ],
    };

    const currentActions = actions[hs] || [];

    return (
        <div
            className={`bg-white rounded-2xl border shadow-soft overflow-hidden transition-all ${isCheckout ? 'border-warning/40 ring-1 ring-warning/20' : 'border-border'
                }`}
        >
            {/* Card header — tap to expand */}
            <button
                className="w-full text-left p-4"
                onClick={() => setExpanded((p) => !p)}
            >
                <div className="flex items-center gap-3">
                    {/* Room number badge */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border-2 ${cfg.color}`}>
                        <BedDouble size={16} className="mb-0.5" />
                        <span className="text-xs font-bold leading-none">{room.roomNumber}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-text-primary text-sm">
                                {room.roomTypeId?.name || room.type || 'Room'}
                            </span>
                            {isCheckout && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 font-semibold">
                                    Checkout Today
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                            Floor {room.floor || '—'}
                            {room.capacity ? ` · Max ${room.capacity} guests` : ''}
                        </p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                    </div>
                </div>
            </button>

            {/* Expanded actions */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
                    {currentActions.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                            <button
                                key={action.next}
                                onClick={() => {
                                    onUpdate(room._id, room.roomNumber, action.next);
                                    setExpanded(false);
                                }}
                                disabled={isUpdating}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 ${action.style}`}
                            >
                                {isUpdating
                                    ? <RefreshCw size={16} className="animate-spin" />
                                    : <ActionIcon size={16} />
                                }
                                {isUpdating ? 'Updating...' : action.label}
                            </button>
                        );
                    })}

                    {/* Room detail info */}
                    <div className="mt-1 p-3 rounded-xl bg-background border border-border text-xs text-text-secondary space-y-1">
                        <div className="flex justify-between">
                            <span>Operational Status</span>
                            <span className="font-medium text-text-primary capitalize">
                                {room.status?.toLowerCase() || '—'}
                            </span>
                        </div>
                        {room.lastCleanedAt && (
                            <div className="flex justify-between">
                                <span>Last Cleaned</span>
                                <span className="font-medium text-text-primary">
                                    {new Date(room.lastCleanedAt).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {room.floor !== null && room.floor !== undefined && (
                            <div className="flex justify-between">
                                <span>Floor</span>
                                <span className="font-medium text-text-primary">{room.floor}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HousekeepingPage;