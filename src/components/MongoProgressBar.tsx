'use client';

import React, { useEffect, useState } from 'react';
import { Database, Sparkles, Loader2 } from 'lucide-react';

interface MongoProgressBarProps {
  message?: string;
  subMessage?: string;
  theme?: 'dark' | 'light' | 'gold';
  estimatedSeconds?: number;
  asModal?: boolean; // When true or default, shows fixed in center with blurred backdrop
}

export default function MongoProgressBar({
  message = 'Loading data from MongoDB...',
  subMessage = 'Connecting to database cluster & fetching records',
  theme = 'light',
  estimatedSeconds = 4.5,
  asModal = true
}: MongoProgressBarProps) {
  const [progress, setProgress] = useState<number>(10);
  const [remainingSec, setRemainingSec] = useState<number>(Math.ceil(estimatedSeconds));

  useEffect(() => {
    const startTime = Date.now();
    const durationMs = estimatedSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = elapsed / durationMs;

      // Realistic easing curve
      let calculatedProgress: number;
      if (fraction < 0.3) {
        calculatedProgress = 10 + (fraction / 0.3) * 35; // 10% to 45%
      } else if (fraction < 0.7) {
        calculatedProgress = 45 + ((fraction - 0.3) / 0.4) * 35; // 45% to 80%
      } else if (fraction < 1.0) {
        calculatedProgress = 80 + ((fraction - 0.7) / 0.3) * 15; // 80% to 95%
      } else {
        // Asymptotically approach 98%
        const extraFraction = (elapsed - durationMs) / 5000;
        calculatedProgress = Math.min(98, 95 + extraFraction * 3);
      }

      const left = Math.max(1, Math.ceil(estimatedSeconds - elapsed / 1000));
      setRemainingSec(left);
      setProgress(Math.min(98, Math.round(calculatedProgress)));
    }, 100);

    return () => clearInterval(interval);
  }, [estimatedSeconds]);

  const isGold = theme === 'gold';
  const isDark = theme === 'dark';

  const cardContent = (
    <div className={`w-full max-w-md mx-auto p-6 border shadow-2xl relative transition-all ${
      isGold 
        ? 'bg-[#18050a]/95 border-[#e6c594]/40 text-[#fdfbf7]' 
        : isDark
        ? 'bg-slate-900/95 border-slate-700 text-white'
        : 'bg-white/95 border-slate-300 text-slate-800'
    }`}>
      {/* Top row: DB Icon, Label, Percentage */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${
            isGold 
              ? 'bg-[#800020]/50 text-[#e6c594] border border-[#e6c594]/30' 
              : isDark 
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' 
              : 'bg-slate-100 text-emerald-700 border border-slate-200'
          }`}>
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black uppercase tracking-wider">
              {message}
            </h4>
            <span className={`text-[11px] block mt-0.5 ${
              isGold ? 'text-[#a69181]' : 'text-slate-500'
            }`}>
              MongoDB Cloud Cluster Sync
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-base font-mono font-black ${
            isGold ? 'text-[#e6c594]' : isDark ? 'text-emerald-400' : 'text-slate-900'
          }`}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className={`w-full h-3 overflow-hidden relative ${
        isGold ? 'bg-[#2b0812]' : isDark ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200'
      }`}>
        <div 
          className={`h-full transition-all duration-150 ease-out relative ${
            isGold 
              ? 'bg-gradient-to-r from-[#b38743] via-[#e6c594] to-[#fcead0]' 
              : isDark
              ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400'
              : 'bg-gradient-to-r from-slate-900 via-indigo-600 to-emerald-600'
          }`}
          style={{ width: `${progress}%` }}
        >
          {/* Animated light pulse highlight */}
          <div className="absolute inset-0 bg-white/30 animate-[pulse_1.2s_infinite]" />
        </div>
      </div>

      {/* Footer Info: Estimated wait & status message */}
      <div className="flex items-center justify-between mt-3.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-left truncate max-w-[260px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-slate-400" />
          <span className={`${isGold ? 'text-[#a69181]' : 'text-slate-500'} truncate`}>
            {subMessage}
          </span>
        </div>
        <div className={`font-bold shrink-0 flex items-center gap-1 px-2 py-0.5 ${
          isGold 
            ? 'bg-[#800020]/40 text-[#e6c594] border border-[#e6c594]/20' 
            : isDark 
            ? 'bg-slate-800 text-slate-300 border border-slate-700' 
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          <Sparkles className="w-3 h-3 opacity-70" />
          <span>~{remainingSec}s wait</span>
        </div>
      </div>
    </div>
  );

  if (!asModal) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all animate-fadeIn">
      {cardContent}
    </div>
  );
}
