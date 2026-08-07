'use client';

import Link from 'next/link';

export default function EventCard({ event }) {
  const { id, title, description, date, location, organizer, hasAttendance, requireFileUpload } = event;

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'TBD';

  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full group border border-[#f7f1e5]/10 hover:border-[#e6c594]/50 relative overflow-hidden">
      {/* Decorative maroon glowing orb */}
      <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#800020]/20 rounded-full blur-xl group-hover:bg-[#800020]/40 transition-all" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#800020]/25 text-[#e6c594] border border-[#e6c594]/30 truncate">
            {organizer || 'HITian Inside'}
          </span>
          <span className="text-xs text-[#e6d7c3]/80 flex items-center gap-1 shrink-0 font-medium">
            📅 {formattedDate}
          </span>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hasAttendance !== false && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              📱 QR Check-in
            </span>
          )}
          {requireFileUpload && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30 font-semibold">
              📁 File Submission
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#fdfbf7] mb-2 group-hover:text-[#e6c594] transition-colors line-clamp-1">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[#e6d7c3]/80 text-sm mb-4 line-clamp-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-[#f7f1e5]/10 flex items-center justify-between mt-auto">
        <span className="text-xs text-[#a69181] flex items-center gap-1.5 truncate max-w-[55%] font-medium">
          📍 {location || 'Main Campus'}
        </span>
        <Link 
          href={`/events/${id}`}
          className="px-3.5 py-1.5 text-xs font-bold text-[#150408] bg-[#e6c594] hover:bg-[#f7f1e5] rounded-lg transition-all shadow-md shadow-[#e6c594]/20 flex items-center gap-1"
        >
          Register & Details &rarr;
        </Link>
      </div>
    </div>
  );
}
