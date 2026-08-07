'use client';

import { useState } from 'react';
import { createEventApi } from '../services/api';

export default function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    organizer: 'HITian Inside'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.date) {
      setError('Title, Description, and Date are required.');
      return;
    }

    setLoading(true);
    try {
      const result = await createEventApi(formData);
      if (result.success) {
        onEventCreated(result.data);
        onClose();
        setFormData({
          title: '',
          description: '',
          date: '',
          location: '',
          organizer: 'HITian Inside'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Create New Event</h2>
        <p className="text-xs text-slate-400 mb-6">Fill in details to publish a new event to the backend API.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input 
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. HITian Hackathon 2026"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide event details, objectives, and schedule..."
              rows={3}
              className="form-textarea"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input 
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Auditorium / Online"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Organizer</label>
            <input 
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="e.g. HITian Inside Tech Club"
              className="form-input"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary text-sm min-w-[120px] justify-center"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
