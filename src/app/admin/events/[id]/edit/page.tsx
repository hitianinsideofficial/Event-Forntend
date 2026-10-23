'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../../../components/AdminNavbar';
import ImageCropModal from '../../../../../components/ImageCropModal';
import { QRCodeSVG } from 'qrcode.react';
import { fetchEventById, updateEventDetailsApi } from '../../../../../services/api.service';
import { EventHighlight, EventStatus, EventMode, EventTheme } from '../../../../../types/event.types';
import { ArrowLeft, Sparkles, Plus, X, Lock, GripVertical, Image as ImageIcon, Crop, Save, Calendar, Flag, QrCode, CreditCard } from 'lucide-react';

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
    theme: 'DEFAULT' as EventTheme,
    isFlagship: false,
    bannerUrl: '',
    coverUrl: '',
    hasAttendance: false,
    requireFileUpload: false,
    isHidden: false,
    showGallery: true,
    upiId: '',
    payeeName: '',
    registrationFee: '',
    paymentNote: '',
    upiQrUrl: ''
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
            theme: ev.theme || (ev.title.toLowerCase().includes('swaraj') ? 'TRICOLOUR' : 'DEFAULT'),
            isFlagship: Boolean(ev.isFlagship || ev.title.toLowerCase().includes('swaraj')),
            bannerUrl: ev.bannerUrl || '',
            coverUrl: ev.coverUrl || '',
            hasAttendance: Boolean(ev.hasAttendance),
            requireFileUpload: Boolean(ev.requireFileUpload),
            isHidden: Boolean(ev.isHidden),
            showGallery: ev.showGallery !== false,
            upiId: ev.upiId || '',
            payeeName: ev.payeeName || '',
            registrationFee: ev.registrationFee !== undefined ? String(ev.registrationFee) : '',
            paymentNote: ev.paymentNote || '',
            upiQrUrl: ev.upiQrUrl || ''
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
        setSuccessMsg('Event edition, banners & details updated successfully!');
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 mb-6 transition-colors font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {fetching ? (
          <div className="bg-white border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent animate-spin mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading event details...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Event Details & Banners</h1>
                <p className="text-xs text-slate-500 mt-0.5">Update edition titles, banner/cover artwork, venues, and live status.</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Admin Console</span>
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dual Image Uploaders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 border border-slate-200">
                <div className="mb-0">
                  <label className="font-bold flex items-center justify-between text-xs mb-2 uppercase tracking-wider text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Header Banner (16:9)</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono px-2 py-0.5 bg-slate-200 border border-slate-300 font-bold">16 : 9</span>
                  </label>

                  {formData.bannerUrl ? (
                    <div className="relative border border-slate-300 h-36 bg-slate-100 group">
                      <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1 bg-slate-900 text-white text-xs font-bold cursor-pointer">
                          Change
                          <input type="file" onChange={(e) => triggerCropModal(e, 'banner')} accept="image/*" className="hidden" />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 h-36 border-2 border-dashed border-slate-300 bg-white hover:border-slate-400 transition-colors cursor-pointer text-center">
                      <Crop className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-xs font-bold text-slate-800 mb-0.5 uppercase">Upload 16:9 Banner</span>
                      <span className="text-[10px] text-slate-500">Optional (Can add later)</span>
                      <input type="file" onChange={(e) => triggerCropModal(e, 'banner')} accept="image/*" className="hidden" />
                    </label>
                  )}
                </div>

                <div className="mb-0">
                  <label className="font-bold flex items-center justify-between text-xs mb-2 uppercase tracking-wider text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Card Cover Image (4:3)</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono px-2 py-0.5 bg-slate-200 border border-slate-300 font-bold">4 : 3</span>
                  </label>

                  {formData.coverUrl ? (
                    <div className="relative border border-slate-300 h-36 bg-slate-100 group">
                      <img src={formData.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1 bg-slate-900 text-white text-xs font-bold cursor-pointer">
                          Change
                          <input type="file" onChange={(e) => triggerCropModal(e, 'cover')} accept="image/*" className="hidden" />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, coverUrl: '' }))}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 h-36 border-2 border-dashed border-slate-300 bg-white hover:border-slate-400 transition-colors cursor-pointer text-center">
                      <Crop className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-xs font-bold text-slate-800 mb-0.5 uppercase">Upload 4:3 Cover</span>
                      <span className="text-[10px] text-slate-500">Optional (Can add later)</span>
                      <input type="file" onChange={(e) => triggerCropModal(e, 'cover')} accept="image/*" className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Event Name / Edition Title *</label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. SWARAJ-E-HIND 5.0"
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Event Description *</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed event description and agenda..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white font-medium"
                  required
                />
              </div>

              {/* Date Range Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200">
                <div className="mb-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Start Date *</span>
                  </label>
                  <input 
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                    required
                  />
                </div>

                <div className="mb-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold mb-1.5 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>End Date (Optional)</span>
                  </label>
                  <input 
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className="w-full bg-white border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Event Mode *</label>
                  <select
                    name="mode"
                    value={formData.mode}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                  >
                    <option value="OFFLINE">OFFLINE (In-Person Campus Venue)</option>
                    <option value="ONLINE">ONLINE (Virtual / Portal Submission)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    {formData.mode === 'ONLINE' ? 'Online Portal / Meeting Link' : 'Location / Venue *'}
                  </label>
                  <input 
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={formData.mode === 'ONLINE' ? 'e.g. HITian Inside Portal' : 'e.g. Main Auditorium'}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                    required={formData.mode === 'OFFLINE'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Event Theme / Aesthetic</label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                  >
                    <option value="DEFAULT">DEFAULT (Maroon & Gold)</option>
                    <option value="TRICOLOUR">🇮🇳 TRICOLOUR (Swaraj-E-Hind Independence Day Theme)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Event Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                  >
                    <option value="UPCOMING">UPCOMING (Registration Open)</option>
                    <option value="LIVE">LIVE Now</option>
                    <option value="DONE">DONE (Archived / Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 bg-slate-50 p-4 border border-slate-200">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                  <input 
                    type="checkbox"
                    name="isFlagship"
                    checked={formData.isFlagship}
                    onChange={handleChange}
                    className="w-4 h-4 border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Flagship Event Badge</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                  <input 
                    type="checkbox"
                    name="hasAttendance"
                    checked={formData.hasAttendance}
                    onChange={handleChange}
                    className="w-4 h-4 border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Enable QR Code Attendance System</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-rose-700 font-bold cursor-pointer">
                  <input 
                    type="checkbox"
                    name="isHidden"
                    checked={formData.isHidden}
                    onChange={handleChange}
                    className="w-4 h-4 border-slate-300 text-rose-600 focus:ring-0"
                  />
                  <span>🙈 Keep Hidden from Main Website Catalog</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-indigo-700 font-bold cursor-pointer">
                  <input 
                    type="checkbox"
                    name="showGallery"
                    checked={formData.showGallery}
                    onChange={handleChange}
                    className="w-4 h-4 border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <span>🖼️ Show Submissions Gallery on Event Page</span>
                </label>
              </div>

              {/* UPI Payee & Dynamic QR Code Configuration */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>UPI Payee & Dynamic QR Code Configuration</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                    Auto Generates QR
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Configure the UPI ID and Payee name for this event. A live dynamic UPI QR code will be generated automatically for participants during registration!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        UPI ID (VPA)
                      </label>
                      <input 
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="e.g. 9135444297@ibl or hitianinside@upi"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 font-mono outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Participants can scan or copy this UPI ID to pay.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Official Payee Name
                      </label>
                      <input 
                        type="text"
                        name="payeeName"
                        value={formData.payeeName}
                        onChange={handleChange}
                        placeholder="e.g. Ayush Raj or Srijita Bandyopadhyay"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Registration Fee (Optional)
                      </label>
                      <input 
                        type="text"
                        name="registrationFee"
                        value={formData.registrationFee}
                        onChange={handleChange}
                        placeholder="e.g. 9 or 50 (leave empty if free)"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 font-mono outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Embedded into the UPI QR code so users don't need to manually enter the amount.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Custom Payment Message / Note
                      </label>
                      <input 
                        type="text"
                        name="paymentNote"
                        value={formData.paymentNote}
                        onChange={handleChange}
                        placeholder="e.g. Navroopam Registration or Event Entry"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Displayed to participants as payment instructions and prefilled into UPI transaction note (`tn`).
                      </span>
                    </div>
                  </div>

                  {/* Live Dynamic QR Preview */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      Live QR Preview
                    </span>

                    {formData.upiId.trim() ? (
                      <div className="flex flex-col items-center p-3 bg-white border border-slate-300 rounded-lg shadow-sm">
                        <QRCodeSVG 
                          value={`upi://pay?pa=${encodeURIComponent(formData.upiId.trim())}&pn=${encodeURIComponent(formData.payeeName.trim() || formData.title || 'HITian Inside')}${formData.registrationFee.trim() ? `&am=${encodeURIComponent(formData.registrationFee.trim())}` : ''}&cu=INR&tn=${encodeURIComponent(formData.paymentNote.trim() || `${formData.title || 'Event'} Registration`)}`}
                          size={130}
                          level="H"
                          imageSettings={{
                            src: '/hitianinsidelogo.png',
                            height: 28,
                            width: 28,
                            excavate: true,
                          }}
                        />
                        <span className="font-mono text-[11px] font-bold text-slate-900 mt-2">
                          {formData.upiId.trim()}
                        </span>
                        {formData.payeeName.trim() && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {formData.payeeName.trim()}
                          </span>
                        )}
                        {formData.registrationFee.trim() && (
                          <span className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5">
                            ₹{formData.registrationFee.trim()} INR
                          </span>
                        )}
                        {formData.paymentNote.trim() && (
                          <span className="text-[9.5px] text-indigo-600 font-medium mt-1">
                            Note: "{formData.paymentNote.trim()}"
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
                        <QrCode className="w-10 h-10 mb-2 opacity-40" />
                        <span className="text-xs font-semibold">Enter a UPI ID to preview QR</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Highlights */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
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
                      className={`flex gap-2 items-center bg-slate-50 p-3 border transition-all ${
                        draggedIdx === idx ? 'border-slate-900 opacity-50' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-800">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <input 
                        type="text"
                        value={item.title}
                        onChange={e => handleUpdateHighlight(idx, 'title', e.target.value)}
                        placeholder="Highlight Title"
                        className="w-1/3 bg-white border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                      />

                      <input 
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateHighlight(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 bg-white border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                      />

                      <button 
                        type="button" 
                        onClick={() => handleRemoveHighlight(idx)}
                        className="text-rose-600 p-2 text-sm hover:text-rose-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={handleAddHighlight}
                  className="w-full py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Highlight</span>
                </button>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <Link href="/admin" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold uppercase tracking-wider">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider min-w-[200px] justify-center inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
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
