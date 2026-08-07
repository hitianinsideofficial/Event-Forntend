'use client';

import Link from 'next/link';
import Image from 'next/image';
import BackendStatus from './BackendStatus';

export default function Navbar({ onOpenVerifyModal }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#f7f1e5]/10 bg-[#150408]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center p-1 rounded-xl bg-[#2a0c14] border border-[#e6c594]/25 shadow-md shadow-[#800020]/40 group-hover:scale-105 transition-transform">
            <Image 
              src="/hitianinsidelogo.png" 
              alt="HITian Inside Logo" 
              width={48} 
              height={48}
              className="h-10 w-auto object-contain rounded-lg"
              priority
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#fdfbf7] group-hover:text-[#e6c594] transition-colors">
              HITian <span className="gradient-text">Inside</span>
            </span>
            <span className="hidden sm:block text-xs text-[#e6d7c3]/70 font-medium">Event Hub & Certificate Verification</span>
          </div>
        </Link>

        {/* Center/Right Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          <BackendStatus />

          {onOpenVerifyModal && (
            <button 
              onClick={onOpenVerifyModal}
              className="btn-secondary text-xs sm:text-sm shadow-[#e6c594]/20 inline-flex items-center gap-1.5"
            >
              📜 Verify Certificate
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
