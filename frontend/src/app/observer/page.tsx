'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { 
  observerLoginApi, 
  fetchObserverSubmissionsApi, 
  fetchEvents 
} from '../../services/api.service';
import { SubmissionItem } from '../../types/submission.types';
import { EventItem } from '../../types/event.types';
import { 
  Eye, 
  Lock, 
  LogOut, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink, 
  Image as ImageIcon, 
  Film, 
  BookOpen, 
  Camera, 
  X, 
  CheckCircle,
  Clock,
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  Mail,
  LayoutGrid,
  List,
  Maximize2
} from 'lucide-react';

function getPhotoPreviewUrl(sub: SubmissionItem, apiOrigin: string) {
  const driveLink = sub.answers?.['Google Drive Link'] || sub.answers?.['Drive Link'] || sub.files?.find(f => f.driveLink)?.driveLink;
  
  if (sub.files && sub.files.length > 0) {
    const file = sub.files[0];
    if (file.localUrl) {
      const fullUrl = file.localUrl.startsWith('http') ? file.localUrl : `${apiOrigin}${file.localUrl.startsWith('/') ? '' : '/'}${file.localUrl}`;
      const isImg = !file.mimeType || file.mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.originalName || '');
      return { url: isImg ? fullUrl : null, isDrive: false, isImage: isImg, driveLink };
    }
  }

  if (driveLink) {
    const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveLink.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      const previewUrl = `https://lh3.googleusercontent.com/d/${fileId}=s800`;
      return { url: previewUrl, isDrive: true, isImage: true, driveLink };
    }
    return { url: null, isDrive: true, isImage: false, driveLink };
  }

  return { url: null, isDrive: false, isImage: false };
}

export default function ObserverPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [observerEmail, setObserverEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const [activeModalSub, setActiveModalSub] = useState<SubmissionItem | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [apiOrigin, setApiOrigin] = useState<string>('http://localhost:5000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setApiOrigin(isLocal ? 'http://localhost:5000' : 'https://hitianinside-event-backend.vercel.app');
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await observerLoginApi(emailInput, passwordInput);
      if (res.success && res.token) {
        setIsAuthenticated(true);
        setObserverEmail(res.observer?.email || emailInput);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('observerToken', res.token);
          sessionStorage.setItem('observerEmail', res.observer?.email || emailInput);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid Observer Credentials or Access Revoked');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadSubmissions = async (eventId?: string) => {
    if (!eventId) return;
    setLoadingSubmissions(true);
    try {
      const data = await fetchObserverSubmissionsApi(eventId);
      setSubmissions(data);
    } catch (err: any) {
      console.error('Failed to load observer submissions:', err);
      if (err.message?.includes('Access revoked') || err.message?.includes('token')) {
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('observerToken');
          sessionStorage.removeItem('observerEmail');
        }
        setAuthError('Your access has been revoked by the Administrator.');
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadEventsList = async () => {
    try {
      const evs = await fetchEvents(true);
      setEvents(evs);
      if (evs.length > 0 && !selectedEventId) {
        const firstId = evs[0].id || evs[0]._id || '';
        setSelectedEventId(firstId);
      }
    } catch (err) {
      console.error('Failed loading events:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('observerToken');
      const savedEmail = sessionStorage.getItem('observerEmail');
      if (token) {
        setIsAuthenticated(true);
        if (savedEmail) setObserverEmail(savedEmail);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadEventsList();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && selectedEventId) {
      loadSubmissions(selectedEventId);
    }
  }, [isAuthenticated, selectedEventId]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('observerToken');
      sessionStorage.removeItem('observerEmail');
    }
  };

  // Filtering submissions
  const filteredSubmissions = submissions.filter(sub => {
    const q = searchQuery.toLowerCase().trim();
    const roll = (sub.answers?.['College Roll Number'] || '').toLowerCase();
    const domain = (sub.answers?.['Selected Domain'] || '').toUpperCase();
    const dept = (sub.answers?.['Department'] || '').toLowerCase();

    const matchesSearch = !q || 
      sub.fullName.toLowerCase().includes(q) ||
      sub.email.toLowerCase().includes(q) ||
      sub.ticketId.toLowerCase().includes(q) ||
      roll.includes(q) ||
      dept.includes(q);

    const matchesDomain = selectedDomain === 'ALL' || domain.includes(selectedDomain);

    return matchesSearch && matchesDomain;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full border border-[#f7f1e5]/10 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#ff9933]/20 border border-[#ff9933]/40 text-[#ff9933] flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold mb-1 text-white">Observer Portal Access</h1>
            <p className="text-xs text-[#a69181] mb-6">Enter observer email & password provided by admin to view event submissions.</p>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="form-group text-left">
                <label className="form-label">Observer Email</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="observer@hitianinside.in"
                  className="form-input text-sm"
                  required
                />
              </div>

              <div className="form-group text-left">
                <label className="form-label">Observer Password</label>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="form-input text-sm font-mono"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="btn-tricolour w-full py-2.5 justify-center text-sm font-semibold mt-2 inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>{authLoading ? 'Verifying...' : 'Access Observer Portal'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff9933]/15 border border-[#ff9933]/30 text-[#ff9933] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Observer / Judge Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Event Submissions <span className="tricolour-gradient-text">Viewer</span>
            </h1>
            <p className="text-xs text-[#a69181] mt-0.5">Logged in as: <strong className="text-white">{observerEmail}</strong> (Read-Only Access)</p>
          </div>

          <button 
            onClick={handleLogout}
            className="btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Portal</span>
          </button>
        </div>

        {/* Interactive Event Cards Hub for Observers */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#ff9933]" />
            <span>Select Event to View Submissions</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Individual Event Cards */}
            {events.map(ev => {
              const evId = ev.id || ev._id || '';
              const isSelected = selectedEventId === evId;
              const isTricolour = ev.isFlagship || ev.theme === 'TRICOLOUR' || ev.title.toLowerCase().includes('swaraj');

              return (
                <button
                  key={evId}
                  onClick={() => setSelectedEventId(evId)}
                  className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#ff9933]/15 border-[#ff9933] shadow-lg shadow-[#ff9933]/10 ring-2 ring-[#ff9933]'
                      : 'bg-[#180509] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isTricolour ? 'bg-[#ff9933]/20 text-[#ff9933] border border-[#ff9933]/40' : 'bg-white/10 text-white'
                      }`}>
                        {ev.mode || 'ONLINE'}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#ff9933]">
                          <CheckCircle className="w-4 h-4" />
                          <span>Selected</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-white line-clamp-1">{ev.title}</h3>
                    <p className="text-xs text-[#a69181] mt-1 line-clamp-1">{ev.date || 'Official Event'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#e6c594]">
                      {isSelected ? 'Viewing Submissions' : 'Click to Select Event'}
                    </span>
                    <span className="text-[10px] text-[#a69181] font-mono">{ev.organizer || 'HITian Inside'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter & Search Toolbar */}
        <div className="glass-panel p-5 border border-[#f7f1e5]/10 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Event Selector Dropdown */}
            <div className="flex items-center gap-2 min-w-[240px]">
              <span className="text-xs text-[#a69181] font-medium shrink-0">Selected Event:</span>
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="form-input text-xs py-2 bg-[#180509] border border-white/10 text-white rounded-lg w-full font-semibold"
              >
                {events.map(ev => (
                  <option key={ev.id || ev._id} value={ev.id || ev._id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#a69181] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by participant name, roll number, email, ticket ID..."
                className="form-input text-xs pl-9 py-2 bg-[#180509] border border-white/10 text-white w-full rounded-lg"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a69181] hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Domain Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
            <span className="text-[11px] text-[#a69181] font-semibold uppercase mr-1">Domain:</span>
            {[
              { id: 'ALL', label: 'All Submissions' },
              { id: 'TRICOLENS', label: 'TRICOLENS (Reels)' },
              { id: 'PATRIOT', label: "PATRIOT'S PALETTE (Artwork)" },
              { id: 'APERTURE', label: 'APERTURE OF FREEDOM (Photography)' },
              { id: 'INKQUILAB', label: 'INKQUILAB (Writing)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedDomain(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedDomain === tab.id
                    ? 'bg-[#ff9933] text-black font-bold'
                    : 'bg-white/5 text-[#a69181] hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Section */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ff9933]" />
                <span>Event Submissions</span>
              </h2>
              <p className="text-xs text-[#a69181] mt-0.5">
                Total Submissions: <strong className="text-white font-mono">{filteredSubmissions.length}</strong>
              </p>
            </div>

            {/* View Mode Toggle Controls */}
            <div className="flex items-center gap-1.5 bg-[#180509] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  viewMode === 'GRID'
                    ? 'bg-[#ff9933] text-black shadow-md'
                    : 'text-[#a69181] hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Photo Cards (Name-Wise)</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  viewMode === 'TABLE'
                    ? 'bg-[#ff9933] text-black shadow-md'
                    : 'text-[#a69181] hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {loadingSubmissions ? (
            <div className="py-20 text-center text-[#a69181]">
              <div className="inline-block w-8 h-8 border-2 border-[#ff9933] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading event submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center text-[#a69181] border border-dashed border-white/10 rounded-2xl">
              <p className="text-sm font-semibold text-white mb-1">No Submissions Found</p>
              <p className="text-xs">Try adjusting your search query or domain filter.</p>
            </div>
          ) : viewMode === 'GRID' ? (
            /* Name-Wise Photo Preview Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSubmissions.map(sub => {
                const photoData = getPhotoPreviewUrl(sub, apiOrigin);
                const domain = sub.answers?.['Selected Domain'] || 'General';
                const theme = sub.answers?.['Selected Theme'] || sub.answers?.['Theme'] || '';
                const roll = sub.answers?.['College Roll Number'] || '';
                const dept = sub.answers?.['Department'] || '';

                return (
                  <div 
                    key={sub.id || sub.ticketId}
                    className="glass-panel border border-[#ff9933]/20 hover:border-[#ff9933]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff9933]/15 flex flex-col justify-between group bg-[#160508]"
                  >
                    {/* Photo Container */}
                    <div className="relative aspect-[4/3] bg-[#0d0204] overflow-hidden flex items-center justify-center border-b border-white/10">
                      {photoData.url ? (
                        <img 
                          src={photoData.url} 
                          alt={`${sub.fullName}'s submission photo`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallbackEl = (e.target as HTMLElement).nextElementSibling;
                            if (fallbackEl) fallbackEl.classList.remove('hidden');
                          }}
                        />
                      ) : null}

                      {/* Fallback Container */}
                      <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${photoData.url ? 'hidden' : ''}`}>
                        {photoData.isDrive ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                              <Film className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-amber-300">Google Drive Media Link</span>
                            {photoData.driveLink && (
                              <a 
                                href={photoData.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-amber-400 hover:underline font-mono max-w-[180px] truncate"
                              >
                                Open Drive Media
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-[#a69181]">
                            <ImageIcon className="w-10 h-10 opacity-30 mb-1" />
                            <span className="text-xs font-semibold text-white/80">No Direct Attachment</span>
                            <span className="text-[10px]">Text submission / response</span>
                          </div>
                        )}
                      </div>

                      {/* Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[#ff9933] text-[10px] font-mono font-extrabold shadow-lg">
                          {sub.ticketId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#ff9933]/90 text-black text-[10px] font-extrabold shadow-lg uppercase tracking-wide truncate max-w-[140px]">
                          {domain}
                        </span>
                      </div>

                      {/* Photo Zoom Button */}
                      {photoData.url && (
                        <button
                          onClick={() => setLightboxImage({ url: photoData.url!, title: `${sub.fullName} (${sub.ticketId})` })}
                          className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/80 hover:bg-[#ff9933] text-white hover:text-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                          title="View Full Resolution Photo"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Participant Details Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-[#ff9933] transition-colors line-clamp-1">
                          {sub.fullName}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#a69181] mt-0.5">
                          {roll && <span className="font-mono text-white/90">{roll}</span>}
                          {dept && <span>• {dept}</span>}
                        </div>

                        {theme && (
                          <p className="text-[11px] text-[#e6c594] mt-1.5 italic font-medium line-clamp-1">
                            Theme: "{theme}"
                          </p>
                        )}
                      </div>

                      {/* Answers Snippet */}
                      <div className="space-y-1 pt-2 border-t border-white/5 text-[11px]">
                        {Object.entries(sub.answers || {})
                          .filter(([k]) => !['Selected Domain', 'Selected Theme', 'College Roll Number', 'Department', 'Theme'].includes(k))
                          .slice(0, 2)
                          .map(([key, val]) => (
                            <div key={key} className="flex justify-between items-baseline gap-2">
                              <span className="text-[#a69181] truncate shrink-0 max-w-[90px] font-medium">{key}:</span>
                              <span className="text-white font-semibold truncate">{String(val || '-')}</span>
                            </div>
                          ))}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        {photoData.driveLink ? (
                          <a 
                            href={photoData.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Drive Reel</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#a69181] font-mono">
                            {sub.files?.length ? `${sub.files.length} attachment` : 'Participant'}
                          </span>
                        )}

                        <button
                          onClick={() => setActiveModalSub(sub)}
                          className="btn-secondary text-[11px] py-1 px-3 inline-flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Full Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#a69181] uppercase font-bold text-[10px]">
                    <th className="py-3 px-3">Ticket ID</th>
                    <th className="py-3 px-3">Participant</th>
                    <th className="py-3 px-3">Roll & Dept</th>
                    <th className="py-3 px-3">Domain & Theme</th>
                    <th className="py-3 px-3">Media / Link</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#e6d7c3]/90">
                  {filteredSubmissions.map(sub => {
                    const subKey = sub.id || sub.ticketId;
                    const isExpanded = expandedSubId === subKey;
                    const domain = sub.answers?.['Selected Domain'] || 'General';
                    const theme = sub.answers?.['Selected Theme'] || sub.answers?.['Theme'] || '-';
                    const roll = sub.answers?.['College Roll Number'] || '-';
                    const dept = sub.answers?.['Department'] || '-';
                    const driveLink = sub.answers?.['Google Drive Link'] || sub.files?.find(f => f.driveLink)?.driveLink;

                    return (
                      <React.Fragment key={subKey}>
                        <tr className={`transition-colors ${isExpanded ? 'bg-[#ff9933]/10' : 'hover:bg-white/[0.02]'}`}>
                          <td className="py-3 px-3 font-mono font-bold text-[#ff9933]">
                            {sub.ticketId}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{sub.fullName}</span>
                            <span className="text-[10px] text-[#a69181]">{sub.email}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-white block">{roll}</span>
                            <span className="text-[10px] text-[#a69181]">{dept}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold text-[10px] inline-block mb-0.5">
                              {domain}
                            </span>
                            <span className="text-[10px] text-[#a69181] block italic truncate max-w-[160px]">{theme}</span>
                          </td>
                          <td className="py-3 px-3">
                            {driveLink ? (
                              <a 
                                href={driveLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors text-[10px] font-bold"
                              >
                                <Film className="w-3 h-3" />
                                <span>View Reel Link</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : sub.files && sub.files.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-semibold">
                                <ImageIcon className="w-3 h-3" />
                                <span>{sub.files.length} file attached</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#a69181]">No attachments</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setExpandedSubId(isExpanded ? null : subKey)}
                                className={`text-[11px] py-1 px-2.5 rounded-lg border font-semibold transition-all inline-flex items-center gap-1.5 ${
                                  isExpanded
                                    ? 'bg-[#ff9933]/20 border-[#ff9933] text-[#ff9933] shadow-md'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                }`}
                                title="Quick preview submission details without opening dialog"
                              >
                                <Sparkles className="w-3 h-3 text-[#ff9933]" />
                                <span>{isExpanded ? 'Hide' : 'Quick Preview'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              <button
                                onClick={() => setActiveModalSub(sub)}
                                className="btn-secondary text-[11px] py-1 px-3 inline-flex items-center gap-1 shrink-0"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Full Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Quick Preview Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#180509]/95 border-b-2 border-[#ff9933]/40">
                            <td colSpan={6} className="p-4 sm:p-5">
                              <div className="bg-[#120306] rounded-xl border border-[#ff9933]/30 p-4 sm:p-5 text-xs shadow-2xl space-y-4">
                                {/* Header / Summary Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#ff9933]/20 text-[#ff9933] text-[10px] font-extrabold font-mono border border-[#ff9933]/30">
                                      QUICK PREVIEW • {sub.ticketId}
                                    </span>
                                    <span className="font-extrabold text-white text-sm">{sub.fullName}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-[#a69181]">
                                    {sub.phone && (
                                      <span className="flex items-center gap-1 text-white">
                                        <Phone className="w-3 h-3 text-[#ff9933]" />
                                        <a href={`tel:${sub.phone}`} className="hover:underline">{sub.phone}</a>
                                      </span>
                                    )}
                                    {sub.email && (
                                      <span className="flex items-center gap-1 text-white">
                                        <Mail className="w-3 h-3 text-[#ff9933]" />
                                        <a href={`mailto:${sub.email}`} className="hover:underline">{sub.email}</a>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Submitted Answers Grid */}
                                <div>
                                  <h4 className="text-[10px] font-extrabold text-[#e6c594] uppercase tracking-wider mb-2.5 flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-[#ff9933]" />
                                    <span>Submission Answers Breakdown</span>
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {Object.entries(sub.answers || {}).map(([key, val]) => (
                                      <div key={key} className="bg-white/[0.04] p-3 rounded-lg border border-white/5 hover:border-white/15 transition-colors">
                                        <span className="text-[10px] text-[#a69181] block font-bold uppercase tracking-wide">{key}</span>
                                        <span className="text-xs font-semibold text-white break-words mt-1 block">
                                          {String(val || '-')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Media & Attachments & Quick Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {driveLink && (
                                      <a 
                                        href={driveLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors text-xs font-extrabold"
                                      >
                                        <Film className="w-3.5 h-3.5" />
                                        <span>Open Google Drive Link</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                    {sub.files && sub.files.map((file, idx) => (
                                      <a 
                                        key={idx}
                                        href={file.localUrl || file.driveLink || '#'} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors text-xs font-semibold"
                                      >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[160px]">{file.originalName}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setActiveModalSub(sub)} 
                                      className="btn-tricolour text-xs py-1.5 px-4 font-bold inline-flex items-center gap-1.5"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Full Dialog Modal</span>
                                    </button>
                                    <button 
                                      onClick={() => setExpandedSubId(null)} 
                                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a69181] hover:text-white text-xs transition-colors"
                                    >
                                      Close Quick Preview
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Submission Details Modal */}
      {activeModalSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full p-6 border border-[#ff9933]/30 rounded-2xl max-h-[90vh] overflow-y-auto relative space-y-6">
            <button 
              onClick={() => setActiveModalSub(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff9933]/20 text-[#ff9933] text-[10px] font-bold font-mono">
                  {activeModalSub.ticketId}
                </span>
                <span className="text-xs text-[#a69181]">{activeModalSub.eventTitle}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">{activeModalSub.fullName}</h2>
              <p className="text-xs text-[#a69181]">{activeModalSub.email} • {activeModalSub.phone}</p>
            </div>

            {/* Answer Field Breakdown */}
            <div className="space-y-3 bg-[#180509] p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-2">Registration Answers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(activeModalSub.answers || {}).map(([key, val]) => (
                  <div key={key} className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-[#a69181] block font-medium uppercase">{key}</span>
                    <span className="text-xs font-semibold text-white break-words mt-0.5 block">{String(val || '-')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments / Files */}
            {activeModalSub.files && activeModalSub.files.length > 0 && (
              <div className="space-y-3 bg-[#180509] p-4 rounded-xl border border-white/5">
                <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-2">Uploaded Attachments</h3>
                <div className="space-y-2">
                  {activeModalSub.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-white font-medium truncate">{file.originalName}</span>
                      </div>
                      <a 
                        href={file.localUrl || file.driveLink || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-secondary text-[10px] py-1 px-2.5 shrink-0 inline-flex items-center gap-1"
                      >
                        <span>Open File</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setActiveModalSub(null)} 
                className="btn-secondary text-xs py-2 px-6"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-[#120306] border border-[#ff9933]/40 rounded-2xl p-4 overflow-hidden flex flex-col items-center justify-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-[#ff9933] text-white hover:text-black border border-white/20 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-full text-center mb-3">
              <span className="text-xs font-bold font-mono text-[#ff9933] uppercase tracking-wider">Photo Preview Lightbox</span>
              <h3 className="text-sm font-extrabold text-white truncate max-w-md mx-auto mt-0.5">{lightboxImage.title}</h3>
            </div>

            <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/50 border border-white/10 p-2">
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            <div className="mt-3 flex items-center gap-3">
              <a 
                href={lightboxImage.url} 
                target="_blank" 
                rel="noreferrer"
                className="btn-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5"
              >
                <span>Open Full Image in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button 
                onClick={() => setLightboxImage(null)}
                className="btn-tricolour text-xs py-1.5 px-4 font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
