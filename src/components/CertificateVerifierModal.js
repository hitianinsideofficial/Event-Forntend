'use client';

import { useState } from 'react';
import { verifyCertificateApi } from '../services/api';

export default function CertificateVerifierModal({ isOpen, onClose }) {
  const [certInput, setCertInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setCertData(null);

    if (!certInput.trim()) {
      setError('Please enter a Certificate ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCertificateApi(certInput.trim());
      if (res.verified) {
        setCertData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Certificate record not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative max-w-lg border border-[#e6c594]/30" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#e6d7c3] hover:text-white text-lg w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📜</span>
          <h2 className="text-xl font-bold text-[#fdfbf7]">Verify Certificate</h2>
        </div>
        <p className="text-xs text-[#a69181] mb-6">
          Enter Certificate ID (e.g., <span className="font-mono text-[#e6c594]">CERT-HIT-2026-X891</span>) to verify official authenticity.
        </p>

        <form onSubmit={handleVerify} className="space-y-4 mb-6">
          <div className="flex gap-2">
            <input 
              type="text"
              value={certInput}
              onChange={e => setCertInput(e.target.value)}
              placeholder="Enter Certificate ID (e.g., CERT-HIT-2026-XXXX)..."
              className="form-input font-mono uppercase text-sm"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary text-xs shrink-0"
            >
              {loading ? 'Verifying...' : 'Verify ✓'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {certData && (
          <div className="p-6 rounded-2xl bg-[#180509] border-2 border-emerald-500/40 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                ✓ VERIFIED AUTHENTIC
              </span>
              <span className="text-[10px] font-mono text-[#a69181]">{certData.certificateId}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#a69181]">Recipient Name:</span>
                <span className="font-bold text-[#fdfbf7] text-sm">{certData.participantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a69181]">Event Name:</span>
                <span className="font-semibold text-[#e6c594]">{certData.eventTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a69181]">Certificate Type:</span>
                <span className="font-medium text-amber-200">{certData.certificateType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a69181]">Date Issued:</span>
                <span className="font-mono text-[#e6d7c3]">{certData.issueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a69181]">Issuer Authority:</span>
                <span className="font-semibold text-white">{certData.issuer}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
