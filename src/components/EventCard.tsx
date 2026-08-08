'use client';

import Link from 'next/link';
import { EventItem } from '../types/event.types';
import { Calendar, MapPin, Globe, QrCode, UploadCloud, ArrowRight, Flag } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
}

export default function EventCard({ event }: EventCardProps) {
  const { id, _id, title, description, date, organizer, status, mode, theme, isFlagship, bannerUrl, coverUrl, hasAttendance } = event;
  const eventId = id || _id;

  const isTricolour = isFlagship || theme === 'TRICOLOUR' || title.toLowerCase().includes('swaraj');
  const cardImage = coverUrl || bannerUrl;

  return (
    <div className={`glass-card flex flex-col justify-between h-full group relative overflow-hidden transition-all ${
      isTricolour 
        ? 'border-2 border-[#ff9933]/50 hover:border-[#138808]/80 shadow-lg shadow-[#ff9933]/10' 
        : 'border border-[#f7f1e5]/10 hover:border-[#e6c594]/50'
    }`}>
      {/* 4:3 Aspect Ratio Card Cover Image */}
      {cardImage ? (
        <div className="relative w-full aspect-[4/3] overflow-hidden border-b border-white/10">
          <img 
            src={cardImage} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b060c] via-transparent to-transparent opacity-80" />
        </div>
      ) : (
        <div className={`absolute -right-12 -top-12 w-28 h-28 rounded-full blur-xl transition-all ${
          isTricolour ? 'bg-[#ff9933]/30 group-hover:bg-[#138808]/40' : 'bg-[#800020]/20 group-hover:bg-[#800020]/40'
        }`} />
      )}

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border truncate ${
              isTricolour 
                ? 'bg-gradient-to-r from-[#ff9933]/20 via-white/10 to-[#138808]/20 text-[#ff9933] border-[#ff9933]/40' 
                : 'bg-[#800020]/25 text-[#e6c594] border-[#e6c594]/30'
            }`}>
              {organizer || 'HITian Inside'}
            </span>
            
            <span className="text-xs text-[#e6d7c3]/80 flex items-center gap-1 shrink-0 font-medium">
              <Calendar className={`w-3.5 h-3.5 ${isTricolour ? 'text-[#ff9933]' : 'text-[#e6c594]'}`} />
              {date}
            </span>
          </div>

          {/* Flagship Trademark Banner */}
          {isTricolour && (
            <div className="mb-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff9933]/25 via-white/10 to-[#138808]/25 border border-[#ff9933]/40 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-[#ff9933] shrink-0" />
              <span className="text-[10px] font-black tracking-wider uppercase text-white font-mono">
                🇮🇳 FLAGSHIP EVENT
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {/* Status Badge */}
            {status === 'LIVE' ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE NOW
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                Registration Open
              </span>
            )}

            {/* Mode Badge (OFFLINE / ONLINE) */}
            {mode === 'ONLINE' ? (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold inline-flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                ONLINE
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-purple-300" />
                IN-PERSON VENUE
              </span>
            )}

            {hasAttendance && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold inline-flex items-center gap-1">
                <QrCode className="w-3 h-3" />
                QR Pass
              </span>
            )}
          </div>

          <h3 className={`text-lg font-bold mb-2 transition-colors line-clamp-1 ${
            isTricolour ? 'text-white group-hover:text-[#ff9933]' : 'text-[#fdfbf7] group-hover:text-[#e6c594]'
          }`}>
            {title}
          </h3>

          <p className="text-[#e6d7c3]/80 text-sm mb-4 line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Full Width Registration Action Button */}
        <div className="pt-4 border-t border-[#f7f1e5]/10 mt-auto">
          <Link 
            href={`/events/${eventId}`}
            className={
              isTricolour 
                ? 'btn-tricolour w-full justify-center text-center text-xs py-2.5 px-4 font-bold shadow-lg' 
                : 'w-full justify-center text-center py-2.5 px-4 text-xs font-bold text-[#150408] bg-[#e6c594] hover:bg-[#f7f1e5] rounded-xl transition-all shadow-md shadow-[#e6c594]/20 inline-flex items-center gap-1.5'
            }
          >
            <span>{isTricolour ? 'Register for Swaraj-E-Hind' : 'View Details & Rules'}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
