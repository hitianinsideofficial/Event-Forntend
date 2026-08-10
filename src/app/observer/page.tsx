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
  Calendar
} from 'lucide-react';

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Submissions List / Table */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ff9933]" />
              <span>Submissions List</span>
            </h2>
            <span className="text-xs font-mono text-[#e6c594]">Found: {filteredSubmissions.length}</span>
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
                    const domain = sub.answers?.['Selected Domain'] || 'General';
                    const theme = sub.answers?.['Selected Theme'] || sub.answers?.['Theme'] || '-';
                    const roll = sub.answers?.['College Roll Number'] || '-';
                    const dept = sub.answers?.['Department'] || '-';
                    const driveLink = sub.answers?.['Google Drive Link'] || sub.files?.find(f => f.driveLink)?.driveLink;

                    return (
                      <tr key={sub.id || sub.ticketId} className="hover:bg-white/[0.02] transition-colors">
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
                          <button
                            onClick={() => setActiveModalSub(sub)}
                            className="btn-secondary text-[11px] py-1 px-3 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
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
    </div>
  );
}
