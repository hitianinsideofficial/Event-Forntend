'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenVerifyModal?: () => void;
}

export default function Navbar({ onOpenVerifyModal }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#150408]/90 border-b border-[#f7f1e5]/10">
      <div className="container-custom flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-[#800020]/20 border border-[#e6c594]/30 flex items-center justify-center p-1 sm:p-1.5 transition-transform group-hover:scale-105 shadow-md">
            <Image 
              src="/hitianinsidelogo.png" 
              alt="HITian Inside Official Logo"
              width={40}
              height={40}
              className="object-contain w-8 h-8 sm:w-10 sm:h-10"
              priority
            />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-xl text-[#fdfbf7] tracking-tight group-hover:text-[#e6c594] transition-colors leading-tight">
              HITian Inside
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-[#a69181] tracking-wider uppercase truncate max-w-[170px] sm:max-w-none">
              Event Hub & Verification
            </span>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a 
            href="https://www.hitianinside.in/" 
            target="_blank" 
            rel="noreferrer"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#800020]/30 hover:bg-[#800020] text-[#e6c594] hover:text-white border border-[#e6c594]/30 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 sm:gap-1.5 transition-all shadow-md shrink-0"
          >
            <span>Visit Main Website</span>
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>

          {onOpenVerifyModal && (
            <button 
              onClick={onOpenVerifyModal}
              className="btn-secondary text-[11px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-4 inline-flex items-center gap-1 sm:gap-1.5 shrink-0"
            >
              <Award className="w-3.5 h-3.5 text-[#e6c594]" />
              <span className="hidden xs:inline sm:inline">Verify Certificate</span>
              <span className="xs:hidden sm:hidden">Verify</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
