import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Eye, Landmark, Users, DollarSign,
    ToggleLeft, ToggleRight, ChevronDown, ChevronUp, ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatCard from '../components/ui/StatCard';
import ImageUploader from '../components/ui/ImageUploader';

const EMPTY = {
    name: '', description: '', basePricePerHour: '',
    maxOccupancy: '', amenities: '', isPublished: true,
};

const HallTypesPage = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [linkedHalls, setLinkedHalls] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [savedTypeId, setSavedTypeId] = useState(null);
    const [savedImages, setSavedImages] = useState([]);

    useEffect(() => { fetchTypes(); }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/hall-types');
            setTypes(res.data.hallTypes || []);
        } catch { toast.error('Failed to load hall types'); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditing(null); setForm(EMPTY); setFormErrors({});
        setSavedTypeId(null); setSavedImages([]);
        setModalOpen(true);
    };

    const openEdit = (type) => {
        setEditing(type);
        setForm({
            name: type.name,
            description: type.description || '',
            basePricePerHour: type.basePricePerHour,
            maxOccupancy: type.maxOccupancy,
            amenities: (type.amenities || []).join(', '),
            isPublished: type.isPublished,
        });
        setFormErrors({});
        setSavedTypeId(type._id);
        setSavedImages(type.images || []);
        setModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type: t, checked } = e.target;
        setForm((p) => ({ ...p, [name]: t === 'checkbox' ? checked : value }));
        if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.name?.trim()) e.name = 'Name is required';
        if (!form.basePricePerHour || Number(form.basePricePerHour) <= 0) e.basePricePerHour = 'Valid price required';
        if (!form.maxOccupancy || Number(form.maxOccupancy) < 1) e.maxOccupancy = 'Min 1 guest';
        setFormErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description,
                basePricePerHour: Number(form.basePricePerHour),
                maxOccupancy: Number(form.maxOccupancy),
                amenities: form.amenities
                    ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
                isPublished: form.isPublished,
            };
            if (editing) {
                const res = await apiClient.put(`/hall-types/${editing._id}`, payload);
                setSavedTypeId(editing._id);
                setSavedImages(res.data.hallType?.images || editing.images || []);
                toast.success(`"${payload.name}" updated`);
            } else {
                const res = await apiClient.post('/hall-types', payload);
                setSavedTypeId(res.data.hallType._id);
                setSavedImages([]);
                toast.success(`Hall type "${payload.name}" created — you can now upload images`);
            }
            fetchTypes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/hall-types/${id}`);
            toast.success('Hall type deleted');
            setDeleteTarget(null);
            fetchTypes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleTogglePublish = async (type) => {
        try {
            await apiClient.put(`/hall-types/${type._id}`, { isPublished: !type.isPublished });
            toast.success(type.isPublished ? 'Hidden from gallery' : 'Now visible on gallery');
            fetchTypes();
        } catch { toast.error('Failed to toggle'); }
    };

    const handleExpand = async (typeId) => {
        if (expanded === typeId) { setExpanded(null); return; }
        setExpanded(typeId);
        if (!linkedHalls[typeId]) {
            try {
                const res = await apiClient.get(`/hall-types/${typeId}`);
                setLinkedHalls((p) => ({ ...p, [typeId]: res.data.halls || [] }));
            } catch { setLinkedHalls((p) => ({ ...p, [typeId]: [] })); }
        }
    };

    const stats = {
        total: types.length,
        published: types.filter((t) => t.isPublished).length,
        halls: types.reduce((s, t) => s + (t.hallCount || 0), 0),
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Hall Types"
                subtitle="Define venue categories — physical halls link to these types"
                breadcrumbs={[{ label: 'Home' }, { label: 'Hall Types' }]}
                action={
                    <button onClick={openCreate}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 transition-colors shadow-soft">
                        <Plus size={18} /> New Hall Type
                    </button>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Types" value={stats.total} icon={Landmark} color="primary" />
                <StatCard title="Published (Public)" value={stats.published} icon={Eye} color="success" />
                <StatCard title="Physical Halls" value={stats.halls} icon={Users} color="secondary" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : types.length === 0 ? (
                <div className="bg-white rounded-card border border-border shadow-soft p-12 text-center">
                    <Landmark size={48} className="mx-auto mb-4 text-text-secondary opacity-30" />
                    <p className="text-text-secondary font-medium mb-4">No hall types yet</p>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-medium hover:bg-primary/90 mx-auto">
                        <Plus size={16} /> Create Hall Type
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {types.map((type) => (
                        <div key={type._id} className="bg-white rounded-card border border-border shadow-soft overflow-hidden">
                            <div className="p-5 flex items-start gap-4">
                                {type.images?.[0] ? (
                                    <img src={type.images[0]} alt={type.name}
                                        className="w-20 h-14 object-cover rounded-xl border border-border shrink-0" />
                                ) : (
                                    <div className="w-20 h-14 bg-background border border-border rounded-xl flex items-center justify-center shrink-0">
                                        <ImageIcon size={20} className="text-text-secondary opacity-40" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-text-primary text-base">{type.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${type.isPublished ? 'bg-success/10 text-success border-success/20' : 'bg-text-secondary/10 text-text-secondary border-border'}`}>
                                            {type.isPublished ? 'Public' : 'Hidden'}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 font-medium">
                                            {type.hallCount || 0} hall{(type.hallCount || 0) !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-text-secondary font-medium">
                                            {type.images?.length || 0} photo{(type.images?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-1">
                                        <span><strong className="text-warning">ETB {type.basePricePerHour?.toLocaleString()}</strong>/hour</span>
                                        <span>Max {type.maxOccupancy} guests</span>
                                    </div>
                                    {type.amenities?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {type.amenities.slice(0, 4).map((a) => (
                                                <span key={a} className="text-xs px-1.5 py-0.5 bg-background border border-border rounded text-text-secondary">{a}</span>
                                            ))}
                                            {type.amenities.length > 4 && <span className="text-xs text-text-secondary">+{type.amenities.length - 4} more</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => handleTogglePublish(type)} title={type.isPublished ? 'Hide' : 'Show'}
                                        className={`p-1.5 rounded-lg transition-colors ${type.isPublished ? 'text-success hover:bg-success/10' : 'text-text-secondary hover:bg-background'}`}>
                                        {type.isPublished ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button onClick={() => openEdit(type)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"><Edit2 size={15} /></button>
                                    <button onClick={() => setDeleteTarget(type)} className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"><Trash2 size={15} /></button>
                                    <button onClick={() => handleExpand(type._id)} className="p-1.5 rounded-lg text-text-secondary hover:bg-background ml-1">
                                        {expanded === type._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>

                            {expanded === type._id && (
                                <div className="border-t border-border bg-background px-5 py-4">
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Linked physical halls</p>
                                    {linkedHalls[type._id]?.length === 0
                                        ? <p className="text-sm text-text-secondary">No halls linked yet.</p>
                                        : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {(linkedHalls[type._id] || []).map((hall) => (
                                                    <div key={hall._id} className="p-3 bg-white rounded-xl border border-border text-center">
                                                        <p className="font-bold text-text-primary text-sm">{hall.hallName}</p>
                                                        <p className="text-xs text-text-secondary">Floor {hall.floor || '—'}</p>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${hall.housekeepingStatus === 'CLEAN' ? 'bg-success/10 text-success'
                                                                : hall.housekeepingStatus === 'DIRTY' ? 'bg-error/10 text-error'
                                                                    : 'bg-warning/10 text-warning'
                                                            }`}>{hall.housekeepingStatus || 'CLEAN'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null); setSavedTypeId(null); fetchTypes(); }}
                title={editing ? `Edit — ${editing.name}` : 'New Hall Type'}
                size="lg"
                footer={
                    <>
                        <button onClick={() => { setModalOpen(false); setEditing(null); setSavedTypeId(null); fetchTypes(); }}
                            className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium">
                            Close
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-5 py-2 rounded-btn bg-primary text-white hover:bg-primary/90 text-sm font-medium disabled:opacity-60">
                            {saving ? 'Saving...' : savedTypeId ? 'Update' : 'Create Type'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <FormField label="Type Name" name="name" placeholder="e.g. Grand Ballroom, Conference Hall"
                        value={form.name} onChange={handleChange} error={formErrors.name} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Base Price / Hour (ETB)" name="basePricePerHour" type="number" placeholder="0" min="0"
                            value={form.basePricePerHour} onChange={handleChange} error={formErrors.basePricePerHour} required />
                        <FormField label="Max Occupancy" name="maxOccupancy" type="number" placeholder="50" min="1"
                            value={form.maxOccupancy} onChange={handleChange} error={formErrors.maxOccupancy} required />
                    </div>
                    <FormField label="Description" name="description" type="textarea" rows={2}
                        placeholder="Marketing description for the gallery..." value={form.description} onChange={handleChange} />
                    <div>
                        <FormField label="Amenities (comma-separated)" name="amenities"
                            placeholder="PA System, Projector, Stage, Catering Kitchen, Wi-Fi"
                            value={form.amenities} onChange={handleChange} />
                        {form.amenities && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {form.amenities.split(',').map((a) => a.trim()).filter(Boolean).map((a) => (
                                    <span key={a} className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full border border-warning/20">{a}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background cursor-pointer hover:border-primary/30 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Visible on public gallery</p>
                            <p className="text-xs text-text-secondary">Customers can browse and book this hall type</p>
                        </div>
                        <div className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors"
                            style={{ backgroundColor: form.isPublished ? '#10b981' : '#d1d5db' }}>
                            <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="sr-only" />
                            <span className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ml-1"
                                style={{ transform: form.isPublished ? 'translateX(20px)' : 'translateX(0)' }} />
                        </div>
                    </label>
                    {editing && editing.hallCount > 0 && (
                        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                            <p className="text-xs text-warning font-medium">
                                ⚠ Updating price or occupancy syncs to all {editing.hallCount} linked hall(s).
                            </p>
                        </div>
                    )}
                    <div className="border-t border-border pt-4">
                        <ImageUploader
                            typeId={savedTypeId}
                            endpoint="hall-type"
                            images={savedImages}
                            onUpdate={(imgs) => {
                                setSavedImages(imgs);
                                setTypes((prev) => prev.map((t) => t._id === savedTypeId ? { ...t, images: imgs } : t));
                            }}
                            maxImages={5}
                        />
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Hall Type" size="sm"
                footer={
                    <>
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-btn border border-border text-text-primary hover:bg-background text-sm font-medium">Cancel</button>
                        <button onClick={() => handleDelete(deleteTarget._id)} className="px-5 py-2 rounded-btn bg-error text-white hover:bg-error/90 text-sm font-medium">Delete</button>
                    </>
                }
            >
                <p className="text-text-secondary text-sm">
                    Delete <strong className="text-text-primary">"{deleteTarget?.name}"</strong>?
                    {deleteTarget?.hallCount > 0
                        ? <span className="block mt-2 text-error font-medium">⚠ {deleteTarget.hallCount} hall(s) must be reassigned first.</span>
                        : <span className="block mt-2">This cannot be undone.</span>}
                </p>
            </Modal>
        </div>
    );
};

export default HallTypesPage;