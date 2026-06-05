import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, CheckCircle, LogIn, LogOut, XCircle, Eye,
  BedDouble, Landmark, Clock, AlertCircle, UserPlus,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatusBadge from '../components/ui/StatusBadge';

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeFormat = (d, fmt = 'MMM dd, yyyy') => {
  try { const dt = new Date(d); return isValid(dt) ? format(dt, fmt) : '—'; }
  catch { return '—'; }
};

const buildISO = (dateStr, timeStr) =>
  new Date(`${dateStr}T${timeStr}:00`).toISOString();

const calcHallHours = (s, e) => {
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
};

// ── Role helpers ──────────────────────────────────────────────────────────────
const CAN_CONFIRM = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
const CAN_CHECKIN = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
const CAN_CHECKOUT = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
const CAN_CANCEL = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
const IS_STAFF = ['STAFF', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'];

// ── Availability checker component ───────────────────────────────────────────
const RoomAvailabilityChecker = ({ roomTypeId, checkInDate, checkOutDate, numberOfGuests, onResult }) => {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!roomTypeId || !checkInDate || !checkOutDate) return;
    let cancelled = false;
    const check = async () => {
      setStatus('checking');
      setResult(null);
      try {
        const res = await apiClient.get('/rooms/available-by-type', {
          params: { type: roomTypeId, checkInDate, checkOutDate, numberOfGuests },
        });
        if (cancelled) return;
        setResult(res.data);
        setStatus(res.data.available ? 'available' : 'unavailable');
        onResult(res.data);
      } catch {
        if (!cancelled) setStatus(null);
      }
    };
    const t = setTimeout(check, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [roomTypeId, checkInDate, checkOutDate, numberOfGuests]);

  if (status === 'checking') return (
    <div className="flex items-center gap-2 text-sm text-text-secondary p-3 rounded-xl bg-background border border-border">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      Checking availability...
    </div>
  );

  if (status === 'available') return (
    <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-sm">
      <p className="font-semibold text-success mb-1">✓ Available — room will be auto-assigned</p>
      {result?.room && (
        <p className="text-text-secondary text-xs">
          {result.room.type} · Capacity {result.room.capacity} · ETB {result.room.pricePerNight?.toLocaleString()}/night
        </p>
      )}
    </div>
  );

  if (status === 'unavailable' && result) return (
    <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-sm space-y-2">
      <p className="font-semibold text-error">No rooms available for those dates</p>
      {result.alternatives?.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary font-medium mb-1">Alternatives:</p>
          {result.alternatives.map((r) => (
            <div key={r._id} className="text-xs px-2 py-1.5 rounded bg-white border border-border mt-1">
              {r.type} · {r.capacity} guests · ETB {r.pricePerNight?.toLocaleString()}/night
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return null;
};

// ── Empty form defaults ───────────────────────────────────────────────────────
const EMPTY_ROOM = {
  roomTypeId: '',
  roomTypeName: '',
  checkInDate: '',
  checkOutDate: '',
  numberOfGuests: 1,
  specialRequests: '',
  // walk-in
  isWalkIn: false,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
};

const EMPTY_HALL = {
  hallTypeId: '',
  eventDate: '',
  startTime: '09:00',
  endTime: '17:00',
  numberOfGuests: 1,
  specialRequests: '',
};

// ─────────────────────────────────────────────────────────────────────────────
const ReservationsPage = () => {
  const { user } = useAuthStore();
  const role = user?.role || '';
  const location = useLocation();
  const isStaff = IS_STAFF.includes(role);

  const [reservations, setReservations] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [hallTypes, setHallTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urlSearch, setUrlSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [resType, setResType] = useState('room'); // 'room' | 'hall'
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);

  // Forms
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [hallForm, setHallForm] = useState(EMPTY_HALL);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [rohResult, setRohResult] = useState(null); // availability check result
  const [recommendations, setRecommendations] = useState([]);

  // ── URL search param ────────────────────────────────────────────────────────
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search');
    if (q) setUrlSearch(q);
  }, [location.search]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, rtRes, htRes] = await Promise.allSettled([
        apiClient.get('/reservations'),
        apiClient.get('/room-types'),
        apiClient.get('/hall-types'),
      ]);

      if (resRes.status === 'fulfilled') {
        const d = resRes.value.data?.reservations || resRes.value.data?.data || [];
        setReservations(Array.isArray(d) ? d : []);
      } else {
        toast.error('Failed to load reservations');
      }
      if (rtRes.status === 'fulfilled') {
        setRoomTypes(rtRes.value.data?.roomTypes || []);
      }
      if (htRes.status === 'fulfilled') {
        setHallTypes(htRes.value.data?.hallTypes || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Modal open/close ────────────────────────────────────────────────────────
  const openCreate = () => {
    setRoomForm(EMPTY_ROOM);
    setHallForm(EMPTY_HALL);
    setFormErrors({});
    setResType('room');
    setRohResult(null);
    setRecommendations([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormErrors({});
    setRohResult(null);
    setRecommendations([]);
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateRoom = () => {
    const e = {};
    if (!roomForm.roomTypeId) e.roomTypeId = 'Select a room type';
    if (!roomForm.checkInDate) e.checkInDate = 'Check-in date is required';
    if (!roomForm.checkOutDate) e.checkOutDate = 'Check-out date is required';
    if (roomForm.checkInDate && roomForm.checkOutDate &&
      new Date(roomForm.checkInDate) >= new Date(roomForm.checkOutDate))
      e.checkOutDate = 'Check-out must be after check-in';
    if (!roomForm.numberOfGuests || Number(roomForm.numberOfGuests) < 1)
      e.numberOfGuests = 'At least 1 guest required';
    // Walk-in validation
    if (roomForm.isWalkIn) {
      if (!roomForm.guestName?.trim()) e.guestName = 'Guest legal name required';
      if (!roomForm.guestPhone?.trim()) e.guestPhone = 'Guest phone required';
      if (!roomForm.guestEmail?.trim()) e.guestEmail = 'Guest email required';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateHall = () => {
    const e = {};
    if (!hallForm.hallTypeId) e.hallTypeId = 'Select a hall type';
    if (!hallForm.eventDate) e.eventDate = 'Event date is required';
    if (!hallForm.startTime) e.startTime = 'Start time is required';
    if (!hallForm.endTime) e.endTime = 'End time is required';
    if (hallForm.startTime && hallForm.endTime && calcHallHours(hallForm.startTime, hallForm.endTime) <= 0)
      e.endTime = 'End time must be after start time';
    if (!hallForm.numberOfGuests || Number(hallForm.numberOfGuests) < 1)
      e.numberOfGuests = 'At least 1 guest required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (resType === 'room') {
      if (!validateRoom()) return;
      setSaving(true);
      try {
        const payload = {
          roomTypeId: roomForm.roomTypeId,
          checkInDate: new Date(roomForm.checkInDate).toISOString(),
          checkOutDate: new Date(roomForm.checkOutDate).toISOString(),
          numberOfGuests: Number(roomForm.numberOfGuests),
          specialRequests: roomForm.specialRequests || '',
          isWalkIn: roomForm.isWalkIn,
          ...(roomForm.isWalkIn ? {
            guestName: roomForm.guestName,
            guestEmail: roomForm.guestEmail,
            guestPhone: roomForm.guestPhone,
          } : {}),
        };
        const res = await apiClient.post('/reservations', payload);
        const assigned = res.data.assignedRoom;
        toast.success(
          assigned
            ? `Room ${assigned.roomNumber} (${assigned.typeName}) assigned!`
            : 'Reservation created!'
        );
        closeModal();
        setTimeout(fetchData, 500);
      } catch (err) {
        if (err.response?.data?.fullyBooked) {
          setRecommendations(err.response.data.recommendations || []);
          toast.error(err.response.data.message || 'Fully booked for those dates');
        } else {
          toast.error(err.response?.data?.message || 'Failed to create reservation');
        }
      } finally {
        setSaving(false);
      }
    } else {
      if (!validateHall()) return;
      setSaving(true);
      try {
        const payload = {
          hallTypeId: hallForm.hallTypeId,
          checkInDate: buildISO(hallForm.eventDate, hallForm.startTime),
          checkOutDate: buildISO(hallForm.eventDate, hallForm.endTime),
          numberOfGuests: Number(hallForm.numberOfGuests),
          specialRequests: hallForm.specialRequests || '',
        };
        await apiClient.post('/reservations', payload);
        toast.success('Hall reservation created!');
        closeModal();
        setTimeout(fetchData, 500);
      } catch (err) {
        if (err.response?.data?.fullyBooked) {
          setRecommendations(err.response.data.recommendations || []);
          toast.error(err.response.data.message || 'Hall fully booked for those dates');
        } else {
          toast.error(err.response?.data?.message || 'Failed to create hall reservation');
        }
      } finally {
        setSaving(false);
      }
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAction = async (reservationId, action) => {
    setActionLoading(`${reservationId}-${action}`);
    try {
      await apiClient.post(`/reservations/${reservationId}/${action}`);
      toast.success(`Reservation ${action.replace('-', ' ')} successful`);
      if (viewModal) setViewModal(false);
      setTimeout(fetchData, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const handleRoomChange = (e) => {
    const { name, value, type: t, checked } = e.target;
    setRoomForm((p) => ({ ...p, [name]: t === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
    // Reset ROH result when type/dates change
    if (['roomTypeId', 'checkInDate', 'checkOutDate', 'numberOfGuests'].includes(name)) {
      setRohResult(null);
      setRecommendations([]);
    }
  };
  const handleHallChange = (e) => {
    const { name, value } = e.target;
    setHallForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  // ── Dropdown options ─────────────────────────────────────────────────────────
  const roomTypeOptions = roomTypes.map((rt) => ({
    value: rt._id,
    label: `${rt.name} — ETB ${rt.basePricePerNight?.toLocaleString()}/night · max ${rt.maxOccupancy} guests`,
  }));

  const hallTypeOptions = hallTypes.map((ht) => ({
    value: ht._id,
    label: `${ht.name} — ETB ${ht.basePricePerHour?.toLocaleString()}/hr · max ${ht.maxOccupancy} guests`,
  }));

  // ── Price preview ────────────────────────────────────────────────────────────
  const roomPricePreview = (() => {
    if (!roomForm.roomTypeId || !roomForm.checkInDate || !roomForm.checkOutDate) return null;
    const rt = roomTypes.find((r) => r._id === roomForm.roomTypeId);
    if (!rt) return null;
    const nights = Math.ceil(
      (new Date(roomForm.checkOutDate) - new Date(roomForm.checkInDate)) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) return null;
    return { nights, total: nights * rt.basePricePerNight, rate: rt.basePricePerNight };
  })();

  const hallPricePreview = (() => {
    if (!hallForm.hallTypeId || !hallForm.startTime || !hallForm.endTime) return null;
    const ht = hallTypes.find((h) => h._id === hallForm.hallTypeId);
    if (!ht) return null;
    const hours = calcHallHours(hallForm.startTime, hallForm.endTime);
    if (hours <= 0) return null;
    return { hours, total: hours * ht.basePricePerHour, rate: ht.basePricePerHour };
  })();

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Reservation #',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-text-primary text-sm font-mono">
            {row.reservationNumber || row._id?.slice(-8).toUpperCase()}
          </p>
          <p className="text-xs text-text-secondary">{safeFormat(row.createdAt)}</p>
          {row.isWalkIn && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium mt-0.5 inline-block">
              Walk-in
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Guest',
      accessor: (row) => {
        const c = row.customer || row.customerId;
        const name = c
          ? `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email
          : row.guestName || 'Guest';
        const email = c?.email || row.guestEmail || '';
        return (
          <div>
            <p className="font-medium text-text-primary text-sm">{name}</p>
            <p className="text-xs text-text-secondary">{email}</p>
          </div>
        );
      },
    },
    {
      header: 'Room / Hall',
      accessor: (row) => {
        const room = row.room || row.roomId;
        const hall = row.hall || row.hallId;
        const rt = row.roomType || row.roomTypeId;
        const ht = row.hallType || row.hallTypeId;
        if (room?.roomNumber) {
          return (
            <div className="flex items-center gap-1.5">
              <BedDouble size={13} className="text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Room {room.roomNumber}</p>
                <p className="text-xs text-text-secondary">{rt?.name || room.type || ''}</p>
              </div>
            </div>
          );
        }
        if (hall?.hallName) {
          return (
            <div className="flex items-center gap-1.5">
              <Landmark size={13} className="text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium">{hall.hallName}</p>
                <p className="text-xs text-text-secondary">{ht?.name || ''}</p>
              </div>
            </div>
          );
        }
        return <span className="text-text-secondary text-xs">Pending assignment</span>;
      },
    },
    {
      header: 'Check-in',
      accessor: (row) => <span className="text-sm text-text-secondary">{safeFormat(row.checkInDate)}</span>,
    },
    {
      header: 'Check-out',
      accessor: (row) => <span className="text-sm text-text-secondary">{safeFormat(row.checkOutDate)}</span>,
    },
    {
      header: 'Amount',
      accessor: (row) => (
        <span className="font-semibold text-sm text-primary">
          ETB {(row.totalPrice || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge type={row.status?.toLowerCase()} />,
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isMine = row.customerId?._id === user?._id || row.customerId === user?._id;
        const canConf = CAN_CONFIRM.includes(role) && row.status === 'PENDING';
        const canIn = CAN_CHECKIN.includes(role) && row.status === 'CONFIRMED';
        const canOut = CAN_CHECKOUT.includes(role) && row.status === 'CHECKED_IN';
        const canCan = (CAN_CANCEL.includes(role) || (role === 'CUSTOMER' && isMine))
          && !['CANCELLED', 'CHECKED_OUT'].includes(row.status);
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSelected(row); setViewModal(true); }}
              className="p-1.5 rounded-lg text-text-secondary hover:bg-background transition-colors"
              title="View"
            >
              <Eye size={14} />
            </button>
            {canConf && (
              <button onClick={() => handleAction(row._id, 'confirm')}
                disabled={actionLoading === `${row._id}-confirm`}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50">
                Confirm
              </button>
            )}
            {canIn && (
              <button onClick={() => handleAction(row._id, 'check-in')}
                disabled={actionLoading === `${row._id}-check-in`}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 disabled:opacity-50">
                Check In
              </button>
            )}
            {canOut && (
              <button onClick={() => handleAction(row._id, 'check-out')}
                disabled={actionLoading === `${row._id}-check-out`}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-warning/10 text-warning hover:bg-warning/20 disabled:opacity-50">
                Check Out
              </button>
            )}
            {canCan && (
              <button onClick={() => handleAction(row._id, 'cancel')}
                disabled={actionLoading === `${row._id}-cancel`}
                className="p-1.5 rounded-lg text-error hover:bg-error/10 disabled:opacity-50">
                <XCircle size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reservations"
        subtitle="Manage bookings, check-ins, check-outs"
        breadcrumbs={[{ label: 'Home' }, { label: 'Reservations' }]}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft"
          >
            <Plus size={18} /> New Reservation
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={reservations}
        loading={loading}
        searchPlaceholder="Search guest, room, reservation #..."
        searchValue={urlSearch}
        onSearchChange={setUrlSearch}
        pageSize={12}
        emptyMessage="No reservations found."
      />

      {/* ── Create Reservation Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="New Reservation"
        size="lg"
        footer={
          <>
            <button onClick={closeModal}
              className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background transition-colors text-sm font-medium">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="px-5 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Reservation'}
            </button>
          </>
        }
      >
        {/* Room / Hall tab switcher */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-5">
          {[
            { val: 'room', icon: BedDouble, label: 'Room Reservation' },
            { val: 'hall', icon: Landmark, label: 'Hall Reservation' },
          ].map(({ val, icon: Icon, label }) => (
            <button
              key={val}
              onClick={() => { setResType(val); setFormErrors({}); setRohResult(null); setRecommendations([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${resType === val ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:text-text-primary'
                }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── ROOM FORM ─────────────────────────────────────────────────────── */}
        {resType === 'room' && (
          <div className="space-y-4">

            {/* Walk-in toggle — staff only */}
            {isStaff && (
              <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-primary/30 transition-colors">
                <input type="checkbox" name="isWalkIn" checked={roomForm.isWalkIn}
                  onChange={handleRoomChange} className="rounded border-border" />
                <div className="flex items-center gap-2">
                  <UserPlus size={15} className="text-primary" />
                  <span className="text-sm font-medium text-text-primary">Walk-in guest (no account)</span>
                </div>
              </label>
            )}

            {/* Walk-in guest details */}
            {roomForm.isWalkIn && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Guest Information</p>
                <FormField label="Guest Legal Name" name="guestName" placeholder="Full name as on ID"
                  value={roomForm.guestName} onChange={handleRoomChange} error={formErrors.guestName} required />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Phone" name="guestPhone" type="tel" placeholder="+251 9XX XXX XXX"
                    value={roomForm.guestPhone} onChange={handleRoomChange} error={formErrors.guestPhone} required />
                  <FormField label="Email" name="guestEmail" type="email" placeholder="guest@email.com"
                    value={roomForm.guestEmail} onChange={handleRoomChange} error={formErrors.guestEmail} required />
                </div>
              </div>
            )}

            {/* Step 1: Room Type */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Step 1 — Select Room Type
              </p>
              <FormField
                label="Room Type" name="roomTypeId" type="select"
                options={[{ value: '', label: 'Choose a type...' }, ...roomTypeOptions]}
                value={roomForm.roomTypeId} onChange={handleRoomChange}
                error={formErrors.roomTypeId} required
              />
              {roomForm.roomTypeId && (() => {
                const rt = roomTypes.find((r) => r._id === roomForm.roomTypeId);
                if (!rt) return null;
                return (
                  <div className="mt-1 text-xs text-text-secondary flex flex-wrap gap-3 px-1">
                    <span>Max {rt.maxOccupancy} guests</span>
                    <span>·</span>
                    <span className="text-primary font-medium">ETB {rt.basePricePerNight?.toLocaleString()}/night</span>
                    {rt.amenities?.length > 0 && <><span>·</span><span>{rt.amenities.slice(0, 3).join(', ')}</span></>}
                  </div>
                );
              })()}
            </div>

            {/* Step 2: Dates */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Step 2 — Select Dates
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Check-in" name="checkInDate" type="date"
                  value={roomForm.checkInDate} onChange={handleRoomChange}
                  error={formErrors.checkInDate} required
                  min={new Date().toISOString().split('T')[0]} />
                <FormField label="Check-out" name="checkOutDate" type="date"
                  value={roomForm.checkOutDate} onChange={handleRoomChange}
                  error={formErrors.checkOutDate} required
                  min={roomForm.checkInDate || new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <FormField label="Number of Guests" name="numberOfGuests" type="number"
              placeholder="1" value={roomForm.numberOfGuests} onChange={handleRoomChange}
              error={formErrors.numberOfGuests} required min="1" />

            {/* ROH availability check */}
            {roomForm.roomTypeId && roomForm.checkInDate && roomForm.checkOutDate && (
              <RoomAvailabilityChecker
                roomTypeId={roomForm.roomTypeId}
                checkInDate={roomForm.checkInDate}
                checkOutDate={roomForm.checkOutDate}
                numberOfGuests={roomForm.numberOfGuests}
                onResult={setRohResult}
              />
            )}

            {/* Recommendations panel (shown after failed attempt) */}
            {recommendations.length > 0 && (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 space-y-2">
                <p className="text-xs font-semibold text-warning uppercase tracking-wide">Alternatives</p>
                {recommendations.map((rec, i) => (
                  <div key={i} className="text-xs p-2 bg-white rounded-lg border border-border">
                    <span className="font-medium text-text-primary">{rec.name}</span>
                    <span className="text-text-secondary ml-2">{rec.suggestion}</span>
                  </div>
                ))}
              </div>
            )}

            <FormField label="Special Requests" name="specialRequests" type="textarea"
              placeholder="Dietary needs, early check-in, accessibility..." rows={2}
              value={roomForm.specialRequests} onChange={handleRoomChange} />

            {roomPricePreview && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  ETB {roomPricePreview.rate?.toLocaleString()}/night × {roomPricePreview.nights} night{roomPricePreview.nights !== 1 ? 's' : ''}
                </span>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">Estimated Total</p>
                  <p className="text-lg font-bold text-primary">ETB {roomPricePreview.total?.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HALL FORM ──────────────────────────────────────────────────────── */}
        {resType === 'hall' && (
          <div className="space-y-4">
            <FormField
              label="Hall Type" name="hallTypeId" type="select"
              options={[{ value: '', label: 'Choose a hall type...' }, ...hallTypeOptions]}
              value={hallForm.hallTypeId} onChange={handleHallChange}
              error={formErrors.hallTypeId} required
            />

            {hallForm.hallTypeId && (() => {
              const ht = hallTypes.find((h) => h._id === hallForm.hallTypeId);
              if (!ht) return null;
              return (
                <div className="text-xs text-text-secondary flex flex-wrap gap-3 px-1">
                  <span>Max {ht.maxOccupancy} guests</span>
                  <span>·</span>
                  <span className="text-warning font-medium">ETB {ht.basePricePerHour?.toLocaleString()}/hr</span>
                  {ht.amenities?.length > 0 && <><span>·</span><span>{ht.amenities.slice(0, 3).join(', ')}</span></>}
                </div>
              );
            })()}

            <FormField label="Event Date" name="eventDate" type="date"
              value={hallForm.eventDate} onChange={handleHallChange}
              error={formErrors.eventDate} required
              min={new Date().toISOString().split('T')[0]} />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Time" name="startTime" type="time"
                value={hallForm.startTime} onChange={handleHallChange} error={formErrors.startTime} required />
              <FormField label="End Time" name="endTime" type="time"
                value={hallForm.endTime} onChange={handleHallChange} error={formErrors.endTime} required />
            </div>

            {hallForm.startTime && hallForm.endTime && (() => {
              const h = calcHallHours(hallForm.startTime, hallForm.endTime);
              return h > 0 ? (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={14} className="text-primary" />
                  Duration: <strong className="text-text-primary">{h} hour{h !== 1 ? 's' : ''}</strong>
                </div>
              ) : null;
            })()}

            <FormField label="Number of Guests" name="numberOfGuests" type="number"
              placeholder="1" value={hallForm.numberOfGuests} onChange={handleHallChange}
              error={formErrors.numberOfGuests} required min="1" />

            <FormField label="Event Description / Special Requests" name="specialRequests" type="textarea"
              placeholder="Event type, setup requirements, AV needs..." rows={2}
              value={hallForm.specialRequests} onChange={handleHallChange} />

            {recommendations.length > 0 && (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 space-y-2">
                <p className="text-xs font-semibold text-warning uppercase tracking-wide">Alternatives</p>
                {recommendations.map((rec, i) => (
                  <div key={i} className="text-xs p-2 bg-white rounded-lg border border-border">
                    <span className="font-medium text-text-primary">{rec.name}</span>
                    <span className="text-text-secondary ml-2">{rec.suggestion}</span>
                  </div>
                ))}
              </div>
            )}

            {hallPricePreview && (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  ETB {hallPricePreview.rate?.toLocaleString()}/hr × {hallPricePreview.hours} hour{hallPricePreview.hours !== 1 ? 's' : ''}
                </span>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">Estimated Total</p>
                  <p className="text-lg font-bold text-warning">ETB {hallPricePreview.total?.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── View Reservation Detail Modal ────────────────────────────────────── */}
      <Modal
        isOpen={viewModal}
        onClose={() => { setViewModal(false); setSelected(null); }}
        title={`Reservation — ${selected?.reservationNumber || ''}`}
        size="md"
        footer={
          <button onClick={() => { setViewModal(false); setSelected(null); }}
            className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background transition-colors text-sm font-medium">
            Close
          </button>
        }
      >
        {selected && (
          <div className="space-y-4">
            {selected.isWalkIn && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
                <UserPlus size={14} className="text-primary" />
                <span className="text-xs font-semibold text-primary">Walk-in reservation</span>
                {selected.createdByStaff && (
                  <span className="text-xs text-text-secondary ml-auto">
                    by {selected.createdByStaff.firstName} {selected.createdByStaff.lastName}
                    {selected.createdByStaff.employeeId && ` (${selected.createdByStaff.employeeId})`}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Guest',
                  value: (() => {
                    const c = selected.customer || selected.customerId;
                    return c
                      ? `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email
                      : selected.guestName || 'Guest';
                  })(),
                },
                {
                  label: 'Contact',
                  value: (selected.customer || selected.customerId)?.email || selected.guestEmail || '—',
                },
                {
                  label: 'Room / Hall',
                  value: (() => {
                    const room = selected.room || selected.roomId;
                    const hall = selected.hall || selected.hallId;
                    const rt = selected.roomType || selected.roomTypeId;
                    const ht = selected.hallType || selected.hallTypeId;
                    if (room?.roomNumber) return `Room ${room.roomNumber} · Floor ${room.floor || '—'} · ${rt?.name || room.type || ''}`;
                    if (hall?.hallName) return `${hall.hallName} · ${ht?.name || ''}`;
                    return 'Pending assignment';
                  })(),
                },
                { label: 'Guests', value: selected.numberOfGuests || 1 },
                { label: 'Check-in', value: safeFormat(selected.checkInDate) },
                { label: 'Check-out', value: safeFormat(selected.checkOutDate) },
                { label: 'Total', value: `ETB ${(selected.totalPrice || 0).toLocaleString()}` },
                { label: 'Payment', value: selected.paymentStatus || 'UNPAID' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-background border border-border">
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-semibold text-text-primary text-sm">{value}</p>
                </div>
              ))}
            </div>

            {selected.specialRequests && (
              <div className="p-3 rounded-xl bg-background border border-border">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">Special Requests</p>
                <p className="text-sm text-text-primary">{selected.specialRequests}</p>
              </div>
            )}

            <StatusBadge type={selected.status?.toLowerCase()} />

            {/* Action buttons in detail modal */}
            {(() => {
              const isMine = selected.customerId?._id === user?._id || selected.customerId === user?._id;
              const canConf = CAN_CONFIRM.includes(role) && selected.status === 'PENDING';
              const canIn = CAN_CHECKIN.includes(role) && selected.status === 'CONFIRMED';
              const canOut = CAN_CHECKOUT.includes(role) && selected.status === 'CHECKED_IN';
              const canCan = (CAN_CANCEL.includes(role) || (role === 'CUSTOMER' && isMine))
                && !['CANCELLED', 'CHECKED_OUT'].includes(selected.status);
              if (!canConf && !canIn && !canOut && !canCan) return null;
              return (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {canConf && (
                    <button onClick={() => handleAction(selected._id, 'confirm')}
                      disabled={actionLoading === `${selected._id}-confirm`}
                      className="flex-1 py-2 rounded-btn text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50">
                      Confirm
                    </button>
                  )}
                  {canIn && (
                    <button onClick={() => handleAction(selected._id, 'check-in')}
                      disabled={actionLoading === `${selected._id}-check-in`}
                      className="flex-1 py-2 rounded-btn text-sm font-semibold bg-success/10 text-success hover:bg-success/20 disabled:opacity-50">
                      Check In
                    </button>
                  )}
                  {canOut && (
                    <button onClick={() => handleAction(selected._id, 'check-out')}
                      disabled={actionLoading === `${selected._id}-check-out`}
                      className="flex-1 py-2 rounded-btn text-sm font-semibold bg-warning/10 text-warning hover:bg-warning/20 disabled:opacity-50">
                      Check Out
                    </button>
                  )}
                  {canCan && (
                    <button onClick={() => handleAction(selected._id, 'cancel')}
                      disabled={actionLoading === `${selected._id}-cancel`}
                      className="flex-1 py-2 rounded-btn text-sm font-semibold bg-error/10 text-error hover:bg-error/20 disabled:opacity-50">
                      Cancel
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReservationsPage;