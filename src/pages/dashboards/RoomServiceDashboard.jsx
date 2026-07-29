import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import { onSocketEvent, offSocketEvent } from '../../services/socket';
import PageHeader from '../../components/ui/PageHeader';
import { Clock, Truck, CheckCircle2, AlertCircle, RefreshCw, DoorOpen, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function RoomServiceDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch READY and OUT_FOR_DELIVERY orders
      const [readyRes, outRes] = await Promise.all([
        apiClient.get('/restaurant/orders?status=READY&limit=50'),
        apiClient.get('/restaurant/orders?status=OUT_FOR_DELIVERY&limit=50')
      ]);
      const activeOrders = [...readyRes.data, ...outRes.data].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setOrders(activeOrders);
    } catch (err) {
      toast.error('Failed to load room service orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrderUpdate = (order) => {
      setOrders((prev) => {
        // If order is delivered or not in our statuses, remove it
        if (order.status !== 'READY' && order.status !== 'OUT_FOR_DELIVERY') {
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

    onSocketEvent('orderUpdated', handleOrderUpdate);

    const interval = setInterval(() => {
      setOrders((prev) => [...prev]);
    }, 60000);

    return () => {
      offSocketEvent('orderUpdated', handleOrderUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await apiClient.patch(`/restaurant/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      setOrders((prev) => {
        if (newStatus !== 'READY' && newStatus !== 'OUT_FOR_DELIVERY') {
          return prev.filter((o) => o._id !== orderId);
        }
        return prev.map((o) => (o._id === orderId ? res.data : o));
      });
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const readyOrders = orders.filter((o) => o.status === 'READY');
  const deliveryOrders = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Room Service Dispatch"
        subtitle="Manage food deliveries to guest rooms"
        breadcrumbs={[{ label: 'Home' }, { label: 'Room Service' }, { label: 'Dispatch' }]}
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
          <p className="text-text-secondary">Loading dispatch queue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Ready Orders Column */}
          <div className="bg-white rounded-card shadow-soft border border-border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-success/10 rounded-t-card">
              <h2 className="text-lg font-bold flex items-center gap-2 text-success">
                <CheckCircle2 size={20} /> Ready for Pickup ({readyOrders.length})
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {readyOrders.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No orders ready for pickup.</p>
                </div>
              ) : (
                readyOrders.map((order) => (
                  <DispatchCard 
                    key={order._id} 
                    order={order} 
                    actionLabel="Dispatch to Room"
                    actionColor="bg-primary text-white hover:bg-primary/90"
                    onAction={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                  />
                ))
              )}
            </div>
          </div>

          {/* Out for Delivery Column */}
          <div className="bg-white rounded-card shadow-soft border border-border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-primary/10 rounded-t-card">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <Truck size={20} /> Out for Delivery ({deliveryOrders.length})
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {deliveryOrders.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">
                  <Truck size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No active deliveries.</p>
                </div>
              ) : (
                deliveryOrders.map((order) => (
                  <DispatchCard 
                    key={order._id} 
                    order={order} 
                    actionLabel="Mark Delivered"
                    actionColor="bg-success text-white hover:bg-success/90"
                    onAction={() => handleUpdateStatus(order._id, 'DELIVERED')}
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

function DispatchCard({ order, actionLabel, actionColor, onAction }) {
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  
  return (
    <div className="p-4 rounded-lg border border-border bg-background/30 hover:bg-background/50 transition-colors">
      <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
        <div>
          <h3 className="font-bold text-text-primary text-lg">Order #{order.orderNumber}</h3>
          <p className="text-sm text-text-secondary mt-1">
            Ordered {timeAgo}
          </p>
        </div>
        <div className="flex flex-col items-end">
           <div className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 text-lg">
             <DoorOpen size={18} /> Room {order.room?.roomNumber || 'N/A'}
           </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-text-primary flex items-center gap-2 mb-1">
          {order.customerName}
        </p>
        {order.customerPhone && (
          <p className="text-sm text-text-secondary flex items-center gap-2">
            <Phone size={14} /> {order.customerPhone}
          </p>
        )}
      </div>

      <div className="space-y-1 mb-4 text-sm bg-white p-2 rounded border border-border/50">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
             <span className="font-bold text-text-secondary">{item.quantity}x</span>
             <span className="truncate">{item.foodItem?.name || 'Item'}</span>
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="bg-warning/10 border border-warning/20 p-2 rounded text-xs text-warning-dark mb-4">
          <strong>Delivery Notes:</strong> {order.specialInstructions}
        </div>
      )}

      <button 
        onClick={onAction}
        className={`w-full py-2.5 rounded-md font-bold text-sm transition-colors ${actionColor}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
