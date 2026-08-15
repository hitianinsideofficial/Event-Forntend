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
  Flag,
  Phone,
  Mic,
  Palette,
  Users
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

  const isPratidhwani = Boolean(
    eventId === 'pratidhawni' || 
    eventId === 'pratidhwani' || 
    event.id === 'pratidhawni' || 
    event.id === 'pratidhwani' || 
    event.title?.toLowerCase()?.includes('pratid')
  );

  const isTricolour = (event.isFlagship || event.theme === 'TRICOLOUR' || event.title.toLowerCase().includes('swaraj')) && !isPratidhwani;

  const SWARAJ_HIGHLIGHTS = [
    { 
      title: 'Art Beyond Boundaries', 
      description: 'Photography • Digital Art\nExplore India through creativity, colour, and perspective.' 
    },
    { 
      title: 'Stories That Move', 
      description: 'Reel Making\nTurn stories of freedom and India into powerful visual narratives.' 
    },
    { 
      title: 'Words That Speak', 
      description: 'Creative Writing\nGive your thoughts a voice through stories, reflections, and imagination.' 
    }
  ];

  const hasOldHighlights = event.highlights?.some(h => 
    h.title?.includes('Grand Stage') || 
    h.title?.includes('Poetry') || 
    h.title?.includes('Digital Arts') ||
    h.title?.startsWith('1.') ||
    h.title?.startsWith('2.')
  );

  const displayHighlights = (isTricolour || hasOldHighlights)
    ? SWARAJ_HIGHLIGHTS
    : (event.highlights || []);

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

        {/* 16:9 Header Banner or Flagship Header Box */}
        {event.bannerUrl ? (
          <div className="relative w-full aspect-[16/9] max-h-80 rounded-2xl overflow-hidden border border-white/10 mb-8 shadow-2xl">
            <img 
              src={event.bannerUrl} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#150408] via-transparent to-transparent opacity-90" />
          </div>
        ) : isPratidhwani ? (
          <div className="relative w-full p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#800020]/40 via-[#2a0810] to-[#c41e3a]/40 border-2 border-[#ff9933] mb-8 text-center shadow-2xl overflow-hidden">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff9933]/20 border border-[#ff9933]/50 text-[#ff9933] text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-[#ff9933]" />
              <span>🇮🇳 HITian inside • A unit of the Tabloid, Media and Literary Club</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#ff9933] drop-shadow-lg">
              PRATIDHWANI
            </h1>
            <p className="text-xs sm:text-sm text-[#e6c594] font-extrabold tracking-widest uppercase mt-1 font-mono">
              ONE LINER ... ONE LINER..
            </p>
            <div className="mt-4 inline-flex items-center gap-3 bg-[#ff9933]/15 px-4 py-1.5 rounded-full border border-[#ff9933]/30">
              <span className="text-xs font-bold text-white">ENTRY FEE:</span>
              <span className="text-sm font-black text-amber-300 font-mono">RS. 50/- ONLY</span>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
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

            <div className="bg-[#180509] p-4 rounded-xl border border-[#ff9933]/30 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[#ff9933]/20 text-[#ff9933] shrink-0 mt-0.5">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">Event Queries Contact</span>
                <div className="text-xs font-bold text-white space-y-0.5 mt-0.5">
                  <a href="tel:9836018190" className="hover:text-[#ff9933] transition-colors block">Srijita: 98360 18190</a>
                  <a href="tel:9135444297" className="hover:text-[#ff9933] transition-colors block">Ayush: 91354 44297</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pratidhwani Flagship 3 Event Categories Grid */}
        {isPratidhwani && (
          <section className="glass-panel p-6 sm:p-8 border-2 border-[#ff9933]/50 mb-8 space-y-6 bg-[#1b060c] shadow-2xl">
            <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-[#ff9933] uppercase tracking-wider font-mono">
                  Pratidhwani Competition Categories
                </h2>
                <p className="text-xs text-[#a69181] mt-0.5">Select 1 event option during registration (Entry Fee: RS. 50/- ONLY)</p>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-black shadow-md">
                RS. 50/- ENTRY FEE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category 1: OPEN MIC */}
              <div className="bg-[#180509] p-5 rounded-2xl border border-white/10 space-y-2 hover:border-[#ff9933]/60 transition-all shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-[#ff9933]/20 border border-[#ff9933]/40 text-[#ff9933] flex items-center justify-center mb-2">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">OPEN MIC</h3>
                <p className="text-[11px] font-bold text-[#ff9933] font-mono">Poetry • Music • Stand-up • Stories</p>
                <p className="text-xs text-[#a69181] leading-relaxed pt-1">
                  Share your voice live on stage! Express your thoughts, perform original music, poetry, or stand-up comedy in front of a live campus audience.
                </p>
              </div>

              {/* Category 2: YOUTH PARLIAMENT */}
              <div className="bg-[#180509] p-5 rounded-2xl border border-white/10 space-y-2 hover:border-[#ff9933]/60 transition-all shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">YOUTH PARLIAMENT</h3>
                <p className="text-[11px] font-bold text-purple-300 font-mono">Debate • Policy • Parliamentary Discussion</p>
                <p className="text-xs text-[#a69181] leading-relaxed pt-1">
                  Engage in constructive parliamentary debate! Discuss youth policies, speak on national topics, and represent young leaders of tomorrow.
                </p>
              </div>

              {/* Category 3: LIVE ART */}
              <div className="bg-[#180509] p-5 rounded-2xl border border-white/10 space-y-2 hover:border-[#ff9933]/60 transition-all shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mb-2">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">LIVE ART</h3>
                <p className="text-[11px] font-bold text-cyan-300 font-mono">Painting • Sketching • Poster Art</p>
                <p className="text-xs text-[#a69181] leading-relaxed pt-1">
                  Unleash your visual creativity on canvas! Live sketching, poster making, and painting celebrating Indian heritage and freedom.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Detailed Description & Guidelines */}
        <section className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10 mb-8 space-y-4">
          <h2 className="text-lg font-bold text-[#e6c594] border-b border-white/10 pb-2">
            {isPratidhwani ? 'Pratidhwani Flagship Event Guidelines & Steps' : 'Event Overview & Description'}
          </h2>
          <div className="text-sm text-[#e6d7c3]/90 leading-relaxed whitespace-pre-line space-y-4">
            {event.description}

            {isPratidhwani && (
              <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">1. What is Pratidhwani?</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    Pratidhwani is the flagship offline celebration of Swaraj-e-Hind at HIT Haldia, organized by the Tabloid, Media and Literary Club (HITian Inside). It provides a live stage for students to perform, express, debate, and paint.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">2. Entry Fee & Payment Steps (RS. 50/- ONLY)</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    Registration fee is <strong>RS. 50/- ONLY</strong>. Make payment using the UPI QR Code (`hitianinside@upi`), input your 12-digit Transaction UTR UID & UPI ID, and click Proceed to generate your official digital receipt pass.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">3. Official WhatsApp Group Access</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    Upon submitting your payment details, you will receive instant access to the official <strong>Pratidhwani WhatsApp Group</strong> for stage schedules, venue maps, and competition rules.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">4. QR_UID Attendance Verification</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    Your generated receipt includes a unique <strong>`QR_UID`</strong> code at the top-right corner. Present this receipt or digital code at the entrance of Main Campus Grounds & SAC for check-in.
                  </p>
                </div>
              </div>
            )}

            {isTricolour && !event.description?.includes('1. What is Swaraj-e-Hind?') && (
              <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">1. What is Swaraj-e-Hind?</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    Swaraj-e-Hind is more than just an event, it’s a celebration of India, its freedom, and the voices of its youth. It brings together ideas, creativity, and expressions that reflect what India means to us today.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">2. What happens here?</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    From performances to creative expressions, Swaraj-e-Hind gives everyone a chance to share their thoughts and showcase their talent.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">3. Evaluation Process</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    Participants will be judged on creativity, originality, relevance to the theme, and how effectively they present their ideas.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#ff9933]">4. Value Edition</h3>
                  <p className="text-xs text-[#e6d7c3]/90 mt-1">
                    The Value Edition is about going beyond celebration and looking at the values that make us who we are—freedom, unity, courage, responsibility, and respect. Because independence isn’t just something we remember; it’s something we carry forward.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Pratidhwani Official Social Media Handles Banner */}
        {isPratidhwani && (
          <div className="p-4 rounded-2xl bg-[#180509] border border-white/10 mb-8 text-center text-xs text-[#a69181]">
            <span className="font-bold text-white block mb-1">Official Social Media Handles:</span>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#e6c594] font-mono">
              <span>📘 Facebook: @HITian.Inside</span>
              <span>•</span>
              <span>📷 Instagram: @hitianinside</span>
              <span>•</span>
              <span>💼 LinkedIn: hitian-inside</span>
              <span>•</span>
              <span>🔴 YouTube: HITian INSIDE</span>
            </div>
          </div>
        )}

        {/* Custom Event Highlights */}
        {displayHighlights && displayHighlights.length > 0 && (
          <section className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10 mb-8">
            <h2 className="text-lg font-bold text-[#e6c594] border-b border-white/10 pb-4 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e6c594]" />
              <span>Event Highlights & Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayHighlights.map((item, idx) => (
                <div key={idx} className="bg-[#180509] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#800020]/25 text-[#e6c594] shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-[#e6c594]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-[#a69181] mt-0.5 whitespace-pre-line">{item.description}</p>
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
