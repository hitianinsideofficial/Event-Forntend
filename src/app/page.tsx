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
  Tag
} from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents(false);
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

  const filteredEvents = events.filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0204] text-[#fdfbf7] w-full selection:bg-[#e6c594] selection:text-[#150408]">
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
        {/* EVENT DIRECTORY & CONTROLS SECTION */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          {/* Controls Bar: Search Box */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Available Registrations</span>
                  <span className="text-xs font-mono font-normal text-[#a69181] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                    {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
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

          {/* Catalog Listing */}
          <div>
            {loading ? (
              <div className="py-24 text-center text-[#e6d7c3]">
                <div className="inline-block w-9 h-9 border-3 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold tracking-wide">Fetching active college events...</p>
                <p className="text-xs text-[#a69181] mt-1">Connecting to official event catalog</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-3xl bg-[#140307]/70 p-12 text-center my-6 border border-white/10 max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#800020]/30 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto">
                  <CalendarX className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-white">No Matching Events Found</h3>
                <p className="text-xs text-[#a69181] leading-relaxed">
                  {searchQuery 
                    ? `No registrations match your search "${searchQuery}". Please check for typos or clear your filter.` 
                    : 'There are currently no active events in this category. Check back soon for new club updates!'}
                </p>

                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors inline-block"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="events-grid-container">
                {filteredEvents.map(event => (
                  <EventCard key={event.id || event._id} event={event} />
                ))}
              </div>
            )}
          </div>
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
