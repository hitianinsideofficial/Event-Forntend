'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  verifyResubmissionTokenApi, 
  submitResubmissionFileApi 
} from '../../../services/api.service';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Lock, 
  Upload, 
  ArrowRight,
  FileCheck,
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';

function ReuploadSubmissionContent() {
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
    rejectionReason?: string;
    resubmissionCompleted: boolean;
    resubmissionCompletedAt?: string;
  } | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Initial Verification of UTM and Token
  useEffect(() => {
    // UTM Source Verification as strictly requested
    if (!utmSource || utmSource !== 'email_resubmission') {
      setAccessDenied(true);
      setAccessDeniedReason('Direct access to this route is restricted. Please access this page directly by clicking the link provided in your official rejection & re-upload notification email.');
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
        const res = await verifyResubmissionTokenApi({
          submissionId,
          ticketId,
          token,
          utm_source: utmSource
        });

        if (res.success && res.data) {
          setSubmissionData(res.data);
          if (res.data.resubmissionCompleted) {
            setIsExpired(true);
            setExpiredTime(res.data.resubmissionCompletedAt || null);
          }
        }
      } catch (err: any) {
        if (err.errorCode === 'LINK_EXPIRED' || err.status === 410) {
          setIsExpired(true);
          setExpiredTime(err.data?.completedAt || null);
        } else if (err.errorCode === 'INVALID_SOURCE' || err.status === 403) {
          setAccessDenied(true);
          setAccessDeniedReason(err.message || 'Access Denied: Invalid security token or referral source.');
        } else {
          setAccessDenied(true);
          setAccessDeniedReason(err.message || 'Unable to verify your re-upload link.');
        }
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [submissionId, ticketId, token, utmSource]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage('');

      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Submit file
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedFile) {
      setErrorMessage('Please select a file to upload before submitting.');
      return;
    }

    // Max 25MB
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit. Please compress or optimize your file.');
      return;
    }

    const confirmSubmit = window.confirm(
      '⚠️ ATTENTION: ONE-TIME RE-UPLOAD POLICY\n\nYou can only re-upload this replacement file ONCE. Once submitted, this update link will immediately expire and cannot be changed again.\n\nMake sure this is your final, correct submission file (NOT payment screenshot or collage).\n\nClick OK to confirm and upload.'
    );

    if (!confirmSubmit) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', submissionId);
      formData.append('ticketId', ticketId);
      formData.append('token', token);
      formData.append('utm_source', utmSource);
      formData.append('replacementFile', selectedFile);

      const res = await submitResubmissionFileApi(formData);

      if (res.success) {
        setSubmitSuccess(true);
        setUploadedFileName(res.data?.fileName || selectedFile.name);
      }
    } catch (err: any) {
      if (err.errorCode === 'LINK_EXPIRED' || err.status === 410) {
        setIsExpired(true);
      } else {
        setErrorMessage(err.message || 'Failed to upload replacement file. Please try again.');
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
            Validating security credentials and re-upload authorization token...
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
              To protect the integrity of festival entries and prevent unauthorized file modifications, this portal only accepts participants coming directly from their official re-upload email link with valid tokens.
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

  // State 3: Link Already Expired (One-Time Re-upload Enforced)
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
              Re-upload Link Has Expired
            </h1>
            <p className="text-xs text-[#e6d7c3] mt-2 leading-relaxed">
              This one-time link has already been used to upload your replacement submission file.
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
              🔒 <strong>One-Time Policy:</strong> To keep contest judging fair and tamper-proof, participants are granted exactly one re-upload opportunity. Our judges have received your updated entry.
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
              Replacement Received & Locked
            </span>
            <h1 className="text-2xl font-black text-[#fdfbf7] uppercase tracking-wide">
              File Re-uploaded Successfully!
            </h1>
            <p className="text-xs text-[#e6d7c3] mt-2 leading-relaxed">
              Thank you, <strong>{submissionData?.fullName}</strong>! Your replacement submission has been recorded and submitted directly to our judges for final evaluation.
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
              <span className="text-[#fdfbf7] font-semibold">{submissionData?.eventTitle} ({submissionData?.domainTitle || 'Contest'})</span>
            </div>
            <div className="border-t border-emerald-500/20 pt-2 flex items-center justify-between">
              <span className="text-slate-400">Uploaded File:</span>
              <span className="font-mono font-bold text-emerald-400 truncate max-w-[200px]">{uploadedFileName}</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded text-left flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              This link has now <strong>expired</strong>. Your entry is now locked for evaluation and will be reviewed by the event committee.
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

  // State 5: Active Form Page to Re-upload File
  return (
    <div className="min-h-screen bg-[#0b0204] text-[#fdfbf7] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-[#170409] border border-[#e6c594] p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6c594]/20 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#e6c594] uppercase tracking-widest block">
                Official Contestant Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#fdfbf7] mt-0.5">
                Re-upload Submission Entry
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
              <span className="font-bold text-[#e6c594]">{submissionData?.eventTitle} - {submissionData?.domainTitle || 'Contest'}</span>
            </div>
          </div>

          {/* REASON WHY IT WAS REJECTED */}
          <div className="mt-4 bg-rose-500/15 border-l-4 border-rose-500 p-4 space-y-1">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Reason Submission Was Rejected:</span>
            </div>
            <p className="text-sm font-bold text-rose-100 leading-snug pt-1">
              &ldquo;{submissionData?.rejectionReason || 'Submission file was rejected. Please re-upload according to guidelines.'}&rdquo;
            </p>
          </div>
        </div>

        {/* GUIDELINES BOX */}
        <div className="bg-[#170409] border border-[#e6c594]/40 p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-[#e6c594]/20 pb-3">
            <AlertCircle className="w-4 h-4 text-[#e6c594]" />
            <h2 className="text-xs font-black text-[#e6c594] uppercase tracking-wider">
              Contest Submission Rules:
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#240710] p-3 border border-[#e6c594]/15 space-y-1">
              <span className="font-black text-rose-400 block">1. Photo Not Uploaded</span>
              <p className="text-[11px] text-[#e6d7c3]/70 leading-normal">
                Make sure you upload the full original photo or artwork image file.
              </p>
            </div>
            <div className="bg-[#240710] p-3 border border-[#e6c594]/15 space-y-1">
              <span className="font-black text-amber-400 block">2. No Collages Allowed</span>
              <p className="text-[11px] text-[#e6d7c3]/70 leading-normal">
                Against the rules: You cannot upload collage photos. Only single original captures.
              </p>
            </div>
            <div className="bg-[#240710] p-3 border border-[#e6c594]/15 space-y-1">
              <span className="font-black text-emerald-400 block">3. Position Swap</span>
              <p className="text-[11px] text-[#e6d7c3]/70 leading-normal">
                Do not upload your payment screenshot proof here. Upload your actual entry file!
              </p>
            </div>
          </div>
        </div>

        {/* UPLOAD FORM */}
        <div className="bg-[#170409] border border-[#e6c594] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[#e6c594]/20 pb-3">
            <Upload className="w-4 h-4 text-[#e6c594]" />
            <h2 className="text-sm font-black text-[#fdfbf7] uppercase tracking-wider">
              Choose Replacement File
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
              <label className="block text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-2">
                Upload File (JPG, PNG, WEBP, or PDF) <span className="text-rose-400">*</span>
              </label>

              <div className="border-2 border-dashed border-[#e6c594]/40 hover:border-[#e6c594] bg-[#240710] p-6 text-center transition-colors cursor-pointer relative">
                <input 
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#fdfbf7] block">
                      {selectedFile ? selectedFile.name : 'Click or drag file here to upload'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Max size 25MB'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="mt-3 p-2 bg-[#240710] border border-[#e6c594]/30 rounded">
                  <span className="text-[10px] text-[#e6c594] font-bold block mb-1">Selected File Preview:</span>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-56 mx-auto rounded object-contain border border-[#e6c594]/20" 
                  />
                </div>
              )}
            </div>

            {/* Warning Box on Single Use */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="text-amber-300">One-Time Re-upload Notice:</strong>
                <p className="mt-0.5">
                  Once you click submit, this replacement file will overwrite your previous rejected entry, your one-time link will expire, and your submission will be locked for judging.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedFile}
              className="w-full py-3 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white font-black text-xs uppercase tracking-widest border border-[#fcd34d] transition-all disabled:opacity-50 cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading Replacement File...</span>
                </>
              ) : (
                <>
                  <span>Submit Replacement & Lock Entry</span>
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

export default function ReuploadSubmissionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0204] flex items-center justify-center p-4">
        <div className="text-center text-[#e6c594] text-xs font-mono">
          Loading re-upload portal...
        </div>
      </div>
    }>
      <ReuploadSubmissionContent />
    </Suspense>
  );
}
