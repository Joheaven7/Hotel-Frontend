import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import FormField from '../ui/FormField';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MaintenanceForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await apiClient.get('/rooms');
      const allRooms = response.data.rooms || response.data || [];
      setRooms(allRooms);
    } catch (err) {
      toast.error('Failed to load active rooms');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.roomId || !formData.title) {
        throw new Error('Please fill in all required fields');
      }

      await apiClient.post('/maintenance', formData);
      toast.success('Maintenance request created successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        label="Select Room"
        name="roomId"
        type="select"
        value={formData.roomId}
        onChange={handleChange}
        required
        placeholder={roomsLoading ? 'Loading rooms...' : 'Choose a room'}
        disabled={roomsLoading}
        options={rooms.map((room) => ({
          value: room._id,
          label: `Room ${room.roomNumber} - Floor ${room.floor} (${room.type})`,
        }))}
      />

      <FormField
        label="Request Title"
        name="title"
        type="text"
        value={formData.title}
        onChange={handleChange}
        required
        placeholder="e.g., AC not cooling, bathroom leak"
      />

      <FormField
        label="Detailed Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        rows={4}
        placeholder="Provide details about the issue..."
      />

      <FormField
        label="Priority"
        name="priority"
        type="select"
        value={formData.priority}
        onChange={handleChange}
        required
        options={[
          { value: 'LOW', label: 'Low - General issue' },
          { value: 'MEDIUM', label: 'Medium - Operational impact' },
          { value: 'HIGH', label: 'High - Service disruption' },
          { value: 'CRITICAL', label: 'Critical - System outage' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={loading || roomsLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/95 disabled:bg-primary/40 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-soft"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Request...
            </>
          ) : (
            'Submit Request'
          )}
        </button>
      </div>
    </form>
  );
};

export default MaintenanceForm;