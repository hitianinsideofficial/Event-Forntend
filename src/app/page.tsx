'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../services/api.service';
import { EventItem } from '../types/event.types';
import { 
  CalendarX, 
  Search, 
  Sparkles, 
  Flame, 
  Compass, 
  Users, 
  Award, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Tag,
  History,
  CheckCircle2,
  Calendar,
  ExternalLink
} from 'lucide-react';

// Curated legacy archive for past hallmark HITian Inside celebrations
const FALLBACK_PAST_EVENTS: EventItem[] = [
  {
    id: 'swaraj_e_hind_legacy',
    title: 'SWARAJ-E-HIND 3.0',
    description: 'The hallmark Independence Day tournament celebrating patriotism, freedom & creative youth expression across Photography, Reel Making, Digital Art, and Creative Writing.',
    date: 'August 15, 2025',
    location: 'HIT Campus & Online Media Showcase',
    organizer: 'HITian Inside',
    status: 'DONE',
    mode: 'ONLINE',
    theme: 'TRICOLOUR',
    isFlagship: true,
    hasAttendance: false,
    requireFileUpload: true,
    coverUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'navroopam_v6_legacy',
    title: 'NAVROOPAM v6.0',
    description: 'The 6th grand edition of Durga Puja Socio-Cultural Festival featuring Kolkata & Haldia pandal photography, festive vlogs, canvas art, and literary tributes.',
    date: 'October 18 – 28, 2025',
    location: 'HITian Inside Cultural Exhibition',
    organizer: 'HITian Inside',
    status: 'DONE',
    mode: 'ONLINE',
    theme: 'DEFAULT',
    isFlagship: true,
    hasAttendance: false,
    requireFileUpload: true,
    coverUrl: 'https://ik.imagekit.io/n6cw3mewa/navroopam_banner.png'
  },
  {
    id: 'canvas_chronicles_legacy',
    title: 'CANVAS CHRONICLES 2025',
    description: 'Annual fine arts and visual design competition bringing together campus painters, digital illustrators, and sketch artists with offline gallery display.',
    date: 'February 20, 2025',
    location: 'HIT Central Auditorium & Gallery',
    organizer: 'HITian Inside',
    status: 'DONE',
    mode: 'OFFLINE',
    theme: 'DEFAULT',
    isFlagship: false,
    hasAttendance: true,
    requireFileUpload: true,
    coverUrl: 'https://images.unsplash.com/photo-1460661419200-1868a1eb65bc?q=80&w=1200&auto=format&fit=crop'
  }
];

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Fetch all events including completed (includeDone: true)
      const data = await fetchEvents(true, false, false);
      setEvents(data || []);
    } catch (err) {
      console.warn('Backend unavailable.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const flagshipNavroopam = events.find(e => {
    const id = e.id || e._id || '';
    const t = e.title?.toLowerCase() || '';
    return id === '6aca70825588e8009b8e8e83' || id.includes('nav') || t.includes('navroopam');
  });

  // Separate active/upcoming and past events
  const activeEvents = events.filter(e => e.status !== 'DONE' && !e.isHidden);
  const dbPastEvents = events.filter(e => e.status === 'DONE');

  // If no DB past events yet, showcase the hallmark archive
  const pastEvents = dbPastEvents.length > 0 ? dbPastEvents : FALLBACK_PAST_EVENTS;

  const filteredActiveEvents = activeEvents.filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastEvents = pastEvents.filter(event =>
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0204] text-[#fdfbf7] w-full selection:bg-[#e6c594] selection:text-[#150408] relative">
      <Navbar />

      <main className="flex-1 w-full pb-16 sm:pb-24">
        {/* ========================================================= */}
        {/* HERO SECTION: ADAPTIVE DESKTOP & MOBILE PRESENTATION */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden border-b border-[#f7f1e5]/10 bg-gradient-to-b from-[#18040a] via-[#0f0205] to-[#0b0204] py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* DESKTOP HERO VIEW (md+) */}
            <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Mission & Brand Positioning */}
              <div className="md:col-span-7 space-y-6">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  Discover, Register & <br />
                  <span className="bg-gradient-to-r from-[#ffffff] via-[#f7f1e5] to-[#e6c594] bg-clip-text text-transparent">
                    Compete in HIT Events
                  </span>
                </h1>

                <p className="text-sm lg:text-base text-[#d8c7b8] max-w-xl leading-relaxed">
                  Welcome to the official registration hub of <strong>HITian Inside</strong> at Haldia Institute of Technology. Explore premier cultural fests, photography showcases, creative writing tournaments, and campus celebrations.
                </p>

                {/* Quick Trust Highlights Strip */}
                <div className="pt-2 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg">
                  <div className="space-y-0.5">
                    <div className="text-xl font-black text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>100%</span>
                    </div>
                    <p className="text-[11px] text-[#a69181] font-medium">Verified HIT Platform</p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xl font-black text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>₹9 Entry</span>
                    </div>
                    <p className="text-[11px] text-[#a69181] font-medium">Accessible Student Fests</p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xl font-black text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#e6c594]" />
                      <span>Medals & Rewards</span>
                    </div>
                    <p className="text-[11px] text-[#a69181] font-medium">Trophies, Medals & Certificates</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Spotlight Card (Desktop Preview) */}
              <div className="md:col-span-5">
                {flagshipNavroopam ? (
                  <div className="relative group rounded-3xl p-1 bg-gradient-to-b from-[#e6c594]/60 via-[#800020]/40 to-[#e6c594]/20 shadow-2xl shadow-[#800020]/30 transition-all hover:scale-[1.01]">
                    <div className="relative rounded-[22px] overflow-hidden bg-[#160307] p-5 lg:p-6 space-y-4">
                      {/* Spotlight Header Tag */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-[#800020]/60 text-[#e6c594] border border-[#e6c594]/40 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="w-3 h-3 text-[#ff9933]" />
                          Featured Flagship
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Registration Active
                        </span>
                      </div>

                      {/* Cover Banner */}
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#e6c594]/30 shadow-md">
                        <img 
                          src={flagshipNavroopam.coverUrl || flagshipNavroopam.bannerUrl || 'https://ik.imagekit.io/n6cw3mewa/navroopam_banner.png'} 
                          alt={flagshipNavroopam.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#160307]/90 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
                          <span className="font-extrabold text-[#e6c594]">October 10 – 24, 2026</span>
                          <span className="font-mono bg-[#e6c594] text-[#150408] font-black px-2 py-0.5 rounded text-[10px]">₹9.00 / ENTRY</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight group-hover:text-[#e6c594] transition-colors">
                          {flagshipNavroopam.title}
                        </h3>
                        <p className="text-xs text-[#a69181] line-clamp-2 mt-1 leading-relaxed">
                          {flagshipNavroopam.description}
                        </p>
                      </div>

                      <Link 
                        href={`/events/${flagshipNavroopam.id || flagshipNavroopam._id}`}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#e6c594] via-[#f7f1e5] to-[#e6c594] hover:brightness-110 text-[#150408] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#800020]/40 flex items-center justify-center gap-2"
                      >
                        <span>Register Now 🔱</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-[#160307] p-8 border border-white/10 text-center space-y-3">
                    <Compass className="w-8 h-8 text-[#e6c594] mx-auto" />
                    <h3 className="text-lg font-bold text-white">HIT Cultural & Literary Hub</h3>
                    <p className="text-xs text-[#a69181]">Official student events, cultural fests, and competitive opportunities.</p>
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE HERO VIEW (Mobile-first layout optimized for thumb interaction) */}
            <div className="md:hidden space-y-5 text-center">
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                Official Event <br />
                <span className="bg-gradient-to-r from-[#ffffff] via-[#f7f1e5] to-[#e6c594] bg-clip-text text-transparent">
                  Registrations & Fests
                </span>
              </h1>

              <p className="text-xs text-[#d8c7b8] leading-relaxed max-w-sm mx-auto">
                Participate in college cultural competitions, fests, and showcases. Instant digital ticket passes and certificates.
              </p>

              {/* Mobile Spotlight Banner Highlight */}
              {flagshipNavroopam && (
                <div className="pt-1">
                  <Link 
                    href={`/events/${flagshipNavroopam.id || flagshipNavroopam._id}`}
                    className="block rounded-2xl overflow-hidden border-2 border-[#e6c594]/70 bg-gradient-to-b from-[#22060e] to-[#160307] shadow-xl text-left p-3.5 relative"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#e6c594]/40 bg-black">
                        <img 
                          src={flagshipNavroopam.coverUrl || flagshipNavroopam.bannerUrl || 'https://ik.imagekit.io/n6cw3mewa/navroopam_banner.png'} 
                          alt="Navroopam" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-[#e6c594] bg-[#800020]/60 px-1.5 py-0.5 rounded">
                            🔱 Live Flagship
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            ₹9.00
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white truncate mt-1">
                          {flagshipNavroopam.title}
                        </h4>
                        <p className="text-[10px] text-[#a69181] truncate">
                          Durga Puja Socio-Cultural Celebration
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#e6c594] shrink-0" />
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* EVENT DIRECTORY & CONTROLS SECTION (ACTIVE REGISTRATIONS) */}
        {/* ========================================================= */}
        <section id="active-events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          {/* Controls Bar: Search Box */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Available Registrations</span>
                  <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {filteredActiveEvents.length} Active {filteredActiveEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                </h2>
                <p className="text-xs text-[#a69181] mt-0.5">
                  Select an event card to read the rules, eligibility, schedule, and register.
                </p>
              </div>

              {/* Search Box */}
              <div className="w-full sm:w-80 relative">
                <Search className="w-4 h-4 text-[#a69181] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input 
                  type="text" 
                  placeholder="Search events, fests, or topics..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#140307] border border-white/15 focus:border-[#e6c594] rounded-xl text-xs text-white placeholder:text-[#a69181] outline-none transition-colors font-medium shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Active Catalog Listing */}
          <div>
            {loading ? (
              <div className="py-20 text-center text-[#e6d7c3]">
                <p className="text-xs font-semibold text-[#a69181] animate-pulse">Syncing with MongoDB database...</p>
              </div>
            ) : filteredActiveEvents.length === 0 ? (
              <div className="rounded-3xl bg-[#140307]/70 p-10 text-center my-4 border border-white/10 max-w-xl mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#800020]/30 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto">
                  <CalendarX className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-white">No Matching Active Events</h3>
                <p className="text-xs text-[#a69181] leading-relaxed">
                  {searchQuery 
                    ? `No active registrations match your search "${searchQuery}".` 
                    : 'All current registrations are closed. Explore our past events below!'}
                </p>

                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors inline-block"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="events-grid-container">
                {filteredActiveEvents.map(event => (
                  <EventCard key={event.id || event._id} event={event} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* PAST EVENTS & HALLMARK ARCHIVE SECTION */}
        {/* ========================================================= */}
        <section id="past-events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-white/10 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e6c594]" />
                <span className="text-[10px] font-black tracking-widest text-[#e6c594] uppercase font-mono">
                  Legacy & History
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                <History className="w-5 h-5 text-[#e6c594]" />
                <span>Past Events</span>
                <span className="text-xs font-mono font-normal text-[#a69181] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  {filteredPastEvents.length} Concluded
                </span>
              </h2>
              <p className="text-xs text-[#a69181] mt-0.5">
                Archived festivals, tournaments, and creative showcases celebrated across Haldia Institute of Technology.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#a69181]">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-[#e6d7c3]">
                🏆 Certificates & Highlights Archived
              </span>
            </div>
          </div>

          {filteredPastEvents.length === 0 ? (
            <div className="rounded-3xl bg-[#140307]/50 p-8 text-center border border-white/5 max-w-md mx-auto text-xs text-[#a69181]">
              No archived events match your search &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastEvents.map((event) => {
                const eventId = event.id || event._id;
                const cardImg = event.coverUrl || event.bannerUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop';
                const isNav = Boolean(event.title?.toLowerCase().includes('nav') || eventId?.includes('nav'));
                const isTri = Boolean(event.theme === 'TRICOLOUR' || event.title?.toLowerCase().includes('swaraj'));

                return (
                  <div 
                    key={eventId}
                    className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#18040a] via-[#120306] to-[#0c0204] border border-white/10 hover:border-[#e6c594]/50 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#800020]/20 hover:-translate-y-1"
                  >
                    {/* Media Preview Thumbnail */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                      <img 
                        src={cardImg} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#120306] via-transparent to-black/50" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-[#e6d7c3] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Concluded</span>
                        </span>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isNav 
                            ? 'bg-[#800020]/80 text-[#e6c594] border border-[#e6c594]/40' 
                            : isTri 
                            ? 'bg-[#ff9933]/20 text-[#ff9933] border border-[#ff9933]/40' 
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {event.mode === 'ONLINE' ? 'Online' : 'In-Person'}
                        </span>
                      </div>

                      {/* Date bar on thumbnail */}
                      <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-[#e6d7c3]">
                        <span className="font-semibold text-white/90 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#e6c594]" />
                          <span>{event.date}</span>
                        </span>
                        <span className="text-[10px] text-[#a69181] font-mono">
                          {event.organizer || 'HITian Inside'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-white group-hover:text-[#e6c594] transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="text-xs text-[#a69181] line-clamp-3 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-mono text-[#a69181]">
                          Status: <strong className="text-emerald-400">Successfully Completed</strong>
                        </span>

                        <Link 
                          href={`/events/${eventId}`}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#e6c594]/40 text-[#e6c594] text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          <span>Event Overview</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* VALUE PROPOSITION & FAQS STRIP (RESPONSIVE) */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="rounded-3xl bg-gradient-to-r from-[#170409] via-[#20060e] to-[#170409] border border-[#e6c594]/30 p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#e6c594]/15 border border-[#e6c594]/40 flex items-center justify-center shrink-0 text-[#e6c594]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Direct Instagram Recognition</h4>
                  <p className="text-xs text-[#a69181] mt-1 leading-relaxed">
                    Selected entries are officially featured across the HITian Inside Instagram feed for thousands of college viewers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Transparent Verification</h4>
                  <p className="text-xs text-[#a69181] mt-1 leading-relaxed">
                    Student submissions and payment transactions are verified directly by organizing coordinators with email confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Vibrant Student Community</h4>
                  <p className="text-xs text-[#a69181] mt-1 leading-relaxed">
                    Join dedicated WhatsApp cohorts to exchange ideas, participate in prize distributions, and stay connected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0d0205] py-8 sm:py-12 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">
              HITian Inside • Haldia Institute of Technology
            </p>
            <p className="text-[11px] text-[#a69181]">
              Official Student Tabloid, Media and Socio-Cultural Events Platform.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-[#e6c594]">
            <a href="https://instagram.com/hitianinside" target="_blank" rel="noreferrer" className="hover:underline">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
