import React, { useState } from 'react';
import apiClient from '../../services/api';
import { AlertCircle, Loader } from 'lucide-react';

const RoomForm = ({ room, onSuccess }) => {
  const [formData, setFormData] = useState(
    room || {
      roomNumber: '',
      type: 'DOUBLE',
      capacity: 2,
      pricePerNight: 0,
      floor: 1,
      amenities: [],
      description: '',
      images: [],
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amenityInput, setAmenityInput] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (idx) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (room) {
        await apiClient.patch(`/rooms/${room._id}`, formData);
      } else {
        await apiClient.post('/rooms', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="alert alert-danger flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="roomNumber">Room Number</label>
          <input
            type="text"
            id="roomNumber"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            required
            placeholder="101"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Room Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="form-select"
          >
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="SUITE">Suite</option>
            <option value="DELUXE">Deluxe</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="form-group">
          <label htmlFor="capacity">Capacity</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pricePerNight">Price/Night ($)</label>
          <input
            type="number"
            id="pricePerNight"
            name="pricePerNight"
            value={formData.pricePerNight}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="floor">Floor</label>
          <input
            type="number"
            id="floor"
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            min="1"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder="Room description..."
          className="form-textarea"
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="amenityInput">Amenities</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            id="amenityInput"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            placeholder="e.g., WiFi, AC, TV"
            className="form-input flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAmenity();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddAmenity}
            className="btn btn-outline"
          >
            Add
          </button>
        </div>

        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(idx)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Room'
          )}
        </button>
      </div>
    </form>
  );
};

export default RoomForm;