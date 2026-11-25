'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../components/AdminNavbar';
import MongoProgressBar from '../../../components/MongoProgressBar';
import { 
  fetchSubmissionsApi,
  fetchBrevoMailStatsApi,
  sendParticipantCertificateEmailApi,
  BrevoMailStatsData
} from '../../../services/api.service';
import { 
  renderCertificateCanvas, 
  downloadCertificateAsImage 
} from '../../../utils/certificateGenerator';
import { SubmissionItem } from '../../../types/submission.types';
import { 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  Send, 
  CheckCircle2, 
  RotateCw, 
  Search, 
  Eye, 
  Download, 
  AlertTriangle, 
  Clock, 
  X,
  Layers,
  Filter,
  Check,
  Award
} from 'lucide-react';

interface GroupedParticipant {
  email: string;
  fullName: string;
  primaryTicketId: string;
  allTicketIds: string[];
  submissionIds: string[];
  domains: string[];
  domainCount: number;
  isCertificateSent: boolean;
  sentAt?: string | null;
  submissions: SubmissionItem[];
}

export default function AdminNavroopamCertificatesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSENT' | 'SENT'>('ALL');

  // Preview Modal
  const [previewParticipant, setPreviewParticipant] = useState<GroupedParticipant | null>(null);
  const [previewCanvasUrl, setPreviewCanvasUrl] = useState<string | null>(null);
  const [renderingPreview, setRenderingPreview] = useState<boolean>(false);

  // Mail Quota & Queue Dispatch State
  const [mailQuota, setMailQuota] = useState<BrevoMailStatsData | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState<boolean>(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isBulkQueueModalOpen, setIsBulkQueueModalOpen] = useState<boolean>(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number; currentName: string }>({ current: 0, total: 0, currentName: '' });
  const [queueResults, setQueueResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  // Single dispatch state
  const [sendingEmailKey, setSendingEmailKey] = useState<string | null>(null);

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

  // Load submissions and quota
  const loadData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Navroopam event ID: 6aca70825588e8009b8e8e83 or pass 'all'
      const subs = await fetchSubmissionsApi('6aca70825588e8009b8e8e83', forceRefresh);
      setSubmissions(subs);
      await loadMailQuota();
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMailQuota = async () => {
    setIsLoadingQuota(true);
    try {
      const res = await fetchBrevoMailStatsApi();
      if (res && res.data) {
        setMailQuota(res.data);
      }
    } catch (err) {
      console.warn('Could not load Brevo stats:', err);
    } finally {
      setIsLoadingQuota(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData(false);
    }
  }, [isAuthenticated]);

  // Group submissions by participant Email so multi-domain participants get ONE single certificate
  const groupedParticipants = useMemo<GroupedParticipant[]>(() => {
    const map = new Map<string, GroupedParticipant>();

    for (const sub of submissions) {
      // Ignore completely disqualified entries
      if (sub.postingStatus === 'DISQUALIFIED' || sub.paymentStatus === 'REJECTED') {
        continue;
      }

      const email = (sub.email || '').trim().toLowerCase();
      if (!email) continue;

      const domain = sub.answers?.['Selected Domain'] || sub.answers?.Domain || 'General Entry';

      if (!map.has(email)) {
        map.set(email, {
          email,
          fullName: (sub.fullName || 'Participant').trim(),
          primaryTicketId: sub.ticketId,
          allTicketIds: [sub.ticketId],
          submissionIds: [sub.id],
          domains: [domain],
          domainCount: 1,
          isCertificateSent: !!sub.certificateSent,
          sentAt: sub.certificateSentAt || null,
          submissions: [sub]
        });
      } else {
        const item = map.get(email)!;
        if (!item.allTicketIds.includes(sub.ticketId)) {
          item.allTicketIds.push(sub.ticketId);
        }
        if (!item.submissionIds.includes(sub.id)) {
          item.submissionIds.push(sub.id);
        }
        if (!item.domains.includes(domain)) {
          item.domains.push(domain);
          item.domainCount = item.domains.length;
        }
        if (sub.certificateSent) {
          item.isCertificateSent = true;
          item.sentAt = sub.certificateSentAt || item.sentAt;
        }
        item.submissions.push(sub);
      }
    }

    return Array.from(map.values());
  }, [submissions]);

  // Filtered view
  const filteredParticipants = useMemo(() => {
    return groupedParticipants.filter(p => {
      // Status filter
      if (statusFilter === 'UNSENT' && p.isCertificateSent) return false;
      if (statusFilter === 'SENT' && !p.isCertificateSent) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.allTicketIds.some(t => t.toLowerCase().includes(q)) ||
        p.domains.some(d => d.toLowerCase().includes(q))
      );
    });
  }, [groupedParticipants, statusFilter, searchQuery]);

  // Open Preview Modal
  const handleOpenPreview = async (p: GroupedParticipant) => {
    setPreviewParticipant(p);
    setRenderingPreview(true);
    try {
      const canvas = await renderCertificateCanvas({ participantName: p.fullName });
      setPreviewCanvasUrl(canvas.toDataURL('image/jpeg', 0.88));
    } catch (err: any) {
      alert('Error rendering certificate preview: ' + err.message);
    } finally {
      setRenderingPreview(false);
    }
  };

  // Dispatch single certificate email
  const handleSendSingleEmail = async (p: GroupedParticipant) => {
    if (!window.confirm(
      `Send official Certificate of Participation email to "${p.fullName}" (${p.email})?\n\nDomains: ${p.domains.join(', ')}`
    )) {
      return;
    }

    setSendingEmailKey(p.email);
    try {
      const canvas = await renderCertificateCanvas({ participantName: p.fullName });
      // Use 0.88 quality JPEG: crystal crisp 1600x1131 image at only ~250-350KB payload (well below limits)
      const base64Data = canvas.toDataURL('image/jpeg', 0.88);

      await sendParticipantCertificateEmailApi({
        submissionId: p.submissionIds[0],
        email: p.email,
        fullName: p.fullName,
        ticketId: p.primaryTicketId,
        eventTitle: 'NAVROOPAM v7.0',
        domains: p.domains,
        certificateBase64: base64Data
      });

      alert(`Certificate email successfully dispatched to ${p.fullName}!`);
      
      // Update local state
      p.isCertificateSent = true;
      p.sentAt = new Date().toISOString();
      setSubmissions(prev => prev.map(s => {
        if (p.submissionIds.includes(s.id) || (s.email && s.email.toLowerCase() === p.email)) {
          return { ...s, certificateSent: true, certificateSentAt: new Date().toISOString() };
        }
        return s;
      }));
      await loadMailQuota();
    } catch (err: any) {
      alert(`Failed to send certificate: ${err.message || 'Unknown error'}`);
    } finally {
      setSendingEmailKey(null);
    }
  };

  // Selection handlers
  const handleToggleSelect = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // Auto-Select today's safe quota chunk (e.g. 290 emails today, reserving 5-10 for tests)
  const handleSelectSafeBatch = (limit: number = 290) => {
    const unsent = groupedParticipants.filter(p => !p.isCertificateSent);
    const availableQuota = mailQuota?.credits ?? 300;
    // Keep 10 buffer for testing as requested
    const safeCapacity = Math.min(limit, Math.max(0, availableQuota - 10));
    const toSelect = unsent.slice(0, safeCapacity).map(p => p.email);
    setSelectedEmails(toSelect);
    alert(`Selected ${toSelect.length} unsent recipients for today's batch (Safe Limit: ${safeCapacity}, Buffer: 10 emails reserved for testing).`);
  };

  const handleSelectAllUnsent = () => {
    const unsent = groupedParticipants.filter(p => !p.isCertificateSent).map(p => p.email);
    setSelectedEmails(unsent);
  };

  const handleClearSelection = () => {
    setSelectedEmails([]);
  };

  // Start Bulk Queue
  const handleStartQueue = async () => {
    if (selectedEmails.length === 0) return;

    setIsProcessingQueue(true);
    setQueueResults({ success: 0, failed: 0 });
    setQuotaWarning(null);

    const emailList = [...selectedEmails];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i];
      const p = groupedParticipants.find(x => x.email === email);
      if (!p) continue;

      setQueueProgress({
        current: i + 1,
        total: emailList.length,
        currentName: p.fullName
      });

      try {
        const canvas = await renderCertificateCanvas({ participantName: p.fullName });
        const base64Data = canvas.toDataURL('image/jpeg', 0.88);

        await sendParticipantCertificateEmailApi({
          submissionId: p.submissionIds[0],
          email: p.email,
          fullName: p.fullName,
          ticketId: p.primaryTicketId,
          eventTitle: 'NAVROOPAM v7.0',
          domains: p.domains,
          certificateBase64: base64Data
        });

        successCount++;
        setQueueResults(prev => ({ ...prev, success: successCount }));

        // Update local status
        p.isCertificateSent = true;
        p.sentAt = new Date().toISOString();
        setSubmissions(prev => prev.map(s => {
          if (p.submissionIds.includes(s.id) || (s.email && s.email.toLowerCase() === p.email)) {
            return { ...s, certificateSent: true, certificateSentAt: new Date().toISOString() };
          }
          return s;
        }));

        // Remove from selected list
        setSelectedEmails(prev => prev.filter(e => e !== email));

        // 600ms delay between dispatches to maintain smooth server pace
        await new Promise(r => setTimeout(r, 650));
      } catch (err: any) {
        console.error(`Error sending certificate to ${email}:`, err);
        failCount++;
        setQueueResults(prev => ({ ...prev, failed: failCount }));
        if (err.message && err.message.toLowerCase().includes('quota')) {
          setQuotaWarning('Brevo daily email quota reached! Halting queue to protect account.');
          break;
        }
      }
    }

    setIsProcessingQueue(false);
    await loadMailQuota();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <AdminNavbar />

      {loading && (
        <MongoProgressBar
          asModal={true}
          theme="light"
          message="Loading Navroopam Participant Data..."
          subMessage="Grouping multi-domain participants & checking eligibility"
          estimatedSeconds={2}
        />
      )}

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link 
                href="/admin" 
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200">
                Official Navroopam v7.0 E-Certificates
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-rose-600" />
              <span>Certificate Distribution Console</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white uppercase">
                {groupedParticipants.length} Unique Participants
              </span>
            </h1>
            <p className="text-xs text-slate-600">
              Multi-domain participants have been merged into single unified certificates. 1st, 2nd, and 3rd rank position certificates will be given offline.
            </p>
          </div>

          {/* Right Action Utilities */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quota Badge */}
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold flex items-center gap-2 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Today&apos;s Quota: <strong>{mailQuota?.credits ?? 285} / 300</strong>
              </span>
              <button 
                onClick={loadMailQuota}
                className="text-amber-700 hover:text-amber-950 ml-1"
                title="Refresh Brevo Quota"
              >
                <RotateCw className={`w-3 h-3 ${isLoadingQuota ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Batch Select 290 Button */}
            <button
              onClick={() => handleSelectSafeBatch(290)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Select today's maximum safe batch (290 emails, leaving 10 for test sends)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select Today&apos;s 290 Batch</span>
            </button>

            {/* Launch Queue Modal Button */}
            <button
              onClick={() => setIsBulkQueueModalOpen(true)}
              disabled={selectedEmails.length === 0}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Queue ({selectedEmails.length})</span>
            </button>

            <button
              onClick={() => loadData(true)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter and Selection Control Bar */}
        <div className="bg-white border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search participant by name, email, pass ID, domain..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="inline-flex border border-slate-300 bg-slate-50 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 transition-colors ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({groupedParticipants.length})
              </button>
              <button
                onClick={() => setStatusFilter('UNSENT')}
                className={`px-3 py-1 transition-colors ${statusFilter === 'UNSENT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Unsent ({groupedParticipants.filter(p => !p.isCertificateSent).length})
              </button>
              <button
                onClick={() => setStatusFilter('SENT')}
                className={`px-3 py-1 transition-colors ${statusFilter === 'SENT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Sent ({groupedParticipants.filter(p => p.isCertificateSent).length})
              </button>
            </div>

            {/* Select/Deselect quick buttons */}
            <button
              onClick={handleSelectAllUnsent}
              className="text-xs font-bold text-blue-700 hover:underline px-2 py-1"
            >
              Select All Unsent
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleClearSelection}
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
            >
              Clear Selected
            </button>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredParticipants.length > 0 &&
                      filteredParticipants.every(p => selectedEmails.includes(p.email))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newEmails = Array.from(new Set([...selectedEmails, ...filteredParticipants.map(p => p.email)]));
                        setSelectedEmails(newEmails);
                      } else {
                        const currentShown = new Set(filteredParticipants.map(p => p.email));
                        setSelectedEmails(prev => prev.filter(em => !currentShown.has(em)));
                      }
                    }}
                    className="accent-rose-600"
                  />
                </th>
                <th className="p-3">Participant Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Event Pass ID(s)</th>
                <th className="p-3">Domain(s) Participated</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                    No participants found matching the current search or filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const isSelected = selectedEmails.includes(p.email);
                  const isSending = sendingEmailKey === p.email;

                  return (
                    <tr 
                      key={p.email} 
                      className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-rose-50/50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.email)}
                          className="accent-rose-600"
                        />
                      </td>

                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{p.fullName}</span>
                          {p.domainCount > 1 && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 font-bold px-1.5 py-0.2 rounded">
                              {p.domainCount} Domains
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-slate-600">{p.email}</td>

                      <td className="p-3 font-mono text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          {p.allTicketIds.map(t => (
                            <span key={t} className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {p.domains.map((d, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-medium"
                            >
                              <Award className="w-3 h-3 text-amber-700" />
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {p.isCertificateSent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            SENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-300">
                            PENDING
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenPreview(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 border border-slate-300 cursor-pointer"
                            title="Preview certificate typography"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleSendSingleEmail(p)}
                            disabled={isSending}
                            className={`px-3 py-1 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              p.isCertificateSent 
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-400' 
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                            } disabled:opacity-50`}
                            title={p.isCertificateSent ? 'Resend certificate' : 'Send certificate email'}
                          >
                            <Send className="w-3 h-3" />
                            <span>{isSending ? 'Sending...' : p.isCertificateSent ? 'Resend' : 'Send'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* CERTIFICATE PREVIEW MODAL */}
      {previewParticipant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setPreviewParticipant(null);
                setPreviewCanvasUrl(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 text-lg w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Certificate Preview: {previewParticipant.fullName}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              Email: {previewParticipant.email} | Domains: {previewParticipant.domains.join(', ')}
            </p>

            <div className="relative border border-slate-300 bg-black shadow-inner mb-4 flex items-center justify-center min-h-[300px]">
              {renderingPreview ? (
                <div className="text-center p-8 text-white">
                  <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">Generating high-res canvas with matching handwriting font...</p>
                </div>
              ) : previewCanvasUrl ? (
                <img
                  src={previewCanvasUrl}
                  alt="Certificate Preview"
                  className="w-full h-auto object-contain block"
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Font: <strong>Great Vibes / MonteCarlo cursive</strong> &bull; Color: <span className="font-mono font-bold text-rose-800">#800020 (Maroon)</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCertificateAsImage(previewParticipant.fullName)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Test JPG</span>
                </button>
                <button
                  onClick={() => {
                    handleSendSingleEmail(previewParticipant);
                    setPreviewParticipant(null);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Recipient</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK DISPATCH QUEUE MODAL */}
      {isBulkQueueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-xl w-full shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Bulk Certificate Dispatch Queue
                </h3>
              </div>
              {!isProcessingQueue && (
                <button
                  onClick={() => setIsBulkQueueModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-base"
                >
                  ✕
                </button>
              )}
            </div>

            {isProcessingQueue ? (
              <div className="space-y-4 py-4 text-center">
                <div className="inline-block p-3 rounded-full bg-rose-50 border border-rose-200 text-rose-600 animate-spin">
                  <RotateCw className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Generating & Dispatched to: {queueProgress.currentName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Queue: {queueProgress.current} of {queueProgress.total} completed
                  </p>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-rose-600 h-full transition-all duration-300"
                    style={{ width: `${Math.round((queueProgress.current / queueProgress.total) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs font-mono font-bold text-slate-600 px-1">
                  <span className="text-emerald-700">✓ {queueResults.success} sent</span>
                  <span className="text-rose-600">{queueResults.failed} failed</span>
                  <span>{Math.round((queueProgress.current / queueProgress.total) * 100)}%</span>
                </div>

                {quotaWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 font-bold flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{quotaWarning}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 italic">
                  Keep this tab active. Each participant receives their personalized certificate rendered client-side and dispatched sequentially via Brevo.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                  <p className="font-bold">
                    You have selected {selectedEmails.length} participants for certificate dispatch.
                  </p>
                  <p className="text-[11.5px] text-rose-800">
                    Brevo daily credits remaining: <strong>{mailQuota?.credits ?? 285}</strong>. You can safely send up to <strong>290</strong> emails today and reserve 10 for testing.
                  </p>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 p-2 space-y-1 text-xs">
                  {selectedEmails.map(em => {
                    const p = groupedParticipants.find(x => x.email === em);
                    return (
                      <div key={em} className="flex justify-between py-1 px-2 hover:bg-slate-50 border-b border-slate-100 last:border-none">
                        <span className="font-bold text-slate-800">{p?.fullName || em}</span>
                        <span className="font-mono text-slate-500">{em}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setIsBulkQueueModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartQueue}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Start Certificate Queue ({selectedEmails.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
