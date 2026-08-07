'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import { createEventApi } from '../../../../services/api.service';
import { EventHighlight, EventStatus } from '../../../../types/event.types';
import { ArrowLeft, Calendar, Sparkles, Plus, X, Lock } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    organizer: 'HITian Inside',
    status: 'UPCOMING' as EventStatus,
    hasAttendance: true,
    requireFileUpload: false
  });

  const [highlights, setHighlights] = useState<EventHighlight[]>([
    { title: 'Schedule Highlight', description: 'Interactive workshops & live keynotes' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  if (!isAuthenticated) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddHighlight = () => {
    setHighlights(prev => [...prev, { title: '', description: '' }]);
  };

  const handleUpdateHighlight = (index: number, key: keyof EventHighlight, value: string) => {
    setHighlights(prev => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.date) {
      setError('Title, Description, and Date are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        highlights: highlights.filter(h => h.title.trim())
      };

      const result = await createEventApi(payload);
      if (result.success && result.data) {
        const eventId = result.data.id || result.data._id;
        router.push(`/admin/events/${eventId}/form-builder`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Console</span>
        </Link>

        <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Event</h1>
              <p className="text-xs text-[#a69181] mt-0.5">Define event details and status. Next step will build the registration form.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#800020]/30 text-[#e6c594] border border-[#e6c594]/30 text-xs font-semibold inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Mode</span>
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input 
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. HITian Tech Symposium 2026"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Event Description *</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed event description and agenda..."
                rows={4}
                className="form-textarea"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Event Date *</label>
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
                <label className="form-label">Location *</label>
                <input 
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Main Auditorium / Computer Lab 3"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Organizer Name</label>
                <input 
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleChange}
                  placeholder="e.g. HITian Tech Club"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Event Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="UPCOMING">UPCOMING (Registration Open)</option>
                  <option value="LIVE">LIVE Now</option>
                  <option value="DONE">DONE (Archived / Hidden from Homepage)</option>
                </select>
              </div>
            </div>

            {/* Custom Highlights */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#e6c594] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Custom Event Highlights</span>
                </h3>
                <button 
                  type="button" 
                  onClick={handleAddHighlight}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[#800020]/40 text-[#e6c594] border border-[#e6c594]/30 hover:bg-[#800020] inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Highlight</span>
                </button>
              </div>

              {highlights.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-[#180509] p-3 rounded-xl border border-white/5">
                  <input 
                    type="text"
                    value={item.title}
                    onChange={e => handleUpdateHighlight(idx, 'title', e.target.value)}
                    placeholder="Highlight Title (e.g. Prize Pool)"
                    className="form-input flex-1 text-xs"
                  />
                  <input 
                    type="text"
                    value={item.description}
                    onChange={e => handleUpdateHighlight(idx, 'description', e.target.value)}
                    placeholder="Description (e.g. ₹50,000 Cash)"
                    className="form-input flex-1 text-xs"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveHighlight(idx)}
                    className="text-rose-400 p-2 text-sm hover:text-rose-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <Link href="/admin" className="btn-secondary text-sm">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary text-sm min-w-[180px] justify-center"
              >
                {loading ? 'Creating...' : 'Save & Build Registration Form →'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
