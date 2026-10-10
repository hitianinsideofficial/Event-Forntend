'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';


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
              Haldia Institute of Technology • Event Portal
            </span>
          </div>
        </Link>

      </div>
    </header>
  );
}
