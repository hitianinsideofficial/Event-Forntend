'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import { fetchEvents } from '../services/api.service';
import { EventItem } from '../types/event.types';
import { CalendarX, Search } from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Fetches active events (UPCOMING & LIVE only, excludes DONE)
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

  const filteredEvents = events.filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#150408] text-[#fdfbf7] w-full">
      <Navbar />

      <main className="flex-1 w-full container-custom py-10">
        {/* Main Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#f7f1e5]/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Official Event <span className="gradient-text">Registrations</span>
            </h1>
            <p className="text-xs text-[#a69181] mt-1 font-medium">
              Official portal for HITian Inside club event registrations & details.
            </p>
          </div>

          <div className="w-full md:w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#a69181] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input text-xs !pl-10 pr-4 py-2.5 w-full"
              />
            </div>
          </div>
        </div>

        {/* Events Catalog / Directory */}
        <section className="w-full">
          {loading ? (
            <div className="py-20 text-center text-[#e6d7c3]">
              <div className="inline-block w-8 h-8 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Fetching active events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel p-12 text-center my-6 border border-[#f7f1e5]/10 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#800020]/20 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto mb-4">
                <CalendarX className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Live Events Currently Available</h3>
              <p className="text-xs text-[#a69181] leading-relaxed max-w-md mx-auto">
                {searchQuery 
                  ? `No events found matching "${searchQuery}". Try clearing your search query.` 
                  : 'There are currently no active or published events for registration. Check back soon!'}
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

      <footer className="border-t border-[#f7f1e5]/10 bg-[#100306] py-6 mt-auto w-full">
        <div className="container-custom text-center text-xs text-[#a69181]">
          <p>© 2026 HITian Inside. Official Event Portal.</p>
        </div>
      </footer>
    </div>
  );
}
