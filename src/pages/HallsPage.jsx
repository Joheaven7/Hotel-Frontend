import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Home, Landmark, Users, DollarSign, Activity, Loader2, Edit, Eye, EyeOff } from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import FormField from '../components/ui/FormField';
import StatCard from '../components/ui/StatCard';
// import axios from 'axios';


const HallsPage = () => {
  const { user } = useAuthStore();
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    hallName: '',
    capacity: '',
    pricePerHour: '',
    description: '',
    amenities: '',
    status: 'Available',
  });

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);

      // Change '/halls/public-catalog' to '/halls'
      const response = await apiClient.get('/halls', {
        params: {
          adminView: 'true',       // Properly captured by getAllHalls controller
          includeDeleted: 'true'   // Properly captured by getAllHalls controller
        }
      });

      const allHalls = response.data.halls || response.data || [];
      setHalls(allHalls);
    } catch (error) {
      toast.error('Failed to load halls details');
    } finally {
      setLoading(false);
    }
  };
  const handleOpenCreateModal = () => {
    setEditingHall(null);
    setFormData({
      hallName: '',
      capacity: '',
      pricePerHour: '',
      description: '',
      amenities: '',
      status: 'Available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hall) => {
    setEditingHall(hall);
    setFormData({
      hallName: hall.hallName,
      capacity: hall.capacity,
      pricePerHour: hall.pricePerHour,
      description: hall.description || '',
      // Here lies a subtle type mutation!
      amenities: Array.isArray(hall.amenities) ? hall.amenities.join(', ') : hall.amenities || '',
      status: hall.status || 'Other',
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      pricePerHour: Number(formData.pricePerHour),
      status: formData.status,
      amenities: formData.amenities ? formData.amenities.split(',').map((a) => a.trim()) : [],
    };

    try {
      if (editingHall) {
        await apiClient.patch(`/halls/${editingHall._id}`, payload);
        toast.success('Hall updated successfully');
      } else {
        await apiClient.post('/halls', payload);
        toast.success('New Hall registered successfully');
      }
      setIsModalOpen(false);
      fetchHalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hall details');
    } finally {
      setActionLoading(false);
    }
  };
  

  const handleDeleteHall = async (hallId) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this hall?')) return;

    try {
      await apiClient.delete(`/halls/${hallId}`);
      toast.success('Hall deactivated successfully');
      fetchHalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate hall');
    }
  };

  const handleToggleVisibility = async (hallId) => {
    try {
      const response = await apiClient.patch(`/halls/${hallId}/toggle-visibility`);

      // Update local table state UI without removing the row
      setHalls((prevHalls) =>
        prevHalls.map((hall) =>
          hall._id === hallId ? { ...hall, isActive: response.data.hall.isActive } : hall
        )
      );

      toast.success(response.data.message);
    } catch (error) {
      console.error("Visibility switch error:", error);
      toast.error(error.response?.data?.message || "Could not alter landing page visibility status");
    }
  };

  const stats = {
    total: halls.length,
    maxCapacity: halls.reduce((max, h) => (h.capacity > max ? h.capacity : max), 0),
    avgRate: halls.length > 0 ? Math.round(halls.reduce((sum, h) => sum + h.pricePerHour, 0) / halls.length) : 0,
  };

  const hallColumns = [
    { header: 'Hall Name', accessor: 'hallName' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Price/Hour', accessor: 'pricePerHour' },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];
  // Fixed column definitions - use 'accessor' for render functions, 'searchKey' for search
  const columns = [
    {
      header: 'Hall Name',
      searchKey: 'hallName', // For searching
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Landmark size={18} />
          </div>
          <div>
            <p className="font-semibold text-text-primary">{row.hallName}</p>
            <p className="text-xs text-text-secondary line-clamp-1">{row.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Capacity',
      searchKey: 'capacity',
      accessor: (row) => (
        <span className="font-medium text-text-primary">
          {row.capacity.toLocaleString()} guests
        </span>
      ),
    },
    {
      header: 'Hourly Price',
      searchKey: 'pricePerHour',
      accessor: (row) => (
        <span className="font-semibold text-primary">
          ${row.pricePerHour}/hr
        </span>
      ),
    },
    {
      header: 'Amenities Offered',
      searchKey: 'amenities',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(row.amenities) && row.amenities.length > 0 ? (
            row.amenities.map((item, idx) => (
              <span key={idx} className="bg-background text-text-secondary border border-border px-2 py-0.5 rounded-md text-[10px] font-medium">
                {item}
              </span>
            ))
          ) : (
            <span className="text-text-secondary text-xs">Standard amenities</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      searchKey: 'status',
      accessor: (row) => row.status || 'Other',
      render: (row) => {
        const status = row.status || 'Other';
        const statusStyles = {
          Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          Booked: 'bg-blue-50 text-blue-700 border-blue-200',
          Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
          Other: 'bg-gray-50 text-gray-600 border-gray-200',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.Other}`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
        if (!canManage) return null;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 hover:bg-border/40 text-text-primary rounded-lg transition-colors duration-150"
              title="Edit Hall"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => handleDeleteHall(row._id)}
              className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors duration-150"
              title="Delete/Deactivate"
            >
              <Trash2 size={15} />
            </button>

            <button
              onClick={() => handleToggleVisibility(row._id)}
              className={`p-1.5 rounded-lg transition-colors ${row.isActive
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-blue-600 hover:bg-blue-50'
                }`}
              title={row.isActive ? "Hide from Landing Page" : "Show on Landing Page"}
            >
              {row.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        );
      },
    },
    {
      header: 'Landing Page',
      accessor: 'isActive',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
          {row.isActive ? 'Live' : 'Hidden'}
        </span>
      )
    },

  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Halls Management"
        subtitle="Configure event venues, banquets, business halls, capacity parameters, and pricing structures."
        action={
          (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all duration-200 shadow-soft"
            >
              <Plus size={20} />
              Add Hall
            </button>
          )
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Configured Venues"
          value={stats.total}
          icon={Landmark}
          color="primary"
        />
        <StatCard
          title="Maximum Host Capacity"
          value={`${stats.maxCapacity} Guests`}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Average Venue Cost"
          value={`$${stats.avgRate}/hr`}
          icon={DollarSign}
          color="primary"
        />
      </div>

      {/* DataTable */}
      <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
        <DataTable
          columns={columns}
          data={halls}
          loading={loading}
          searchPlaceholder="Search by venue name or description..."
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHall ? 'Modify Venue Configurations' : 'Register New Hall Venue'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <FormField
            label="Hall Name"
            name="hallName"
            type="text"
            value={formData.hallName}
            onChange={handleInputChange}
            required
            placeholder="e.g., Grand Ballroom, Sapphire Suite"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Hosting Capacity"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleInputChange}
              required
              placeholder="e.g., 250"
            />
            <FormField
              label="Price Per Hour ($)"
              name="pricePerHour"
              type="number"
              value={formData.pricePerHour}
              onChange={handleInputChange}
              required
              placeholder="e.g., 150"
            />
          </div>

          <FormField
            label="Amenities (Comma Separated List)"
            name="amenities"
            type="text"
            value={formData.amenities}
            onChange={handleInputChange}
            placeholder="e.g., Sound System, Stage, Projector, High-Speed Wi-Fi"
            helpText="Separate multiple amenities with commas."
          />

          <FormField
            label="Detailed Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Provide a summary detailing layout arrangements, catering options, etc..."
          />
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
              Hall Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
              required
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 bg-background hover:bg-border/30 text-text-primary border border-border rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-soft"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Configurations'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HallsPage;