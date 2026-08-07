'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import { createEventApi } from '../../../../services/api.service';
import { EventHighlight, EventStatus, EventMode } from '../../../../types/event.types';
import { ArrowLeft, Sparkles, Plus, X, Lock, GripVertical, Globe, MapPin, QrCode } from 'lucide-react';

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
    mode: 'OFFLINE' as EventMode,
    hasAttendance: false,
    requireFileUpload: false
  });

  const [highlights, setHighlights] = useState<EventHighlight[]>([
    { title: 'Schedule Highlight', description: 'Interactive workshops & live keynotes' }
  ]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
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
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  // Drag & Drop Reorder Handlers
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    setHighlights(prev => {
      const copy = [...prev];
      const draggedItem = copy[draggedIdx];
      copy.splice(draggedIdx, 1);
      copy.splice(index, 0, draggedItem);
      return copy;
    });
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
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
        location: formData.location.trim() || (formData.mode === 'ONLINE' ? 'Online Event (Link provided)' : 'Main Campus'),
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
              <p className="text-xs text-[#a69181] mt-0.5">Define event mode (Online/Offline), options, and details. Next step will build the registration form.</p>
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
                <label className="form-label">Event Mode *</label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="OFFLINE">OFFLINE (In-Person Campus Venue)</option>
                  <option value="ONLINE">ONLINE (Virtual / Google Meet / Zoom)</option>
                </select>
              </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  {formData.mode === 'ONLINE' ? 'Online Meeting Link / Platform' : 'Location / Venue *'}
                </label>
                <input 
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={formData.mode === 'ONLINE' ? 'e.g. Google Meet Link / Zoom' : 'e.g. Main Auditorium / Lab 3'}
                  className="form-input"
                  required={formData.mode === 'OFFLINE'}
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

              {/* Optional QR Attendance Toggle */}
              <div className="form-group justify-end pb-2">
                <label className="flex items-center gap-2 text-xs text-[#e6d7c3] cursor-pointer mt-4">
                  <input 
                    type="checkbox"
                    name="hasAttendance"
                    checked={formData.hasAttendance}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-white/20 text-[#800020] focus:ring-0"
                  />
                  <span className="font-semibold text-white inline-flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Enable QR Code Attendance System</span>
                  </span>
                </label>
                <p className="text-[11px] text-[#a69181] mt-1">
                  (Uncheck if this event does not require QR attendance passes)
                </p>
              </div>
            </div>

            {/* Custom Highlights with Drag & Drop Reordering */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#e6c594] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Custom Event Highlights (Drag handle to reorder)</span>
                </h3>
              </div>

              <div className="space-y-2">
                {highlights.map((item, idx) => (
                  <div 
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex gap-2 items-center bg-[#180509] p-3 rounded-xl border transition-all ${
                      draggedIdx === idx ? 'border-[#e6c594] opacity-50' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="cursor-grab active:cursor-grabbing p-1 text-[#a69181] hover:text-[#e6c594]">
                      <GripVertical className="w-4 h-4" />
                    </div>

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
                      placeholder="Description (e.g. INR 50,000 Cash)"
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

              <button 
                type="button" 
                onClick={handleAddHighlight}
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-[#800020]/30 hover:bg-[#800020] text-[#e6c594] hover:text-white border border-[#e6c594]/30 inline-flex items-center justify-center gap-1.5 transition-all mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Highlight</span>
              </button>
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
