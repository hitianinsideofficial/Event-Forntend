'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  verifyDriveLinkUpdateTokenApi, 
  submitDriveLinkUpdateApi 
} from '../../../services/api.service';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  Lock, 
  Share2, 
  Video, 
  ArrowRight,
  Globe,
  Eye,
  Check,
  ChevronRight,
  FileCheck
} from 'lucide-react';

function UpdateDriveLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const submissionId = searchParams.get('submissionId') || '';
  const ticketId = searchParams.get('ticketId') || '';
  const token = searchParams.get('token') || '';
  const utmSource = searchParams.get('utm_source') || '';

  // Verification & Submission states
  const [verifying, setVerifying] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [expiredTime, setExpiredTime] = useState<string | null>(null);

  // Participant data from verification
  const [submissionData, setSubmissionData] = useState<{
    ticketId: string;
    fullName: string;
    eventTitle: string;
    domainTitle?: string;
    currentLink?: string;
    driveLinkUpdated: boolean;
    driveLinkUpdatedAt?: string;
  } | null>(null);

  // Form input & submission states
  const [newDriveLink, setNewDriveLink] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [confirmedLink, setConfirmedLink] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Initial Verification of UTM and Token
  useEffect(() => {
    // UTM Source Verification as strictly requested
    if (!utmSource || utmSource !== 'email_drive_update') {
      setAccessDenied(true);
      setAccessDeniedReason('Direct access to this route is restricted. Please access this page directly by clicking the link provided in your official notification email.');
      setVerifying(false);
      return;
    }

    if (!token) {
      setAccessDenied(true);
      setAccessDeniedReason('Missing or invalid authentication token in the URL. Please click the full link in your email.');
      setVerifying(false);
      return;
    }

    // Call backend verify endpoint
    const verifyToken = async () => {
      setVerifying(true);
      try {
        const res = await verifyDriveLinkUpdateTokenApi({
          submissionId,
          ticketId,
          token,
          utm_source: utmSource
        });

        if (res.success && res.data) {
          setSubmissionData(res.data);
          if (res.data.currentLink) {
            setNewDriveLink(res.data.currentLink);
          }
        }
      } catch (err: any) {
        if (err.errorCode === 'LINK_EXPIRED' || err.status === 410) {
          setIsExpired(true);
          setExpiredTime(err.data?.updatedAt || null);
        } else if (err.errorCode === 'INVALID_SOURCE' || err.status === 403) {
          setAccessDenied(true);
          setAccessDeniedReason(err.message || 'Access Denied: Invalid security token or referral source.');
        } else {
          setAccessDenied(true);
          setAccessDeniedReason(err.message || 'Unable to verify your update link.');
        }
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [submissionId, ticketId, token, utmSource]);

  // 2. Submit Link
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanLink = newDriveLink.trim();
    if (!cleanLink) {
      setErrorMessage('Please enter your updated Google Drive link.');
      return;
    }

    if (!cleanLink.includes('drive.google.com')) {
      setErrorMessage('Please enter a valid Google Drive link (must contain drive.google.com).');
      return;
    }

    const confirmSubmit = window.confirm(
      '⚠️ ATTENTION: ONE-TIME UPDATE POLICY\n\nYou can only update this link ONCE. Once submitted, this update link will immediately expire and cannot be changed again.\n\nHave you made sure the link is set to "Anyone with the link can view"?\n\nClick OK to confirm and update.'
    );

    if (!confirmSubmit) return;

    setSubmitting(true);
    try {
      const res = await submitDriveLinkUpdateApi({
        submissionId,
        ticketId,
        token,
        utm_source: utmSource,
        newDriveLink: cleanLink
      });

      if (res.success) {
        setSubmitSuccess(true);
        setConfirmedLink(cleanLink);
      }
    } catch (err: any) {
      if (err.errorCode === 'LINK_EXPIRED' || err.status === 410) {
        setIsExpired(true);
      } else {
        setErrorMessage(err.message || 'Failed to update Google Drive link. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // State 1: Verifying
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#0b0204] flex items-center justify-center p-4">
        <div className="bg-[#170409] border border-[#e6c594]/40 p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 border-3 border-[#e6c594]/30 border-t-[#e6c594] rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-black text-[#fdfbf7] uppercase tracking-wider">Verifying Link Security</h2>
          <p className="text-xs text-[#e6d7c3]/80 leading-relaxed">
            Validating security tokens and campaign parameters...
          </p>
        </div>
      </div>
    );
  }

  // State 2: Access Denied / Invalid UTM Source
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0b0204] flex items-center justify-center p-4">
        <div className="bg-[#170409] border border-rose-500/50 p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-rose-400 uppercase tracking-wide">Access Restricted</h1>
            <p className="text-xs text-[#e6d7c3] mt-2 leading-relaxed">
              {accessDeniedReason}
            </p>
          </div>
          <div className="bg-[#240710] border border-rose-500/20 p-4 rounded text-left space-y-2">
            <span className="text-[11px] font-bold text-rose-300 block uppercase tracking-wider">Why am I seeing this?</span>
            <p className="text-[11px] text-[#e6d7c3]/70 leading-normal">
              To protect the integrity of festival judging and ensure entries cannot be manipulated by third parties, this update portal only accepts visitors coming directly from their registered email link with verified campaign tokens.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-block px-5 py-2.5 bg-[#240710] hover:bg-[#340a17] text-[#e6c594] text-xs font-bold uppercase tracking-wider border border-[#e6c594]/40 transition-colors"
            >
              Return to Homepage &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Link Already Expired (One-Time Update Enforced)
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0b0204] flex items-center justify-center p-4">
        <div className="bg-[#170409] border border-amber-500/40 p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-amber-500/30 mb-2">
              Status: Expired (Already Used)
            </span>
            <h1 className="text-xl font-black text-[#fdfbf7] uppercase tracking-wide">
              Update Link Has Expired
            </h1>
            <p className="text-xs text-[#e6d7c3] mt-2 leading-relaxed">
              This one-time update link has already been used to submit your Google Drive video link.
            </p>
          </div>

          <div className="bg-[#240710] border border-amber-500/20 p-4 rounded text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#e6c594]">
              <span className="font-bold">Pass / Ticket ID:</span>
              <span className="font-mono">{ticketId || submissionData?.ticketId || 'VERIFIED'}</span>
            </div>
            {expiredTime && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Submitted On:</span>
                <span className="font-mono">{new Date(expiredTime).toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-[#e6c594]/20 pt-2 text-[#e6d7c3]/80 leading-relaxed text-[11px]">
              🔒 <strong>One-Time Policy:</strong> To keep evaluations unbiased and fair for all participants, each contestant is permitted exactly one link update. Our evaluation panel has received your updated submission.
            </div>
          </div>

          <div className="pt-2">
            <Link 
              href="/"
              className="inline-block px-5 py-2.5 bg-[#800020] hover:bg-[#600018] text-[#fdfbf7] text-xs font-bold uppercase tracking-wider border border-[#e6c594] transition-colors"
            >
              Back to HITian Inside &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Successful Submission
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#0b0204] flex items-center justify-center p-4">
        <div className="bg-[#170409] border border-emerald-500/50 p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-500/30 mb-2">
              Update Received & Locked
            </span>
            <h1 className="text-2xl font-black text-[#fdfbf7] uppercase tracking-wide">
              Drive Link Updated Successfully!
            </h1>
            <p className="text-xs text-[#e6d7c3] mt-2 leading-relaxed">
              Thank you, <strong>{submissionData?.fullName}</strong>! Your updated Google Drive video link has been recorded and submitted directly to our judges.
            </p>
          </div>

          {/* Submission Details Card */}
          <div className="bg-[#240710] border border-emerald-500/20 p-4 rounded text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold">Registration Pass:</span>
              <span className="font-mono font-bold text-[#e6c594]">{submissionData?.ticketId || ticketId}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold">Event / Domain:</span>
              <span className="text-[#fdfbf7] font-semibold">{submissionData?.eventTitle} ({submissionData?.domainTitle || 'Puja Vlog'})</span>
            </div>
            <div className="border-t border-emerald-500/20 pt-2">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Updated Link:</span>
              <a 
                href={confirmedLink} 
                target="_blank" 
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-[11px] font-mono break-all inline-flex items-center gap-1"
              >
                <span>{confirmedLink}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded text-left flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              This link has now <strong>expired</strong> and cannot be modified again. Ensure your Google Drive permission remains set to &quot;Anyone with the link can view&quot; throughout the judging phase.
            </p>
          </div>

          <div className="pt-2">
            <Link 
              href="/"
              className="inline-block px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-[#fdfbf7] text-xs font-bold uppercase tracking-wider border border-[#e6c594] transition-colors"
            >
              Done & Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 5: Active Form Page to Update Link
  return (
    <div className="min-h-screen bg-[#0b0204] text-[#fdfbf7] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-[#170409] border border-[#e6c594] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Video className="w-48 h-48 text-[#e6c594]" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6c594]/20 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#e6c594] uppercase tracking-widest block">
                Official Contestant Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#fdfbf7] mt-0.5">
                Update Google Drive Video Link
              </h1>
            </div>
            <div className="bg-[#240710] border border-[#e6c594]/40 px-3 py-1.5 text-right">
              <span className="text-[9px] font-mono text-[#e6d7c3]/60 uppercase block">Pass ID</span>
              <span className="text-xs font-mono font-black text-[#e6c594]">{submissionData?.ticketId || ticketId}</span>
            </div>
          </div>

          {/* Participant Info Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#240710] p-3 border border-[#e6c594]/20">
            <div>
              <span className="text-slate-400 block text-[10px]">Participant:</span>
              <span className="font-bold text-[#fdfbf7]">{submissionData?.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Event / Domain:</span>
              <span className="font-bold text-[#e6c594]">{submissionData?.eventTitle} - {submissionData?.domainTitle || 'Puja Vlog'}</span>
            </div>
          </div>

          {/* Notice Alert */}
          <div className="mt-4 bg-rose-500/10 border-l-4 border-rose-500 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Drive Link Needs Access Permission</span>
            </div>
            <p className="text-[12px] text-rose-100/90 leading-relaxed">
              Our evaluation panel attempted to review your video entry, but access was blocked because the Google Drive link is set to <strong>&quot;Restricted&quot;</strong>. Follow the instructions below to enable public viewing access and submit your link.
            </p>
          </div>
        </div>

        {/* STEP-BY-STEP INSTRUCTIONS GUIDE */}
        <div className="bg-[#170409] border border-[#e6c594]/40 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#e6c594]/20 pb-3">
            <Share2 className="w-4 h-4 text-[#e6c594]" />
            <h2 className="text-sm font-black text-[#e6c594] uppercase tracking-wider">
              5 Steps: How to Make Your Google Drive Link Public
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className="flex items-start gap-3 bg-[#240710] p-3 border border-[#e6c594]/15">
              <span className="w-6 h-6 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <p className="font-bold text-[#fdfbf7]">Locate your video file on Google Drive</p>
                <p className="text-[11px] text-[#e6d7c3]/70 mt-0.5">
                  Open Google Drive on your computer or mobile device and find the uploaded video file.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 bg-[#240710] p-3 border border-[#e6c594]/15">
              <span className="w-6 h-6 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <p className="font-bold text-[#fdfbf7]">Open the Share Menu</p>
                <p className="text-[11px] text-[#e6d7c3]/70 mt-0.5">
                  Right-click the video file (or tap the 3-dots icon on the mobile app) and select <strong>&quot;Share&quot; &rarr; &quot;Share&quot;</strong>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 bg-[#240710] p-3 border border-[#e6c594]/15">
              <span className="w-6 h-6 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <p className="font-bold text-[#fdfbf7]">Change General Access from Restricted</p>
                <p className="text-[11px] text-[#e6d7c3]/70 mt-0.5">
                  Under the <strong>&quot;General access&quot;</strong> section, click on <em>&quot;Restricted&quot;</em> and switch it to <strong>&quot;Anyone with the link&quot;</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 bg-[#240710] p-3 border border-[#e6c594]/15">
              <span className="w-6 h-6 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <p className="font-bold text-[#fdfbf7]">Set Permission Role & Copy Link</p>
                <p className="text-[11px] text-[#e6d7c3]/70 mt-0.5">
                  Confirm the permission dropdown on the right is set to <strong>&quot;Viewer&quot;</strong>. Then click the <strong>&quot;Copy link&quot;</strong> button.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-3 bg-[#240710] p-3 border border-[#e6c594]/15">
              <span className="w-6 h-6 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <div>
                <p className="font-bold text-[#fdfbf7]">Test in Incognito (Recommended)</p>
                <p className="text-[11px] text-[#e6d7c3]/70 mt-0.5">
                  Paste the copied link in an Incognito / Private browser tab. If the video opens without asking you to sign in, it is public!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMISSION FORM */}
        <div className="bg-[#170409] border border-[#e6c594] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[#e6c594]/20 pb-3">
            <Globe className="w-4 h-4 text-[#e6c594]" />
            <h2 className="text-sm font-black text-[#fdfbf7] uppercase tracking-wider">
              Paste & Submit Updated Link
            </h2>
          </div>

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-1.5">
                Google Drive Video URL <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input 
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  value={newDriveLink}
                  onChange={e => setNewDriveLink(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#240710] border border-[#e6c594]/50 text-[#fdfbf7] placeholder:text-slate-500 font-mono focus:outline-none focus:border-[#e6c594] transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Must be a valid Google Drive link containing <code className="text-[#e6c594]">drive.google.com</code>
              </p>
            </div>

            {/* Warning Box on Single Use */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="text-amber-300">One-Time Submission Notice:</strong>
                <p className="mt-0.5">
                  Once you click submit, this update token is permanently invalidated and the link expires. You will not be able to edit this link a second time.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white font-black text-xs uppercase tracking-widest border border-[#fcd34d] transition-all disabled:opacity-50 cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting & Locking Link...</span>
                </>
              ) : (
                <>
                  <span>Submit Updated Public Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 py-4">
          <p>HITian Inside &bull; Haldia Institute of Technology</p>
          <p className="mt-1">Queries? Contact <a href="mailto:event@hitianinside.in" className="text-[#e6c594] hover:underline">event@hitianinside.in</a></p>
        </div>

      </div>
    </div>
  );
}

export default function UpdateDriveLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0204] flex items-center justify-center p-4">
        <div className="text-center text-[#e6c594] text-xs font-mono">
          Loading portal...
        </div>
      </div>
    }>
      <UpdateDriveLinkContent />
    </Suspense>
  );
}
