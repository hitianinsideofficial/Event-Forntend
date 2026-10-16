import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Clock, ExternalLink, HelpCircle, Share2, Camera } from 'lucide-react';
import { EventItem } from '../types/event.types';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export default function EmailPreviewModal({ isOpen, onClose, event }: EmailPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'verified' | 'drive_fix' | 'resubmission_request'>('received');

  if (!isOpen) return null;

  const eventTitle = event?.title || 'NAVROOPAM v7.0';
  const isNavroopam = Boolean(
    event?.id === '6aca70825588e8009b8e8e83' ||
    event?.id?.includes('nav') ||
    event?.title?.toLowerCase().includes('nav')
  );

  const bannerSrc = isNavroopam ? 'https://ik.imagekit.io/n6cw3mewa/navroopam_banner.png' : (event?.bannerUrl || 'https://ik.imagekit.io/n6cw3mewa/navroopam_banner.png');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white border border-slate-300 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">
                Official Email Templates Preview
              </h2>
              <p className="text-[11px] text-slate-300">
                {eventTitle} • Automatic & Verification Notification Dispatches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TEMPLATE SWITCHER TABS */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-3 py-2 text-xs font-bold border-t-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'received'
                ? 'bg-white border-t-emerald-600 text-slate-900 border-x border-slate-200 -mb-[1px] shadow-xs'
                : 'border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Submission & Payment Received</span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3 py-2 text-xs font-bold border-t-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'verified'
                ? 'bg-white border-t-pink-600 text-slate-900 border-x border-slate-200 -mb-[1px] shadow-xs'
                : 'border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-pink-600" />
            <span>2. Instagram Live Confirmation</span>
          </button>

          <button
            onClick={() => setActiveTab('drive_fix')}
            className={`px-3 py-2 text-xs font-bold border-t-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'drive_fix'
                ? 'bg-white border-t-amber-600 text-slate-900 border-x border-slate-200 -mb-[1px] shadow-xs'
                : 'border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Video: Public Link Request</span>
          </button>

          <button
            onClick={() => setActiveTab('resubmission_request')}
            className={`px-3 py-2 text-xs font-bold border-t-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'resubmission_request'
                ? 'bg-white border-t-rose-600 text-slate-900 border-x border-slate-200 -mb-[1px] shadow-xs'
                : 'border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-600" />
            <span>4. Re-upload Rejection Mail</span>
          </button>
        </div>

        {/* MODAL BODY: INBOX CLIENT SIMULATION */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* EMAIL METADATA BAR */}
          <div className="bg-white border border-slate-300 p-3 mb-4 text-xs space-y-1.5 text-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold w-16">Subject:</span>
              <span className="font-bold text-slate-900">
                {activeTab === 'received'
                  ? `Submission & Payment Received: ${eventTitle} [Pass: HIT-NAV-4821]`
                  : activeTab === 'verified'
                  ? `Payment Verified & Featured on Instagram: ${eventTitle} [Pass: HIT-NAV-4821]`
                  : activeTab === 'drive_fix'
                  ? `Action Required: Make Google Drive Video Link Public [Pass: HIT-NAV-4821]`
                  : `Action Required: Re-upload Your Submission [Pass: HIT-NAV-4821]`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold w-16">From:</span>
              <span className="text-slate-700 font-mono">HITian Inside &lt;event@hitianinside.in&gt;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold w-16">To:</span>
              <span className="text-slate-700 font-mono">Arjun Sen &lt;arjun.sen@hit.ac.in&gt;</span>
            </div>
          </div>

          {/* EMAIL CARD */}
          <div className="max-w-[600px] mx-auto bg-white border border-slate-300 shadow-md overflow-hidden text-slate-900">
            {/* NAVROOPAM / EVENT BANNER */}
            <div className="w-full bg-[#150408] border-b border-amber-900/30 overflow-hidden">
              <img
                src={bannerSrc}
                alt="Event Banner"
                className="w-full h-auto max-h-[220px] object-cover block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ik.imagekit.io/n6cw3mewa/navroopam_banner.png';
                }}
              />
            </div>

            {/* TEMPLATE 1: SUBMISSION & PAYMENT RECEIVED */}
            {activeTab === 'received' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                    Payment & Submission Received
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    We Have Received Your Submission & Payment
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Dear <strong>Arjun Sen</strong>, thank you for registering for <strong>{eventTitle}</strong>. We have successfully received your submission entry along with your registration payment details.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Participant Name:</span>
                    <span className="font-bold text-slate-900">Arjun Sen</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Registration Pass:</span>
                    <span className="font-mono font-bold text-slate-900">HIT-NAV-4821</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Selected Domain:</span>
                    <span className="font-bold text-slate-900">Creative Writing / Photography</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Transaction UTR:</span>
                    <span className="font-mono text-slate-700">429188201948</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Payment Status:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 border border-emerald-300">
                      PAYMENT RECEIVED
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-emerald-50/50 border border-emerald-200 p-4">
                  <p className="font-semibold text-slate-900">What Happens Next?</p>
                  <p>
                    Our organizing panel has received your entry and payment. Your submission is now queued for feature on our official Instagram handle.
                  </p>
                  <p>
                    Once your post goes live on Instagram, we will send you a follow-up confirmation email containing the direct link to your post!
                  </p>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-4 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <HelpCircle className="w-4 h-4 text-slate-600" />
                    <span>Have any questions or need to make corrections?</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    If you have any questions regarding your submission or payment status, feel free to email our coordination desk directly:
                  </p>
                  <p className="font-mono font-bold text-blue-700">
                    <a href="mailto:event@hitianinside.in" className="hover:underline">event@hitianinside.in</a>
                    {' '}&bull;{' '}
                    <a href="mailto:hitianinside@gmail.com" className="hover:underline">hitianinside@gmail.com</a>
                  </p>
                </div>

                <div className="text-center pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <p>HITian Inside &bull; Haldia Institute of Technology</p>
                  <p className="mt-0.5">Official Student Tabloid, Media & Socio-Cultural Club</p>
                </div>
              </div>
            )}

            {/* TEMPLATE 2: PAYMENT VERIFIED & INSTAGRAM POST CONFIRMATION */}
            {activeTab === 'verified' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <span className="inline-block px-2.5 py-1 bg-pink-50 text-pink-700 border border-pink-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                    You Are Live on Instagram
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Your Submission is Live on Instagram!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Dear <strong>Arjun Sen</strong>, congratulations! Your submission for <strong>{eventTitle}</strong> has been officially featured and published on the <strong>HITian Inside</strong> Instagram page.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Participant Name:</span>
                    <span className="font-bold text-slate-900">Arjun Sen</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Registration Pass:</span>
                    <span className="font-mono font-bold text-slate-900">HIT-NAV-4821</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Selected Domain & Theme:</span>
                    <span className="font-bold text-slate-900">Photography &bull; Traditional Festivities</span>
                  </div>
                </div>

                {/* INSTAGRAM POST FEATURE BOX */}
                <div className="bg-slate-900 text-white p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Your Official Instagram Feature Link</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Here is the direct link to your published entry on our official handle:
                  </p>
                  <a
                    href="https://www.instagram.com/p/DB123456789/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <span>Open Your Post on Instagram ↗</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="font-mono text-[11px] text-sky-400 break-all underline">
                    https://www.instagram.com/p/DB123456789/
                  </p>
                </div>

                {/* SHARE & WIN TIPS BOX */}
                <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 space-y-1.5 text-xs text-amber-950">
                  <p className="font-bold text-amber-900 text-sm">
                    Share with friends, grab likes & win exciting prizes!
                  </p>
                  <p className="leading-relaxed">
                    Public engagement, audience appreciation, and peer votes play a huge role in the contest! Share your post link on your Instagram Story, WhatsApp groups, and with your friends. The more love and likes your post gets, the higher your chances to stand out and take home the winning prize!
                  </p>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-4 text-xs text-slate-700 space-y-1.5">
                  <p className="font-semibold text-slate-900">Queries & Communication:</p>
                  <p className="text-[11px] text-slate-600">
                    For any questions regarding jury evaluation, guidelines, or results, please contact the organizing panel at:
                  </p>
                  <p className="font-mono text-xs font-bold text-slate-900">
                    event@hitianinside.in &bull; hitianinside@gmail.com
                  </p>
                </div>

                <div className="text-center pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <p>HITian Inside &bull; Haldia Institute of Technology</p>
                  <p className="mt-0.5">Official Student Tabloid, Media & Socio-Cultural Club</p>
                </div>
              </div>
            )}

            {/* TEMPLATE 3: REQUEST TO MAKE GOOGLE DRIVE LINK PUBLIC */}
            {activeTab === 'drive_fix' && (
              <div className="bg-[#170409] text-[#fdfbf7] p-6 sm:p-8 space-y-6">
                <div className="border-b border-[#e6c594]/30 pb-4">
                  <span className="inline-block px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider mb-2">
                    Action Required &bull; Video Submissions Only
                  </span>
                  <h3 className="text-xl font-black text-[#fdfbf7] tracking-tight uppercase">
                    Make Google Drive Video Link Public
                  </h3>
                  <p className="text-xs text-[#e6d7c3] mt-1.5 leading-relaxed">
                    Dear <strong>Arjun Sen</strong>, thank you for participating in <strong>{eventTitle}</strong> under the <strong>Puja Vlog</strong> domain (Registration Pass: <code className="text-[#e6c594] font-bold">HIT-NAV-4821</code>).
                  </p>
                </div>

                {/* ALERT BOX */}
                <div className="bg-rose-500/15 border-l-4 border-rose-500 p-4 space-y-1">
                  <div className="text-rose-300 font-bold text-xs uppercase tracking-wide">
                    Google Drive Link is Private / Restricted
                  </div>
                  <p className="text-xs text-rose-100/90 leading-relaxed">
                    Our judging panel attempted to view your submitted video entry, but the Google Drive access permission is currently set to <strong>&quot;Restricted&quot;</strong>. Because of this, judges cannot evaluate your submission.
                  </p>
                </div>

                {/* STEPS BOX */}
                <div className="bg-[#240710] border border-[#e6c594]/30 p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-black text-[#e6c594] uppercase tracking-wider">
                    Steps to Make Your Google Drive Link Public:
                  </h4>
                  <div className="space-y-2.5 text-xs text-[#fdfbf7]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span>Open your <strong>Google Drive</strong> and locate your uploaded video file.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span>Right-click on the video file (or tap the 3 dots on mobile) and select <strong>&quot;Share&quot; &rarr; &quot;Share&quot;</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                      <span>Under <strong>&quot;General access&quot;</strong>, click on <em>&quot;Restricted&quot;</em> and change it to <strong>&quot;Anyone with the link&quot;</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">4</span>
                      <span>Ensure the role on the right is set to <strong>&quot;Viewer&quot;</strong>, then click <strong>&quot;Copy link&quot;</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">5</span>
                      <span>Click the button below to paste and submit your updated, public video link.</span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="text-center py-2">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs uppercase tracking-wider border border-amber-300 shadow-md"
                  >
                    Click Here to Update Your Video Link &rarr;
                  </a>
                  <p className="text-[10px] text-amber-300 font-mono mt-2 underline">
                    https://hitianinside.in/submissions/update-drive-link?submissionId=...&token=...&utm_source=email_drive_update
                  </p>
                </div>

                {/* ONE-TIME POLICY WARNING */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-center text-xs text-amber-200/90 leading-relaxed">
                  <strong>One-Time Update Policy:</strong> For competition integrity, this secure link can only be used <strong>ONE TIME</strong>. Once submitted, the link will immediately expire. Please test your link in an incognito window before submitting!
                </div>

                <div className="text-center pt-2 border-t border-[#e6c594]/20 text-[11px] text-[#a69181]">
                  <p>HITian Inside &bull; Haldia Institute of Technology</p>
                  <p className="mt-0.5">Contact: event@hitianinside.in</p>
                </div>
              </div>
            )}

            {/* TEMPLATE 4: RE-UPLOAD REJECTION MAIL (PHOTO, ARTWORK, WRITING) */}
            {activeTab === 'resubmission_request' && (
              <div className="bg-[#170409] text-[#fdfbf7] p-6 sm:p-8 space-y-6">
                <div className="border-b border-[#e6c594]/30 pb-4">
                  <span className="inline-block px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold uppercase tracking-wider mb-2">
                    Action Required &bull; Submission Re-upload
                  </span>
                  <h3 className="text-xl font-black text-[#fdfbf7] tracking-tight uppercase">
                    Action Required: Re-upload Your Submission
                  </h3>
                  <p className="text-xs text-[#e6d7c3] mt-1.5 leading-relaxed">
                    Dear <strong>Arjun Sen</strong>, thank you for participating in <strong>{eventTitle}</strong> under the <strong>Photography</strong> domain (Registration Pass: <code className="text-[#e6c594] font-bold">HIT-NAV-4821</code>).
                  </p>
                </div>

                {/* REJECTION REASON BOX */}
                <div className="bg-rose-500/15 border-l-4 border-rose-500 p-4 space-y-1">
                  <div className="text-rose-300 font-bold text-xs uppercase tracking-wide">
                    Reason Why Your Submission Was Rejected:
                  </div>
                  <p className="text-sm font-bold text-rose-100 leading-snug pt-1">
                    &ldquo;Against the rule you cannot upload collage&rdquo;
                  </p>
                </div>

                {/* GUIDELINES BOX */}
                <div className="bg-[#240710] border border-[#e6c594]/30 p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-black text-[#e6c594] uppercase tracking-wider">
                    Important Re-upload Guidelines:
                  </h4>
                  <div className="space-y-2.5 text-xs text-[#fdfbf7]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span><strong>Photo Not Uploaded:</strong> Ensure you upload a clear, high-resolution original photograph or artwork image.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span><strong>No Collages Allowed:</strong> Against competition rules, you cannot upload collages or multi-photo grids. Only single original submissions are accepted.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                      <span><strong>Avoid File Position Swaps:</strong> Ensure you are uploading your actual entry photo/file, NOT your UPI payment screenshot proof.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020] border border-[#e6c594] text-[#e6c594] font-black text-[10px] flex items-center justify-center shrink-0">4</span>
                      <span>Supported file formats include JPEG, PNG, WEBP, and PDF documents.</span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="text-center py-2">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs uppercase tracking-wider border border-amber-300 shadow-md"
                  >
                    Click Here to Re-upload Your Submission &rarr;
                  </a>
                  <p className="text-[10px] text-amber-300 font-mono mt-2 underline">
                    https://hitianinside.in/submissions/reupload?submissionId=...&token=...&utm_source=email_resubmission
                  </p>
                </div>

                {/* ONE-TIME POLICY WARNING */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-center text-xs text-amber-200/90 leading-relaxed">
                  <strong>One-Time Re-upload Policy:</strong> For competition integrity, this secure link can only be used <strong>ONE TIME</strong>. Once submitted, your replacement entry will be permanently locked and sent straight to our judges for final review.
                </div>

                <div className="text-center pt-2 border-t border-[#e6c594]/20 text-[11px] text-[#a69181]">
                  <p>HITian Inside &bull; Haldia Institute of Technology</p>
                  <p className="mt-0.5">Contact: event@hitianinside.in</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Preview mode &bull; Templates format automatically using the participant details and official event banner.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
