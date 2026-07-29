import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { onSocketEvent, offSocketEvent } from '../../services/socket';
import PageHeader from '../../components/ui/PageHeader';
import { Clock, ChefHat, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch PAID and PREPARING orders
      const [paidRes, prepRes] = await Promise.all([
        apiClient.get('/restaurant/orders?status=PAID&limit=50'),
        apiClient.get('/restaurant/orders?status=PREPARING&limit=50')
      ]);
      const activeOrders = [...paidRes.data, ...prepRes.data].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setOrders(activeOrders);
    } catch (err) {
      toast.error('Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleNewOrder = (order) => {
      // Audio alert for new paid orders could be added here
      toast('🔔 New Order Arrived!', { icon: '🧑‍🍳' });
      setOrders((prev) => {
        // Prevent duplicates
        if (prev.some((o) => o._id === order._id)) return prev;
        return [...prev, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    };

    const handleOrderUpdate = (order) => {
      setOrders((prev) => {
        // If order moved past PREPARING, remove it from Kitchen Dashboard
        if (order.status !== 'PAID' && order.status !== 'PREPARING') {
          return prev.filter((o) => o._id !== order._id);
        }
        // Update existing or add new
        const exists = prev.some((o) => o._id === order._id);
        if (exists) {
          return prev.map((o) => (o._id === order._id ? order : o));
        }
        return [...prev, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    };

    onSocketEvent('newOrder', handleNewOrder);
    onSocketEvent('orderUpdated', handleOrderUpdate);

    // Refresh every minute for the time-ago counters
    const interval = setInterval(() => {
      setOrders((prev) => [...prev]);
    }, 60000);

    return () => {
      offSocketEvent('newOrder', handleNewOrder);
      offSocketEvent('orderUpdated', handleOrderUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await apiClient.patch(`/restaurant/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      // The socket event 'orderUpdated' will update the state
      // But we can eagerly update it:
      setOrders((prev) => {
        if (newStatus !== 'PAID' && newStatus !== 'PREPARING') {
          return prev.filter((o) => o._id !== orderId);
        }
        return prev.map((o) => (o._id === orderId ? res.data : o));
      });
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const newOrders = orders.filter((o) => o.status === 'PAID');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Kitchen Dashboard"
        subtitle="Live order queue and preparation station"
        breadcrumbs={[{ label: 'Home' }, { label: 'Restaurant' }, { label: 'Kitchen' }]}
        action={
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white text-text-primary border border-border rounded-btn font-medium hover:bg-background transition-colors shadow-sm"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />

      {loading && orders.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading kitchen orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* New Orders Column */}
          <div className="bg-white rounded-card shadow-soft border border-border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-primary/5 rounded-t-card">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <AlertCircle size={20} /> New Orders ({newOrders.length})
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {newOrders.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">
                  <ChefHat size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No new orders.</p>
                </div>
              ) : (
                newOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    actionLabel="Start Preparing"
                    actionColor="bg-warning text-white hover:bg-warning/90"
                    onAction={() => handleUpdateStatus(order._id, 'PREPARING')}
                  />
                ))
              )}
            </div>
          </div>

          {/* Preparing Orders Column */}
          <div className="bg-white rounded-card shadow-soft border border-border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-warning/10 rounded-t-card">
              <h2 className="text-lg font-bold flex items-center gap-2 text-warning">
                <ChefHat size={20} /> In Preparation ({preparingOrders.length})
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {preparingOrders.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No orders currently being prepared.</p>
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    actionLabel="Mark Ready"
                    actionColor="bg-success text-white hover:bg-success/90"
                    onAction={() => handleUpdateStatus(order._id, 'READY')}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function OrderCard({ order, actionLabel, actionColor, onAction }) {
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  const isUrgent = (new Date() - new Date(order.createdAt)) > 20 * 60 * 1000; // > 20 mins

  return (
    <div className={`p-4 rounded-lg border ${isUrgent ? 'border-error/50 bg-error/5' : 'border-border bg-background/30'}`}>
      <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
        <div>
          <h3 className="font-bold text-text-primary text-lg">Order #{order.orderNumber}</h3>
          <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
            <span className="font-semibold text-primary">Room {order.room?.roomNumber || 'N/A'}</span>
            <span className="mx-1">•</span>
            {order.customerName}
          </p>
        </div>
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${isUrgent ? 'bg-error text-white' : 'bg-background text-text-secondary'}`}>
          <Clock size={12} /> {timeAgo}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start text-sm">
            <div>
              <span className="font-bold mr-2">{item.quantity}x</span>
              <span className="font-medium text-text-primary">{item.foodItem?.name || 'Unknown Item'}</span>
              {item.specialInstructions && (
                <p className="text-error text-xs italic mt-0.5 max-w-[200px]">Note: {item.specialInstructions}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="bg-warning/10 border border-warning/20 p-2 rounded text-xs text-warning-dark mb-4">
          <strong>Order Notes:</strong> {order.specialInstructions}
        </div>
      )}

      <button 
        onClick={onAction}
        className={`w-full py-2 rounded-md font-bold text-sm transition-colors ${actionColor}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
