'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { fetchEventById, fetchSubmissionsApi } from '../../../services/api.service';
import { EventItem } from '../../../types/event.types';
import { SubmissionItem } from '../../../types/submission.types';
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
  Users,
  Camera,
  BookOpen,
  Film,
  Trophy,
  ExternalLink,
  ImageIcon
} from 'lucide-react';

export default function DedicatedEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!eventId) return;

    const loadEventDetails = async () => {
      setLoading(true);
      try {
        const [eventData, subsData] = await Promise.all([
          fetchEventById(eventId),
          fetchSubmissionsApi(eventId).catch(() => [])
        ]);
        setEvent(eventData);
        setSubmissions(subsData || []);
      } catch (err) {
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    loadEventDetails();
  }, [eventId]);

  const isNavroopam = Boolean(
    eventId === '6aca70825588e8009b8e8e83' ||
    eventId?.toLowerCase().includes('nav') ||
    event?.id === '6aca70825588e8009b8e8e83' ||
    event?.title?.toLowerCase()?.includes('navroopam') ||
    event?.title?.toLowerCase()?.includes('navaroopam')
  );

  const isTricolour = Boolean(
    event &&
    ((event.isFlagship || event.theme === 'TRICOLOUR' || event.title?.toLowerCase().includes('swaraj')) && !isNavroopam)
  );

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

  const hasOldHighlights = Boolean(
    event?.highlights?.some(h => 
      h.title?.includes('Grand Stage') || 
      h.title?.includes('Poetry') || 
      h.title?.includes('Digital Arts') ||
      h.title?.startsWith('1.') ||
      h.title?.startsWith('2.')
    )
  );

  const displayHighlights = (isTricolour || hasOldHighlights)
    ? SWARAJ_HIGHLIGHTS
    : (event?.highlights || []);

  const isEventConcluded = event?.status === 'DONE';

  // Group winners by domain (for all domains: Photography, Artwork, Creative Writing, Puja Vlog/Reel)
  const winnersGroupedByDomain = useMemo(() => {
    const winnerSubs = submissions.filter(s => s.winnerPosition && ['1st', '2nd', '3rd'].includes(s.winnerPosition));
    const grouped: Record<string, SubmissionItem[]> = {};

    winnerSubs.forEach(sub => {
      const rawDomain = sub.answers?.['Selected Domain'] || 'General';
      // Clean domain title
      let cleanDomain = rawDomain;
      if (rawDomain.includes('(')) {
        cleanDomain = rawDomain.split('(')[0].trim();
      }
      if (!grouped[cleanDomain]) {
        grouped[cleanDomain] = [];
      }
      grouped[cleanDomain].push(sub);
    });

    // Sort winners within each domain: 1st, 2nd, 3rd
    const rankOrder: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3 };
    Object.keys(grouped).forEach(dom => {
      grouped[dom].sort((a, b) => (rankOrder[a.winnerPosition || ''] || 99) - (rankOrder[b.winnerPosition || ''] || 99));
    });

    return grouped;
  }, [submissions]);

  const hasAnyWinners = Object.keys(winnersGroupedByDomain).length > 0;

  // Filter submissions for Gallery (Photography and Artwork ONLY - strictly exclude reels/vlogs & creative writing)
  const galleryItems = useMemo(() => {
    return submissions.filter(sub => {
      // Must not be disqualified
      if (sub.postingStatus === 'DISQUALIFIED') return false;

      const domain = (sub.answers?.['Selected Domain'] || '').toLowerCase();
      const isPhoto = domain.includes('photo') || domain.includes('drishti') || domain.includes('lens');
      const isArt = domain.includes('art') || domain.includes('paint') || domain.includes('sketch') || domain.includes('canvas') || domain.includes('palette');
      const isReel = domain.includes('reel') || domain.includes('vlog') || domain.includes('video');
      const isWriting = domain.includes('writing') || domain.includes('inkquilab') || domain.includes('essay');

      if (isReel || isWriting) return false;
      if (!isPhoto && !isArt) return false;

      // In Navroopam, only show photos/artworks that are marked as included (moveToPostingExcel)
      if (isNavroopam && !sub.moveToPostingExcel) return false;

      // Must have valid image media file (exclude payment proof)
      const paymentProof = sub.files?.find(f => {
        const n = (f.originalName || '').toLowerCase();
        return n.includes('proof') || n.includes('pay') || n.includes('screen') || n.includes('utr') || f.provider === 'cloudinary_payment_proof';
      });
      const validFiles = sub.files ? sub.files.filter(f => f !== paymentProof) : [];
      const media = validFiles.find(f => {
        const m = (f.mimeType || '').toLowerCase();
        const n = (f.originalName || '').toLowerCase();
        const url = (f.localUrl || f.driveLink || '').toLowerCase();
        return m.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif)$/.test(n) || /\.(jpg|jpeg|png|webp|gif|avif)/.test(url);
      });

      return Boolean(media?.localUrl || media?.driveLink);
    }).map(sub => {
      const paymentProof = sub.files?.find(f => {
        const n = (f.originalName || '').toLowerCase();
        return n.includes('proof') || n.includes('pay') || n.includes('screen') || n.includes('utr') || f.provider === 'cloudinary_payment_proof';
      });
      const validFiles = sub.files ? sub.files.filter(f => f !== paymentProof) : [];
      const media = validFiles.find(f => {
        const m = (f.mimeType || '').toLowerCase();
        const n = (f.originalName || '').toLowerCase();
        const url = (f.localUrl || f.driveLink || '').toLowerCase();
        return m.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif)$/.test(n) || /\.(jpg|jpeg|png|webp|gif|avif)/.test(url);
      }) || validFiles[0];

      const rollNumber = sub.answers?.['College Roll Number'] || sub.answers?.['Roll Number'] || '-';
      const domain = sub.answers?.['Selected Domain'] || 'Artwork / Photography';

      return {
        id: sub.id,
        name: sub.fullName,
        rollNumber,
        imageUrl: media?.localUrl || media?.driveLink || '',
        originalName: media?.originalName || 'Artwork',
        domain,
        theme: sub.answers?.['Selected Theme'] || '',
        winnerPosition: sub.winnerPosition
      };
    });
  }, [submissions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-10 h-10 border-2 border-[#e6c594]/20 border-t-[#e6c594] rounded-full animate-spin" />
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

  return (
    <div className="min-h-screen bg-[#0a0204] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Events</span>
        </Link>

        {/* 2-Column Responsive Layout for Desktop Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Primary Content Column (8 cols on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
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
        ) : isNavroopam ? (
          <div className="relative w-full p-8 sm:p-10 rounded-3xl navroopam-theme-bg navroopam-gold-border navroopam-header-glow mb-8 text-center shadow-2xl overflow-hidden">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#800020]/50 border border-[#e6c594]/60 text-[#e6c594] text-xs font-black uppercase tracking-wider mb-3">
              <span className="text-sm">🔱</span>
              <span>HITian Inside • Tabloid, Media & Literary Club</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg">
              NAVROOPAM <span className="text-[#e6c594]">v7.0</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#e6c594] font-extrabold tracking-widest uppercase mt-1 font-mono">
              Socio-Cultural Festive Celebration of Durga Puja
            </p>
            <div className="mt-4 inline-flex items-center gap-3 bg-[#800020]/40 px-4 py-1.5 rounded-full border border-[#e6c594]/40">
              <span className="text-xs font-bold text-white">ENTRY FEE:</span>
              <span className="text-sm font-black text-[#e6c594] font-mono">₹9.00 INR (Per Domain Entry)</span>
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

            {/* Event Title & Badges Header Card */}
            <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-[#800020]/40 text-[#e6c594] border border-[#e6c594]/40 uppercase tracking-wider">
                  {event.organizer || 'HITian Inside'}
                </span>

                {event.status === 'LIVE' ? (
                  <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE NOW
                  </span>
                ) : (
                  <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                    Registration Open
                  </span>
                )}

                <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 text-[#a69181] border border-white/10 font-medium">
                  {event.mode === 'ONLINE' ? '🌐 Online Mode' : '📍 On-Campus'}
                </span>
              </div>

              <h1 className={`text-2xl sm:text-4xl font-extrabold ${isTricolour ? 'tricolour-gradient-text' : 'text-white'} leading-tight`}>
                {event.title}
              </h1>

              {/* Mobile-only CTA & Quick Info */}
              <div className="lg:hidden mt-6 pt-6 border-t border-white/10 space-y-4">
                {isEventConcluded ? (
                  <div className="w-full text-center py-3 px-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Registration Closed • Event Concluded</span>
                  </div>
                ) : (
                  <Link 
                    href={`/events/${eventId}/register`}
                    className={
                      isNavroopam 
                        ? 'btn-navroopam w-full text-center py-3 px-6 shadow-xl flex items-center justify-center gap-2 font-black text-sm' 
                        : isTricolour 
                          ? 'btn-tricolour w-full text-center py-3 px-6 shadow-xl flex items-center justify-center gap-2 text-sm' 
                          : 'btn-primary w-full text-center py-3 px-6 flex items-center justify-center gap-2 text-sm font-bold'
                    }
                  >
                    <span>Register Now for Event</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#180509]/80 p-3 rounded-xl border border-white/5 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#e6c594] shrink-0" />
                    <span className="text-white font-bold truncate">{event.date}</span>
                  </div>
                  <div className="bg-[#180509]/80 p-3 rounded-xl border border-white/5 flex items-center gap-2.5">
                    {event.mode === 'ONLINE' ? <Globe className="w-4 h-4 text-cyan-400 shrink-0" /> : <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />}
                    <span className="text-white font-bold truncate">
                      {event.mode === 'ONLINE' ? (event.location && !event.location.includes('Auditorium') ? event.location : 'Online Submission & Digital Entry') : (event.location || 'Main Campus')}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Community Join Card (Mobile) */}
                <a 
                  href="https://chat.whatsapp.com/Fa3xmAgX4nQETzqkNTSklq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#180509]/80 to-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 hover:border-emerald-400 transition-all shadow-lg group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <span className="text-base">💬</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors block">
                        Join Official WhatsApp Group
                      </span>
                      <span className="text-[10px] text-[#e6d7c3]/80 block">
                        Event updates, prize distribution & campus news
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-black font-extrabold text-[10px] shrink-0">
                    Join ↗
                  </span>
                </a>

                {/* Mobile View Event Contacts */}
                <div className="bg-[#180509]/80 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#e6c594] font-bold">
                    <Phone className="w-3.5 h-3.5 text-[#e6c594]" />
                    <span>Event Queries & Support:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <a href="tel:9931769909" className="p-1.5 rounded-lg bg-black/30 hover:bg-[#800020]/30 transition-colors flex flex-col">
                      <span className="text-[#a69181] font-sans text-[10px]">Mehwish</span>
                      <span className="text-white font-bold">+91 99317 69909</span>
                    </a>
                    <a href="tel:9135444297" className="p-1.5 rounded-lg bg-black/30 hover:bg-[#800020]/30 transition-colors flex flex-col">
                      <span className="text-[#a69181] font-sans text-[10px]">Ayush</span>
                      <span className="text-white font-bold">+91 91354 44297</span>
                    </a>
                    <a href="tel:9732741560" className="p-1.5 rounded-lg bg-black/30 hover:bg-[#800020]/30 transition-colors flex flex-col">
                      <span className="text-[#a69181] font-sans text-[10px]">Sanchayan</span>
                      <span className="text-white font-bold">+91 97327 41560</span>
                    </a>
                    <a href="tel:9836018190" className="p-1.5 rounded-lg bg-black/30 hover:bg-[#800020]/30 transition-colors flex flex-col">
                      <span className="text-[#a69181] font-sans text-[10px]">Srijita</span>
                      <span className="text-white font-bold">+91 98360 18190</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

        {/* Detailed Description & Guidelines */}
        <section className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10 mb-8 space-y-4">
          <h2 className="text-lg font-bold text-[#e6c594] border-b border-white/10 pb-2">
            Event Overview & Description
          </h2>
          <div className="text-sm text-[#e6d7c3]/90 leading-relaxed whitespace-pre-line space-y-4">
            {event.description}

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

        {/* Custom Event Highlights */}
        {displayHighlights && displayHighlights.length > 0 && (
          <section className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
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

        {/* Bottom Registration Call to Action for Mobile */}
        <div className={`lg:hidden glass-panel p-8 text-center border-2 ${isTricolour ? 'border-[#ff9933]/50' : 'border-[#e6c594]/30'}`}>
          {isEventConcluded ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mx-auto mb-3">
                🏆
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Registration Concluded</h2>
              <p className="text-xs text-[#a69181] mb-4 max-w-md mx-auto">
                Submissions for this event are closed. Explore the official winners showcase and submissions gallery below.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Ready to Participate?</h2>
              <p className="text-xs text-[#a69181] mb-6 max-w-md mx-auto">
                Complete the official registration form to reserve your spot and receive your verified pass.
              </p>

              <Link 
                href={`/events/${eventId}/register`}
                className={
                  isNavroopam 
                    ? 'btn-navroopam text-sm py-3 px-8 inline-flex items-center gap-2 font-black shadow-xl' 
                    : isTricolour 
                      ? 'btn-tricolour text-sm py-3 px-8' 
                      : 'btn-primary text-sm py-3 px-8 inline-flex items-center gap-2'
                }
              >
                <span>{isNavroopam ? 'Fill Navroopam v7.0 Registration Form →' : 'Fill Registration Form →'}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Sticky Desktop Sidebar Column (4 cols on lg screens) */}
      <div className="hidden lg:flex flex-col lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
        
        {/* Primary Desktop Action & Registration Card */}
        <div className={`glass-panel p-6 sm:p-7 border-2 ${isNavroopam ? 'navroopam-gold-border navroopam-theme-bg shadow-2xl shadow-[#800020]/30' : isTricolour ? 'border-[#ff9933]/50 shadow-xl' : 'border-[#e6c594]/30 shadow-xl'} rounded-3xl space-y-5`}>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <span className="text-xs text-[#a69181] uppercase tracking-wider font-semibold">Participation Pass</span>
            {isNavroopam ? (
              <span className="text-xs font-black text-[#e6c594] bg-[#800020]/60 px-3 py-1 rounded-full border border-[#e6c594]/40 font-mono">
                ₹9.00 / Domain
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">
                Free Entry
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white">
              {isEventConcluded ? 'Event Concluded' : 'Join This Event'}
            </h3>
            <p className="text-xs text-[#a69181] mt-1.5 leading-relaxed">
              {isEventConcluded
                ? 'Registrations are closed for this edition. Check out the top winners showcase and submissions gallery below!'
                : isNavroopam 
                  ? 'Submit your original creations across Writing, Photography, Artwork, & Video Vlogs.'
                  : 'Reserve your spot, submit entries, and receive your verified pass.'}
            </p>
          </div>

          {isEventConcluded ? (
            <div className="w-full text-center py-3.5 px-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Registration Closed 🏆</span>
            </div>
          ) : (
            <Link 
              href={`/events/${eventId}/register`}
              className={
                isNavroopam 
                  ? 'btn-navroopam w-full text-center py-3.5 px-6 shadow-xl flex items-center justify-center gap-2 font-black text-sm' 
                  : isTricolour 
                    ? 'btn-tricolour w-full text-center py-3.5 px-6 shadow-xl flex items-center justify-center gap-2 text-sm' 
                    : 'btn-primary w-full text-center py-3.5 px-6 flex items-center justify-center gap-2 text-sm font-bold'
              }
            >
              <span>Register Now for Event</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Key Event Details Card */}
        <div className="glass-panel p-6 border border-[#f7f1e5]/10 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider pb-3 border-b border-white/10">
            Key Event Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${isTricolour ? 'bg-[#ff9933]/20 text-[#ff9933]' : 'bg-[#800020]/30 text-[#e6c594]'}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">Date & Timeline</span>
                <span className="text-xs font-bold text-white leading-snug">{event.date}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
                {event.mode === 'ONLINE' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">
                  {event.mode === 'ONLINE' ? 'Event Mode' : 'Mode & Venue'}
                </span>
                <span className="text-xs font-bold text-white leading-snug">
                  {event.mode === 'ONLINE' 
                    ? (event.location && !event.location.includes('Auditorium') ? event.location : 'Online Submission & Digital Exhibition')
                    : (event.location || 'Main Campus')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#a69181] uppercase font-semibold block">Organizing Body</span>
                <span className="text-xs font-bold text-white leading-snug">
                  {event.organizer || 'HITian Inside'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Queries & Support Contacts Card */}
        <div className="glass-panel p-6 border border-[#f7f1e5]/10 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-xs text-[#e6c594] font-bold uppercase tracking-wider">
            <Phone className="w-4 h-4 text-[#e6c594]" />
            <span>Event Queries & Support</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <a 
              href="tel:9931769909" 
              className="p-2.5 rounded-xl bg-[#180509]/80 border border-white/5 hover:border-[#e6c594]/40 hover:bg-[#800020]/20 transition-all flex items-center justify-between"
            >
              <span className="text-[#a69181] font-sans font-medium">Mehwish</span>
              <span className="text-white font-bold">+91 99317 69909</span>
            </a>

            <a 
              href="tel:9135444297" 
              className="p-2.5 rounded-xl bg-[#180509]/80 border border-white/5 hover:border-[#e6c594]/40 hover:bg-[#800020]/20 transition-all flex items-center justify-between"
            >
              <span className="text-[#a69181] font-sans font-medium">Ayush</span>
              <span className="text-white font-bold">+91 91354 44297</span>
            </a>

            <a 
              href="tel:9732741560" 
              className="p-2.5 rounded-xl bg-[#180509]/80 border border-white/5 hover:border-[#e6c594]/40 hover:bg-[#800020]/20 transition-all flex items-center justify-between"
            >
              <span className="text-[#a69181] font-sans font-medium">Sanchayan</span>
              <span className="text-white font-bold">+91 97327 41560</span>
            </a>

            <a 
              href="tel:9836018190" 
              className="p-2.5 rounded-xl bg-[#180509]/80 border border-white/5 hover:border-[#e6c594]/40 hover:bg-[#800020]/20 transition-all flex items-center justify-between"
            >
              <span className="text-[#a69181] font-sans font-medium">Srijita</span>
              <span className="text-white font-bold">+91 98360 18190</span>
            </a>
          </div>
        </div>

        {/* Official WhatsApp Community Card (Desktop) */}
        <div className="glass-panel p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#180509]/90 to-emerald-950/20 rounded-3xl space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <span className="text-base">💬</span>
            <span>Official WhatsApp Community</span>
          </div>

          <p className="text-xs text-[#e6d7c3]/90 leading-relaxed">
            Join the official HITian Inside WhatsApp group to stay updated on event timelines, evaluation schedules, prize distributions, and campus announcements.
          </p>

          <a 
            href="https://chat.whatsapp.com/Fa3xmAgX4nQETzqkNTSklq"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/30"
          >
            <span>Join WhatsApp Group</span>
            <span className="text-sm">↗</span>
          </a>
        </div>

      </div>
    </div>

      {/* ========================================================= */}
      {/* 1. OFFICIAL WINNERS SHOWCASE SECTION (FOR ALL DOMAINS) */}
      {/* ========================================================= */}
      {(hasAnyWinners || isEventConcluded) && (
        <section id="winners-section" className="mt-16 pt-12 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-400">
                  Hall of Champions
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Trophy className="w-7 h-7 text-amber-400" />
                <span>Event Winners & Top Rankers</span>
              </h2>
              <p className="text-xs text-[#a69181] mt-1 max-w-2xl leading-relaxed">
                Celebrating outstanding creative excellence, storytelling, and artistic mastery across all competition categories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
                <span>🏅 Verified Results</span>
              </span>
            </div>
          </div>

          {!hasAnyWinners ? (
            <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
                🏆
              </div>
              <h3 className="text-base font-bold text-white">Evaluation in Final Stage</h3>
              <p className="text-xs text-[#a69181] leading-relaxed">
                Judges and evaluators are finalizing the scores across domains. Official winner announcements will be revealed here soon!
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(winnersGroupedByDomain).map(([domainName, winners]) => (
                <div key={domainName} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                  {/* Domain Category Banner */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {domainName.toLowerCase().includes('photo') ? (
                          <Camera className="w-4 h-4" />
                        ) : domainName.toLowerCase().includes('art') ? (
                          <Palette className="w-4 h-4" />
                        ) : domainName.toLowerCase().includes('writ') ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <Film className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {domainName}
                        </h3>
                        <span className="text-[10px] text-[#a69181] font-mono">
                          Official Category Results
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                      {winners.length} {winners.length === 1 ? 'Winner' : 'Winners'}
                    </span>
                  </div>

                  {/* Winners Podium Cards (1st, 2nd, 3rd) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {winners.map((win) => {
                      const pos = win.winnerPosition;
                      const isFirst = pos === '1st';
                      const isSecond = pos === '2nd';
                      const isThird = pos === '3rd';

                      const rollNo = win.answers?.['College Roll Number'] || win.answers?.['Roll Number'] || '-';
                      const theme = win.answers?.['Selected Theme'] || '';

                      return (
                        <div 
                          key={win.id}
                          className={`relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
                            isFirst 
                              ? 'bg-gradient-to-b from-amber-500/20 via-[#1e1308] to-[#120a04] border-amber-400/60 shadow-xl shadow-amber-500/10 hover:border-amber-400' 
                              : isSecond
                              ? 'bg-gradient-to-b from-slate-400/15 via-[#181a1f] to-[#0f1115] border-slate-300/40 shadow-lg hover:border-slate-300'
                              : 'bg-gradient-to-b from-orange-500/15 via-[#1c120c] to-[#100906] border-orange-400/40 shadow-lg hover:border-orange-400'
                          }`}
                        >
                          {/* Corner ambient glow */}
                          <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-xl pointer-events-none ${
                            isFirst ? 'bg-amber-400/20' : isSecond ? 'bg-slate-300/15' : 'bg-orange-500/15'
                          }`} />

                          <div>
                            {/* Rank Badge Header */}
                            <div className="flex items-center justify-between mb-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider border shadow-sm ${
                                isFirst 
                                  ? 'bg-amber-400 text-black border-amber-300 shadow-amber-400/30' 
                                  : isSecond 
                                  ? 'bg-slate-200 text-slate-900 border-slate-100' 
                                  : 'bg-orange-400 text-black border-orange-300'
                              }`}>
                                <span className="text-sm">
                                  {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                                </span>
                                <span>{isFirst ? '1st Place Winner' : isSecond ? '2nd Place Winner' : '3rd Place Winner'}</span>
                              </span>

                              <span className="text-[10px] font-mono text-[#a69181] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                #{win.ticketId}
                              </span>
                            </div>

                            {/* Participant Name & Details */}
                            <h4 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                              {win.fullName}
                            </h4>

                            <div className="mt-2 space-y-1 text-xs">
                              <p className="font-mono text-[#e6d7c3] font-semibold flex items-center gap-1.5">
                                <span className="text-[#a69181]">Roll:</span>
                                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 font-bold">{rollNo}</span>
                              </p>

                              {theme && (
                                <p className="text-[#a69181] text-[11px] truncate">
                                  Theme: <span className="text-white font-medium">{theme}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Footer with IG link if available */}
                          {win.instagramPostUrl && (
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                              <a 
                                href={win.instagramPostUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>View Winning Post</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <span className="text-[10px] text-[#a69181] font-mono">Verified Entry</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 2. GALLERY SECTION (PHOTOGRAPHY & ARTWORK ONLY)           */}
      {/* One to another, no boxes, no separation                   */}
      {/* On hover: black transparent layer at bottom with name & roll */}
      {/* ========================================================= */}
      {event?.showGallery !== false && galleryItems.length > 0 && (
        <section id="gallery-section" className="mt-20 pt-12 border-t border-white/10">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-mono font-black uppercase tracking-widest text-rose-400">
                  Exhibition Showcase
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-rose-400" />
                <span>Submissions Gallery</span>
              </h2>
              <p className="text-xs text-[#a69181] mt-0.5">
                Photography & Artwork original submissions. Hover over any work to reveal the creator.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#e6d7c3]">
                {galleryItems.length} Visual Creations
              </span>
            </div>
          </div>

          {/* Seamless Edge-to-Edge Grid: No boxes, no separation, gap-0 */}
          <div className="w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0">
              {galleryItems.map((item) => (
                <div 
                  key={item.id}
                  className="group relative aspect-square overflow-hidden bg-neutral-950 cursor-pointer"
                >
                  {/* The Image (no borders, edge-to-edge flush) */}
                  <img 
                    src={item.imageUrl} 
                    alt={item.originalName || item.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />

                  {/* Winner Top-Right Badge if awarded */}
                  {item.winnerPosition && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-amber-400/60 text-[10px] font-black text-amber-300 font-mono shadow-md">
                        {item.winnerPosition === '1st' ? '🥇 1st' : item.winnerPosition === '2nd' ? '🥈 2nd' : '🥉 3rd'}
                      </span>
                    </div>
                  )}

                  {/* Black transparent layer at the bottom on hover with name & roll number */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end pointer-events-none z-20">
                    <p className="text-xs font-bold text-white leading-tight drop-shadow-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] font-mono font-medium text-amber-300 mt-0.5 tracking-tight drop-shadow-sm truncate">
                      Roll: {item.rollNumber}
                    </p>
                    {item.theme && (
                      <p className="text-[9px] text-[#e6d7c3]/80 truncate mt-0.5 italic">
                        {item.theme}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      </main>
    </div>
  );
}
