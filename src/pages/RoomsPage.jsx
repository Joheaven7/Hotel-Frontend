import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, BedDouble, Users, DollarSign, Home } from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import { onSocketEvent, offSocketEvent } from '../services/socket';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatusBadge from '../components/ui/StatusBadge';
import StatCard from '../components/ui/StatCard';

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'DELUXE', label: 'Deluxe' },
];

const ROOM_STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const EMPTY_FORM = {
  roomNumber: '',
  floor: '',
  roomTypeId: '',
  status: 'AVAILABLE',
  housekeepingStatus: 'CLEAN',
};

const RoomsPage = () => {
  const { user } = useAuthStore();
  const canManage = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const canUpdateStatus = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user?.role);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // {room} for quick status change

  // Add at top of RoomsPage component (after useState declarations):
  const [roomTypes, setRoomTypes] = useState([]);

  useEffect(() => {
    fetchRooms();
    // Fetch room types for the dropdown
    apiClient.get('/room-types')
      .then(r => setRoomTypes(r.data.roomTypes || []))
      .catch(() => { });
  }, []);

  const roomTypeOptions = roomTypes.map(rt => ({
    value: rt._id,
    label: `${rt.name} — ETB ${rt.basePricePerNight}/night · max ${rt.maxOccupancy} guests`,
  }));

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    const handleRoomCreated = (data) => setRooms((p) => [data, ...p]);
    const handleRoomUpdated = (data) => setRooms((p) => p.map((r) => r._id === data._id ? data : r));
    const handleRoomDeleted = (data) => setRooms((p) => p.filter((r) => r._id !== data.roomId));
    const handleStatusChanged = (data) => setRooms((p) => p.map((r) => r._id === data.roomId ? { ...r, status: data.status } : r));

    onSocketEvent('room:created', handleRoomCreated);
    onSocketEvent('room:updated', handleRoomUpdated);
    onSocketEvent('room:deleted', handleRoomDeleted);
    onSocketEvent('room:statusChanged', handleStatusChanged);

    return () => {
      offSocketEvent('room:created', handleRoomCreated);
      offSocketEvent('room:updated', handleRoomUpdated);
      offSocketEvent('room:deleted', handleRoomDeleted);
      offSocketEvent('room:statusChanged', handleStatusChanged);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/rooms');
      setRooms(response.data.rooms || response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRoom(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber || '',
      type: room.type || '',
      pricePerNight: room.pricePerNight || '',
      capacity: room.capacity || '',
      floor: room.floor || '',
      status: room.status || 'AVAILABLE',
      description: room.description || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    setFormErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.roomNumber?.trim()) errors.roomNumber = 'Room number is required';
    if (!formData.roomTypeId) errors.roomTypeId = 'Please select a room type';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        roomNumber: formData.roomNumber,
        floor: formData.floor ? Number(formData.floor) : null,
        roomTypeId: formData.roomTypeId,
        status: formData.status,
        housekeepingStatus: formData.housekeepingStatus,
      };
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom._id}`, payload);
        toast.success(`Room ${formData.roomNumber} updated`);
      } else {
        await apiClient.post('/rooms', payload);
        toast.success(`Room ${formData.roomNumber} created`);
      }
      closeModal();
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId) => {
    try {
      await apiClient.delete(`/rooms/${roomId}`);
      toast.success('Room deleted');
      setDeleteConfirm(null);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleQuickStatusChange = async (roomId, newStatus) => {
    try {
      await apiClient.patch(`/rooms/${roomId}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setStatusModal(null);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Stats
  const stats = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'AVAILABLE').length,
    occupied: rooms.filter((r) => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter((r) => r.status === 'MAINTENANCE').length,
  };

  const columns = [
    {
      header: 'Room',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {row.roomNumber}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">{row.type}</p>
            <p className="text-xs text-text-secondary">Floor {row.floor || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Capacity',
      accessor: (row) => (
        <span className="text-sm text-text-secondary">{row.capacity} guest{row.capacity !== 1 ? 's' : ''}</span>
      ),
    },
    {
      header: 'Price / Night',
      accessor: (row) => (
        <span className="font-semibold text-primary text-sm">ETB {(row.pricePerNight || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge type={row.status?.toLowerCase()} />,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          {/* Quick status change — STAFF and above */}
          {canUpdateStatus && (
            <button
              onClick={() => setStatusModal(row)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-colors"
              title="Change status"
            >
              Status
            </button>
          )}

          {/* Edit + Delete — ADMIN only */}
          {canManage && (
            <>
              <button
                onClick={() => openEdit(row)}
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                title="Edit room"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setDeleteConfirm(row)}
                className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                title="Delete room"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rooms"
        subtitle="Manage hotel room inventory, pricing, and availability"
        breadcrumbs={[{ label: 'Home' }, { label: 'Rooms' }]}
        action={
          canManage && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft"
            >
              <Plus size={18} /> Add Room
            </button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Rooms" value={stats.total} icon={Home} color="primary" />
        <StatCard title="Available" value={stats.available} icon={BedDouble} color="success" />
        <StatCard title="Occupied" value={stats.occupied} icon={Users} color="warning" />
        <StatCard title="Maintenance" value={stats.maintenance} icon={AlertCircle} color="error" />
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        loading={loading}
        searchPlaceholder="Search room number or type..."
        emptyMessage="No rooms found."
      />

      {/* Create / Edit Modal */}
      {canManage && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Room'}
          size="md"
          footer={
            <>
              <button onClick={closeModal} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60">
                {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Step 1: Choose room type */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                Step 1 — Select Room Type
              </p>
              <FormField
                label="Room Type"
                name="roomTypeId"
                type="select"
                options={[{ value: '', label: 'Choose a type...' }, ...roomTypeOptions]}
                value={formData.roomTypeId}
                onChange={handleChange}
                error={formErrors.roomTypeId}
                required
              />
              {/* Show type preview */}
              {formData.roomTypeId && (() => {
                const rt = roomTypes.find(t => t._id === formData.roomTypeId);
                if (!rt) return null;
                return (
                  <div className="mt-2 text-xs text-text-secondary space-y-1">
                    <p>Capacity: <strong>{rt.maxOccupancy}</strong> · Price: <strong>ETB {rt.basePricePerNight}/night</strong></p>
                    {rt.amenities?.length > 0 && <p>Amenities: {rt.amenities.slice(0, 4).join(', ')}</p>}
                  </div>
                );
              })()}
            </div>

            {/* Step 2: Physical identifiers */}
            <div className="p-3 rounded-xl bg-background border border-border">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Step 2 — Physical Unit Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Room Number" name="roomNumber" placeholder="e.g. 101"
                  value={formData.roomNumber} onChange={handleChange}
                  error={formErrors.roomNumber} required />
                <FormField
                  label="Floor" name="floor" type="number" placeholder="e.g. 1"
                  value={formData.floor} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  label="Operational Status" name="status" type="select"
                  options={ROOM_STATUSES}
                  value={formData.status} onChange={handleChange} />
                <FormField
                  label="Housekeeping Status" name="housekeepingStatus" type="select"
                  options={[
                    { value: 'CLEAN', label: 'Clean' },
                    { value: 'DIRTY', label: 'Dirty' },
                    { value: 'IN_PROGRESS', label: 'Being Cleaned' },
                    { value: 'INSPECTING', label: 'Under Inspection' },
                  ]}
                  value={formData.housekeepingStatus} onChange={handleChange} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Status Modal — STAFF and above */}
      <Modal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={`Change Status — Room ${statusModal?.roomNumber}`}
        size="sm"
        footer={
          <button onClick={() => setStatusModal(null)} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background transition-colors text-sm font-medium">
            Cancel
          </button>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-text-secondary mb-3">
            Current: <StatusBadge type={statusModal?.status?.toLowerCase()} />
          </p>
          {ROOM_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleQuickStatusChange(statusModal._id, s.value)}
              disabled={statusModal?.status === s.value}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${statusModal?.status === s.value
                ? 'bg-primary/5 border-primary/30 text-primary cursor-default'
                : 'border-border hover:bg-background hover:border-primary/30'
                }`}
            >
              {s.label}
              {statusModal?.status === s.value && <span className="ml-2 text-xs opacity-60">(current)</span>}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {canManage && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Deletion"
          size="sm"
          footer={
            <>
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm?._id)} className="px-5 py-2 rounded-btn bg-error text-white hover:bg-error/90 transition-colors text-sm font-medium">
                Delete Room
              </button>
            </>
          }
        >
          <div className="flex items-start gap-4 py-2">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
              <AlertCircle className="text-error" size={20} />
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-text-primary">Room {deleteConfirm?.roomNumber}</span>? This cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RoomsPage;