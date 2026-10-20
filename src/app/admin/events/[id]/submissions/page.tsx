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
  sendConfirmationEmailApi,
  deleteSubmissionApi,
  updatePaymentStatusApi,
  requestDriveLinkUpdateEmailApi,
  requestResubmissionEmailApi,
  updatePostingExcelApi
} from '../../../../../services/api.service';
import { EventItem } from '../../../../../types/event.types';
import { SubmissionItem } from '../../../../../types/submission.types';
import { ApiResponse } from '../../../../../types/api.types';
import EmailPreviewModal from '../../../../../components/EmailPreviewModal';
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
  Download,
  FileSpreadsheet,
  MailWarning,
  Upload,
  AlertTriangle
} from 'lucide-react';
import MongoProgressBar from '../../../../../components/MongoProgressBar';

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
  const [sendingDriveEmailId, setSendingDriveEmailId] = useState<string | null>(null);

  // View Mode & Filters
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('ALL');

  // Preview Modal for Proof / Submission File
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Email Templates Preview Modal
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState<boolean>(false);

  // Send Confirmation Email with Instagram link modal
  const [confirmationModalSub, setConfirmationModalSub] = useState<SubmissionItem | null>(null);
  const [instagramInput, setInstagramInput] = useState<string>('');
  const [sendingConfirmationId, setSendingConfirmationId] = useState<string | null>(null);

  // Re-submission rejection modal (Photo, Artwork, Writing)
  const [resubmissionModalSub, setResubmissionModalSub] = useState<SubmissionItem | null>(null);
  const [selectedReasonOption, setSelectedReasonOption] = useState<string>('Photo is not uploaded');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [sendingResubmissionId, setSendingResubmissionId] = useState<string | null>(null);
  const [updatingMoveId, setUpdatingMoveId] = useState<string | null>(null);

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

  const loadData = async (forceRefresh: boolean = false) => {
    if (!event || submissions.length === 0) {
      setLoading(true);
    }
    try {
      const [evData, subsData] = await Promise.all([
        fetchEventById(eventId, forceRefresh),
        fetchSubmissionsApi(eventId, forceRefresh)
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
      loadData(false);
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

  const handleOpenConfirmationModal = (sub: SubmissionItem) => {
    if (!sub.acknowledged) {
      alert('Acknowledgment email must be sent first before sending the confirmation email.');
      return;
    }
    setConfirmationModalSub(sub);
    setInstagramInput(sub.instagramPostUrl || '');
  };

  const handleSendConfirmationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationModalSub) return;

    if (!instagramInput.trim()) {
      alert('Please enter the Instagram post URL where the submission has been published.');
      return;
    }

    setSendingConfirmationId(confirmationModalSub.id);
    try {
      const res = await sendConfirmationEmailApi(confirmationModalSub.id, instagramInput.trim());
      if (res.success) {
        alert(res.message);
        setConfirmationModalSub(null);
        setInstagramInput('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send confirmation email');
    } finally {
      setSendingConfirmationId(null);
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

  const handleSendDriveUpdateEmail = async (sub: SubmissionItem) => {
    if (!window.confirm(
      `Send Google Drive link update email to "${sub.fullName}" (${sub.email})?\n\nThis will send a step-by-step guide explaining how to make their Google Drive video link public ("Anyone with the link can view") and provide a secure, one-time link for them to update their submission.`
    )) {
      return;
    }

    setSendingDriveEmailId(sub.id);
    try {
      const res = await requestDriveLinkUpdateEmailApi(sub.id);
      if (res.success) {
        alert(res.message || `Drive link update email successfully dispatched to ${sub.fullName}!`);
        setSubmissions(prev => prev.map(s => {
          if (s.id === sub.id) {
            return {
              ...s,
              driveUpdateMailSent: true,
              driveUpdateMailSentAt: new Date().toISOString(),
              isDriveNotPublic: true
            };
          }
          return s;
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send Drive link update email');
    } finally {
      setSendingDriveEmailId(null);
    }
  };

  // Toggle "Move to Posting Excel" checkbox
  const handleToggleMoveToPostingExcel = async (sub: SubmissionItem, currentValue: boolean) => {
    const newValue = !currentValue;
    setUpdatingMoveId(sub.id);
    try {
      await updatePostingExcelApi(sub.id, {
        moveToPostingExcel: newValue
      });
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, moveToPostingExcel: newValue } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update Move to Posting Excel status');
    } finally {
      setUpdatingMoveId(null);
    }
  };

  // Open Re-submission Modal
  const handleOpenResubmissionModal = (sub: SubmissionItem) => {
    setResubmissionModalSub(sub);
    setSelectedReasonOption('Photo is not uploaded');
    setCustomReasonText('');
  };

  // Dispatch Re-submission Email
  const handleConfirmSendResubmissionEmail = async () => {
    if (!resubmissionModalSub) return;

    let finalReason = selectedReasonOption;
    if (selectedReasonOption === 'OTHER') {
      finalReason = customReasonText.trim();
      if (!finalReason) {
        alert('Please specify the rejection reason.');
        return;
      }
    }

    setSendingResubmissionId(resubmissionModalSub.id);
    try {
      const res = await requestResubmissionEmailApi(resubmissionModalSub.id, finalReason);
      if (res.success) {
        alert(res.message || `Resubmission email successfully sent to ${resubmissionModalSub.fullName}!`);
        setSubmissions(prev => prev.map(s => {
          if (s.id === resubmissionModalSub.id) {
            return {
              ...s,
              resubmissionRequested: true,
              resubmissionRequestedAt: new Date().toISOString(),
              resubmissionReason: finalReason,
              resubmissionCompleted: false
            };
          }
          return s;
        }));
        setResubmissionModalSub(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send resubmission email');
    } finally {
      setSendingResubmissionId(null);
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

  // Summary Metrics & QR / Payee Revenue Breakdown
  const paymentStats = {
    total: submissions.length,
    verified: submissions.filter(s => s.paymentStatus === 'VERIFIED' || s.paymentStatus === 'PAID').length,
    pending: submissions.filter(s => !s.paymentStatus || s.paymentStatus === 'PENDING').length,
    rejected: submissions.filter(s => s.paymentStatus === 'REJECTED').length,
  };

  // Helper to extract fee number from string like "₹9.00 INR", "RS. 50/-", or "9"
  const parseFeeAmount = (feeStr?: string): number => {
    if (!feeStr) return 0;
    const match = String(feeStr).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // QR / Payee Money Breakdown
  const payeeBreakdown = React.useMemo(() => {
    const stats: Record<string, { count: number; verifiedCount: number; pendingCount: number; verifiedAmount: number; totalAmount: number; name: string; upiId: string }> = {};

    submissions.forEach(sub => {
      const rawPayee = sub.answers?.['Selected Payee'] || sub.answers?.['Payee'] || (isNavroopam ? 'Ayush Raj (9135444297@ibl)' : 'HITian Inside (Default QR)');
      const key = rawPayee.trim() || 'Unknown Payee';
      
      let payeeName = key;
      let upiId = '';
      const match = key.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        payeeName = match[1].trim();
        upiId = match[2].trim();
      }

      if (!stats[key]) {
        stats[key] = {
          name: payeeName,
          upiId: upiId,
          count: 0,
          verifiedCount: 0,
          pendingCount: 0,
          verifiedAmount: 0,
          totalAmount: 0
        };
      }

      const rawFee = sub.answers?.['Registration Fee'] || sub.answers?.['Payment Amount'] || (isNavroopam ? '9' : '50');
      const amount = parseFeeAmount(rawFee);

      stats[key].count += 1;
      stats[key].totalAmount += amount;

      const isVerified = sub.paymentStatus === 'VERIFIED' || sub.paymentStatus === 'PAID';
      if (isVerified) {
        stats[key].verifiedCount += 1;
        stats[key].verifiedAmount += amount;
      } else if (!sub.paymentStatus || sub.paymentStatus === 'PENDING') {
        stats[key].pendingCount += 1;
      }
    });

    return Object.entries(stats).map(([raw, data]) => ({ raw, ...data }));
  }, [submissions, isNavroopam]);

  const totalVerifiedRevenue = payeeBreakdown.reduce((sum, p) => sum + p.verifiedAmount, 0);
  const totalPotentialRevenue = payeeBreakdown.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white relative">
      <AdminNavbar />

      {/* Centered Modal Progress Bar with blurred backdrop */}
      {loading && (
        <MongoProgressBar 
          asModal={true}
          theme="light" 
          message="Loading submissions from MongoDB..." 
          subMessage="Fetching participant registrations & files"
          estimatedSeconds={3.5}
        />
      )}

      <main className="flex-1 w-full max-w-[100vw] px-2 sm:px-4 lg:px-6 py-4 space-y-4">
        
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
            {isNavroopam && (
              <Link
                href={`/admin/events/${eventId}/posting-excel`}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                title="Posting Excel - Mark Qualified, Posted, Disqualified & Save Instagram link"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Posting Excel</span>
              </Link>
            )}

            <button
              onClick={() => setIsEmailPreviewOpen(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Preview participant email templates (Submission under verification & Instagram post confirmation)"
            >
              <Mail className="w-3.5 h-3.5 text-amber-700" />
              <span>Email Previews</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
        {/* QR CODE & PAYEE REVENUE BREAKDOWN */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>QR Code & Payee Revenue Breakdown</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full font-mono">
                    {payeeBreakdown.length} {payeeBreakdown.length === 1 ? 'QR / Payee' : 'QRs / Payees'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Total money collected and pending verification split across each UPI QR code / payee.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-right">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Verified</span>
                <span className="text-sm font-black text-emerald-700 font-mono">₹{totalVerifiedRevenue.toFixed(2)}</span>
              </div>
              <div className="w-[1px] h-7 bg-slate-200"></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">All Entries</span>
                <span className="text-sm font-black text-slate-800 font-mono">₹{totalPotentialRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payeeBreakdown.map((payee, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 hover:bg-slate-100/70 transition-all border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Payee / QR Target
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={payee.name}>
                      {payee.name}
                    </h4>
                    {payee.upiId && (
                      <span className="font-mono text-[11px] text-emerald-700 font-semibold block truncate select-all" title={payee.upiId}>
                        {payee.upiId}
                      </span>
                    )}
                  </div>

                  <div className="w-7 h-7 rounded-md bg-white border border-slate-300 flex items-center justify-center shrink-0 text-slate-700 shadow-2xs">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                </div>

                {/* Amount Split Cards */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Verified Received</span>
                    <span className="text-base font-black text-emerald-700 font-mono block mt-0.5">
                      ₹{payee.verifiedAmount.toFixed(2)}
                    </span>
                    <span className="text-[9.5px] text-emerald-600 font-medium">
                      {payee.verifiedCount} {payee.verifiedCount === 1 ? 'payment' : 'payments'} verified
                    </span>
                  </div>

                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Expected</span>
                    <span className="text-base font-black text-amber-700 font-mono block mt-0.5">
                      ₹{payee.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[9.5px] text-amber-600 font-medium">
                      {payee.count} total ({payee.pendingCount} pending)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                  <span>Entries routed: <strong className="text-slate-800">{payee.count}</strong></span>
                  <span>
                    Success rate: <strong className="text-slate-800">{payee.count > 0 ? Math.round((payee.verifiedCount / payee.count) * 100) : 0}%</strong>
                  </span>
                </div>
              </div>
            ))}
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
              <p className="text-xs font-semibold animate-pulse">Syncing submissions from database...</p>
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
                    <th className="px-2 py-2 w-[110px]">Ticket ID</th>
                    <th className="px-2 py-2 max-w-[190px]">Participant Details</th>
                    <th className="px-2 py-2 max-w-[180px]">Domain & Theme</th>
                    <th className="px-2 py-2 w-[130px]">Payment & UTR</th>
                    <th className="px-2 py-2 w-[110px]">Verification</th>
                    <th className="px-2 py-2 w-[140px]">Media / File</th>
                    {isNavroopam && (
                      <th className="px-2 py-2 text-center whitespace-nowrap bg-emerald-50 text-emerald-900 border-x border-emerald-200 w-[70px]" title="Move to Posting Excel Sheet">
                        To Excel
                      </th>
                    )}
                    <th className="px-2 py-2 text-right w-[150px]">Actions</th>
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
                        <td className="px-2 py-2 align-top font-mono font-bold text-slate-900">
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 block text-center text-[11px] truncate">
                            {sub.ticketId}
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans block mt-0.5 text-center">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* PARTICIPANT DETAILS */}
                        <td className="px-2 py-2 align-top max-w-[190px]">
                          <div className="font-extrabold text-slate-900 text-xs truncate" title={sub.fullName}>{sub.fullName}</div>
                          <div className="text-[10px] text-slate-600 truncate flex items-center gap-1 mt-0.5" title={sub.email}>
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{sub.email}</span>
                          </div>
                          {sub.phone && (
                            <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{sub.phone}</span>
                            </div>
                          )}
                          <div className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 mt-1 block truncate" title={`Roll: ${sub.answers?.['College Roll Number'] || 'N/A'} • ${sub.answers?.['Department'] || ''} (${sub.answers?.['Academic Year'] || ''})`}>
                            Roll: {sub.answers?.['College Roll Number'] || 'N/A'} • {sub.answers?.['Department'] || ''}
                          </div>
                        </td>

                        {/* DOMAIN & THEME */}
                        <td className="px-2 py-2 align-top max-w-[180px]">
                          <div className="font-bold text-slate-900 text-[11px] leading-tight">
                            {sub.answers?.['Selected Domain'] || sub.answers?.['Enrolled Event Options'] || 'General Entry'}
                          </div>
                          {sub.answers?.['Selected Theme'] && (
                            <div className="text-[10px] text-slate-600 italic mt-0.5 leading-snug line-clamp-2" title={sub.answers['Selected Theme']}>
                              Theme: {sub.answers['Selected Theme']}
                            </div>
                          )}
                          {sub.answers?.['Caption / Write-up / Raw Notes'] && (
                            <div className="text-[9px] text-slate-500 mt-1 line-clamp-1 bg-slate-50 p-1 border border-slate-200" title={sub.answers['Caption / Write-up / Raw Notes']}>
                              "{sub.answers['Caption / Write-up / Raw Notes']}"
                            </div>
                          )}
                        </td>

                        {/* PAYMENT INFO & UTR */}
                        <td className="px-2 py-2 align-top">
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-slate-500" />
                            <span>{fee}</span>
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 border border-slate-300 truncate" title={`UTR: ${utr}`}>
                            UTR: {utr}
                          </div>
                          {payee !== '-' && (
                            <div className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[130px]" title={`Payee: ${payee}`}>
                              Payee: {payee}
                            </div>
                          )}

                          {/* PAYMENT PROOF SCREENSHOT PREVIEW BUTTON */}
                          {(() => {
                            let proofFile = sub.files && sub.files.find(f => {
                              const n = (f.originalName || '').toLowerCase();
                              return n.includes('proof') || n.includes('pay') || n.includes('screen') || n.includes('utr') || n.includes('receipt') || f.provider === 'cloudinary_payment_proof';
                            });

                            if (!proofFile && sub.files && sub.files.length > 1) {
                              const imageFiles = sub.files.filter(f => (f.mimeType || '').startsWith('image/'));
                              if (imageFiles.length > 1) {
                                proofFile = imageFiles[imageFiles.length - 1];
                              }
                            }

                            if (!proofFile && sub.files && sub.files.length === 1 && !sub.answers?.['Selected Domain']) {
                              proofFile = sub.files[0];
                            }

                            if (!proofFile) {
                              return (
                                <div className="mt-1 text-[9px] text-slate-400 italic">
                                  No screenshot
                                </div>
                              );
                            }

                            const proofUrl = proofFile.localUrl || proofFile.driveLink || '';
                            return (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewMediaUrl(proofUrl);
                                    setPreviewTitle(`Payment Screenshot - ${sub.fullName} (UTR: ${utr})`);
                                  }}
                                  className="w-full px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors"
                                  title="Click to preview payment screenshot proof"
                                >
                                  <ImageIcon className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span>Proof SS 📸</span>
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* PAYMENT VERIFICATION CONTROLS */}
                        <td className="px-2 py-2 align-top">
                          <div className="space-y-1">
                            {paymentStatus === 'VERIFIED' || paymentStatus === 'PAID' ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-black uppercase whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>VERIFIED</span>
                              </div>
                            ) : paymentStatus === 'REJECTED' ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 text-[9px] font-black uppercase whitespace-nowrap">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>REJECTED</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-black uppercase whitespace-nowrap">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>PENDING</span>
                              </div>
                            )}

                            {/* Verification Quick Action Buttons */}
                            <div className="flex items-center gap-1">
                              {paymentStatus !== 'VERIFIED' && paymentStatus !== 'PAID' && (
                                <button
                                  type="button"
                                  disabled={updatingPaymentId === sub.id}
                                  onClick={() => handleUpdatePayment(sub.id, 'VERIFIED')}
                                  className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase transition-colors"
                                  title="Approve & Delete SS Proof"
                                >
                                  ✓ OK
                                </button>
                              )}

                              {paymentStatus !== 'REJECTED' && (
                                <button
                                  type="button"
                                  disabled={updatingPaymentId === sub.id}
                                  onClick={() => handleUpdatePayment(sub.id, 'REJECTED')}
                                  className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[9px] font-bold uppercase transition-colors"
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
                                  className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold uppercase transition-colors"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* MEDIA / FILE PREVIEWS */}
                        <td className="px-2 py-2 align-top">
                          {driveLink ? (
                            <div className="space-y-1">
                              <a 
                                href={driveLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold inline-flex items-center gap-1 transition-colors w-full justify-center"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Drive Video ↗</span>
                              </a>

                              <div>
                                {sub.driveLinkUpdated ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 font-bold">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Link Updated</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendDriveUpdateEmail(sub)}
                                    disabled={sendingDriveEmailId === sub.id}
                                    className="w-full inline-flex items-center justify-center gap-1 px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                    title="Send email explaining how to make Drive link public"
                                  >
                                    {sendingDriveEmailId === sub.id ? (
                                      <span>Sending...</span>
                                    ) : (
                                      <>
                                        <MailWarning className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                        <span>{sub.driveUpdateMailSent ? 'Resend Fix Mail' : 'Fix Drive Link Mail'}</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : mediaFile ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewMediaUrl(mediaFile.localUrl || mediaFile.driveLink || '');
                                    setPreviewTitle(`${sub.fullName} - ${mediaFile.originalName}`);
                                  }}
                                  className="flex-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3 text-slate-600" />
                                  <span>Preview</span>
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
                                  className="p-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer shrink-0"
                                  title="Download File"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                              <a
                                href={mediaFile.localUrl || mediaFile.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-blue-600 hover:underline block truncate max-w-[130px]"
                                title={mediaFile.originalName}
                              >
                                {mediaFile.originalName}
                              </a>

                              {/* RE-SUBMISSION ACTION FOR NON-VIDEO */}
                              <div className="pt-0.5 border-t border-slate-100">
                                {sub.resubmissionCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 font-bold">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Replaced</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResubmissionModal(sub)}
                                    className="w-full inline-flex items-center justify-center gap-1 px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-bold transition-colors cursor-pointer"
                                    title="Send Re-upload email with specific rejection reason"
                                  >
                                    <Upload className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                    <span>{sub.resubmissionRequested ? 'Resend Re-up' : 'Request Re-up'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 italic block">No media</span>
                              {!driveLink && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenResubmissionModal(sub)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-bold transition-colors cursor-pointer"
                                >
                                  <Upload className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  <span>Request Upload</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* SAVED INSTAGRAM POST LINK BADGE */}
                          {sub.instagramPostUrl && (
                            <div className="mt-1">
                              <a
                                href={sub.instagramPostUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-300 text-[9px] font-bold tracking-tight transition-colors"
                                title={sub.instagramPostUrl}
                              >
                                <span>IG Post ↗</span>
                              </a>
                            </div>
                          )}
                        </td>

                        {/* MOVE TO POSTING EXCEL CHECKBOX (NAVROOPAM) */}
                        {isNavroopam && (
                          <td className="px-2 py-2 align-middle text-center bg-emerald-50/30 border-x border-emerald-100">
                            <label className="inline-flex flex-col items-center gap-0.5 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={Boolean(sub.moveToPostingExcel)}
                                disabled={updatingMoveId === sub.id}
                                onChange={() => handleToggleMoveToPostingExcel(sub, Boolean(sub.moveToPostingExcel))}
                                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className={`text-[9px] font-black uppercase tracking-tight ${
                                sub.moveToPostingExcel ? 'text-emerald-800 font-bold' : 'text-slate-400 font-normal'
                              }`}>
                                {sub.moveToPostingExcel ? 'Included' : 'Add'}
                              </span>
                            </label>
                          </td>
                        )}

                        {/* ACTIONS (STACKED CLEANLY SO IT NEVER OVERFLOWS) */}
                        <td className="px-2 py-2 align-top text-right">
                          <div className="flex flex-col items-end gap-1 w-full min-w-[140px]">
                            {/* 1. ACKNOWLEDGEMENT EMAIL BUTTON */}
                            {sub.acknowledged ? (
                              <button 
                                onClick={() => handleAcknowledge(sub.id)}
                                disabled={acknowledgingId === sub.id}
                                className="w-full px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                title="Resend payment & submission acknowledgment email"
                              >
                                <Mail className="w-3 h-3 text-amber-700 shrink-0" />
                                <span className="truncate">{acknowledgingId === sub.id ? 'Sending...' : 'Resend Ack 🔄'}</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAcknowledge(sub.id)}
                                disabled={acknowledgingId === sub.id}
                                className="w-full px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold inline-flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                                title="Send payment & submission received acknowledgment email"
                              >
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{acknowledgingId === sub.id ? 'Sending...' : 'Send Ack Mail'}</span>
                              </button>
                            )}

                            {/* 2. CONFIRMATION EMAIL BUTTON & DELETE IN A ROW */}
                            <div className="flex items-center gap-1 w-full">
                              {sub.confirmationEmailSent ? (
                                <button 
                                  onClick={() => handleOpenConfirmationModal(sub)}
                                  disabled={sendingConfirmationId === sub.id}
                                  className="flex-1 px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Resend payment verified confirmation email with Instagram link"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">Resend Conf</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleOpenConfirmationModal(sub)}
                                  disabled={!sub.acknowledged || sendingConfirmationId === sub.id}
                                  className={`flex-1 px-1.5 py-1 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors ${
                                    sub.acknowledged
                                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                  }`}
                                  title={
                                    sub.acknowledged
                                      ? 'Send payment verified confirmation email with Instagram post link'
                                      : 'Send acknowledgment email first to enable confirmation email'
                                  }
                                >
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Send Conf</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteSubmission(sub.id, sub.fullName, sub.ticketId)}
                                disabled={deletingSubId === sub.id}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer shrink-0"
                                title="Delete Submission"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
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
                        {/* Ack Email */}
                        <button 
                          onClick={() => handleAcknowledge(sub.id)}
                          disabled={acknowledgingId === sub.id}
                          className={`p-1.5 border transition-colors ${
                            sub.acknowledged 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' 
                              : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                          }`}
                          title={sub.acknowledged ? 'Resend Acknowledgment Email' : 'Send Acknowledgment Email'}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Confirmation Email */}
                        <button 
                          onClick={() => handleOpenConfirmationModal(sub)}
                          disabled={!sub.acknowledged || sendingConfirmationId === sub.id}
                          className={`p-1.5 border transition-colors ${
                            sub.confirmationEmailSent
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : sub.acknowledged
                                ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                          title={
                            !sub.acknowledged
                              ? 'Send acknowledgment email first'
                              : sub.confirmationEmailSent
                                ? 'Resend Confirmation Email with Instagram link'
                                : 'Send Confirmation Email with Instagram link'
                          }
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteSubmission(sub.id, sub.fullName, sub.ticketId)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

        {/* EMAIL TEMPLATES PREVIEW MODAL */}
        <EmailPreviewModal
          isOpen={isEmailPreviewOpen}
          onClose={() => setIsEmailPreviewOpen(false)}
          event={event}
        />

        {/* SEND CONFIRMATION EMAIL MODAL (WITH INSTAGRAM LINK INPUT) */}
        {confirmationModalSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in">
            <div 
              className="bg-white border border-slate-300 w-full max-w-lg shadow-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Send Payment Verified & Instagram Post Email
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmationModalSub(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Participant:</span>
                  <span className="font-bold text-slate-900">{confirmationModalSub.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Pass:</span>
                  <span className="font-mono font-bold text-slate-800">{confirmationModalSub.ticketId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-mono text-slate-700">{confirmationModalSub.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Domain:</span>
                  <span className="font-semibold text-slate-800">
                    {confirmationModalSub.answers?.['Selected Domain'] || 'General Entry'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Provide the direct link to the Instagram post where this submission has been featured. Once sent, the participant will receive the confirmation email and their payment status will be marked as verified.
              </p>

              <form onSubmit={handleSendConfirmationSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Instagram Post Link *
                  </label>
                  <div className="relative">
                    <input 
                      type="url"
                      required
                      value={instagramInput}
                      onChange={(e) => setInstagramInput(e.target.value)}
                      placeholder="https://www.instagram.com/p/DB_..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Example: https://www.instagram.com/p/Cxyz12345/
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setConfirmationModalSub(null)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={sendingConfirmationId === confirmationModalSub.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{sendingConfirmationId === confirmationModalSub.id ? 'Sending Email...' : 'Send Confirmation Email'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RE-SUBMISSION MODAL FOR REJECTED FILES */}
        {resubmissionModalSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
            <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Send Re-upload Request Email
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Notify contestant about entry rejection and provide one-time re-upload link
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResubmissionModalSub(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Participant info preview */}
              <div className="bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Participant:</span>
                  <span className="font-bold text-slate-900">{resubmissionModalSub.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Pass:</span>
                  <span className="font-mono font-bold text-slate-800">{resubmissionModalSub.ticketId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-mono text-slate-700">{resubmissionModalSub.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Domain:</span>
                  <span className="font-semibold text-slate-800">
                    {resubmissionModalSub.answers?.['Selected Domain'] || 'Contest Entry'}
                  </span>
                </div>
              </div>

              {/* SELECT REJECTION REASON */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Select Reason for Rejection:
                </label>

                <div className="space-y-2 text-xs">
                  {/* Reason 1 */}
                  <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                    selectedReasonOption === 'Photo is not uploaded' 
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="rejectionReason"
                      value="Photo is not uploaded"
                      checked={selectedReasonOption === 'Photo is not uploaded'}
                      onChange={() => setSelectedReasonOption('Photo is not uploaded')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span>1. Photo is not uploaded</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        The participant did not attach an original photo/artwork file in their registration form.
                      </p>
                    </div>
                  </label>

                  {/* Reason 2 */}
                  <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                    selectedReasonOption === 'Against the rule you cannot upload collage' 
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="rejectionReason"
                      value="Against the rule you cannot upload collage"
                      checked={selectedReasonOption === 'Against the rule you cannot upload collage'}
                      onChange={() => setSelectedReasonOption('Against the rule you cannot upload collage')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span>2. Against the rule you cannot upload collage</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        The contest rules forbid collage pictures or split photos. Single original shots only.
                      </p>
                    </div>
                  </label>

                  {/* Reason 3 */}
                  <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                    selectedReasonOption === 'You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)' 
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="rejectionReason"
                      value="You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)"
                      checked={selectedReasonOption === 'You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)'}
                      onChange={() => setSelectedReasonOption('You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span>3. Payment screenshot uploaded instead of photo</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Swapped position: The participant uploaded their UPI payment proof into the contest media slot.
                      </p>
                    </div>
                  </label>

                  {/* Custom Option */}
                  <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                    selectedReasonOption === 'OTHER' 
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="rejectionReason"
                      value="OTHER"
                      checked={selectedReasonOption === 'OTHER'}
                      onChange={() => setSelectedReasonOption('OTHER')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="w-full">
                      <span>4. Custom Rejection Reason</span>
                      {selectedReasonOption === 'OTHER' && (
                        <input 
                          type="text"
                          required
                          placeholder="Type custom rejection note..."
                          value={customReasonText}
                          onChange={(e) => setCustomReasonText(e.target.value)}
                          className="mt-2 w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 outline-none focus:border-rose-600 font-sans"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResubmissionModalSub(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSendResubmissionEmail}
                  disabled={sendingResubmissionId === resubmissionModalSub.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingResubmissionId === resubmissionModalSub.id ? 'Sending Email...' : 'Send Re-upload Request'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
