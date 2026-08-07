'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../../components/Navbar';
import { 
  fetchEventById, 
  fetchSubmissionsApi, 
  checkInAttendeeApi 
} from '../../../../../services/api.service';
import { EventItem } from '../../../../../types/event.types';
import { SubmissionItem } from '../../../../../types/submission.types';
import { ApiResponse } from '../../../../../types/api.types';
import { 
  ArrowLeft, 
  QrCode, 
  Check, 
  FileX, 
  ExternalLink 
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

  const filteredSubmissions = submissions.filter(sub => 
    sub.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.ticketId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-xs text-[#a69181] mt-1">Registrations, custom answers, uploaded files, and live QR check-in scanner.</p>
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
                <h3 className="text-base font-bold text-white mb-1">QR Attendance System Disabled</h3>
                <p className="text-xs text-[#a69181]">
                  This event was configured without QR Attendance tracking. Registrations and submitted media files are tracked below.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-[#e6d7c3] mb-4">Event Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#a69181]">Registrations</span>
                <span className="text-lg font-bold text-white">{submissions.length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-[#a69181]">Checked-In Attendees</span>
                <span className="text-lg font-bold text-emerald-400">
                  {submissions.filter(s => s.attendanceStatus === 'CHECKED_IN').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a69181]">Media Files Uploaded</span>
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
              <h2 className="text-xl font-bold text-white">Attendee Submissions</h2>
              <p className="text-xs text-[#a69181] mt-0.5">Filter attendees, custom answers, and downloaded files.</p>
            </div>

            <input 
              type="text" 
              placeholder="Search name, email, ticket..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#20070d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#a69181] outline-none w-full sm:w-64"
            />
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
              <p className="text-sm font-semibold text-white mb-1">No Submissions Found</p>
              <p className="text-xs text-[#a69181]">
                {searchQuery ? 'No submission records match your search query.' : 'No attendees have registered for this event yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#a69181] font-semibold bg-white/[0.02]">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Attendee</th>
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

                      <td className="p-3 text-[#a69181] max-w-[220px]">
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
                        {sub.attendanceStatus === 'CHECKED_IN' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Present</span>
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
    </div>
  );
}
