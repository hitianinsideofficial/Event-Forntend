'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { 
  fetchEvents, 
  fetchSubmissionsApi, 
  sendAppreciationEmailApi,
  toggleCouponCollectedApi,
  deleteCertificateApi
} from '../../../services/api.service';
import { EventItem } from '../../../types/event.types';
import { SubmissionItem } from '../../../types/submission.types';
import { 
  ArrowLeft, 
  Mail, 
  Send, 
  CheckCircle2, 
  RotateCw, 
  Upload, 
  FileCheck, 
  Sparkles, 
  MapPin, 
  Clock, 
  Calendar, 
  Ticket, 
  Search, 
  User, 
  CheckSquare, 
  Square, 
  AlertCircle,
  Trash2,
  X
} from 'lucide-react';

export default function SendAppreciationEmailPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING'>('ALL');

  // Email Config State (Pre-filled as requested: Garden hut, 3pm to 5pm, 04. Oct 2026)
  const [location, setLocation] = useState<string>('Garden hut');
  const [timeSlot, setTimeSlot] = useState<string>('3:00 PM to 5:00 PM');
  const [dateStr, setDateStr] = useState<string>('04. Oct 2026');
  const [customMessage, setCustomMessage] = useState<string>(
    'We truly appreciate your dynamic enthusiasm, hard work, and valuable participation in the event. We are pleased to issue you this Certificate of Participation! You can collect your participation coupon at the venue and timing indicated below.'
  );

  // Per-participant Certificate Files: { [subId: string]: File }
  const [certificateFiles, setCertificateFiles] = useState<{ [subId: string]: File }>({});
  
  // Sending & Deleting state
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Load all events on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAllEvents = async () => {
      setLoadingEvents(true);
      try {
        const evs = await fetchEvents(true, true);
        setEvents(evs);
        if (evs.length > 0) {
          setSelectedEventId(evs[0].id || (evs[0] as any)._id);
        }
      } catch (err) {
        console.error('Failed to load events list:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadAllEvents();
  }, [isAuthenticated]);

  // Load submissions whenever selected event changes
  const loadEventSubmissions = async (eventId: string) => {
    if (!eventId) return;
    setLoadingSubmissions(true);
    try {
      const subs = await fetchSubmissionsApi(eventId);
      setSubmissions(subs);
    } catch (err) {
      console.error('Failed to fetch event submissions:', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadEventSubmissions(selectedEventId);
    }
  }, [selectedEventId]);

  if (!isAuthenticated) return null;

  const selectedEvent = events.find(e => (e.id || (e as any)._id) === selectedEventId);

  const handleFileChange = (subId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificateFiles(prev => ({ ...prev, [subId]: file }));
    }
  };

  const removeLocalFile = (subId: string) => {
    setCertificateFiles(prev => {
      const copy = { ...prev };
      delete copy[subId];
      return copy;
    });
  };

  const handleDeleteStoredCertificate = async (sub: SubmissionItem) => {
    if (!window.confirm(`Are you sure you want to delete the uploaded certificate for ${sub.fullName}?`)) {
      return;
    }

    setDeletingCertId(sub.id);
    try {
      await deleteCertificateApi(sub.id);
      setSubmissions(prev => prev.map(s => {
        if (s.id === sub.id) {
          return { ...s, certificateFileUrl: null };
        }
        return s;
      }));
      setFeedbackMsg({
        type: 'success',
        text: `Certificate deleted for ${sub.fullName}`
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || `Failed to delete certificate for ${sub.fullName}`
      });
    } finally {
      setDeletingCertId(null);
    }
  };

  const handleSendAppreciationEmail = async (sub: SubmissionItem) => {
    const attachedFile = certificateFiles[sub.id];
    const hasCertificate = Boolean(attachedFile || sub.certificateFileUrl);

    if (!hasCertificate) {
      setFeedbackMsg({
        type: 'error',
        text: `Cannot send email to ${sub.fullName}: Please upload a Certificate first.`
      });
      return;
    }

    setSendingId(sub.id);
    setFeedbackMsg(null);

    try {
      const formData = new FormData();
      formData.append('location', location);
      formData.append('timeSlot', timeSlot);
      formData.append('dateStr', dateStr);
      formData.append('customMessage', customMessage);

      if (attachedFile) {
        formData.append('certificate', attachedFile);
      }

      const res = await sendAppreciationEmailApi(sub.id, formData);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Appreciation email sent to ${sub.fullName} (${sub.email}) successfully!`
        });

        // Update local status
        setSubmissions(prev => prev.map(s => {
          if (s.id === sub.id) {
            return {
              ...s,
              appreciationSent: true,
              appreciationSentAt: new Date().toISOString(),
              certificateFileUrl: res.data?.certificateFileUrl || s.certificateFileUrl
            };
          }
          return s;
        }));

        // Remove from pending file picker after successful dispatch
        removeLocalFile(sub.id);
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || `Failed to send email to ${sub.fullName}`
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleToggleCoupon = async (sub: SubmissionItem) => {
    const nextState = !sub.couponCollected;
    try {
      await toggleCouponCollectedApi(sub.id, nextState);
      setSubmissions(prev => prev.map(s => {
        if (s.id === sub.id) {
          return { ...s, couponCollected: nextState };
        }
        return s;
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to update coupon collected status');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      sub.fullName?.toLowerCase().includes(query) ||
      sub.email?.toLowerCase().includes(query) ||
      sub.ticketId?.toLowerCase().includes(query) ||
      sub.answers?.['College Roll Number']?.toLowerCase().includes(query) ||
      sub.answers?.['Department']?.toLowerCase().includes(query);

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'SENT' ? Boolean(sub.appreciationSent) :
      !sub.appreciationSent;

    return matchesSearch && matchesStatus;
  });

  const totalCount = submissions.length;
  const sentCount = submissions.filter(s => s.appreciationSent).length;
  const pendingCount = totalCount - sentCount;
  const couponCollectedCount = submissions.filter(s => s.couponCollected).length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TOP NAVIGATION BAR */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Console</span>
          </Link>

          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono">
            ✉️ PARTICIPATION EMAIL DISPATCH HUB
          </span>
        </div>

        {/* PAGE HEADER */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span>Participant Appreciation & <span className="text-blue-400">Certificate Dispatch</span></span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an event, upload custom certificates, configure venue details, and dispatch appreciation emails with coupon notices.
            </p>
          </div>

          {/* EVENT SELECTOR DROPDOWN */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Target Event:</span>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              disabled={loadingEvents}
              className="form-select bg-[#131b2e] border-slate-700 text-xs text-white py-2 px-3 rounded-xl font-bold min-w-[240px]"
            >
              {events.map(ev => {
                const id = ev.id || (ev as any)._id;
                return (
                  <option key={id} value={id}>
                    {ev.title} {ev.status ? `(${ev.status})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* FEEDBACK NOTIFICATION BANNER */}
        {feedbackMsg && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONFIGURATION & EMAIL TEMPLATE CONTROL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* EMAIL DETAILS CONFIGURATION BOX */}
          <div className="lg:col-span-2 glass-panel p-6 border border-blue-500/20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Coupon Collection & Email Announcement Parameters</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                Auto-Embedded in Emails
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coupon Location:</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Garden hut"
                  className="form-input text-xs bg-[#0b0f19]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Date:</span>
                </label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  placeholder="e.g. 04. Oct 2026"
                  className="form-input text-xs bg-[#0b0f19]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Time Slot:</span>
                </label>
                <input
                  type="text"
                  value={timeSlot}
                  onChange={e => setTimeSlot(e.target.value)}
                  placeholder="e.g. 3pm to 5pm"
                  className="form-input text-xs bg-[#0b0f19]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Appreciation Body Text:</span>
              </label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={2}
                placeholder="Enter custom appreciation paragraph..."
                className="form-textarea text-xs bg-[#0b0f19]"
              />
            </div>
          </div>

          {/* STATS SUMMARY CARD */}
          <div className="glass-panel p-6 flex flex-col justify-between border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-blue-400" />
                <span>Event Dispatch Status</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-4 truncate">{selectedEvent?.title || 'Selected Event'}</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Total Participants</span>
                  <span className="text-base font-bold text-white font-mono">{totalCount}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Email Received
                  </span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{sentCount}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Pending Email</span>
                  <span className="text-base font-bold text-amber-400 font-mono">{pendingCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-blue-400" /> Coupons Collected
                  </span>
                  <span className="text-base font-bold text-blue-400 font-mono">{couponCollectedCount} / {totalCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PARTICIPANTS TABLE & ACTIONS */}
        <section className="glass-panel p-6 border border-slate-800">
          {/* SEARCH & STATUS FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Event Participants</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono">
                  {filteredSubmissions.length} Attendees
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Attach participant certificates, click "Send Appreciation Email", and manage coupon status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* STATUS FILTER PILLS */}
              <div className="flex items-center p-1 rounded-xl bg-[#0b0f19] border border-slate-800">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('SENT')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'SENT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Received ({sentCount})
                </button>
              </div>

              {/* SEARCH BAR */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search participant name, roll, email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* PARTICIPANTS TABLE */}
          {loadingSubmissions ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading registered participants...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white mb-1">No Participants Found</p>
              <p className="text-xs text-slate-400">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'No attendees match the current search or filter.' 
                  : 'No participants registered for this event yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-white/[0.01]">
                    <th className="p-3.5">Ticket ID</th>
                    <th className="p-3.5">Participant Details</th>
                    <th className="p-3.5">Email Status</th>
                    <th className="p-3.5">Certificate File</th>
                    <th className="p-3.5">Coupon Collected</th>
                    <th className="p-3.5 text-right">Email Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubmissions.map(sub => {
                    const isSent = Boolean(sub.appreciationSent);
                    const isSending = sendingId === sub.id;
                    const selectedFile = certificateFiles[sub.id];

                    return (
                      <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* TICKET ID */}
                        <td className="p-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                          {sub.ticketId}
                        </td>

                        {/* PARTICIPANT DETAILS */}
                        <td className="p-3.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.fullName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{sub.email}</div>
                          {sub.answers?.['College Roll Number'] && (
                            <div className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                              Roll: {sub.answers['College Roll Number']}
                            </div>
                          )}
                        </td>

                        {/* EMAIL STATUS BADGE */}
                        <td className="p-3.5 whitespace-nowrap">
                          {isSent ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Email Sent</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium inline-flex items-center gap-1">
                              <span>Pending Delivery</span>
                            </span>
                          )}
                          {sub.appreciationSentAt && (
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {new Date(sub.appreciationSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>

                        {/* CERTIFICATE UPLOAD / DELETE / STATUS */}
                        <td className="p-3.5">
                          {selectedFile ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium truncate max-w-[150px] inline-flex items-center gap-1.5 shadow-sm">
                                <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">{selectedFile.name}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => removeLocalFile(sub.id)}
                                className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all inline-flex items-center gap-1"
                                title="Delete / Remove this uploaded certificate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Delete</span>
                              </button>
                            </div>
                          ) : sub.certificateFileUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={sub.certificateFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium inline-flex items-center gap-1.5 transition-all"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>View Certificate ↗</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteStoredCertificate(sub)}
                                disabled={deletingCertId === sub.id}
                                className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all inline-flex items-center gap-1 disabled:opacity-50"
                                title="Delete this uploaded certificate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[10px]">{deletingCertId === sub.id ? '...' : 'Delete'}</span>
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-[#131b2e] hover:bg-[#1e293b] text-slate-300 border border-slate-700 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-blue-400" />
                              <span>Upload Certificate</span>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={e => handleFileChange(sub.id, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </td>

                        {/* COUPON COLLECTED CHECKBOX */}
                        <td className="p-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(sub)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 border ${
                              sub.couponCollected
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {sub.couponCollected ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                <span>Collected</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5 text-slate-500" />
                                <span>Not Collected</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* SEND / RESEND EMAIL BUTTON */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {(() => {
                            const hasCert = Boolean(selectedFile || sub.certificateFileUrl);

                            if (isSent) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleSendAppreciationEmail(sub)}
                                  disabled={isSending || !hasCert}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                                    !hasCert 
                                      ? 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed'
                                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-50'
                                  }`}
                                  title={!hasCert ? 'Upload a certificate before resending email' : 'Resend Appreciation Email'}
                                >
                                  <RotateCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                                  <span>{isSending ? 'Resending...' : !hasCert ? 'Upload Cert to Resend' : 'Resend Email'}</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => handleSendAppreciationEmail(sub)}
                                disabled={isSending || !hasCert}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                                  !hasCert
                                    ? 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 disabled:opacity-50'
                                }`}
                                title={!hasCert ? 'Upload a certificate first before sending email' : 'Send Appreciation Email'}
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSending ? 'Sending...' : !hasCert ? 'Upload Cert to Send' : 'Send Email'}</span>
                              </button>
                            );
                          })()}
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
    </div>
  );
}
