'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import CertificateVerifierModal from '../components/CertificateVerifierModal';
import { fetchEvents } from '../services/api.service';
import { EventItem } from '../types/event.types';

const DEMO_EVENTS: EventItem[] = [
  {
    id: 'demo-1',
    title: 'HITian Tech Symposium 2026',
    description: 'Annual flagship technical symposium featuring AI workshops, competitive coding contests, and guest lectures. Submit project abstracts & media upon registration.',
    date: '2026-09-15',
    location: 'Main Auditorium',
    organizer: 'HITian Tech Club',
    hasAttendance: true,
    requireFileUpload: true
  },
  {
    id: 'demo-2',
    title: 'Design-a-Thon UI/UX Challenge',
    description: 'Create revolutionary web interfaces and compete for prizes in this 24-hour rapid prototyping hackathon.',
    date: '2026-10-02',
    location: 'Computer Lab 3',
    organizer: 'Creative Wing',
    hasAttendance: true,
    requireFileUpload: true
  },
  {
    id: 'demo-3',
    title: 'Cultural Fest & Talent Hunt',
    description: 'Showcase music, dance, and drama performances in the biggest inter-society cultural extravaganza of the year.',
    date: '2026-11-20',
    location: 'Open Air Theatre',
    organizer: 'Cultural Wing',
    hasAttendance: true,
    requireFileUpload: false
  }
];

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents();
      if (data && data.length > 0) {
        setEvents(data);
        setIsBackendConnected(true);
      } else {
        setEvents(DEMO_EVENTS);
      }
    } catch (err) {
      console.warn('Backend unavailable, displaying showcase events.');
      setEvents(DEMO_EVENTS);
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = events.filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#150408] text-[#fdfbf7] w-full">
      <Navbar onOpenVerifyModal={() => setIsVerifyModalOpen(true)} />

      <main className="flex-1 w-full container-custom py-8">
        <section className="hero-wrapper">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#800020]/25 border border-[#e6c594]/30 text-[#e6c594] text-xs font-semibold mb-6">
            ✨ HITian Inside Official Event & Certificate Portal
          </div>

          <h1 className="hero-title">
            Event Registration & <span className="gradient-text">Certificate Verification</span>
          </h1>

          <p className="hero-subtitle">
            Explore upcoming official events, submit project registrations with media uploads, and instantly verify official participation & merit certificates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="#explore" 
              className="btn-primary shadow-[#e6c594]/25"
            >
              Explore Events & Form Submissions ↓
            </a>
            <button 
              onClick={() => setIsVerifyModalOpen(true)}
              className="btn-secondary"
            >
              📜 Verify Certificate
            </button>
          </div>

          <div className="metrics-grid-container">
            <div className="glass-panel p-4 text-center border-[#f7f1e5]/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#e6c594]">100%</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Verified Certificates</p>
            </div>
            <div className="glass-panel p-4 text-center border-[#f7f1e5]/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#f7f1e5]">50+</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Official Events</p>
            </div>
            <div className="glass-panel p-4 text-center border-[#f7f1e5]/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#e6c594]">2,500+</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Form Submissions</p>
            </div>
            <div className="glass-panel p-4 text-center border-[#f7f1e5]/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#f7f1e5]">QR</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Attendance Verified</p>
            </div>
          </div>
        </section>

        <section id="explore" className="pt-12 pb-12 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 w-full">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#fdfbf7]">Official Events & Form Submissions</h2>
              <p className="text-xs text-[#a69181] mt-1 font-medium">
                {isBackendConnected 
                  ? '⚡ Connected to Express Backend API' 
                  : 'ℹ️ Showing showcase events (start Express backend on port 5000 to connect live)'}
              </p>
            </div>

            <div className="w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Search events or clubs..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#e6d7c3]">
              <div className="inline-block w-8 h-8 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Fetching events from server...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel p-12 text-center my-8">
              <p className="text-[#e6d7c3] text-sm mb-4">No events found matching your search.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="btn-secondary text-xs"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="events-grid-container">
              {filteredEvents.map(event => (
                <EventCard key={event.id || event._id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#f7f1e5]/10 bg-[#100306] py-8 mt-auto w-full">
        <div className="container-custom text-center text-xs text-[#a69181]">
          <p>© 2026 HITian Inside. Official Event & Certificate Verification Portal.</p>
        </div>
      </footer>

      <CertificateVerifierModal 
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </div>
  );
}
