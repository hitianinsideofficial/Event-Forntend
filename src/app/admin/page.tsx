'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import CreateEventModal from '../../components/CreateEventModal';
import { 
  adminLoginApi, 
  fetchEvents, 
  fetchSubmissionsApi, 
  checkInAttendeeApi 
} from '../../services/api.service';
import { EventItem } from '../../types/event.types';
import { SubmissionItem } from '../../types/submission.types';
import { ApiResponse } from '../../types/api.types';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [scanInput, setScanInput] = useState<string>('');
  const [checkInResult, setCheckInResult] = useState<ApiResponse<SubmissionItem> | null>(null);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await adminLoginApi(emailInput, passwordInput);
      if (res.success && res.token) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminToken', res.token);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid Admin Email or Password');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [eventsList, subsList] = await Promise.all([
        fetchEvents(),
        fetchSubmissionsApi(selectedEventId)
      ]);
      setEvents(eventsList);
      setSubmissions(subsList);
    } catch (err) {
      console.error('Failed loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken');
      if (token) setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, selectedEventId]);

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setCheckInLoading(true);
    setCheckInResult(null);

    try {
      const res = await checkInAttendeeApi(scanInput.trim());
      setCheckInResult(res);
      setScanInput('');
      loadAdminData();
    } catch (err: any) {
      setCheckInResult({ success: false, message: err.message });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleManualCheckIn = async (ticketId: string) => {
    try {
      await checkInAttendeeApi(ticketId);
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ticketId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full border border-[#f7f1e5]/10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#800020]/30 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto mb-4 text-2xl">
              🔐
            </div>
            <h1 className="text-2xl font-bold mb-1">Admin Portal Access</h1>
            <p className="text-xs text-[#a69181] mb-6">Enter admin email & password to manage events, QR check-ins, and submissions.</p>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="form-group text-left">
                <label className="form-label">Admin Email</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="admin@hitianinside.org"
                  className="form-input text-sm"
                  required
                />
              </div>

              <div className="form-group text-left">
                <label className="form-label">Admin Password</label>
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
                className="btn-primary w-full py-2.5 justify-center text-sm font-semibold mt-2"
              >
                {authLoading ? 'Verifying...' : 'Unlock Admin Panel'}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Admin Console & <span className="gradient-text">Submissions Panel</span>
            </h1>
            <p className="text-xs text-[#a69181] mt-1">Manage events, track registrant uploads, and perform live QR attendance check-ins.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-xs"
            >
              + Host Event
            </button>
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                if (typeof window !== 'undefined') sessionStorage.removeItem('adminToken');
              }}
              className="btn-secondary text-xs"
            >
              Logout 🔒
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-panel p-6 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Live QR Attendance Scanner & Check-in
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                SCANNER READY
              </span>
            </div>
            <p className="text-xs text-[#a69181] mb-4">
              Scan ticket QR code with camera scanner or enter Ticket ID (e.g. <span className="font-mono text-[#e6c594]">HIT-EVT-98214A</span>) to mark attendance.
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
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 shrink-0"
              >
                {checkInLoading ? 'Checking...' : 'Check-In Attendee ✓'}
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
          </div>

          <div className="glass-panel p-6 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-[#e6d7c3] mb-4">Overview Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#a69181]">Total Submissions</span>
                <span className="text-lg font-bold text-white">{submissions.length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#a69181]">Checked-In Attendees</span>
                <span className="text-lg font-bold text-emerald-400">
                  {submissions.filter(s => s.attendanceStatus === 'CHECKED_IN').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a69181]">Total Files Uploaded</span>
                <span className="text-lg font-bold text-[#e6c594]">
                  {submissions.reduce((acc, s) => acc + (s.files?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="glass-panel p-6 border border-[#f7f1e5]/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Submitted Registrations</h2>
              <p className="text-xs text-[#a69181] mt-0.5">Filter, view answers, download uploaded files, and toggle attendance.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select 
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="bg-[#20070d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="all">All Events ({events.length})</option>
                {events.map(ev => (
                  <option key={ev.id || ev._id} value={ev.id || ev._id}>{ev.title}</option>
                ))}
              </select>

              <input 
                type="text" 
                placeholder="Search name, email, ticket..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#20070d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#a69181] outline-none w-full sm:w-48"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#a69181]">
              <div className="inline-block w-6 h-6 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading submission records...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-[#a69181]">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-xl">
                📋
              </div>
              <p className="text-sm font-semibold text-white mb-1">No Submissions Found</p>
              <p className="text-xs text-[#a69181]">
                {searchQuery || selectedEventId !== 'all'
                  ? 'No submission records match your current search filter.'
                  : 'Once users register for an event, their details, QR passes, and uploaded files will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#a69181] font-semibold bg-white/[0.02]">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Attendee</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Custom Answers</th>
                    <th className="p-3">Attached Files (PNG/Video)</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#e6c594]">
                        {sub.ticketId}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-white">{sub.fullName}</div>
                        <div className="text-[11px] text-[#a69181]">{sub.email}</div>
                        {sub.phone && <div className="text-[10px] text-[#a69181]/80">{sub.phone}</div>}
                      </td>

                      <td className="p-3 text-slate-300 font-medium max-w-[150px] truncate">
                        {sub.eventTitle || 'Event'}
                      </td>

                      <td className="p-3 text-[#a69181] max-w-[180px]">
                        {sub.answers && Object.keys(sub.answers).length > 0 ? (
                          Object.entries(sub.answers).map(([k, v]) => (
                            <div key={k} className="truncate">
                              <span className="text-slate-400 font-medium">{k}:</span> {String(v)}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-600">None</span>
                        )}
                      </td>

                      <td className="p-3">
                        {sub.files && sub.files.length > 0 ? (
                          sub.files.map((f, idx) => (
                            <a 
                              key={idx}
                              href={f.driveLink || f.localUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-medium truncate max-w-[160px] block"
                            >
                              📁 {f.originalName || 'Download File'}
                            </a>
                          ))
                        ) : (
                          <span className="text-slate-600">No file</span>
                        )}
                      </td>

                      <td className="p-3">
                        {sub.attendanceStatus === 'CHECKED_IN' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold inline-flex items-center gap-1">
                            ✓ Present
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {sub.attendanceStatus !== 'CHECKED_IN' ? (
                          <button 
                            onClick={() => handleManualCheckIn(sub.ticketId)}
                            className="px-2.5 py-1 rounded-lg bg-[#800020]/40 hover:bg-[#800020] text-[#e6c594] hover:text-white border border-[#e6c594]/30 text-[11px] font-semibold transition-all"
                          >
                            Mark Present
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <CreateEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => loadAdminData()}
      />
    </div>
  );
}
