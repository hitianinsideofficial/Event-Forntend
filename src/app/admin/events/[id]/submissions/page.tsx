'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../../../components/AdminNavbar';
import { 
  fetchEventById, 
  fetchSubmissionsApi, 
  checkInAttendeeApi, 
  acknowledgeSubmissionApi,
  deleteSubmissionApi,
  updatePaymentStatusApi
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
  XCircle,
  Clock,
  CreditCard,
  Grid,
  List,
  Filter,
  Layers,
  Image as ImageIcon,
  User,
  Hash,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  FileCheck,
  AlertCircle,
  DollarSign,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Download
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

  // QR Check-in scanner
  const [scanInput, setScanInput] = useState<string>('');
  const [checkInResult, setCheckInResult] = useState<ApiResponse<SubmissionItem> | null>(null);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);

  // Actions Loading State
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  // View Mode & Filters
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('ALL');

  // Preview Modal for Proof / Submission File
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

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

  const isNavroopam = eventId === '6aca70825588e8009b8e8e83' || eventId?.includes('nav') || event?.title?.toLowerCase().includes('nav');

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setCheckInLoading(true);
    setCheckInResult(null);

    try {
      const res = await checkInAttendeeApi(scanInput.trim());
      setCheckInResult(res);
      setScanInput('');
      await loadData();
    } catch (err: any) {
      setCheckInResult({ success: false, message: err.message });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleAcknowledge = async (subId: string) => {
    setAcknowledgingId(subId);
    try {
      const res = await acknowledgeSubmissionApi(subId);
      if (res.success) {
        alert(res.message);
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge submission');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleUpdatePayment = async (subId: string, status: 'PENDING' | 'VERIFIED' | 'REJECTED') => {
    setUpdatingPaymentId(subId);
    try {
      await updatePaymentStatusApi(subId, status);
      setSubmissions(prev => prev.map(s => {
        if (s.id === subId) {
          return { ...s, paymentStatus: status, paymentVerifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null };
        }
        return s;
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleDeleteSubmission = async (subId: string, participantName: string, ticketId: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE the registration for "${participantName}" (Ticket: ${ticketId})? This action cannot be undone.`)) {
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

  // Available Domains & Themes
  const availableDomains = Array.from(
    new Set(
      submissions
        .map(s => s.answers?.['Selected Domain'])
        .filter(Boolean) as string[]
    )
  );

  const availableThemes = Array.from(
    new Set(
      submissions
        .filter(s => selectedDomainFilter === 'ALL' || s.answers?.['Selected Domain'] === selectedDomainFilter)
        .map(s => s.answers?.['Selected Theme'])
        .filter(Boolean) as string[]
    )
  );

  // Filtered Submissions
  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      sub.fullName?.toLowerCase().includes(query) ||
      sub.email?.toLowerCase().includes(query) ||
      sub.phone?.toLowerCase().includes(query) ||
      sub.ticketId?.toLowerCase().includes(query) ||
      sub.answers?.['College Roll Number']?.toLowerCase().includes(query) ||
      sub.answers?.['Department']?.toLowerCase().includes(query) ||
      sub.answers?.['Transaction UID']?.toLowerCase().includes(query);

    const matchesDomain = selectedDomainFilter === 'ALL' || sub.answers?.['Selected Domain'] === selectedDomainFilter;
    const matchesTheme = selectedThemeFilter === 'ALL' || sub.answers?.['Selected Theme'] === selectedThemeFilter;
    
    const computedStatus = sub.paymentStatus || (sub.answers?.['Payment Status']?.includes('PAID') ? 'PAID' : 'PENDING');
    const matchesPayment = selectedPaymentFilter === 'ALL' || computedStatus === selectedPaymentFilter;

    return matchesSearch && matchesDomain && matchesTheme && matchesPayment;
  });

  // Summary Metrics
  const paymentStats = {
    total: submissions.length,
    verified: submissions.filter(s => s.paymentStatus === 'VERIFIED' || s.paymentStatus === 'PAID').length,
    pending: submissions.filter(s => !s.paymentStatus || s.paymentStatus === 'PENDING').length,
    rejected: submissions.filter(s => s.paymentStatus === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <AdminNavbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* HEADER BAR */}
        <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link 
              href="/admin" 
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Dashboard</span>
            </Link>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {isNavroopam && <span className="text-rose-600">🔱</span>}
              <span>{event?.title || 'Event Submissions'}</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 uppercase">
                {submissions.length} Total Submissions
              </span>
            </h1>
            <p className="text-xs text-slate-600">
              Direct review table, 12-digit UTR payment verification, media previews, and attendee check-in.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link 
              href={`/admin/events/${eventId}/edit`}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Edit Event Details</span>
            </Link>

            <Link 
              href={`/admin/events/${eventId}/form-builder`}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Edit Form Fields</span>
            </Link>
          </div>
        </div>

        {/* 4 SUMMARY STATS + LIVE QR CHECK-IN BAR */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Quick Metrics */}
          <div className="bg-white border border-slate-200 p-4 border-l-4 border-l-slate-900">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Entries</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{paymentStats.total}</p>
            <span className="text-[10px] text-slate-500">Across all domains</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 border-l-4 border-l-emerald-600">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Verified Payments</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">{paymentStats.verified}</p>
            <span className="text-[10px] text-emerald-700">UTR / Online Approved</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 border-l-4 border-l-amber-500">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending Verification</span>
            <p className="text-2xl font-black text-amber-800 mt-1">{paymentStats.pending}</p>
            <span className="text-[10px] text-amber-700">Requires manual check</span>
          </div>

          {/* QR Code Scanner Compact Form */}
          <div className="bg-white border border-slate-200 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ticket Check-In</span>
              </span>
            </div>

            <form onSubmit={handleCheckInSubmit} className="flex gap-1.5 mt-1">
              <input 
                type="text" 
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder="Scan / Enter Ticket ID..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 text-slate-900 font-mono uppercase outline-none focus:border-slate-900"
              />
              <button 
                type="submit" 
                disabled={checkInLoading}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                {checkInLoading ? '...' : 'Check-In'}
              </button>
            </form>

            {checkInResult && (
              <div className={`mt-2 p-1.5 text-[10px] font-bold border ${
                checkInResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                {checkInResult.message}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUBMISSIONS TABLE & CONTROL TOOLBAR */}
        {/* ========================================================= */}
        <section className="bg-white border border-slate-200 shadow-sm space-y-4 p-5">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name, roll, UTR, ticket..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-slate-900 font-sans"
                />
              </div>

              {/* Domain Filter */}
              <select
                value={selectedDomainFilter}
                onChange={e => {
                  setSelectedDomainFilter(e.target.value);
                  setSelectedThemeFilter('ALL');
                }}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Domains ({submissions.length})</option>
                {availableDomains.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>

              {/* Theme Filter */}
              {availableThemes.length > 0 && (
                <select
                  value={selectedThemeFilter}
                  onChange={e => setSelectedThemeFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-900 outline-none cursor-pointer"
                >
                  <option value="ALL">All Themes</option>
                  {availableThemes.map((thm, i) => (
                    <option key={i} value={thm}>{thm}</option>
                  ))}
                </select>
              )}

              {/* Payment Status Filter */}
              <select
                value={selectedPaymentFilter}
                onChange={e => setSelectedPaymentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="VERIFIED">VERIFIED / PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* VIEW MODE SWITCHER */}
            <div className="flex items-center gap-1 border border-slate-300 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Card / Gallery View</span>
              </button>
            </div>
          </div>

          {/* TABLE DISPLAY */}
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent animate-spin mb-2" />
              <p className="text-xs font-semibold">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 border border-dashed border-slate-300">
              <FileX className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">No submissions found</p>
              <p className="text-xs text-slate-500 mt-1">
                No participant records match the current search or domain/payment filter.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Participant Details</th>
                    <th className="p-3">Domain & Theme</th>
                    <th className="p-3">Payment Info & 12-Digit UTR</th>
                    <th className="p-3">Payment Verification</th>
                    <th className="p-3">Media / Attached File</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredSubmissions.map(sub => {
                    const paymentStatus = sub.paymentStatus || (sub.answers?.['Payment Status']?.includes('PAID') ? 'PAID' : 'PENDING');
                    const utr = sub.answers?.['Transaction UID'] || sub.answers?.['UTR Number'] || sub.answers?.['Transaction UID / Txn ID'] || '-';
                    const fee = sub.answers?.['Registration Fee'] || sub.answers?.['Payment Amount'] || (isNavroopam ? '₹9.00' : '-');
                    const payee = sub.answers?.['Selected Payee'] || '-';
                    
                    const paymentProofFile = sub.files && sub.files.find(f => {
                      const n = (f.originalName || '').toLowerCase();
                      return n.includes('proof') || n.includes('pay') || n.includes('screen') || n.includes('utr') || n.includes('receipt') || f.provider === 'cloudinary_payment_proof';
                    });
                    
                    // The actual submission entry file (excluding payment proof)
                    const entryFiles = sub.files ? sub.files.filter(f => f !== paymentProofFile) : [];
                    const mediaFile = entryFiles.length > 0 ? entryFiles[0] : null;
                    const driveLink = sub.answers?.['Google Drive Video Reel Link'] || sub.answers?.['Google Drive Video Link'];

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* TICKET ID */}
                        <td className="p-3 align-top font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="px-2 py-1 bg-slate-100 border border-slate-300 block text-center">
                            {sub.ticketId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block mt-1">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* PARTICIPANT DETAILS */}
                        <td className="p-3 align-top max-w-[220px]">
                          <div className="font-extrabold text-slate-900 text-xs">{sub.fullName}</div>
                          <div className="text-[11px] text-slate-600 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{sub.email}</span>
                          </div>
                          {sub.phone && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{sub.phone}</span>
                            </div>
                          )}
                          <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 mt-1 inline-block">
                            Roll: {sub.answers?.['College Roll Number'] || 'N/A'} • {sub.answers?.['Department'] || ''} ({sub.answers?.['Academic Year'] || ''})
                          </div>
                        </td>

                        {/* DOMAIN & THEME */}
                        <td className="p-3 align-top max-w-[220px]">
                          <div className="font-bold text-slate-900 text-xs">
                            {sub.answers?.['Selected Domain'] || sub.answers?.['Enrolled Event Options'] || 'General Entry'}
                          </div>
                          {sub.answers?.['Selected Theme'] && (
                            <div className="text-[11px] text-slate-600 italic mt-0.5">
                              Theme: {sub.answers['Selected Theme']}
                            </div>
                          )}
                          {sub.answers?.['Caption / Write-up / Raw Notes'] && (
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-1 border border-slate-200">
                              "{sub.answers['Caption / Write-up / Raw Notes']}"
                            </div>
                          )}
                        </td>

                        {/* PAYMENT INFO & UTR */}
                        <td className="p-3 align-top whitespace-nowrap">
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                            <span>{fee}</span>
                          </div>
                          <div className="mt-1 font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-300">
                            UTR: {utr}
                          </div>
                          {payee !== '-' && (
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                              Payee: {payee}
                            </div>
                          )}

                          {/* PAYMENT PROOF SCREENSHOT PREVIEW BUTTON (UNDER PAYMENT INFO) */}
                          {(() => {
                            // Find explicit proof file or any second uploaded image file
                            let proofFile = sub.files && sub.files.find(f => {
                              const n = (f.originalName || '').toLowerCase();
                              return n.includes('proof') || n.includes('pay') || n.includes('screen') || n.includes('utr') || n.includes('receipt') || f.provider === 'cloudinary_payment_proof';
                            });

                            // If not found by keyword, check if there's more than 1 image file
                            if (!proofFile && sub.files && sub.files.length > 1) {
                              const imageFiles = sub.files.filter(f => (f.mimeType || '').startsWith('image/'));
                              if (imageFiles.length > 1) {
                                proofFile = imageFiles[imageFiles.length - 1];
                              }
                            }

                            // If still only 1 file and it's named with receipt/proof/screenshot/or is a standalone payment event
                            if (!proofFile && sub.files && sub.files.length === 1 && !sub.answers?.['Selected Domain']) {
                              proofFile = sub.files[0];
                            }

                            if (!proofFile) {
                              return (
                                <div className="mt-1.5 text-[10px] text-slate-400 italic">
                                  No screenshot attached
                                </div>
                              );
                            }

                            const proofUrl = proofFile.localUrl || proofFile.driveLink || '';
                            return (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewMediaUrl(proofUrl);
                                    setPreviewTitle(`Payment Screenshot - ${sub.fullName} (UTR: ${utr})`);
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors rounded-none"
                                  title="Click to preview payment screenshot proof"
                                >
                                  <ImageIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span>View Payment SS 📸</span>
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* PAYMENT VERIFICATION CONTROLS */}
                        <td className="p-3 align-top whitespace-nowrap">
                          <div className="space-y-1.5">
                            {paymentStatus === 'VERIFIED' || paymentStatus === 'PAID' ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>VERIFIED / PAID</span>
                              </div>
                            ) : paymentStatus === 'REJECTED' ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-black uppercase">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>REJECTED</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black uppercase">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>PENDING REVIEW</span>
                              </div>
                            )}

                            {/* Verification Quick Action Buttons */}
                            <div className="flex items-center gap-1 pt-1">
                              {paymentStatus !== 'VERIFIED' && paymentStatus !== 'PAID' && (
                                <button
                                  type="button"
                                  disabled={updatingPaymentId === sub.id}
                                  onClick={() => handleUpdatePayment(sub.id, 'VERIFIED')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase transition-colors"
                                  title="Approve & Delete SS Proof"
                                >
                                  ✓ Approve
                                </button>
                              )}

                              {paymentStatus !== 'REJECTED' && (
                                <button
                                  type="button"
                                  disabled={updatingPaymentId === sub.id}
                                  onClick={() => handleUpdatePayment(sub.id, 'REJECTED')}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold uppercase transition-colors"
                                  title="Reject Payment"
                                >
                                  ✕ Reject
                                </button>
                              )}

                              {paymentStatus === 'REJECTED' && (
                                <button
                                  type="button"
                                  disabled={updatingPaymentId === sub.id}
                                  onClick={() => handleUpdatePayment(sub.id, 'VERIFIED')}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase transition-colors"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* MEDIA / FILE PREVIEWS */}
                        <td className="p-3 align-top whitespace-nowrap">
                          {driveLink ? (
                            <a 
                              href={driveLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Google Drive Video ↗</span>
                            </a>
                          ) : mediaFile ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewMediaUrl(mediaFile.localUrl || mediaFile.driveLink || '');
                                    setPreviewTitle(`${sub.fullName} - ${mediaFile.originalName}`);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Preview Media</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const fileUrl = mediaFile.localUrl || mediaFile.driveLink || '';
                                    if (fileUrl.startsWith('data:')) {
                                      try {
                                        const arr = fileUrl.split(',');
                                        const mimeMatch = arr[0].match(/:(.*?);/);
                                        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                                        const bstr = atob(arr[1]);
                                        let n = bstr.length;
                                        const u8arr = new Uint8Array(n);
                                        while (n--) {
                                          u8arr[n] = bstr.charCodeAt(n);
                                        }
                                        const blob = new Blob([u8arr], { type: mime });
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = blobUrl;
                                        a.download = mediaFile.originalName || 'submission_file';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                                      } catch (err) {
                                        window.open(fileUrl, '_blank');
                                      }
                                    } else {
                                      const a = document.createElement('a');
                                      a.href = fileUrl;
                                      a.target = '_blank';
                                      a.rel = 'noreferrer';
                                      a.download = mediaFile.originalName || 'submission_file';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    }
                                  }}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <a
                                href={mediaFile.localUrl || mediaFile.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:underline block truncate max-w-[160px]"
                              >
                                {mediaFile.originalName}
                              </a>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No media file</span>
                          )}
                        </td>

                        {/* ACTIONS (ACKNOWLEDGE & DELETE) */}
                        <td className="p-3 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {sub.acknowledged ? (
                              <button 
                                onClick={() => handleAcknowledge(sub.id)}
                                disabled={acknowledgingId === sub.id}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold inline-flex items-center gap-1"
                                title="Resend Confirmation Email"
                              >
                                <span>{acknowledgingId === sub.id ? '...' : 'Resend Email 🔄'}</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAcknowledge(sub.id)}
                                disabled={acknowledgingId === sub.id}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                              >
                                <Send className="w-3 h-3" />
                                <span>{acknowledgingId === sub.id ? 'Sending...' : 'Send Email'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteSubmission(sub.id, sub.fullName, sub.ticketId)}
                              disabled={deletingSubId === sub.id}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARD / GALLERY VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubmissions.map(sub => {
                const mediaUrl = sub.files && sub.files.length > 0
                  ? (sub.files[0].localUrl || sub.files[0].driveLink || null)
                  : null;
                const isImage = mediaUrl ? /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(mediaUrl) || mediaUrl.includes('cloudinary') || mediaUrl.includes('imagekit') : false;
                const paymentStatus = sub.paymentStatus || (sub.answers?.['Payment Status']?.includes('PAID') ? 'PAID' : 'PENDING');
                const utr = sub.answers?.['Transaction UID'] || sub.answers?.['UTR Number'] || '-';

                return (
                  <div key={sub.id} className="bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between space-y-3">
                    {/* Media Preview Box */}
                    <div className="relative w-full h-48 bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {isImage && mediaUrl ? (
                        <img 
                          src={mediaUrl} 
                          alt={sub.fullName} 
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => {
                            setPreviewMediaUrl(mediaUrl);
                            setPreviewTitle(sub.fullName);
                          }}
                        />
                      ) : sub.answers?.['Google Drive Video Reel Link'] ? (
                        <div className="text-center p-3">
                          <ExternalLink className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                          <span className="text-xs font-bold text-slate-800 block">Google Drive Video</span>
                          <a 
                            href={sub.answers['Google Drive Video Reel Link']} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase"
                          >
                            Open Video ↗
                          </a>
                        </div>
                      ) : mediaUrl ? (
                        <div className="text-center p-3">
                          <ImageIcon className="w-8 h-8 text-indigo-600 mx-auto mb-1" />
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[180px] block">{sub.files?.[0]?.originalName}</span>
                          <a 
                            href={mediaUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="mt-2 inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-bold uppercase"
                          >
                            Download File ↗
                          </a>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <FileX className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-xs">No media file</span>
                        </div>
                      )}

                      {/* Domain Badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
                        {sub.answers?.['Selected Domain'] || 'General'}
                      </span>
                    </div>

                    {/* Participant Details */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{sub.fullName}</span>
                        <span className="font-mono text-[10px] font-bold text-slate-600">{sub.ticketId}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{sub.email} • {sub.phone}</div>
                      <div className="text-indigo-700 font-bold text-[11px]">
                        Roll: {sub.answers?.['College Roll Number'] || 'N/A'} ({sub.answers?.['Department'] || ''})
                      </div>
                      <div className="bg-slate-50 p-2 border border-slate-200 mt-2 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-semibold">UTR:</span>
                          <span className="font-mono font-bold text-slate-800">{utr}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-semibold">Payment:</span>
                          <span className={`font-bold uppercase ${
                            paymentStatus === 'VERIFIED' || paymentStatus === 'PAID' ? 'text-emerald-700' :
                            paymentStatus === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'
                          }`}>
                            {paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Payment Action Bar */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        {paymentStatus !== 'VERIFIED' && paymentStatus !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePayment(sub.id, 'VERIFIED')}
                            className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {paymentStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePayment(sub.id, 'REJECTED')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold uppercase"
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleAcknowledge(sub.id)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                          title="Send Email"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(sub.id, sub.fullName, sub.ticketId)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MEDIA PREVIEW MODAL */}
        {previewMediaUrl && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-xs font-bold bg-slate-200 px-2 py-0.5 text-slate-800">
                    {previewMediaUrl.toLowerCase().includes('.pdf') || previewMediaUrl.startsWith('data:application/pdf') ? 'PDF DOCUMENT' : 'MEDIA PREVIEW'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{previewTitle}</h3>
                </div>
                <button 
                  onClick={() => setPreviewMediaUrl(null)}
                  className="px-2.5 py-1 bg-slate-900 text-white text-xs font-bold uppercase transition-colors hover:bg-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              {/* MODAL CONTENT: PDF EMBED OR IMAGE */}
              <div className="p-2 sm:p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[450px] max-h-[72vh]">
                {previewMediaUrl.toLowerCase().includes('.pdf') || previewMediaUrl.startsWith('data:application/pdf') ? (
                  <iframe 
                    src={previewMediaUrl} 
                    title="PDF Document Preview"
                    className="w-full h-[68vh] border border-slate-300 bg-white"
                  />
                ) : (
                  <img 
                    src={previewMediaUrl} 
                    alt="Submission Preview" 
                    className="max-w-full max-h-[68vh] object-contain border border-slate-300 shadow-sm bg-white"
                  />
                )}
              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div className="p-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 bg-white">
                <button 
                  type="button"
                  onClick={() => {
                    // Safe browser download that works for both remote HTTPS and data URIs
                    try {
                      if (previewMediaUrl.startsWith('data:')) {
                        const arr = previewMediaUrl.split(',');
                        const mimeMatch = arr[0].match(/:(.*?);/);
                        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                          u8arr[n] = bstr.charCodeAt(n);
                        }
                        const blob = new Blob([u8arr], { type: mime });
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = previewTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'download';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                      } else {
                        const a = document.createElement('a');
                        a.href = previewMediaUrl;
                        a.target = '_blank';
                        a.rel = 'noreferrer';
                        a.download = previewTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'download';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    } catch (err) {
                      window.open(previewMediaUrl, '_blank');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    // For data URIs, convert to object URL so Chrome doesn't block with about:blank#blocked
                    if (previewMediaUrl.startsWith('data:')) {
                      try {
                        const arr = previewMediaUrl.split(',');
                        const mimeMatch = arr[0].match(/:(.*?);/);
                        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                          u8arr[n] = bstr.charCodeAt(n);
                        }
                        const blob = new Blob([u8arr], { type: mime });
                        const blobUrl = URL.createObjectURL(blob);
                        window.open(blobUrl, '_blank');
                      } catch (e) {
                        window.open(previewMediaUrl, '_blank');
                      }
                    } else {
                      window.open(previewMediaUrl, '_blank');
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
