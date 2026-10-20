'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../../components/AdminNavbar';
import ImageCropModal from '../../../../components/ImageCropModal';
import { QRCodeSVG } from 'qrcode.react';
import { createEventApi } from '../../../../services/api.service';
import { EventHighlight, EventStatus, EventMode, EventTheme } from '../../../../types/event.types';
import { ArrowLeft, Sparkles, Plus, X, Lock, GripVertical, Image as ImageIcon, Crop, Calendar, Flag, QrCode, CreditCard } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    organizer: 'HITian Inside',
    status: 'UPCOMING' as EventStatus,
    mode: 'OFFLINE' as EventMode,
    theme: 'DEFAULT' as EventTheme,
    isFlagship: false,
    bannerUrl: '',
    coverUrl: '',
    hasAttendance: true,
    requireFileUpload: false,
    isHidden: false,
    upiId: '',
    payeeName: '',
    registrationFee: '',
    upiQrUrl: ''
  });

  // Cropper Modal States
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [selectedRawImage, setSelectedRawImage] = useState<string>('');
  const [targetType, setTargetType] = useState<'banner' | 'cover'>('banner');
  const [initialAspect, setInitialAspect] = useState<number>(16 / 9);

  const [highlights, setHighlights] = useState<EventHighlight[]>([
    { title: 'Schedule Highlight', description: 'Interactive workshops & live keynotes' }
  ]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

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

  const loadSwarajEHindTemplate = () => {
    setSelectedPreset('swaraj');
    setFormData(prev => ({
      ...prev,
      title: 'SWARAJ-E-HIND 4.0',
      description: `The official trademark Independence Day celebration event of HITian Inside! Showcasing patriotism through photography, reel making, creative writing and arts.

1. What is Swaraj-e-Hind?
Swaraj-e-Hind is more than just an event, it’s a celebration of India, its freedom, and the voices of its youth. It brings together ideas, creativity, and expressions that reflect what India means to us today.

2. What happens here?
From performances to creative expressions, Swaraj-e-Hind gives everyone a chance to share their thoughts and showcase their talent.

3. Evaluation Process
Participants will be judged on creativity, originality, relevance to the theme, and how effectively they present their ideas.

4. Value Edition
The Value Edition is about going beyond celebration and looking at the values that make us who we are—freedom, unity, courage, responsibility, and respect. Because independence isn’t just something we remember; it’s something we carry forward.`,
      startDate: '2026-08-15',
      endDate: '2026-08-15',
      location: 'Online Submission Portal (HITian Inside Website)',
      organizer: 'HITian Inside',
      status: 'UPCOMING',
      mode: 'ONLINE',
      theme: 'TRICOLOUR',
      isFlagship: true,
      hasAttendance: false,
      requireFileUpload: true
    }));

    setHighlights([
      { title: 'Art Beyond Boundaries', description: 'Photography • Digital Art\nExplore India through creativity, colour, and perspective.' },
      { title: 'Stories That Move', description: 'Reel Making\nTurn stories of freedom and India into powerful visual narratives.' },
      { title: 'Words That Speak', description: 'Creative Writing\nGive your thoughts a voice through stories, reflections, and imagination.' }
    ]);
  };

  const loadPratidhawniTemplate = () => {
    setSelectedPreset('pratidhawni');
    setFormData(prev => ({
      ...prev,
      title: 'PRATIDHWANI',
      description: `PRATIDHWANI - ONE LINER ... ONE LINER..
A unit of the Tabloid, Media and Literary Club (HITian Inside).

1. What is Pratidhwani?
Pratidhwani is the flagship offline celebration of Swaraj-e-Hind at HIT Haldia. It offers an interactive live stage for students to perform, express, paint, and speak on critical youth topics.

2. Event Categories:
- OPEN MIC: Poetry, Music, Stand-up Comedy, Storytelling
- YOUTH PARLIAMENT: Parliamentary debate, policy & discussion
- LIVE ART: Canvas painting, live sketching, and poster creation

3. Registration Fee:
RS. 50/- ONLY per participant. Includes official digital receipt pass with unique QR_UID ticket for event entrance scanning.

4. Post-Registration WhatsApp Group:
Upon payment confirmation, participants are instantly routed to the official WhatsApp Group for schedules and rules.`,
      startDate: '2026-08-15',
      endDate: '2026-08-15',
      location: 'Main Campus Grounds & Student Activity Centre, HIT Haldia',
      organizer: 'HITian Inside • Tabloid, Media & Literary Club',
      status: 'UPCOMING',
      mode: 'OFFLINE',
      theme: 'TRICOLOUR',
      isFlagship: true,
      hasAttendance: true,
      requireFileUpload: false
    }));

    setHighlights([
      { title: 'OPEN MIC', description: 'Poetry • Music • Stand-up • Storytelling\nUnleash your voice live on stage.' },
      { title: 'YOUTH PARLIAMENT', description: 'Debate • Policy • Parliamentary Discussion\nSpeak up and represent the leaders of tomorrow.' },
      { title: 'LIVE ART', description: 'Painting • Sketching • Poster Art\nExpress freedom and creativity live on canvas.' }
    ]);
  };

  const resetToBlankTemplate = () => {
    setSelectedPreset('blank');
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      organizer: 'HITian Inside',
      status: 'UPCOMING',
      mode: 'OFFLINE',
      theme: 'DEFAULT',
      isFlagship: false,
      bannerUrl: '',
      coverUrl: '',
      hasAttendance: true,
      requireFileUpload: false,
      isHidden: false,
      upiId: '',
      payeeName: '',
      registrationFee: '',
      upiQrUrl: ''
    });
    setHighlights([
      { title: 'Schedule Highlight', description: 'Interactive workshops & live keynotes' }
    ]);
  };

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

    if (!formData.title || !formData.description || !formData.startDate) {
      setError('Title, Description, and Start Date are required.');
      return;
    }

    setLoading(true);
    try {
      const formattedDateString = formatDisplayDate(formData.startDate, formData.endDate);

      const payload = {
        ...formData,
        date: formattedDateString || formData.startDate,
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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Event Presets Dropdown */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={selectedPreset}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'swaraj') loadSwarajEHindTemplate();
                else if (val === 'pratidhawni') loadPratidhawniTemplate();
                else if (val === 'blank') resetToBlankTemplate();
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-900 text-xs font-bold outline-none focus:border-slate-900 shadow-sm cursor-pointer"
            >
              <option value="" disabled>✨ Load Event Preset Template...</option>
              <option value="swaraj">🇮🇳 SWARAJ-E-HIND 4.0 (Online Flagship)</option>
              <option value="pratidhawni">🎭 Pratidhawni (Offline Flagship Paid)</option>
              <option value="blank">🧹 Blank Template (Clear Form)</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Create New Event</h1>
              <p className="text-xs text-slate-500 mt-0.5">Publish flagship celebrations like Navroopam, Swaraj-E-Hind or custom club initiatives.</p>
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                      >
                        Remove Banner
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 h-36 border-2 border-dashed border-slate-300 bg-white hover:border-slate-400 transition-colors cursor-pointer text-center">
                    <Crop className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-xs font-bold text-slate-800 mb-0.5 uppercase">Crop & Compress Banner</span>
                    <span className="text-[10px] text-slate-500">Optional (Can add later)</span>
                    <input type="file" onChange={(e) => triggerCropModal(e, 'banner')} accept="image/*" className="hidden" />
                  </label>
                )}
              </div>

              <div className="mb-0">
                <label className="font-bold flex items-center justify-between text-xs mb-2 uppercase tracking-wider text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Card Cover (4:3)</span>
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono px-2 py-0.5 bg-slate-200 border border-slate-300 font-bold">4 : 3</span>
                </label>

                {formData.coverUrl ? (
                  <div className="relative border border-slate-300 h-36 bg-slate-100 group">
                    <img src={formData.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, coverUrl: '' }))}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                      >
                        Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 h-36 border-2 border-dashed border-slate-300 bg-white hover:border-slate-400 transition-colors cursor-pointer text-center">
                    <Crop className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-xs font-bold text-slate-800 mb-0.5 uppercase">Crop & Compress Cover</span>
                    <span className="text-[10px] text-slate-500">Optional (Can add later)</span>
                    <input type="file" onChange={(e) => triggerCropModal(e, 'cover')} accept="image/*" className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Event Name *</label>
              <input 
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. NAVROOPAM v7.0 or SWARAJ-E-HIND 4.0"
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
                placeholder="Provide detailed event description and rules..."
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
                  {formData.mode === 'ONLINE' ? 'Submission Link / Platform' : 'Location / Venue *'}
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
                  <option value="TRICOLOUR">🇮🇳 TRICOLOUR (Swaraj-E-Hind Independence Day)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Initial Event Status</label>
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
                        value={`upi://pay?pa=${encodeURIComponent(formData.upiId.trim())}&pn=${encodeURIComponent(formData.payeeName.trim() || formData.title || 'HITian Inside')}${formData.registrationFee.trim() ? `&am=${encodeURIComponent(formData.registrationFee.trim())}` : ''}&cu=INR&tn=${encodeURIComponent(`${formData.title || 'Event'} Registration`)}`}
                        size={130}
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
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider min-w-[220px] justify-center cursor-pointer shadow-sm"
              >
                {loading ? 'Creating...' : 'Save & Build Registration Form →'}
              </button>
            </div>
          </form>
        </div>
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
