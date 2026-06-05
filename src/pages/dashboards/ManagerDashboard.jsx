import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { dashboardService } from '../../services/dashboardService';
import {
    TrendingUp, Home, Calendar, Users, AlertCircle, RefreshCw,
    CheckCircle, Clock, DollarSign, Wrench,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/dashboards');
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const monthlyRevenue = (data?.revenueByMonth || []).slice().reverse().map((m) => ({
        month: m._id,
        revenue: m.revenue || 0,
    }));

    if (error) {
        return (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><AlertCircle size={24} /><p>{error}</p></div>
                <button onClick={fetchData} className="flex items-center gap-2 px-3 py-1.5 bg-error/10 rounded-lg text-sm font-semibold">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Operations Overview"
                subtitle="Hotel performance metrics and management dashboard"
                breadcrumbs={[{ label: 'Home' }, { label: 'Manager Dashboard' }]}
                action={
                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft">
                        <RefreshCw size={16} /> Refresh
                    </button>
                }
            />

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
                ) : (
                    <>
                        <StatCard title="Total Revenue" value={`ETB ${(data?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="primary" />
                        <StatCard title="Occupancy Rate" value={`${data?.occupancyRate || 0}%`} icon={Home} color="secondary" />
                        <StatCard title="Pending Reservations" value={data?.pendingReservations || 0} icon={Clock} color="warning" />
                        <StatCard title="Open Maintenance" value={data?.maintenanceStatus?.open || 0} icon={Wrench} color="error" />
                    </>
                )}
            </div>

            {/* Revenue Chart + Room Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-card shadow-soft p-6 border border-border lg:col-span-2">
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Monthly Revenue</h3>
                    {loading ? <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => [`ETB ${v.toLocaleString()}`, 'Revenue']} />
                                <Bar dataKey="revenue" fill="#0F5B4F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-card shadow-soft p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-heading font-bold text-text-primary">Room Status</h3>
                        <button onClick={() => navigate('/rooms')} className="text-sm text-primary hover:underline">Manage →</button>
                    </div>
                    {loading ? <CardSkeleton /> : (
                        <div className="space-y-3">
                            {[
                                { label: 'Available', value: data?.roomStatus?.available || 0, color: 'bg-success' },
                                { label: 'Occupied', value: data?.roomStatus?.occupied || 0, color: 'bg-primary' },
                                { label: 'Maintenance', value: data?.roomStatus?.maintenance || 0, color: 'bg-warning' },
                                { label: 'Blocked', value: data?.roomStatus?.blocked || 0, color: 'bg-error' },
                            ].map(({ label, value, color }) => {
                                const total = data?.roomStatus?.total || 1;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-text-secondary">{label}</span>
                                            <span className="font-bold text-text-primary">{value}</span>
                                        </div>
                                        <div className="h-2 bg-background rounded-full">
                                            <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.round((value / total) * 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Reservations */}
            <div className="bg-white rounded-card shadow-soft p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-bold text-text-primary">Upcoming Reservations</h3>
                    <button onClick={() => navigate('/reservations')} className="text-sm text-primary hover:underline">View all →</button>
                </div>
                {loading ? <CardSkeleton /> : !(data?.upcomingReservations?.length) ? (
                    <p className="text-text-secondary text-sm text-center py-6">No upcoming reservations</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Guest', 'Room', 'Check-in', 'Check-out', 'Status'].map((h) => (
                                        <th key={h} className="text-left py-2 px-3 text-text-secondary font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.upcomingReservations.slice(0, 8).map((res) => {
                                    const c = res.customerId;
                                    return (
                                        <tr key={res._id} className="border-b border-border/50 hover:bg-background">
                                            <td className="py-2 px-3 font-medium text-text-primary">
                                                {c ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : 'Guest'}
                                            </td>
                                            <td className="py-2 px-3 text-text-secondary">
                                                {res.roomId?.roomNumber ? `Room ${res.roomId.roomNumber}` : res.hallId?.hallName || 'N/A'}
                                            </td>
                                            <td className="py-2 px-3 text-text-secondary">
                                                {new Date(res.checkInDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 px-3 text-text-secondary">
                                                {new Date(res.checkOutDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${res.status === 'CONFIRMED' ? 'bg-success/10 text-success' :
                                                    res.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                                                        'bg-text-secondary/10 text-text-secondary'
                                                    }`}>
                                                    {res.status?.toLowerCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerDashboard;