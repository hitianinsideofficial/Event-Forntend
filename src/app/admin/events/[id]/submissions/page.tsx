'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../../components/Navbar';
import { 
  fetchEventById, 
  fetchSubmissionsApi, 
  checkInAttendeeApi,
  acknowledgeSubmissionApi 
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
  Flag
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Attendee Submissions List</h2>
              <p className="text-xs text-[#a69181] mt-0.5">Filter attendees, view domain details, and send acknowledgment emails.</p>
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
                    <th className="p-3">Attendee & Roll Number</th>
                    <th className="p-3">Domain & Theme Details</th>
                    <th className="p-3">Attached Media / Links</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Email Acknowledgment</th>
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
                        {sub.acknowledged ? (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Email Sent</span>
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleAcknowledge(sub.id)}
                            disabled={acknowledgingId === sub.id}
                            className="btn-tricolour text-[11px] py-1.5 px-3 inline-flex items-center gap-1.5 shadow-md disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>{acknowledgingId === sub.id ? 'Sending...' : 'Acknowledge Submission'}</span>
                          </button>
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
