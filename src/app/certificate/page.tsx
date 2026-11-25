'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import CertificateVerifierModal from '../../components/CertificateVerifierModal';
import { 
  checkParticipantCertificateEligibilityApi, 
  ParticipantCertificateEligibility 
} from '../../services/api.service';
import { 
  renderCertificateCanvas, 
  downloadCertificateAsImage 
} from '../../utils/certificateGenerator';
import { 
  Award, 
  Download, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  FileText,
  Mail,
  Ticket,
  ExternalLink,
  Layers
} from 'lucide-react';

export default function CertificateDownloadPage() {
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantCertificateEligibility | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [generatingDownload, setGeneratingDownload] = useState(false);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);

  // Directly handle on-screen certificate preview rendering when participant is loaded
  useEffect(() => {
    let active = true;
    if (participant && participant.fullName) {
      renderCertificateCanvas({ participantName: participant.fullName })
        .then(canvas => {
          if (active) {
            setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.92));
          }
        })
        .catch(err => {
          console.error('Failed to generate preview canvas:', err);
        });
    } else {
      setPreviewDataUrl(null);
    }
    return () => {
      active = false;
    };
  }, [participant]);

  // Exact match search upon clicking "Get Certificate" (no throttle / debounce)
  const handleGetCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = queryInput.trim();

    if (!cleanQuery) {
      setError('Please enter your Event Pass ID or Registered Email.');
      return;
    }

    setError(null);
    setParticipant(null);
    setPreviewDataUrl(null);
    setLoading(true);

    try {
      const res = await checkParticipantCertificateEligibilityApi(cleanQuery);
      if (res && res.eligible && res.participant) {
        setParticipant(res.participant);
      } else {
        setError(res.message || 'No valid participation detected for this entry.');
      }
    } catch (err: any) {
      setError(
        err.message || 
        'No valid participation detected. Please verify your exact registered email or event pass ID.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!participant) return;
    setGeneratingDownload(true);
    try {
      await downloadCertificateAsImage(
        participant.fullName,
        `Navroopam_Certificate_${participant.fullName.replace(/\s+/g, '_')}.jpg`
      );
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Could not download certificate: ' + (err?.message || 'Unknown error'));
    } finally {
      setGeneratingDownload(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0204] text-[#fdfbf7] flex flex-col selection:bg-[#800020] selection:text-[#e6c594]">
      <Navbar onOpenVerifyModal={() => setIsVerifierOpen(true)} />

      {/* Hero Header */}
      <section className="relative pt-12 pb-10 border-b border-[#f7f1e5]/10 overflow-hidden">
        <div className="container-custom max-w-4xl mx-auto px-4 text-center relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-[#e6c594] transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal Home</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800020]/30 border border-[#e6c594]/30 text-[#e6c594] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#e6c594]" />
            <span>Official E-Certificate Portal &bull; NAVROOPAM v7.0</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#fdfbf7]">
            Download Your <span className="text-[#e6c594]">Certificate</span>
          </h1>
          <p className="text-sm sm:text-base text-[#cbbab0] max-w-2xl mx-auto leading-relaxed">
            Enter your exact registered email address or event pass ID below to instantly retrieve and download your official high-resolution Certificate of Participation.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#e6c594]/80 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
            <span>ℹ️ Note: 1st, 2nd & 3rd place position awards & domain rank certificates are presented offline.</span>
          </div>
        </div>
      </section>

      {/* Main Form and Certificate Showcase */}
      <main className="container-custom max-w-4xl mx-auto px-4 py-10 flex-1">
        {/* Search Box */}
        <div className="max-w-xl mx-auto bg-[#130408]/90 border border-[#e6c594]/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md mb-8">
          <form onSubmit={handleGetCertificate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#e6c594] mb-2">
                Event Pass ID or Registered Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="e.g. HIT-EVT-XXXXXX or student@gmail.com"
                  className="w-full bg-[#0a0204]/90 border border-white/20 rounded-xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-[#e6c594] focus:ring-1 focus:ring-[#e6c594] transition-all font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-[#a69181] mt-1.5">
                Type your complete email or Pass ID and click below. No partial matches.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#800020] hover:bg-[#94132e] text-[#fdfbf7] font-bold text-sm py-3.5 px-6 rounded-xl border border-[#e6c594]/40 shadow-lg hover:shadow-rose-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking Participation Records...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Get Certificate</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">No Valid Participation Detected</p>
                <p className="mt-0.5 text-rose-200/90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Certificate Display Card */}
        {participant && (
          <div className="bg-[#130408]/90 border border-[#e6c594]/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md animate-fade-in">
            {/* Header info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Official Participation Verified
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{participant.fullName}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#cbbab0] mt-1.5 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#e6c594]" /> {participant.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-[#e6c594]" /> {participant.ticketId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={generatingDownload || !previewDataUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#94132e] text-white font-bold text-sm px-6 py-3 rounded-xl border border-[#e6c594] shadow-lg shadow-rose-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{generatingDownload ? 'Preparing File...' : 'Download High-Res Certificate'}</span>
                </button>
              </div>
            </div>

            {/* Domains Participated Badge Row (Single Consolidated Certificate for multiple domains) */}
            <div className="my-5 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#e6c594]" />
                  <span className="text-xs font-bold uppercase text-[#e6c594] tracking-wider">
                    Participated Domains ({participant.domainCount})
                  </span>
                </div>
                <span className="text-[11px] text-[#a69181]">
                  Single Unified Certificate Generated
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {participant.domains.map((dom, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center gap-1 text-xs bg-[#800020]/40 text-[#fdfbf7] border border-[#e6c594]/30 px-3 py-1 rounded-lg font-medium"
                  >
                    <Award className="w-3 h-3 text-[#e6c594]" />
                    {dom}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Rendered Canvas / Image Preview */}
            <div className="relative rounded-xl overflow-hidden border border-[#e6c594]/40 bg-black shadow-2xl">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt={`Certificate for ${participant.fullName}`}
                  className="w-full h-auto object-contain block"
                />
              ) : (
                <div className="h-64 sm:h-96 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-[#e6c594]">Rendering personalized certificate typography...</p>
                </div>
              )}
            </div>

            {/* Footer action bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#a69181] gap-4">
              <p>
                Format: <strong className="text-white">High-Resolution JPEG (1600 &times; 1131 px)</strong> with official digital signatures.
              </p>
              <button
                onClick={handleDownload}
                disabled={generatingDownload || !previewDataUrl}
                className="inline-flex items-center gap-1.5 text-[#e6c594] hover:underline font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to device directly</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Verifier Modal */}
      <CertificateVerifierModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
      />
    </div>
  );
}
