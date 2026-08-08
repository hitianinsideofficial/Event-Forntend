'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { fetchEventById } from '../../../services/api.service';
import { EventItem } from '../../../types/event.types';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Sparkles, 
  CheckCircle, 
  QrCode, 
  UploadCloud, 
  Globe,
  Award,
  ArrowRight,
  Flag
} from 'lucide-react';

export default function DedicatedEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!eventId) return;

    const loadEventDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err) {
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    loadEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Event Not Found</h2>
          <p className="text-xs text-[#a69181] mb-6">The requested event could not be found or has been removed.</p>
          <Link href="/" className="btn-secondary text-sm inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Events Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isTricolour = event.isFlagship || event.theme === 'TRICOLOUR' || event.title.toLowerCase().includes('swaraj');

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Events</span>
        </Link>

        {/* 16:9 Header Banner or Tricolour Header Box */}
        {event.bannerUrl ? (
          <div className="relative w-full aspect-[16/9] max-h-80 rounded-2xl overflow-hidden border border-white/10 mb-8 shadow-2xl">
            <img 
              src={event.bannerUrl} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#150408] via-transparent to-transparent opacity-90" />
          </div>
        ) : isTricolour ? (
          <div className="relative w-full p-8 rounded-2xl bg-gradient-to-r from-[#ff9933]/20 via-[#ffffff]/5 to-[#138808]/20 border-2 border-[#ff9933]/40 mb-8 text-center shadow-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff9933]/20 border border-[#ff9933]/50 text-[#ff9933] text-xs font-black uppercase tracking-wider mb-3">
              <Flag className="w-4 h-4 text-[#ff9933]" />
              <span>🇮🇳 FLAGSHIP INDEPENDENCE DAY EVENT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tricolour-gradient-text">
              {event.title}
            </h1>
          </div>
        ) : null}

        {/* Event Main Title & Sticky Register Top Button Bar */}
        <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-0.5 text-[10px] font-bold rounded-full bg-[#800020]/30 text-[#e6c594] border border-[#e6c594]/30 uppercase tracking-wider">
                  {event.organizer || 'HITian Inside'}
                </span>



                {event.status === 'LIVE' ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE NOW
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                    Registration Open
                  </span>
                )}
              </div>

              <h1 className={`text-2xl sm:text-3xl font-extrabold ${isTricolour ? 'tricolour-gradient-text' : 'text-white'}`}>
                {event.title}
              </h1>
            </div>

            {/* Prominent Top Register Button */}
            <Link 
              href={`/events/${eventId}/register`}
              className={isTricolour ? 'btn-tricolour text-sm py-2.5 px-6 shadow-xl shrink-0' : 'btn-primary text-sm py-2.5 px-6 shrink-0 inline-flex items-center gap-2'}
            >
              <span>Register Now for Event</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Key Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="bg-[#180509] p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${isTricolour ? 'bg-[#ff9933]/20 text-[#ff9933]' : 'bg-[#800020]/30 text-[#e6c594]'}`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">Date & Timing</span>
                <span className="text-xs font-bold text-white">{event.date}</span>
              </div>
            </div>

            <div className="bg-[#180509] p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                {event.mode === 'ONLINE' ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">Mode & Venue</span>
                <span className="text-xs font-bold text-white">{event.location || (event.mode === 'ONLINE' ? 'Online Event' : 'Main Campus')}</span>
              </div>
            </div>

            <div className="bg-[#180509] p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-300">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">Organizer</span>
                <span className="text-xs font-bold text-white">{event.organizer || 'HITian Inside'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description & Rules */}
        <section className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10 mb-8 space-y-4">
          <h2 className="text-lg font-bold text-[#e6c594] border-b border-white/10 pb-2">
            Event Overview & Description
          </h2>
          <p className="text-sm text-[#e6d7c3]/90 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </section>

        {/* Custom Event Highlights */}
        {event.highlights && event.highlights.length > 0 && (
          <section className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10 mb-8">
            <h2 className="text-lg font-bold text-[#e6c594] border-b border-white/10 pb-4 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e6c594]" />
              <span>Event Highlights & Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.highlights.map((item, idx) => (
                <div key={idx} className="bg-[#180509] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#800020]/25 text-[#e6c594] shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-[#e6c594]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-[#a69181] mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Registration Call to Action */}
        <div className={`glass-panel p-8 text-center border-2 ${isTricolour ? 'border-[#ff9933]/50' : 'border-[#e6c594]/30'}`}>
          <h2 className="text-xl font-bold text-white mb-2">Ready to Participate?</h2>
          <p className="text-xs text-[#a69181] mb-6 max-w-md mx-auto">
            Complete the official registration form to reserve your spot and receive your verified pass.
          </p>

          <Link 
            href={`/events/${eventId}/register`}
            className={isTricolour ? 'btn-tricolour text-sm py-3 px-8' : 'btn-primary text-sm py-3 px-8 inline-flex items-center gap-2'}
          >
            <span>Fill Registration Form →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
