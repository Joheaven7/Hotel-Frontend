import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, RefreshCw, Sparkles, Building, AlertCircle } from 'lucide-react';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';
import { onSocketEvent, offSocketEvent } from '../../services/socket';

const HousekeepingPanel = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // roomId being updated

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/rooms');
      const fetched = response.data.rooms || response.data || [];
      // Show only rooms that need attention (not OCCUPIED/BLOCKED)
      // AVAILABLE = clean, MAINTENANCE = needs work
      setRooms(fetched.filter(r => ['AVAILABLE', 'MAINTENANCE'].includes(r.status)));
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  // Listen for real-time dirty room events from cron + manual checkout
  useEffect(() => {
    const handleRoomDirty = (data) => {
      // Add the dirty room to list immediately without a full fetch
      setRooms((prev) => {
        const exists = prev.find((r) => r._id === data.roomId?.toString());
        if (exists) {
          // Update existing room's housekeeping status
          return prev.map((r) =>
            r._id === data.roomId?.toString()
              ? { ...r, housekeepingStatus: 'DIRTY', status: 'AVAILABLE' }
              : r
          );
        }
        // Room not in current list — refresh to get it
        fetchRooms();
        return prev;
      });

      // Show a toast so staff knows immediately
      toast(`Room ${data.roomNumber || ''} is now dirty — needs cleaning`, {
        icon: '🧹',
        duration: 5000,
      });
    };

    onSocketEvent('room:dirty', handleRoomDirty);
    return () => offSocketEvent('room:dirty', handleRoomDirty);
  }, []);

  // Mark room as Available (cleaned)
  const handleMarkClean = async (roomId, roomNumber) => {
    setUpdating(roomId);
    try {
      await apiClient.patch(`/rooms/${roomId}/status`, { status: 'AVAILABLE' });
      toast.success(`Room ${roomNumber} marked as clean and available`);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update room status');
    } finally {
      setUpdating(null);
    }
  };

  // Flag room as needing maintenance/cleaning
  const handleFlagMaintenance = async (roomId, roomNumber) => {
    setUpdating(roomId);
    try {
      await apiClient.patch(`/rooms/${roomId}/status`, { status: 'MAINTENANCE' });
      toast.success(`Room ${roomNumber} flagged for cleaning`);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update room status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-soft overflow-hidden h-full flex flex-col border border-border">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-bold text-primary flex items-center gap-2">
            <Building size={20} /> Housekeeping
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">Room cleaning status management</p>
        </div>
        <button
          onClick={fetchRooms}
          disabled={loading}
          className="p-2 hover:bg-background rounded-full transition-colors text-primary disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="text-center py-12 text-text-secondary text-sm">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-success opacity-50" />
            <p className="text-sm font-medium">All rooms are clean and ready</p>
          </div>
        ) : (
          rooms.slice(0, 10).map((room) => {
            const needsCleaning = room.status === 'MAINTENANCE';
            const isUpdating = updating === room._id;

            return (
              <div
                key={room._id}
                className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all ${needsCleaning
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-success/20 bg-success/5'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-text-primary">Room {room.roomNumber}</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wide">({room.type})</span>
                  </div>
                  <div className="mt-1">
                    {needsCleaning ? (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-warning/10 text-warning rounded-full flex items-center gap-1 w-fit">
                        <ShieldAlert size={11} /> Needs Cleaning
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-success/10 text-success rounded-full flex items-center gap-1 w-fit">
                        <CheckCircle2 size={11} /> Clean & Ready
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {needsCleaning ? (
                    <button
                      onClick={() => handleMarkClean(room._id, room.roomNumber)}
                      disabled={isUpdating}
                      className="bg-primary text-white hover:bg-primary/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                    >
                      {isUpdating ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      {isUpdating ? '...' : 'Mark Clean'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFlagMaintenance(room._id, room.roomNumber)}
                      disabled={isUpdating}
                      className="border border-border text-text-secondary hover:bg-background text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {isUpdating ? '...' : 'Flag Dirty'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {rooms.length > 10 && (
        <div className="px-4 py-3 border-t border-border text-center">
          <p className="text-xs text-text-secondary">{rooms.length - 10} more rooms — visit Rooms page for full list</p>
        </div>
      )}
    </div>
  );
};

export default HousekeepingPanel;