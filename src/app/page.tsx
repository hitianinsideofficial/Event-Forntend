'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import CertificateVerifierModal from '../components/CertificateVerifierModal';
import { fetchEvents } from '../services/api.service';
import { EventItem } from '../types/event.types';

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents();
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
              <span className="text-2xl sm:text-3xl font-extrabold text-[#f7f1e5]">{events.length}</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Active Events</p>
            </div>
            <div className="glass-panel p-4 text-center border-[#f7f1e5]/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#e6c594]">Drive</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Media Storage</p>
            </div>
            <div className="glass-panel p-4 text-center border-[#f7f1e5]/10">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#f7f1e5]">QR</span>
              <p className="text-xs text-[#a69181] mt-1 font-medium">Attendance System</p>
            </div>
          </div>
        </section>

        <section id="explore" className="pt-12 pb-12 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 w-full">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#fdfbf7]">Official Events & Form Submissions</h2>
              <p className="text-xs text-[#a69181] mt-1 font-medium">
                Official events published by HITian Inside Administrators.
              </p>
            </div>

            {events.length > 0 && (
              <div className="w-full sm:w-80">
                <input 
                  type="text" 
                  placeholder="Search events or clubs..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input text-sm"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#e6d7c3]">
              <div className="inline-block w-8 h-8 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Fetching events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel p-12 text-center my-8 border border-[#f7f1e5]/10 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#800020]/20 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto mb-4 text-3xl">
                📅
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Live Events Currently Available</h3>
              <p className="text-xs text-[#a69181] leading-relaxed max-w-md mx-auto">
                {searchQuery 
                  ? `No events found matching "${searchQuery}". Try clearing your search.` 
                  : 'Currently, there are no active or published events. Check back soon or access the admin panel via URL to host an event!'}
              </p>

              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="btn-secondary text-xs mt-6"
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
