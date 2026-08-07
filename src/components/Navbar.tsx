'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BackendStatus from './BackendStatus';
import { Award } from 'lucide-react';

interface NavbarProps {
  onOpenVerifyModal?: () => void;
}

export default function Navbar({ onOpenVerifyModal }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#150408]/85 border-b border-[#f7f1e5]/10">
      <div className="container-custom flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#800020]/20 border border-[#e6c594]/30 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 shadow-md">
            <Image 
              src="/hitianinsidelogo.png" 
              alt="HITian Inside Official Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl text-[#fdfbf7] tracking-tight group-hover:text-[#e6c594] transition-colors">
              HITian Inside
            </span>
            <span className="text-[10px] font-medium text-[#a69181] tracking-wider uppercase">
              Event Hub & Certificate Verification
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <BackendStatus />

          {onOpenVerifyModal && (
            <button 
              onClick={onOpenVerifyModal}
              className="btn-secondary text-xs hidden sm:inline-flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-[#e6c594]" />
              <span>Verify Certificate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
