'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../../components/Navbar';
import ImageCropModal from '../../../../../components/ImageCropModal';
import { fetchEventById, updateEventDetailsApi } from '../../../../../services/api.service';
import { EventHighlight, EventStatus, EventMode } from '../../../../../types/event.types';
import { ArrowLeft, Sparkles, Plus, X, Lock, GripVertical, Image as ImageIcon, Crop, Save, Calendar } from 'lucide-react';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    date: '',
    location: '',
    organizer: 'HITian Inside',
    status: 'UPCOMING' as EventStatus,
    mode: 'OFFLINE' as EventMode,
    bannerUrl: '',
    coverUrl: '',
    hasAttendance: false,
    requireFileUpload: false
  });

  // Cropper Modal States
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [selectedRawImage, setSelectedRawImage] = useState<string>('');
  const [targetType, setTargetType] = useState<'banner' | 'cover'>('banner');
  const [initialAspect, setInitialAspect] = useState<number>(16 / 9);

  const [highlights, setHighlights] = useState<EventHighlight[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  useEffect(() => {
    if (!isAuthenticated || !eventId) return;

    const loadEventData = async () => {
      setFetching(true);
      try {
        const ev = await fetchEventById(eventId);
        if (ev) {
          setFormData({
            title: ev.title || '',
            description: ev.description || '',
            startDate: ev.startDate || ev.date || '',
            endDate: ev.endDate || '',
            date: ev.date || '',
            location: ev.location || '',
            organizer: ev.organizer || 'HITian Inside',
            status: ev.status || 'UPCOMING',
            mode: ev.mode || 'OFFLINE',
            bannerUrl: ev.bannerUrl || '',
            coverUrl: ev.coverUrl || '',
            hasAttendance: Boolean(ev.hasAttendance),
            requireFileUpload: Boolean(ev.requireFileUpload)
          });
          setHighlights(ev.highlights || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event data');
      } finally {
        setFetching(false);
      }
    };

    loadEventData();
  }, [isAuthenticated, eventId]);

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

  const triggerCropModal = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedRawImage(reader.result as string);
      setTargetType(type);
      setInitialAspect(type === 'banner' ? 16 / 9 : 4 / 3);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropUploadSuccess = (url: string, type: 'banner' | 'cover') => {
    if (type === 'banner') {
      setFormData(prev => ({ ...prev, bannerUrl: url }));
    } else {
      setFormData(prev => ({ ...prev, coverUrl: url }));
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

  const formatDisplayDate = (startStr: string, endStr?: string) => {
    if (!startStr) return '';
    const startObj = new Date(startStr);
    const startFormatted = isNaN(startObj.getTime()) ? startStr : startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!endStr || endStr === startStr) return startFormatted;

    const endObj = new Date(endStr);
    const endFormatted = isNaN(endObj.getTime()) ? endStr : endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFormatted} – ${endFormatted}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.title || !formData.description || (!formData.startDate && !formData.date)) {
      setError('Title, Description, and Date are required.');
      return;
    }

    setLoading(true);
    try {
      const formattedDateString = formatDisplayDate(formData.startDate || formData.date, formData.endDate);

      const payload = {
        ...formData,
        date: formattedDateString || formData.date,
        location: formData.location.trim() || (formData.mode === 'ONLINE' ? 'Online Event (Link provided)' : 'Main Campus'),
        highlights: highlights.filter(h => h.title.trim())
      };

      const result = await updateEventDetailsApi(eventId, payload);
      if (result.success) {
        setSuccessMsg('Event details & dates updated successfully!');
        setTimeout(() => {
          router.push('/admin');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
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

        {fetching ? (
          <div className="glass-panel p-12 text-center text-[#a69181]">
            <div className="inline-block w-6 h-6 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Loading event details...</p>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Event Details & Dates</h1>
                <p className="text-xs text-[#a69181] mt-0.5">Update single-day or multi-day date ranges and banner assets anytime.</p>
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

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dual Image Uploaders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#180509] p-5 rounded-2xl border border-white/10">
                <div className="form-group mb-0">
                  <label className="form-label font-semibold flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-white">
                      <ImageIcon className="w-4 h-4 text-[#e6c594]" />
                      <span>Header Banner (16:9)</span>
                    </span>
                    <span className="text-[10px] text-[#e6c594] font-mono px-2 py-0.5 rounded bg-[#800020]/40">16 : 9</span>
                  </label>

                  {formData.bannerUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#e6c594]/40 h-36 bg-black/40 group">
                      <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1 rounded bg-[#800020] text-white text-xs font-semibold cursor-pointer">
                          Change Banner
                          <input type="file" onChange={(e) => triggerCropModal(e, 'banner')} accept="image/*" className="hidden" />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                          className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 h-36 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] hover:border-[#e6c594]/40 transition-colors cursor-pointer text-center">
                      <Crop className="w-6 h-6 text-[#e6c594] mb-1" />
                      <span className="text-xs font-medium text-white mb-0.5">Upload 16:9 Banner</span>
                      <span className="text-[10px] text-[#a69181]">Optional (Can add later)</span>
                      <input type="file" onChange={(e) => triggerCropModal(e, 'banner')} accept="image/*" className="hidden" />
                    </label>
                  )}
                </div>

                <div className="form-group mb-0">
                  <label className="form-label font-semibold flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-white">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span>Card Cover Image (4:3)</span>
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded bg-cyan-500/20">4 : 3</span>
                  </label>

                  {formData.coverUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 h-36 bg-black/40 group">
                      <img src={formData.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1 rounded bg-cyan-700 text-white text-xs font-semibold cursor-pointer">
                          Change Cover
                          <input type="file" onChange={(e) => triggerCropModal(e, 'cover')} accept="image/*" className="hidden" />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, coverUrl: '' }))}
                          className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 h-36 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] hover:border-cyan-400/40 transition-colors cursor-pointer text-center">
                      <Crop className="w-6 h-6 text-cyan-400 mb-1" />
                      <span className="text-xs font-medium text-white mb-0.5">Upload 4:3 Cover</span>
                      <span className="text-[10px] text-[#a69181]">Optional (Can add later)</span>
                      <input type="file" onChange={(e) => triggerCropModal(e, 'cover')} accept="image/*" className="hidden" />
                    </label>
                  )}
                </div>
              </div>

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

              {/* Date Range Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#180509] p-4 rounded-2xl border border-white/10">
                <div className="form-group mb-0">
                  <label className="form-label flex items-center gap-1.5 text-xs text-white">
                    <Calendar className="w-4 h-4 text-[#e6c594]" />
                    <span>Start Date *</span>
                  </label>
                  <input 
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input text-xs"
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label flex items-center gap-1.5 text-xs text-[#e6d7c3]">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>End Date (Optional for multi-day range)</span>
                  </label>
                  <input 
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className="form-input text-xs"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Event Status</label>
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
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 text-xs text-[#e6d7c3] cursor-pointer">
                  <input 
                    type="checkbox"
                    name="hasAttendance"
                    checked={formData.hasAttendance}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-white/20 text-[#800020] focus:ring-0"
                  />
                  <span className="font-semibold text-white">Enable QR Code Attendance System</span>
                </label>
              </div>

              {/* Custom Highlights */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#e6c594] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Custom Event Highlights</span>
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
                        placeholder="Highlight Title"
                        className="form-input flex-1 text-xs"
                      />

                      <input 
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateHighlight(idx, 'description', e.target.value)}
                        placeholder="Description"
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
                  className="btn-primary text-sm min-w-[180px] justify-center inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <ImageCropModal 
        isOpen={cropModalOpen}
        imageSrc={selectedRawImage}
        initialAspect={initialAspect}
        targetType={targetType}
        onClose={() => setCropModalOpen(false)}
        onUploadSuccess={handleCropUploadSuccess}
      />
    </div>
  );
}
