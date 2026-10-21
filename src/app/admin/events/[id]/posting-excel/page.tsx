'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../../../components/AdminNavbar';
import MongoProgressBar from '../../../../../components/MongoProgressBar';
import EmailPreviewModal from '../../../../../components/EmailPreviewModal';
import { 
  fetchEventById, 
  fetchSubmissionsApi, 
  updatePostingExcelApi,
  sendConfirmationEmailApi,
  requestDriveLinkUpdateEmailApi,
  requestResubmissionEmailApi
} from '../../../../../services/api.service';
import { EventItem } from '../../../../../types/event.types';
import { SubmissionItem } from '../../../../../types/submission.types';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  RefreshCw, 
  Save, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Download,
  Video,
  FileCheck,
  ShieldAlert,
  SlidersHorizontal,
  MailCheck,
  Eye,
  Check,
  Clock,
  Sparkles,
  Camera,
  Palette,
  BookOpen,
  Film,
  MailWarning,
  Mail
} from 'lucide-react';

type PostingStatusType = 'QUALIFIED' | 'POSTED' | 'DISQUALIFIED' | 'MAIL_SENT' | null;

export default function NavroopamPostingExcelPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Local editing states (keyed by submission ID)
  const [instagramUrls, setInstagramUrls] = useState<Record<string, string>>({});
  const [postingStatuses, setPostingStatuses] = useState<Record<string, PostingStatusType>>({});

  // Async action states
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sendingConfirmationId, setSendingConfirmationId] = useState<string | null>(null);
  const [sendingDriveEmailId, setSendingDriveEmailId] = useState<string | null>(null);
  const [saveSuccessMap, setSaveSuccessMap] = useState<Record<string, boolean>>({});
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState<boolean>(false);

  // Disqualification Modal State
  const [disqualificationModalSub, setDisqualificationModalSub] = useState<SubmissionItem | null>(null);
  const [disqualificationReasonOption, setDisqualificationReasonOption] = useState<string>('Photo is not uploaded');
  const [customDisqualificationReason, setCustomDisqualificationReason] = useState<string>('');
  const [sendingDisqualificationId, setSendingDisqualificationId] = useState<string | null>(null);

  // Media preview modal
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

  const loadData = async (forceRefresh: boolean = false) => {
    if (submissions.length === 0) {
      setLoading(true);
    }
    try {
      const [evData, subsData] = await Promise.all([
        fetchEventById(eventId, forceRefresh),
        fetchSubmissionsApi(eventId, forceRefresh)
      ]);
      setEvent(evData);
      setSubmissions(subsData);

      // Initialize edit fields
      const initUrls: Record<string, string> = {};
      const initStatuses: Record<string, PostingStatusType> = {};

      subsData.forEach(sub => {
        initUrls[sub.id] = sub.instagramPostUrl || '';
        // Default posting status to QUALIFIED ('Yellow') if not set; if confirmation email was already sent, MAIL_SENT ('Blue')
        initStatuses[sub.id] = sub.postingStatus || (sub.confirmationEmailSent ? 'MAIL_SENT' : 'QUALIFIED');
      });

      setInstagramUrls(initUrls);
      setPostingStatuses(initStatuses);
    } catch (err) {
      console.error('Error loading Posting Excel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && eventId) {
      loadData(false);
    }
  }, [isAuthenticated, eventId]);

  // CRUCIAL REQUIREMENT: In this excel sheet only show those data who has been sent acknowledgement mail AND checked to move to posting excel
  const acknowledgedSubmissions = useMemo(() => {
    return submissions.filter(s => Boolean(s.acknowledged) && Boolean(s.moveToPostingExcel));
  }, [submissions]);

  // Filtered list based on Search and Selected Filters
  const filteredSubmissions = useMemo(() => {
    return acknowledgedSubmissions.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.ticketId?.toLowerCase().includes(q) ||
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        (s.answers && JSON.stringify(s.answers).toLowerCase().includes(q));

      const selectedDomain = s.answers?.['Selected Domain'];
      const matchesDomain = domainFilter === 'ALL' || selectedDomain === domainFilter;

      const currentStatus = postingStatuses[s.id] || (s.confirmationEmailSent ? 'MAIL_SENT' : 'QUALIFIED');
      let matchesStatus = true;
      if (statusFilter === 'ALL') matchesStatus = true;
      else if (statusFilter === 'UNMARKED') matchesStatus = !currentStatus;
      else matchesStatus = currentStatus === statusFilter;

      return matchesSearch && matchesDomain && matchesStatus;
    });
  }, [acknowledgedSubmissions, searchQuery, domainFilter, statusFilter, postingStatuses]);

  // Available Domains for Filter
  const availableDomains = useMemo(() => {
    return Array.from(
      new Set(
        acknowledgedSubmissions
          .map(s => s.answers?.['Selected Domain'])
          .filter(Boolean) as string[]
      )
    );
  }, [acknowledgedSubmissions]);

  // Metrics for Posting sheet
  const metrics = useMemo(() => {
    let qualified = 0;
    let posted = 0;
    let disqualified = 0;
    let mailSent = 0;

    acknowledgedSubmissions.forEach(s => {
      const status = postingStatuses[s.id] || (s.confirmationEmailSent ? 'MAIL_SENT' : 'QUALIFIED');
      if (status === 'QUALIFIED') qualified++;
      else if (status === 'POSTED') posted++;
      else if (status === 'DISQUALIFIED') disqualified++;
      else if (status === 'MAIL_SENT') mailSent++;
    });

    return {
      total: acknowledgedSubmissions.length,
      qualified,
      posted,
      disqualified,
      mailSent
    };
  }, [acknowledgedSubmissions, postingStatuses]);

  // Handle Saving single entry row
  const handleSaveRow = async (subId: string) => {
    setSavingId(subId);
    try {
      const url = (instagramUrls[subId] !== undefined ? instagramUrls[subId] : '').trim();
      let status = postingStatuses[subId] || null;

      // Automatically change status to POSTED ('Green') when Instagram link is pasted and saved,
      // exactly like how sending confirmation mail turns it to MAIL_SENT ('Blue')
      if (url && (!status || status === 'QUALIFIED')) {
        status = 'POSTED';
      }

      const res = await updatePostingExcelApi(subId, {
        postingStatus: status,
        instagramPostUrl: url
      });

      if (res.success && res.data) {
        if (status) {
          setPostingStatuses(prev => ({ ...prev, [subId]: status }));
        }
        setSaveSuccessMap(prev => ({ ...prev, [subId]: true }));
        setTimeout(() => {
          setSaveSuccessMap(prev => ({ ...prev, [subId]: false }));
        }, 2500);

        // Update main state
        setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, ...res.data, postingStatus: status || res.data.postingStatus } : s));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSavingId(null);
    }
  };

  // Handle Dispatching Final Confirmation Email using the saved Instagram link
  const handleSendConfirmationEmail = async (sub: SubmissionItem) => {
    const postUrl = (instagramUrls[sub.id] || sub.instagramPostUrl || '').trim();
    if (!postUrl) {
      alert('Please enter and save the Instagram post URL before sending the final confirmation email.');
      return;
    }

    if (!window.confirm(`Send official confirmation email with Instagram link to "${sub.fullName}" (${sub.email})?\n\nInstagram URL:\n${postUrl}`)) {
      return;
    }

    setSendingConfirmationId(sub.id);
    try {
      // First save to make sure DB has the clean link
      await updatePostingExcelApi(sub.id, {
        postingStatus: 'MAIL_SENT',
        instagramPostUrl: postUrl
      });

      // Dispatch confirmation email
      const res = await sendConfirmationEmailApi(sub.id, postUrl);
      if (res.success) {
        alert(res.message || `Confirmation email sent successfully to ${sub.fullName}!`);
        setPostingStatuses(prev => ({ ...prev, [sub.id]: 'MAIL_SENT' }));
        setSubmissions(prev => prev.map(s => {
          if (s.id === sub.id) {
            return {
              ...s,
              confirmationEmailSent: true,
              confirmationEmailSentAt: new Date().toISOString(),
              instagramPostUrl: postUrl,
              postingStatus: 'MAIL_SENT'
            };
          }
          return s;
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send confirmation email');
    } finally {
      setSendingConfirmationId(null);
    }
  };

  // Handle Opening Disqualification Modal
  const handleOpenDisqualificationModal = (sub: SubmissionItem) => {
    setDisqualificationModalSub(sub);
    setDisqualificationReasonOption('Photo is not uploaded');
    setCustomDisqualificationReason('');
  };

  // Handle Confirming and Sending Disqualification Email
  const handleConfirmSendDisqualificationEmail = async () => {
    if (!disqualificationModalSub) return;

    let finalReason = disqualificationReasonOption;
    if (disqualificationReasonOption === 'OTHER') {
      finalReason = customDisqualificationReason.trim();
      if (!finalReason) {
        alert('Please specify the custom disqualification reason.');
        return;
      }
    }

    setSendingDisqualificationId(disqualificationModalSub.id);
    try {
      // First ensure postingStatus is saved as DISQUALIFIED in DB
      await updatePostingExcelApi(disqualificationModalSub.id, {
        postingStatus: 'DISQUALIFIED'
      });

      // Send the official disqualification / re-upload instruction email
      const res = await requestResubmissionEmailApi(disqualificationModalSub.id, finalReason);
      if (res.success) {
        alert(res.message || `Disqualification notification email sent successfully to ${disqualificationModalSub.fullName}!`);
        setPostingStatuses(prev => ({ ...prev, [disqualificationModalSub.id]: 'DISQUALIFIED' }));
        setSubmissions(prev => prev.map(s => {
          if (s.id === disqualificationModalSub.id) {
            return {
              ...s,
              postingStatus: 'DISQUALIFIED',
              resubmissionRequested: true,
              resubmissionRequestedAt: new Date().toISOString(),
              resubmissionReason: finalReason,
              resubmissionCompleted: false
            };
          }
          return s;
        }));
        setDisqualificationModalSub(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send disqualification email');
    } finally {
      setSendingDisqualificationId(null);
    }
  };

  // Handle Sending Email to Request Google Drive Link to be Made Public
  const handleSendDriveUpdateEmail = async (sub: SubmissionItem) => {
    if (!window.confirm(
      `Send Google Drive link update email to "${sub.fullName}" (${sub.email})?\n\nThis email will explain 5 steps to make their Google Drive link public ("Anyone with the link can view") and provide a secure, one-time link for them to update their video submission.`
    )) {
      return;
    }

    setSendingDriveEmailId(sub.id);
    try {
      const res = await requestDriveLinkUpdateEmailApi(sub.id);
      if (res.success) {
        alert(res.message || `Drive link update email successfully dispatched to ${sub.fullName}!`);
        // Update local state to reflect that mail was sent
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
      alert(err.message || 'Failed to send Drive update email');
    } finally {
      setSendingDriveEmailId(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (acknowledgedSubmissions.length === 0) {
      alert('No acknowledged records to export.');
      return;
    }

    const headers = [
      'Ticket ID',
      'Full Name',
      'Email',
      'Phone',
      'College Roll Number',
      'Department',
      'Year',
      'Selected Domain',
      'Selected Theme',
      'Drive Video Link',
      'Posting Status',
      'Instagram Post URL',
      'Confirmation Email Sent'
    ];

    const rows = filteredSubmissions.map(sub => {
      const answers = sub.answers || {};
      const driveLink = answers['Google Drive Video Reel Link'] || answers['Google Drive Video Link'] || sub.files?.find(f => f.driveLink)?.driveLink || '';
      const status = postingStatuses[sub.id] || (sub.confirmationEmailSent ? 'MAIL_SENT' : 'UNMARKED');

      return [
        sub.ticketId,
        `"${sub.fullName}"`,
        sub.email,
        sub.phone || '',
        answers['College Roll Number'] || '',
        answers['Department'] || '',
        answers['Year of Study'] || '',
        `"${answers['Selected Domain'] || ''}"`,
        `"${answers['Selected Theme'] || ''}"`,
        driveLink,
        status,
        `"${instagramUrls[sub.id] || sub.instagramPostUrl || ''}"`,
        sub.confirmationEmailSent ? 'YES' : 'NO'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Navroopam_Posting_Excel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white relative">
      <AdminNavbar />

      {/* Centered Modal Progress Bar with blurred backdrop */}
      {loading && (
        <MongoProgressBar 
          asModal={true}
          theme="light" 
          message="Loading Posting Excel data from MongoDB..." 
          subMessage="Fetching acknowledged entries, media links & posting statuses"
          estimatedSeconds={3.5}
        />
      )}

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* HEADER BAR */}
        <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link 
                href={`/admin/events/${eventId}/submissions`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Submissions</span>
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                Live Spreadsheet Review
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-rose-600">🔱</span>
              <span>Navroopam Posting Excel</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white uppercase">
                {acknowledgedSubmissions.length} Acknowledged Entries
              </span>
            </h1>
            <p className="text-xs text-slate-600">
              Only showing participants who have received an acknowledgement mail. Mark entries with color badges, paste Instagram URLs, and dispatch confirmation emails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEmailPreviewOpen(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Preview official email templates dispatched to participants"
            >
              <Mail className="w-3.5 h-3.5 text-amber-700" />
              <span>Preview Email Templates</span>
            </button>

            <button
              onClick={exportToCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Export current table to CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel / CSV</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 COLOR STATUS & METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Acknowledged */}
          <div className="bg-white border border-slate-200 p-3.5 border-l-4 border-l-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Acknowledged</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.total}</p>
            <span className="text-[10px] text-slate-400">Target for posting</span>
          </div>

          {/* Yellow: Qualified */}
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 border-l-4 border-l-amber-500 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Yellow</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500" />
            </div>
            <p className="text-xl font-black text-amber-900 mt-0.5">{metrics.qualified}</p>
            <span className="text-[10px] text-amber-700 font-bold">Qualified Entries</span>
          </div>

          {/* Green: Posted */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 border-l-4 border-l-emerald-600 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Green</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{metrics.posted}</p>
            <span className="text-[10px] text-emerald-700 font-bold">Posted on Instagram</span>
          </div>

          {/* Red: Disqualified */}
          <div className="bg-rose-50/70 border border-rose-200 p-3.5 border-l-4 border-l-rose-600 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Red</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600" />
            </div>
            <p className="text-xl font-black text-rose-900 mt-0.5">{metrics.disqualified}</p>
            <span className="text-[10px] text-rose-700 font-bold">Disqualified</span>
          </div>

          {/* Blue: Mail Sent */}
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 border-l-4 border-l-blue-600 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Blue</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-600" />
            </div>
            <p className="text-xl font-black text-blue-900 mt-0.5">{metrics.mailSent}</p>
            <span className="text-[10px] text-blue-700 font-bold">Confirmation Sent</span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search ticket, name, roll no, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Domain Filter */}
              <select
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Domains ({availableDomains.length})</option>
                {availableDomains.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>

              {/* Color Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Status Marks</option>
                <option value="QUALIFIED">🟡 Yellow - Qualified</option>
                <option value="POSTED">🟢 Green - Posted</option>
                <option value="DISQUALIFIED">🔴 Red - Disqualified</option>
                <option value="MAIL_SENT">🔵 Blue - Mail Sent</option>
                <option value="UNMARKED">⚪ Unmarked / Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* EXCEL SHEET TABLE CONTAINER */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <p className="text-xs font-semibold animate-pulse">Syncing spreadsheet records from MongoDB...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">No matching acknowledged records found</p>
              <p className="text-xs text-slate-500 mt-1">
                {acknowledgedSubmissions.length === 0 
                  ? 'No entries have been sent an acknowledgment mail yet. Go to Submissions to acknowledge entries first.'
                  : 'Try adjusting your search criteria or filter tags.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 whitespace-nowrap">Ticket & Participant</th>
                    <th className="p-3 whitespace-nowrap">Domain & Roll No</th>
                    <th className="p-3 min-w-[220px]">Submission Entry Media / File</th>
                    <th className="p-3 min-w-[170px]">Posting Status</th>
                    <th className="p-3 min-w-[260px]">Instagram Post Link</th>
                    <th className="p-3 text-right whitespace-nowrap">Action & Confirmation</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredSubmissions.map((sub, idx) => {
                    const answers = sub.answers || {};
                    const rollNo = answers['College Roll Number'] || '-';
                    const domain = answers['Selected Domain'] || '-';
                    const theme = answers['Selected Theme'] || '-';

                    // Find non-payment proof submission files
                    const paymentProofFile = sub.files && sub.files.find(f => {
                      const n = (f.originalName || '').toLowerCase();
                      return n.includes('proof') || n.includes('pay') || n.includes('screen') || n.includes('utr') || f.provider === 'cloudinary_payment_proof';
                    });
                    const entryFiles = sub.files ? sub.files.filter(f => f !== paymentProofFile) : [];
                    const mediaFile = entryFiles.length > 0 ? entryFiles[0] : null;

                    // Domain detection
                    const domLower = domain.toLowerCase();
                    const isVlog = domLower.includes('vlog') || domLower.includes('reel') || domLower.includes('video');
                    const isPhotography = domLower.includes('photo');
                    const isArtwork = domLower.includes('art') || domLower.includes('paint') || domLower.includes('sketch');
                    const isWriting = domLower.includes('writing') || domLower.includes('inkquilab') || domLower.includes('essay');

                    // Drive video reel link from form answers or files
                    const driveReelLink = answers['Google Drive Video Reel Link'] || answers['Google Drive Video Link'] || (isVlog && sub.files?.find(f => f.driveLink)?.driveLink);

                    // Media URL for viewing
                    const mediaUrl = mediaFile ? (mediaFile.localUrl || mediaFile.driveLink || '') : '';

                    const currentStatus = postingStatuses[sub.id] || (sub.confirmationEmailSent ? 'MAIL_SENT' : 'QUALIFIED');
                    const currentInsta = instagramUrls[sub.id] !== undefined ? instagramUrls[sub.id] : (sub.instagramPostUrl || '');
                    const isSaving = savingId === sub.id;
                    const isSendingConf = sendingConfirmationId === sub.id;
                    const isSavedSuccess = Boolean(saveSuccessMap[sub.id]);

                    // Row background tint based on color coding
                    let rowBgClass = 'bg-white hover:bg-slate-50/70';
                    if (currentStatus === 'QUALIFIED') rowBgClass = 'bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-500';
                    else if (currentStatus === 'POSTED') rowBgClass = 'bg-emerald-50/30 hover:bg-emerald-50/60 border-l-4 border-l-emerald-600';
                    else if (currentStatus === 'DISQUALIFIED') rowBgClass = 'bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-600';
                    else if (currentStatus === 'MAIL_SENT') rowBgClass = 'bg-blue-50/30 hover:bg-blue-50/60 border-l-4 border-l-blue-600';

                    return (
                      <tr key={sub.id} className={`transition-colors ${rowBgClass}`}>
                        
                        {/* Index */}
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px] align-top">
                          {idx + 1}
                        </td>

                        {/* Ticket & Participant */}
                        <td className="p-3 align-top min-w-[170px]">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 text-[11px] block w-fit">
                            {sub.ticketId}
                          </span>
                          <span className="text-[9.5px] text-slate-500 font-mono block mt-1 leading-tight">
                            📅 {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <br />
                            ⏰ {new Date(sub.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                          </span>
                          <p className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                            {sub.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {sub.email}
                          </p>
                          {sub.phone && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              📞 {sub.phone}
                            </p>
                          )}
                        </td>

                        {/* Domain & Roll No */}
                        <td className="p-3 align-top min-w-[150px]">
                          <span className="inline-block px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                            {domain}
                          </span>
                          {theme && theme !== '-' && (
                            <span className="block text-[10px] text-slate-500 mt-1">
                              Theme: <span className="font-semibold text-slate-700">{theme}</span>
                            </span>
                          )}
                          <span className="block text-[11px] font-mono font-semibold text-slate-800 mt-1">
                            Roll: {rollNo}
                          </span>
                        </td>

                        {/* Domain-Aware Entry Media / File Column */}
                        <td className="p-3 align-top max-w-xs">
                          {/* 1. PUJA VLOG: Google Drive Video Link */}
                          {isVlog && driveReelLink ? (
                            <div className="space-y-1.5">
                              <a
                                href={driveReelLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-colors truncate max-w-full"
                                title={driveReelLink}
                              >
                                <Film className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                                <span className="truncate">Open Drive Video</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                              </a>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                                {driveReelLink}
                              </p>

                              {/* Drive Public Status & Mail Action */}
                              <div className="pt-1 border-t border-slate-100 space-y-1">
                                {sub.driveLinkUpdated ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-bold">
                                    <Check className="w-3 h-3" />
                                    <span>Link Updated by User</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendDriveUpdateEmail(sub)}
                                    disabled={sendingDriveEmailId === sub.id}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                    title="Send email explaining how to make Drive link public and provide secure one-time update route"
                                  >
                                    {sendingDriveEmailId === sub.id ? (
                                      <>
                                        <div className="w-2.5 h-2.5 border-2 border-amber-800/30 border-t-amber-800 rounded-full animate-spin" />
                                        <span>Sending Mail...</span>
                                      </>
                                    ) : (
                                      <>
                                        <MailWarning className="w-3 h-3 text-amber-700 shrink-0" />
                                        <span>{sub.driveUpdateMailSent ? 'Resend Drive Fix Mail' : 'Email: Request Public Link'}</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {sub.driveUpdateMailSent && !sub.driveLinkUpdated && (
                                  <p className="text-[9px] text-amber-700 font-medium">
                                    Mail dispatched {sub.driveUpdateMailSentAt ? `on ${new Date(sub.driveUpdateMailSentAt).toLocaleDateString()}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : isPhotography && mediaUrl ? (
                            /* 2. PHOTOGRAPHY: Photo Preview & Cloud Link */
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewMediaUrl(mediaUrl);
                                  setPreviewTitle(`${sub.fullName} - Photography: ${domain}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                                <span>View Photo</span>
                              </button>
                              <a 
                                href={mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[10px] text-slate-400 hover:text-slate-600 font-mono truncate max-w-[220px]"
                                title={mediaUrl}
                              >
                                {mediaFile?.originalName || 'Photo Link ↗'}
                              </a>
                            </div>
                          ) : isArtwork && mediaUrl ? (
                            /* 3. ARTWORK: Artwork Image Preview & Cloud Link */
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewMediaUrl(mediaUrl);
                                  setPreviewTitle(`${sub.fullName} - Artwork: ${domain}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                <Palette className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                <span>View Artwork</span>
                              </button>
                              <a 
                                href={mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[10px] text-slate-400 hover:text-slate-600 font-mono truncate max-w-[220px]"
                                title={mediaUrl}
                              >
                                {mediaFile?.originalName || 'Artwork Link ↗'}
                              </a>
                            </div>
                          ) : isWriting && mediaUrl ? (
                            /* 4. CREATIVE WRITING: Document/PDF View & Download */
                            <div className="space-y-1">
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                                <span>Open Creative Writing</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                              </a>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                                {mediaFile?.originalName || 'Document'}
                              </p>
                            </div>
                          ) : driveReelLink ? (
                            /* Fallback with Drive Link */
                            <div className="space-y-1">
                              <a
                                href={driveReelLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-colors truncate max-w-full"
                              >
                                <Video className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Open Link</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                              </a>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                                {driveReelLink}
                              </p>
                            </div>
                          ) : mediaUrl ? (
                            /* General Media File Fallback */
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewMediaUrl(mediaUrl);
                                  setPreviewTitle(`${sub.fullName} - ${domain}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                                <span>View File</span>
                              </button>
                              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                {mediaFile?.originalName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No file/link provided</span>
                          )}
                        </td>

                        {/* Posting Status Selection (Yellow, Green, Red, Blue) */}
                        <td className="p-3 align-top">
                          <div className="space-y-1">
                            <select
                              value={currentStatus || ''}
                              onChange={e => {
                                const val = (e.target.value || null) as PostingStatusType;
                                setPostingStatuses(prev => ({ ...prev, [sub.id]: val }));
                              }}
                              className={`w-full px-2.5 py-1.5 text-xs font-bold border outline-none cursor-pointer ${
                                currentStatus === 'QUALIFIED'
                                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                                  : currentStatus === 'POSTED'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                  : currentStatus === 'DISQUALIFIED'
                                  ? 'bg-rose-100 text-rose-900 border-rose-400'
                                  : currentStatus === 'MAIL_SENT'
                                  ? 'bg-blue-100 text-blue-900 border-blue-400'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="">⚪ Select Status</option>
                              <option value="QUALIFIED">🟡 Yellow - Qualified</option>
                              <option value="POSTED">🟢 Green - Posted</option>
                              <option value="DISQUALIFIED">🔴 Red - Disqualified</option>
                              <option value="MAIL_SENT">🔵 Blue - Mail sent</option>
                            </select>

                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              {currentStatus === 'QUALIFIED' && <span className="text-amber-700 font-semibold">Marked for publishing</span>}
                              {currentStatus === 'POSTED' && <span className="text-emerald-700 font-semibold">Published on Instagram</span>}
                              {currentStatus === 'DISQUALIFIED' && <span className="text-rose-700 font-semibold">Entry rejected</span>}
                              {currentStatus === 'MAIL_SENT' && <span className="text-blue-700 font-semibold">Confirmation mail dispatched</span>}
                            </div>
                          </div>
                        </td>

                        {/* Instagram Link Paste & Save */}
                        <td className="p-3 align-top">
                          <div className="space-y-1">
                            <div className="relative">
                              <svg className="w-3.5 h-3.5 text-rose-500 absolute left-2 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                              </svg>
                              <input 
                                type="url"
                                placeholder="Paste Instagram post URL..."
                                value={currentInsta}
                                onChange={e => {
                                  const val = e.target.value;
                                  setInstagramUrls(prev => ({ ...prev, [sub.id]: val }));
                                }}
                                className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-600 font-mono transition-colors"
                              />
                            </div>

                            {sub.instagramPostUrl && (
                              <div className="flex items-center justify-between text-[10px]">
                                <a 
                                  href={sub.instagramPostUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 underline truncate max-w-[200px]"
                                >
                                  <span>View live IG post</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <span className="text-slate-400">Saved in DB</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action buttons: Save & Send Confirmation Email */}
                        <td className="p-3 align-top text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Save Link and Status Button */}
                            <button
                              type="button"
                              onClick={() => handleSaveRow(sub.id)}
                              disabled={isSaving}
                              className={`px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                                isSavedSuccess 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                              }`}
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : isSavedSuccess ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 text-slate-500" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>

                            {/* Action Button: Disqualification Email OR Confirmation Email */}
                            {currentStatus === 'DISQUALIFIED' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenDisqualificationModal(sub)}
                                disabled={sendingDisqualificationId === sub.id}
                                className={`px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                                  sub.resubmissionRequested
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                                title="Open disqualification dialogue and select reason to notify participant"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>
                                  {sendingDisqualificationId === sub.id 
                                    ? 'Sending...' 
                                    : sub.resubmissionRequested 
                                    ? 'Resend Disqual' 
                                    : 'Send Disqualification'}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendConfirmationEmail(sub)}
                                disabled={isSendingConf || !currentInsta.trim()}
                                className={`px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  sub.confirmationEmailSent
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                title={
                                  !currentInsta.trim() 
                                    ? 'Paste and save an Instagram link first to send the final confirmation email' 
                                    : sub.confirmationEmailSent 
                                    ? 'Resend final confirmation email' 
                                    : 'Send confirmation email with Instagram link'
                                }
                              >
                                <Send className="w-3 h-3" />
                                <span>
                                  {isSendingConf 
                                    ? 'Sending...' 
                                    : sub.confirmationEmailSent 
                                    ? 'Resend Mail' 
                                    : 'Send Confirmation'}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Media Preview Modal */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-300 max-w-3xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900 truncate">
                {previewTitle || 'Entry Attachment Preview'}
              </h3>
              <button
                onClick={() => setPreviewMediaUrl(null)}
                className="text-slate-500 hover:text-slate-900 text-lg font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 p-2 border border-slate-200">
              {previewMediaUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                <img 
                  src={previewMediaUrl} 
                  alt="Entry preview" 
                  className="max-h-[65vh] max-w-full object-contain" 
                />
              ) : previewMediaUrl.match(/\.(mp4|webm|ogg)($|\?)/i) ? (
                <video 
                  src={previewMediaUrl} 
                  controls 
                  className="max-h-[65vh] max-w-full" 
                />
              ) : (
                <div className="py-12 text-center space-y-3">
                  <FileCheck className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600">This file cannot be previewed directly in the browser.</p>
                  <a
                    href={previewMediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold"
                  >
                    <span>Download / Open File</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewMediaUrl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disqualification Reason Modal Dialog */}
      {disqualificationModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Send Disqualification Notice
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {disqualificationModalSub.fullName} &bull; Ticket: {disqualificationModalSub.ticketId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisqualificationModalSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Participant Quick Info */}
            <div className="bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Participant Name:</span>
                <span className="font-bold text-slate-900">{disqualificationModalSub.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Domain:</span>
                <span className="font-semibold text-rose-800">
                  {disqualificationModalSub.answers?.['Selected Domain'] || 'Contest Entry'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-mono text-slate-700">{disqualificationModalSub.email}</span>
              </div>
            </div>

            {/* Radio Options for Disqualification Reason */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Select Reason for Disqualification:
              </label>

              <div className="space-y-2 text-xs">
                {/* Option 1 */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                  disqualificationReasonOption === 'Photo is not uploaded' 
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input 
                    type="radio" 
                    name="disqualReason"
                    value="Photo is not uploaded"
                    checked={disqualificationReasonOption === 'Photo is not uploaded'}
                    onChange={() => setDisqualificationReasonOption('Photo is not uploaded')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span>1. Photo is not uploaded</span>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      The participant did not attach an original photo/artwork file in their registration form.
                    </p>
                  </div>
                </label>

                {/* Option 2 */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                  disqualificationReasonOption === 'Against the rule you cannot upload collage' 
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input 
                    type="radio" 
                    name="disqualReason"
                    value="Against the rule you cannot upload collage"
                    checked={disqualificationReasonOption === 'Against the rule you cannot upload collage'}
                    onChange={() => setDisqualificationReasonOption('Against the rule you cannot upload collage')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span>2. Against the rule you cannot upload collage</span>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      The contest rules forbid collage pictures or split photos. Single original shots only.
                    </p>
                  </div>
                </label>

                {/* Option 3 */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                  disqualificationReasonOption === 'You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)' 
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input 
                    type="radio" 
                    name="disqualReason"
                    value="You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)"
                    checked={disqualificationReasonOption === 'You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)'}
                    onChange={() => setDisqualificationReasonOption('You have submitted the payment ss instead of your photo (swapped position of submission and payment ss.)')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span>3. Payment screenshot uploaded instead of photo</span>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Swapped position: The participant uploaded their UPI payment proof into the contest media slot.
                    </p>
                  </div>
                </label>

                {/* Option 4: Custom */}
                <label className={`flex items-start gap-2.5 p-3 border cursor-pointer transition-colors ${
                  disqualificationReasonOption === 'OTHER' 
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input 
                    type="radio" 
                    name="disqualReason"
                    value="OTHER"
                    checked={disqualificationReasonOption === 'OTHER'}
                    onChange={() => setDisqualificationReasonOption('OTHER')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="w-full">
                    <span>4. Custom Disqualification Reason</span>
                    {disqualificationReasonOption === 'OTHER' && (
                      <input 
                        type="text"
                        required
                        placeholder="Type custom disqualification reason..."
                        value={customDisqualificationReason}
                        onChange={(e) => setCustomDisqualificationReason(e.target.value)}
                        className="mt-2 w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 outline-none focus:border-rose-600 font-sans"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDisqualificationModalSub(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendDisqualificationEmail}
                disabled={sendingDisqualificationId === disqualificationModalSub.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendingDisqualificationId === disqualificationModalSub.id ? 'Sending Email...' : 'Send Disqualification Email'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Email Preview Modal (All Templates including Drive Link Fix with Navroopam banner) */}
      <EmailPreviewModal
        isOpen={isEmailPreviewOpen}
        onClose={() => setIsEmailPreviewOpen(false)}
        event={event}
      />

    </div>
  );
}
