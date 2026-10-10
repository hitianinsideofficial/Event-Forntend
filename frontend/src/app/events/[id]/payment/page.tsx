'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import { fetchEventById } from '../../../../services/api.service';
import { EventItem } from '../../../../types/event.types';
import { 
  ArrowLeft, 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles,
  QrCode,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react';

export default function DedicatedPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [transactionUid, setTransactionUid] = useState('');

  const upiId = 'srijitab.2005@oksbi';
  const payeeName = 'Srijita Bandyopadhyay';
  const amount = '9.00';

  useEffect(() => {
    if (!eventId) return;
    fetchEventById(eventId)
      .then(data => setEvent(data))
      .catch(() => {});
  }, [eventId]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNavroopam = eventId?.toLowerCase().includes('nav') || eventId?.toLowerCase().includes('swaraj');
  const eventTitle = event ? event.title : isNavroopam ? 'NAVROOPAM v7.0' : 'Event Registration';

  return (
    <div className="min-h-screen bg-[#0d0205] text-white flex flex-col font-sans selection:bg-[#ff9933] selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Top Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/events/${eventId}/register`} 
            className="inline-flex items-center gap-2 text-xs font-bold text-[#e6c594] hover:text-[#ff9933] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {eventTitle} Registration Portal</span>
          </Link>
        </div>

        {/* Main Glass Panel (Matching Event Details & Registration Domain Page styling) */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border-2 border-[#ff9933]/40 bg-[#140407]/90 shadow-2xl backdrop-blur-xl space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#ff9933]/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#ff9933]" />
                <h1 className="text-xl sm:text-2xl font-black text-[#ff9933] uppercase tracking-wider font-mono">
                  Official Registration Payment (PhonePe UPI)
                </h1>
              </div>
              <p className="text-xs text-[#a69181]">
                Verified UPI Payment Gateway for {eventTitle}
              </p>
            </div>

            <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 shrink-0 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Payment Gateway
            </span>
          </div>

          {/* Registration Fees Text without container boundaries */}
          <div className="space-y-0.5 pt-1">
            <h2 className="text-xs sm:text-sm font-black text-[#ff9933] uppercase tracking-wider font-mono flex items-center gap-2">
              <span>REGISTRATION FEES</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#e6d7c3] leading-relaxed">
              The registration fee is <strong className="text-[#ff9933] font-bold">Rs. 9/- per submission</strong>. A minimal fee of Rs. 9/- has been set to celebrate the nine special days of Durga Puja.
            </p>
          </div>

          {/* QR Code Scanner Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left Box: UPI Scanner Image */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-5 bg-black/60 rounded-3xl border border-[#ff9933]/20 shadow-inner space-y-3">
              <div className="relative p-3.5 bg-white rounded-3xl shadow-2xl border-4 border-[#ff9933]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(eventTitle + ' Registration Fee')}`)}`} 
                  alt="Auto ₹9 UPI QR Code - Scan to Pay ₹9" 
                  className="w-full max-w-[280px] sm:max-w-[320px] h-auto rounded-xl object-contain"
                />
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-3xl pointer-events-none animate-pulse"></div>
              </div>
              
              <div className="text-center space-y-1">
                <span className="text-xs sm:text-sm text-[#e6c594] font-bold block font-mono tracking-wide">
                  Payee: {payeeName}
                </span>
                <span className="inline-block px-3 py-1 rounded-full bg-[#ff9933]/20 text-[#ff9933] text-xs font-black border border-[#ff9933]/40 font-mono">
                  Auto-Prefilled Amount: ₹9.00 INR
                </span>
              </div>
            </div>

            {/* Right Box: Pay Button & UTR Info */}
            <div className="md:col-span-6 space-y-4">
              
              <div className="p-4 rounded-2xl bg-[#ff9933]/10 border border-[#ff9933]/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff9933]" />
                  <span className="text-xs font-bold text-[#ff9933]">Instant ₹9 Auto-Pay QR</span>
                </div>
                <p className="text-xs text-[#e6d7c3] leading-relaxed">
                  When you scan this QR code with PhonePe, Google Pay, Paytm, or any UPI App, <strong className="text-[#ff9933] font-bold">₹9.00</strong> will be automatically entered as the exact payment amount!
                </p>
              </div>

              {/* Direct UPI Mobile Link */}
              <a 
                href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(eventTitle + ' Registration Fee')}`}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff9933] via-amber-600 to-[#d97706] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all font-mono uppercase tracking-wider border border-amber-400/50"
              >
                <CreditCard className="w-4 h-4 text-black" />
                <span>Pay ₹9.00 Directly via UPI App</span>
              </a>

              {/* Copy VPA Box */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-[#a69181] block uppercase tracking-wider font-mono">
                  Direct UPI VPA ID
                </span>
                <div className="flex items-center justify-between gap-2 bg-black/60 p-2 rounded-lg border border-white/10">
                  <span className="text-xs font-mono font-bold text-[#ff9933] px-1">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 rounded bg-[#ff9933]/20 hover:bg-[#ff9933]/30 text-[#ff9933] text-[11px] font-bold flex items-center gap-1 transition-colors border border-[#ff9933]/30"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction UTR / Txn UID Field */}
              <div className="form-group mb-0">
                <label className="form-label text-xs font-semibold text-white flex items-center justify-between mb-1">
                  <span>Transaction UTR / Txn UID (Optional)</span>
                  <span className="text-[10px] text-[#a69181]">12-digit UPI reference</span>
                </label>
                <input 
                  type="text" 
                  value={transactionUid}
                  onChange={e => setTransactionUid(e.target.value)}
                  placeholder="Enter 12-digit UTR/Txn ID after payment..."
                  className="form-input text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions Notice after Scanner Grid */}
          <div className="pt-1 space-y-0.5">
            <h6 className="text-[11px] font-black text-[#ff9933] uppercase tracking-wider font-mono">
              TERMS &amp; CONDITIONS
            </h6>
            <p className="text-xs text-[#e6d7c3] leading-relaxed">
              Registration fees are strictly non-refundable, so please be certain before proceeding with your registration.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
