'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../../components/Navbar';
import { 
  fetchEventById, 
  fetchSubmissionsApi, 
  checkInAttendeeApi,
  acknowledgeSubmissionApi,
  deleteSubmissionApi
} from '../../../../../services/api.service';
import { EventItem } from '../../../../../types/event.types';
import { SubmissionItem } from '../../../../../types/submission.types';
import { ApiResponse } from '../../../../../types/api.types';
import { 
  ArrowLeft, 
  QrCode, 
  Check, 
  FileX, 
  ExternalLink,
  Send,
  CheckCircle2,
  Flag,
  Grid,
  List,
  Filter,
  Layers,
  Image as ImageIcon,
  User,
  Hash,
  Trash2
} from 'lucide-react';

export default function EventSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const [scanInput, setScanInput] = useState<string>('');
  const [checkInResult, setCheckInResult] = useState<ApiResponse<SubmissionItem> | null>(null);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // Gallery View & Domain -> Theme Filter state
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('ALL');

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [evData, subsData] = await Promise.all([
        fetchEventById(eventId),
        fetchSubmissionsApi(eventId)
      ]);
      setEvent(evData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && eventId) {
      loadData();
    }
  }, [isAuthenticated, eventId]);

  if (!isAuthenticated) return null;

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setCheckInLoading(true);
    setCheckInResult(null);

    try {
      const res = await checkInAttendeeApi(scanInput.trim());
      setCheckInResult(res);
      setScanInput('');
      loadData();
    } catch (err: any) {
      setCheckInResult({ success: false, message: err.message });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleManualCheckIn = async (ticketId: string) => {
    try {
      await checkInAttendeeApi(ticketId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAcknowledge = async (subId: string) => {
    setAcknowledgingId(subId);
    try {
      const res = await acknowledgeSubmissionApi(subId);
      if (res.success) {
        alert(res.message);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge submission');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleDeleteSubmission = async (subId: string, participantName: string, ticketId: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE the registration/submission for "${participantName}" (Ticket: ${ticketId})? This action cannot be undone.`)) {
      return;
    }

    setDeletingSubId(subId);
    try {
      await deleteSubmissionApi(subId);
      setSubmissions(prev => prev.filter(s => s.id !== subId && s.ticketId !== ticketId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete submission');
    } finally {
      setDeletingSubId(null);
    }
  };

  // Extract unique domains present in submissions
  const availableDomains = Array.from(
    new Set(
      submissions
        .map(s => s.answers?.['Selected Domain'])
        .filter(Boolean) as string[]
    )
  );

  // Extract unique themes present for the active domain
  const availableThemes = Array.from(
    new Set(
      submissions
        .filter(s => selectedDomainFilter === 'ALL' || s.answers?.['Selected Domain'] === selectedDomainFilter)
        .map(s => s.answers?.['Selected Theme'])
        .filter(Boolean) as string[]
    )
  );

  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      sub.fullName?.toLowerCase().includes(query) ||
      sub.email?.toLowerCase().includes(query) ||
      sub.ticketId?.toLowerCase().includes(query) ||
      sub.answers?.['College Roll Number']?.toLowerCase().includes(query) ||
      sub.answers?.['Department']?.toLowerCase().includes(query);

    const matchesDomain = selectedDomainFilter === 'ALL' || sub.answers?.['Selected Domain'] === selectedDomainFilter;
    const matchesTheme = selectedThemeFilter === 'ALL' || sub.answers?.['Selected Theme'] === selectedThemeFilter;

    return matchesSearch && matchesDomain && matchesTheme;
  });

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {event?.title || 'Event'} - <span className="gradient-text">Submissions</span>
            </h1>
            <p className="text-xs text-[#a69181] mt-1">Registrations, custom answers, uploaded files, and email acknowledgments.</p>
          </div>

          <Link 
            href={`/admin/events/${eventId}/form-builder`} 
            className="btn-secondary text-xs"
          >
            ✏️ Edit Registration Form
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-panel p-6 border border-emerald-500/20">
            {event?.hasAttendance ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live QR Attendance Scanner
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono inline-flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    SCANNER READY
                  </span>
                </div>
                <p className="text-xs text-[#a69181] mb-4">
                  Scan attendee QR code ticket or enter Ticket ID (e.g. <span className="font-mono text-[#e6c594]">HIT-EVT-XXXXXX</span>).
                </p>

                <form onSubmit={handleCheckInSubmit} className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    placeholder="Scan or enter Ticket ID (e.g., HIT-EVT-XXXXXX)..."
                    className="form-input flex-1 font-mono text-sm uppercase"
                  />
                  <button 
                    type="submit" 
                    disabled={checkInLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 shrink-0 inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{checkInLoading ? 'Checking...' : 'Check-In Attendee'}</span>
                  </button>
                </form>

                {checkInResult && (
                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    checkInResult.success 
                      ? checkInResult.alreadyCheckedIn ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {checkInResult.message}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col justify-center h-full text-left">
                <h3 className="text-base font-bold text-white mb-1">Submissions Portal Overview</h3>
                <p className="text-xs text-[#a69181]">
                  Review submissions, verify attached files & drive links, and send official Tricolour email acknowledgments to participants.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-[#e6d7c3] mb-4">Event Submissions Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#a69181]">Total Submissions</span>
                <span className="text-lg font-bold text-white">{submissions.length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#a69181]">Acknowledged Emails Sent</span>
                <span className="text-lg font-bold text-[#ff9933]">
                  {submissions.filter(s => s.acknowledged).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a69181]">Media Files & Links</span>
                <span className="text-lg font-bold text-[#e6c594]">
                  {submissions.reduce((acc, s) => acc + (s.files?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="glass-panel p-6 border border-[#f7f1e5]/10">
          {/* HEADER BAR WITH VIEW TOGGLE & SEARCH */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Submissions Console</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff9933]/20 text-[#ff9933] border border-[#ff9933]/40 text-xs font-mono">
                  {filteredSubmissions.length} Items
                </span>
              </h2>
              <p className="text-xs text-[#a69181] mt-0.5">Filter by Domain & Theme to view participant images and submission media.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* VIEW MODE TOGGLE BUTTONS */}
              <div className="flex items-center p-1 rounded-xl bg-[#180509] border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'gallery' ? 'bg-[#ff9933] text-black shadow-md' : 'text-[#a69181] hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Image Gallery View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'table' ? 'bg-[#ff9933] text-black shadow-md' : 'text-[#a69181] hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
              </div>

              {/* SEARCH INPUT */}
              <input 
                type="text" 
                placeholder="Search name, roll, ticket..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#20070d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#a69181] outline-none w-full sm:w-56"
              />
            </div>
          </div>

          {/* DOMAIN & THEME FILTERING DROPDOWN BAR */}
          <div className="mb-6 p-4 rounded-xl bg-[#180509] border border-[#ff9933]/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label text-xs text-[#ff9933] font-bold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>1. View Submissions by Domain:</span>
              </label>
              <select
                value={selectedDomainFilter}
                onChange={e => {
                  setSelectedDomainFilter(e.target.value);
                  setSelectedThemeFilter('ALL'); // Reset theme filter when domain changes
                }}
                className="form-select text-xs"
              >
                <option value="ALL">All Domains ({submissions.length} total)</option>
                {availableDomains.map((dom, i) => (
                  <option key={i} value={dom}>{dom}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-xs text-[#e6c594] font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>2. View Submissions by Theme:</span>
              </label>
              <select
                value={selectedThemeFilter}
                onChange={e => setSelectedThemeFilter(e.target.value)}
                className="form-select text-xs"
              >
                <option value="ALL">All Themes</option>
                {availableThemes.map((thm, i) => (
                  <option key={i} value={thm}>{thm}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#a69181]">
              <div className="inline-block w-6 h-6 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading submission records...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-[#a69181]">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <FileX className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No Submissions Match Filters</p>
              <p className="text-xs text-[#a69181]">
                {selectedDomainFilter !== 'ALL' || selectedThemeFilter !== 'ALL' || searchQuery
                  ? 'No submissions found matching the selected Domain, Theme, or Search criteria.'
                  : 'No attendees have registered for this event yet.'}
              </p>
            </div>
          ) : viewMode === 'gallery' ? (
            /* SEPARATE SECTION: DOMAIN & THEME IMAGE & MEDIA GALLERY VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map(sub => {
                const mediaUrl = sub.files && sub.files.length > 0
                  ? (sub.files[0].localUrl || sub.files[0].driveLink || null)
                  : null;

                const isImage = mediaUrl ? /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(mediaUrl) || mediaUrl.includes('cloudinary') || mediaUrl.includes('imagekit') : false;

                return (
                  <div key={sub.id} className="bg-[#1c060b] rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:border-[#ff9933]/50 transition-all flex flex-col justify-between group">
                    {/* TOP MEDIA PREVIEW AREA */}
                    <div className="relative w-full h-56 bg-black/60 border-b border-white/10 flex items-center justify-center overflow-hidden">
                      {mediaUrl && isImage ? (
                        <img 
                          src={mediaUrl} 
                          alt={sub.fullName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : sub.answers?.['Google Drive Video Reel Link'] ? (
                        <div className="p-4 text-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-[#ff9933]/20 text-[#ff9933] flex items-center justify-center mx-auto border border-[#ff9933]/40">
                            <ExternalLink className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-white">Google Drive Video Reel</p>
                          <a 
                            href={sub.answers['Google Drive Video Reel Link']} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn-tricolour text-[11px] py-1 px-3 inline-flex items-center gap-1"
                          >
                            <span>Watch Reel ↗</span>
                          </a>
                        </div>
                      ) : mediaUrl ? (
                        <div className="p-4 text-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto border border-cyan-500/40">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[200px]">{sub.files?.[0]?.originalName || 'Attached Media File'}</p>
                          <a 
                            href={mediaUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <span>Open Media File ↗</span>
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-[#a69181]">
                          <FileX className="w-8 h-8 mx-auto mb-1 opacity-40" />
                          <span className="text-xs">No media file attached</span>
                        </div>
                      )}

                      {/* DOMAIN OVERLAY BADGE */}
                      {sub.answers?.['Selected Domain'] && (
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-[#ff9933]/50 text-[#ff9933] text-[10px] font-black uppercase tracking-wider shadow-lg">
                          {sub.answers['Selected Domain']}
                        </span>
                      )}
                    </div>

                    {/* PARTICIPANT DETAILS & ROLL NUMBER UNDERNEATH IMAGE */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-4 h-4 text-[#ff9933] shrink-0" />
                          <span>{sub.fullName}</span>
                        </div>

                        <div className="text-xs font-mono font-bold text-[#ff9933] mt-1 bg-[#800020]/25 px-2.5 py-1 rounded-lg border border-[#ff9933]/30 inline-flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-[#ff9933]" />
                          <span>Roll: {sub.answers?.['College Roll Number'] || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#a69181] space-y-1 pt-2 border-t border-white/5">
                        <div><strong className="text-white">Dept & Year:</strong> {sub.answers?.['Department'] || 'N/A'} ({sub.answers?.['Academic Year'] || 'N/A'})</div>
                        {sub.answers?.['Selected Theme'] && (
                          <div className="text-[#e6c594] font-medium italic">
                            <strong className="text-white">Theme:</strong> {sub.answers['Selected Theme']}
                          </div>
                        )}
                        <div className="font-mono text-[10px] text-slate-400">
                          <strong className="text-white">Ticket ID:</strong> {sub.ticketId}
                        </div>
                      </div>

                      {/* ACKNOWLEDGMENT EMAIL & DELETE BUTTONS */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                        <div className="flex-1">
                          {sub.acknowledged ? (
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sent
                              </span>
                              <button 
                                onClick={() => handleAcknowledge(sub.id)}
                                disabled={acknowledgingId === sub.id}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all disabled:opacity-50"
                              >
                                {acknowledgingId === sub.id ? '...' : 'Resend 🔄'}
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleAcknowledge(sub.id)}
                              disabled={acknowledgingId === sub.id}
                              className="btn-tricolour text-xs py-1 px-3 w-full justify-center inline-flex items-center gap-1 shadow-md disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              <span>{acknowledgingId === sub.id ? 'Sending...' : 'Acknowledge'}</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteSubmission(sub.id, sub.fullName, sub.ticketId)}
                          disabled={deletingSubId === sub.id}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all shrink-0"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TRADITIONAL TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#a69181] font-semibold bg-white/[0.02]">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Attendee & Roll Number</th>
                    <th className="p-3">Domain & Theme Details</th>
                    <th className="p-3">Attached Media / Links</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#ff9933]">
                        {sub.ticketId}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-white">{sub.fullName}</div>
                        <div className="text-[11px] text-[#a69181]">{sub.email}</div>
                        {sub.answers?.['College Roll Number'] && (
                          <div className="text-[10px] text-[#ff9933] font-mono font-bold mt-0.5">
                            Roll: {sub.answers['College Roll Number']}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-[#a69181] max-w-[240px]">
                        {sub.answers ? (
                          <div className="space-y-1">
                            {sub.answers['Selected Domain'] && (
                              <div className="text-xs font-bold text-white">
                                {sub.answers['Selected Domain']}
                              </div>
                            )}
                            {sub.answers['Selected Theme'] && (
                              <div className="text-[11px] text-[#ff9933] font-medium italic">
                                Theme: {sub.answers['Selected Theme']}
                              </div>
                            )}
                            {Object.entries(sub.answers)
                              .filter(([k]) => !['Selected Domain', 'Selected Theme', 'College Roll Number', 'Department', 'Academic Year'].includes(k))
                              .map(([k, v]) => (
                                <div key={k} className="text-[10px] text-slate-400 truncate">
                                  <span className="font-semibold">{k}:</span> {String(v)}
                                </div>
                              ))
                            }
                          </div>
                        ) : (
                          <span className="text-slate-600">None</span>
                        )}
                      </td>

                      <td className="p-3">
                        {sub.answers?.['Google Drive Video Reel Link'] ? (
                          <a 
                            href={sub.answers['Google Drive Video Reel Link']}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-semibold truncate max-w-[200px]"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span>View Google Drive Reel</span>
                          </a>
                        ) : sub.files && sub.files.length > 0 ? (
                          sub.files.map((f, idx) => (
                            <a 
                              key={idx}
                              href={f.driveLink || f.localUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-medium truncate max-w-[180px] block"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span>{f.originalName || 'Download File'}</span>
                            </a>
                          ))
                        ) : (
                          <span className="text-slate-600">No file</span>
                        )}
                      </td>

                      <td className="p-3">
                        {sub.acknowledged ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acknowledged</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium">
                            Pending Ack
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.acknowledged ? (
                            <>
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Sent</span>
                              </span>
                              <button 
                                onClick={() => handleAcknowledge(sub.id)}
                                disabled={acknowledgingId === sub.id}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1"
                                title="Resend Acknowledgment Email"
                              >
                                <Send className="w-3 h-3" />
                                <span>{acknowledgingId === sub.id ? '...' : 'Resend 🔄'}</span>
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleAcknowledge(sub.id)}
                              disabled={acknowledgingId === sub.id}
                              className="btn-tricolour text-[11px] py-1.5 px-3 inline-flex items-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              <span>{acknowledgingId === sub.id ? 'Sending...' : 'Acknowledge'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSubmission(sub.id, sub.fullName, sub.ticketId)}
                            disabled={deletingSubId === sub.id}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all shrink-0"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
