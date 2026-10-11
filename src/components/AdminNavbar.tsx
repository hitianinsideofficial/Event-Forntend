'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Plus, 
  Mail, 
  LogOut, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface AdminNavbarProps {
  onLogout?: () => void;
}

export default function AdminNavbar({ onLogout }: AdminNavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { href: '/admin/events/create', label: 'Create Event', icon: Plus },
    { href: '/admin/send-appreciation-email', label: 'Certificates & Emails', icon: Mail },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('adminToken');
        window.location.href = '/admin';
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title with 0 rounded corners */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-slate-900 border border-slate-900 flex items-center justify-center p-1 shadow-sm">
                <Image 
                  src="/hitianinsidelogo.png" 
                  alt="HITian Inside"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
                    HITian Inside
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  Event Operations & Verification Console
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-2 border transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-white text-slate-600 border-transparent hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center gap-1 py-2 border-t border-slate-100 overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 shrink-0 border ${
                  isActive 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
