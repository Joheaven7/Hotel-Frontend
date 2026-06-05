import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Filter, 
  Eye, 
  Check, 
  Play, 
  Trash2, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  CheckCircle,
  Search
} from 'lucide-react';
import apiClient from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import StatCard from '../components/ui/StatCard';
import FormField from '../components/ui/FormField';
import MaintenanceForm from '../components/forms/MaintenanceForm';
import { useAuthStore } from '../store/authStore';

const MaintenancePage = () => {
  const [maintenance, setMaintenance] = useState([]);
  const [filteredMaintenance, setFilteredMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,

  });

  const { user } = useAuthStore();
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const canUpdateStatus = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user?.role);

  useEffect(() => {
    fetchMaintenance();
  }, []);

  useEffect(() => {
    filterMaintenance();
  }, [maintenance, filterStatus, filterPriority, searchTerm]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/maintenance');
      const allMaintenance = response.data.maintenance || response.data || [];
      setMaintenance(allMaintenance);

      // Calculate stats
      setStats({
        total: allMaintenance.length,
        open: allMaintenance.filter((m) => m.status === 'OPEN').length,
        inProgress: allMaintenance.filter((m) => m.status === 'IN_PROGRESS').length,
        completed: allMaintenance.filter((m) => m.status === 'COMPLETED').length,
      });
    } catch (error) {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const filterMaintenance = () => {
    let filtered = maintenance;

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'ALL') {
      filtered = filtered.filter((m) => m.priority === filterPriority);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.roomId?.roomNumber?.toString().includes(searchTerm) ||
          m.roomId?.toString().includes(searchTerm)
      );
    }

    setFilteredMaintenance(filtered);
  };

  const handleCreateSuccess = async () => {
    setIsFormModalOpen(false);
    await fetchMaintenance();
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (!canDelete) {
      toast.error('You are not authorized to delete maintenance requests');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this maintenance request?')) return;

    const toastId = toast.loading('Deleting request...');
    try {
      await apiClient.delete(`/maintenance/${maintenanceId}`);
      toast.success('Maintenance request deleted successfully', { id: toastId });
      await fetchMaintenance();
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete maintenance request', { id: toastId });
    }
  };

  const handleUpdateStatus = async (maintenanceId, newStatus) => {
    const toastId = toast.loading('Updating status...');
    try {
      await apiClient.put(`/maintenance/${maintenanceId}`, { status: newStatus });
      toast.success(`Request marked as ${newStatus.replace('_', ' ').toLowerCase()}`, { id: toastId });
      await fetchMaintenance();
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error('Failed to update status', { id: toastId });
    }
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      LOW: 'bg-info/10 text-info border-info/20',
      MEDIUM: 'bg-warning/10 text-warning border-warning/20',
      HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      CRITICAL: 'bg-error/10 text-error border-error/20',
    };
    return colors[priority] || 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'CRITICAL') return '🚨';
    if (priority === 'HIGH') return '⚠️';
    if (priority === 'MEDIUM') return '⚡';
    return '📝';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Management"
        subtitle="Track, assign, and manage room repairs and maintenance requests."
       action={
          canUpdateStatus && (
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold transition-all shadow-soft"
            >
              <Plus size={20} /> New Request
            </button>
          )
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={Wrench}
          color="primary"
        />
        <StatCard
          title="Open Requests"
          value={stats.open}
          icon={AlertTriangle}
          color="error"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="success"
        />
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-card border border-border p-6 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <FormField
            label="Search Request"
            name="searchTerm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Room number, title, or keywords..."
          />

          <FormField
            label="Filter by Status"
            name="filterStatus"
            type="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'OPEN', label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />

          <FormField
            label="Filter by Priority"
            name="filterPriority"
            type="select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />
        </div>
      </div>

      {/* Maintenance Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface rounded-card border border-border p-6 shadow-soft animate-pulse h-60"></div>
          ))}
        </div>
      ) : filteredMaintenance.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaintenance.map((req) => (
            <div
              key={req._id}
              className="bg-surface rounded-card border border-border overflow-hidden hover:shadow-elevated transition-all duration-300 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-border bg-background/30">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-semibold text-text-primary text-lg line-clamp-1">{req.title}</h3>
                  <span className="text-xl flex-shrink-0">{getPriorityIcon(req.priority)}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status={req.status.toLowerCase()} />
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getPriorityBadgeColor(req.priority)}`}>
                    {req.priority}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <p className="text-text-secondary text-sm line-clamp-3 mb-4">{req.description}</p>

                <div className="space-y-1.5 text-xs text-text-secondary mb-5 border-t border-border/60 pt-4">
                  {req.roomId && (
                    <p className="flex justify-between">
                      <span className="font-medium text-text-primary">Room Number:</span>
                      <span className="font-semibold">Room {req.roomId.roomNumber || req.roomId}</span>
                    </p>
                  )}
                  {req.assignedTo && (
                    <p className="flex justify-between">
                      <span className="font-medium text-text-primary">Assigned to:</span>
                      <span>{req.assignedTo.firstName} {req.assignedTo.lastName}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="font-medium text-text-primary">Logged Date:</span>
                    <span>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    setSelectedMaintenance(req);
                    setIsDetailModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-background hover:bg-border/40 text-text-primary border border-border rounded-xl text-sm font-semibold transition-all duration-200"
                >
                  <Eye size={15} />
                  View & Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface border border-border rounded-card shadow-soft">
          <Wrench className="text-text-secondary/40 mx-auto mb-4" size={48} />
          <p className="text-text-primary text-lg font-semibold">No maintenance requests found</p>
          <p className="text-text-secondary text-sm mt-1">Everything is in perfect working order!</p>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="File Maintenance Request"
      >
        <MaintenanceForm onSuccess={handleCreateSuccess} />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Request Details"
      >
        {selectedMaintenance && (
          <div className="space-y-6">
            <div>
              <span className="text-xs text-text-secondary font-medium">REQUEST TITLE</span>
              <h2 className="text-xl font-bold text-text-primary mt-1">{selectedMaintenance.title}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-xl border border-border">
                <span className="text-xs text-text-secondary font-medium block">ROOM</span>
                <span className="font-semibold text-text-primary mt-1 block">
                  Room {selectedMaintenance.roomId?.roomNumber || selectedMaintenance.roomId}
                </span>
              </div>
              <div className="bg-background p-4 rounded-xl border border-border">
                <span className="text-xs text-text-secondary font-medium block">PRIORITY</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-md border text-xs font-semibold mt-1.5 ${getPriorityBadgeColor(selectedMaintenance.priority)}`}>
                  {selectedMaintenance.priority}
                </span>
              </div>
            </div>

            <div className="bg-background p-4 rounded-xl border border-border">
              <span className="text-xs text-text-secondary font-medium">DESCRIPTION</span>
              <p className="text-text-primary text-sm mt-1">{selectedMaintenance.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
              <div>
                <span className="font-medium text-text-primary">Logged Date:</span>
                <p className="mt-0.5">{selectedMaintenance.createdAt ? new Date(selectedMaintenance.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-text-primary">Current Status:</span>
                <div className="mt-1.5">
                  <StatusBadge status={selectedMaintenance.status.toLowerCase()} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              {canUpdateStatus && selectedMaintenance.status === 'OPEN' && (
                <button
                  onClick={() => handleUpdateStatus(selectedMaintenance._id, 'IN_PROGRESS')}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-warning hover:bg-warning/90 text-text-primary rounded-xl font-semibold transition-all duration-200"
                >
                  <Play size={16} />
                  Start Work
                </button>
              )}

              {canUpdateStatus && selectedMaintenance.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleUpdateStatus(selectedMaintenance._id, 'COMPLETED')}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-success hover:bg-success/90 text-white rounded-xl font-semibold transition-all duration-200"
                >
                  <Check size={16} />
                  Mark Complete
                </button>
              )}

             {canDelete && (
              <button
                onClick={() => handleDeleteMaintenance(selectedMaintenance._id)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-error/10 hover:bg-error/20 text-error rounded-xl font-semibold transition-all duration-200"
              >
                <Trash2 size={16} />
                Delete Request
              </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaintenancePage;