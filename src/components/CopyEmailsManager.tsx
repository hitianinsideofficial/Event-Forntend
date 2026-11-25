'use client';

import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  Filter, 
  Users, 
  X, 
  Sparkles, 
  CheckCheck, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { SubmissionItem } from '../types/submission.types';

export type EmailFilterType = 'ALL' | 'ACKNOWLEDGED' | 'UNACKNOWLEDGED' | 'PAID' | 'PENDING';
export type EmailFormatType = 'comma' | 'comma_name' | 'newline' | 'semicolon';

interface EmailEntry {
  email: string;
  name: string;
  source: string;
  acknowledged?: boolean;
  paymentStatus?: string;
}

export function extractUniqueEmails(
  submissions: SubmissionItem[],
  filterType: EmailFilterType,
  format: EmailFormatType,
  searchQuery: string = ''
): { emailsString: string; entries: EmailEntry[]; uniqueCount: number } {
  const seen = new Set<string>();
  const entries: EmailEntry[] = [];

  const isValidEmail = (emailStr: string) => {
    return Boolean(
      emailStr &&
      emailStr.includes('@') &&
      emailStr.includes('.') &&
      !emailStr.includes(' ') &&
      emailStr.length > 5
    );
  };

  const filteredSubs = submissions.filter(sub => {
    if (filterType === 'ACKNOWLEDGED') return sub.acknowledged === true;
    if (filterType === 'UNACKNOWLEDGED') return sub.acknowledged !== true;
    if (filterType === 'PAID') return sub.paymentStatus === 'VERIFIED' || sub.paymentStatus === 'PAID';
    if (filterType === 'PENDING') return sub.paymentStatus !== 'VERIFIED' && sub.paymentStatus !== 'PAID';
    return true;
  });

  filteredSubs.forEach(sub => {
    // Primary email
    if (sub.email) {
      const trimmed = sub.email.trim();
      const lower = trimmed.toLowerCase();
      if (isValidEmail(trimmed) && !seen.has(lower)) {
        seen.add(lower);
        entries.push({
          email: trimmed,
          name: sub.fullName?.trim() || '',
          source: 'Primary',
          acknowledged: sub.acknowledged,
          paymentStatus: sub.paymentStatus
        });
      }
    }

    // Secondary emails in form answers (e.g., team members)
    if (sub.answers && typeof sub.answers === 'object') {
      Object.entries(sub.answers).forEach(([key, val]) => {
        if (typeof val === 'string' && val.includes('@')) {
          const parts = val.split(/[,\s;/]+/);
          parts.forEach(part => {
            const clean = part.trim();
            const lowerClean = clean.toLowerCase();
            if (isValidEmail(clean) && !seen.has(lowerClean)) {
              seen.add(lowerClean);
              entries.push({
                email: clean,
                name: '',
                source: `Form field: ${key}`,
                acknowledged: sub.acknowledged,
                paymentStatus: sub.paymentStatus
              });
            }
          });
        }
      });
    }
  });

  // Apply optional search filter
  const finalEntries = searchQuery.trim()
    ? entries.filter(e => 
        e.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  let emailsString = '';
  if (format === 'comma') {
    emailsString = finalEntries.map(e => e.email).join(', ');
  } else if (format === 'semicolon') {
    emailsString = finalEntries.map(e => e.email).join('; ');
  } else if (format === 'newline') {
    emailsString = finalEntries.map(e => e.email).join('\n');
  } else if (format === 'comma_name') {
    emailsString = finalEntries
      .map(e => e.name ? `"${e.name.replace(/"/g, '')}" <${e.email}>` : e.email)
      .join(', ');
  }

  return {
    emailsString,
    entries: finalEntries,
    uniqueCount: finalEntries.length
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    textarea.remove();
    return successful;
  } catch (err) {
    console.error('Failed to copy using fallback:', err);
    return false;
  }
}

// -------------------------------------------------------------
// INLINE SECTION COMPONENT
// -------------------------------------------------------------
interface CopyEmailsSectionProps {
  submissions: SubmissionItem[];
  title?: string;
  defaultFilter?: EmailFilterType;
  onOpenAdvancedModal?: () => void;
}

export function CopyEmailsSection({
  submissions,
  title = 'Quick Copy User Emails for Gmail',
  defaultFilter = 'ALL',
  onOpenAdvancedModal
}: CopyEmailsSectionProps) {
  const [filter, setFilter] = useState<EmailFilterType>(defaultFilter);
  const [format, setFormat] = useState<EmailFormatType>('comma');
  const [copied, setCopied] = useState<boolean>(false);

  const { emailsString, uniqueCount } = useMemo(() => {
    return extractUniqueEmails(submissions, filter, format);
  }, [submissions, filter, format]);

  const handleCopy = async () => {
    if (!emailsString) return;
    const ok = await copyTextToClipboard(emailsString);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenGmail = () => {
    if (!emailsString) return;
    // Bcc prevents exposing all emails publicly
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emailsString)}`;
    window.open(gmailUrl, '_blank');
  };

  // Counts for tabs
  const allCount = useMemo(() => extractUniqueEmails(submissions, 'ALL', 'comma').uniqueCount, [submissions]);
  const ackCount = useMemo(() => extractUniqueEmails(submissions, 'ACKNOWLEDGED', 'comma').uniqueCount, [submissions]);
  const paidCount = useMemo(() => extractUniqueEmails(submissions, 'PAID', 'comma').uniqueCount, [submissions]);
  const pendingCount = useMemo(() => extractUniqueEmails(submissions, 'PENDING', 'comma').uniqueCount, [submissions]);

  return (
    <div className="bg-white border-2 border-slate-900 shadow-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white font-mono">
                {uniqueCount} Unique {uniqueCount === 1 ? 'Email' : 'Emails'}
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              One-click copy all participant emails formatted for direct pasting into Gmail <span className="font-bold text-slate-900">To</span> or <span className="font-bold text-slate-900">Bcc</span>.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={uniqueCount === 0}
            className={`px-4 py-2 text-xs font-black inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
            }`}
            title="Copy all emails formatted with commas for Gmail"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied {uniqueCount} Emails!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy {uniqueCount} Emails (Gmail)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenGmail}
            disabled={uniqueCount === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open a new Gmail compose window with these emails in Bcc"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            <span>Open in Gmail (Bcc)</span>
          </button>

          {onOpenAdvancedModal && (
            <button
              type="button"
              onClick={onOpenAdvancedModal}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Filter by domain or custom formats"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>More Options</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Format Controls */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
          
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            All Submissions ({allCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('ACKNOWLEDGED')}
            className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
              filter === 'ACKNOWLEDGED'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Acknowledged Only ({ackCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('PAID')}
            className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
              filter === 'PAID'
                ? 'bg-indigo-700 text-white border-indigo-700'
                : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
            }`}
          >
            Verified Payments ({paidCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
              filter === 'PENDING'
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            Unverified ({pendingCount})
          </button>
        </div>

        {/* Separator / Format Type */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Format:</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as EmailFormatType)}
            className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 text-slate-800 font-semibold outline-none cursor-pointer focus:border-slate-900"
          >
            <option value="comma">Comma-separated (Gmail Best)</option>
            <option value="comma_name">Name &lt;Email&gt; (Gmail Formatted)</option>
            <option value="newline">One per line (Newline)</option>
            <option value="semicolon">Semicolon-separated (Outlook)</option>
          </select>
        </div>
      </div>

      {/* Quick Editable/Copyable Textarea Preview */}
      <div className="mt-3 relative">
        <textarea
          readOnly
          value={emailsString}
          rows={3}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          placeholder="No emails found for this filter..."
          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 text-slate-800 select-all outline-none focus:border-slate-900 focus:bg-white resize-y"
        />
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
          <span>💡 Tip: Click inside to auto-select all, or click the red <strong>Copy {uniqueCount} Emails</strong> button above.</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
          >
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ADVANCED FULL MODAL COMPONENT
// -------------------------------------------------------------
interface CopyEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: SubmissionItem[];
  eventName?: string;
}

export function CopyEmailsModal({
  isOpen,
  onClose,
  submissions,
  eventName
}: CopyEmailsModalProps) {
  const [filter, setFilter] = useState<EmailFilterType>('ALL');
  const [format, setFormat] = useState<EmailFormatType>('comma');
  const [search, setSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const { emailsString, entries, uniqueCount } = useMemo(() => {
    return extractUniqueEmails(submissions, filter, format, search);
  }, [submissions, filter, format, search]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!emailsString) return;
    const ok = await copyTextToClipboard(emailsString);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenGmail = () => {
    if (!emailsString) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emailsString)}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        className="bg-white border-2 border-slate-900 w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-600 flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <span>Copy Participant Emails</span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-600 text-white font-mono">
                  {uniqueCount} Unique
                </span>
              </h2>
              {eventName && (
                <p className="text-xs text-slate-300 truncate max-w-md">
                  Event: {eventName}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Notice */}
          <div className="bg-rose-50 border border-rose-200 p-3 text-slate-700 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 text-xs">
                Ready for Gmail Compose:
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Copies all emails formatted with commas. In Gmail, click into the <strong>To</strong> or <strong>Bcc</strong> field and press <kbd className="px-1 py-0.5 bg-white border border-slate-300 font-mono font-bold text-slate-800">Ctrl + V</kbd> (or Cmd + V). Gmail will instantly turn them into recipient chips.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Filter By Participant Status:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'All Submissions' },
                { id: 'ACKNOWLEDGED', label: 'Acknowledged Only' },
                { id: 'UNACKNOWLEDGED', label: 'Unacknowledged Only' },
                { id: 'PAID', label: 'Verified Payments Only' },
                { id: 'PENDING', label: 'Pending Payment Verification' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as EmailFilterType)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                    filter === tab.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Format Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Search Name / Email:
              </label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Copy Format:
              </label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as EmailFormatType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-800 font-semibold outline-none cursor-pointer focus:border-slate-900"
              >
                <option value="comma">Comma-separated (email1, email2) - Standard Gmail</option>
                <option value="comma_name">With Names ("Name" &lt;email&gt;) - Formatted</option>
                <option value="newline">One per line (Newline) - For Lists & Sheets</option>
                <option value="semicolon">Semicolon-separated (email1; email2) - Outlook</option>
              </select>
            </div>
          </div>

          {/* Emails Textarea Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Generated Email List ({uniqueCount} recipient{uniqueCount === 1 ? '' : 's'}):
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Click box to select all text
              </span>
            </div>
            <textarea
              readOnly
              value={emailsString}
              rows={6}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              placeholder="No matching emails found..."
              className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 text-slate-900 select-all outline-none focus:border-slate-900 focus:bg-white leading-relaxed resize-y"
            />
          </div>

          {/* Email Preview Table (First 15 items) */}
          {entries.length > 0 && (
            <div className="border border-slate-200">
              <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Sample Entries ({Math.min(10, entries.length)} of {entries.length})</span>
                <span>Unique Cleaned Emails</span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                {entries.slice(0, 10).map((entry, idx) => (
                  <div key={idx} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-mono text-slate-900 font-medium">{entry.email}</span>
                    <span className="text-slate-500 truncate max-w-[200px]">{entry.name || entry.source}</span>
                  </div>
                ))}
                {entries.length > 10 && (
                  <div className="px-3 py-1 text-[10px] text-slate-400 text-center font-bold">
                    + {entries.length - 10} more emails included in copy
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenGmail}
              disabled={uniqueCount === 0}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Gmail compose tab with all emails in Bcc"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Open in Gmail (Bcc)</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={uniqueCount === 0}
              className={`px-5 py-2 text-xs font-black inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copied {uniqueCount} Emails!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy {uniqueCount} Emails</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
