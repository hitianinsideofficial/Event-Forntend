'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { fetchEventById } from '../../../services/api.service';
import { EventItem } from '../../../types/event.types';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Globe, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Info,
  CheckCircle
} from 'lucide-react';

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!eventId) return;

    const loadEventDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event details:', err);
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
          <p className="text-xs text-[#a69181] mb-6">The requested event details are unavailable or unlisted.</p>
          <Link href="/" className="btn-secondary text-sm inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Event Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Events</span>
          </Link>

          {/* TOP REGISTER BUTTON */}
          <Link 
            href={`/events/${eventId}/register`}
            className="btn-primary text-xs py-2 px-5 shadow-lg shadow-[#e6c594]/25 inline-flex items-center gap-1.5"
          >
            <span>Register Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Event Main Banner */}
        <div className="glass-panel p-6 sm:p-8 mb-8 border border-[#f7f1e5]/10 relative overflow-hidden">
          {event.bannerUrl && (
            <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-2xl">
              <img 
                src={event.bannerUrl} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#800020]/25 text-[#e6c594] border border-[#e6c594]/30">
                {event.organizer || 'HITian Inside'}
              </span>

              {event.mode === 'ONLINE' ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ONLINE EVENT</span>
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-300" />
                  <span>IN-PERSON VENUE</span>
                </span>
              )}

              {event.hasAttendance && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Attendance Pass</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-[#a69181] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#e6c594]" />
                {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {event.mode === 'ONLINE' ? <Globe className="w-3.5 h-3.5 text-cyan-400" /> : <MapPin className="w-3.5 h-3.5 text-[#e6c594]" />}
                {event.location}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            {event.title}
          </h1>

          <p className="text-[#e6d7c3]/90 text-sm sm:text-base leading-relaxed max-w-3xl mb-6">
            {event.description}
          </p>

          {/* Event Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {event.highlights.map((h, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#180509]/80 border border-white/5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#800020]/30 border border-[#e6c594]/20 text-[#e6c594]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#e6c594]">{h.title}</h4>
                    <p className="text-[11px] text-[#a69181] mt-0.5">{h.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules, Guidelines & Information Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 glass-panel p-6 border border-[#f7f1e5]/10 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#e6c594]" />
              <span>Event Rules & Guidelines</span>
            </h2>

            <div className="space-y-3 text-xs text-[#e6d7c3]/90 leading-relaxed">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#180509] border border-white/5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Official Student Verification</strong>
                  All participants must fill out accurate details during registration. Valid college credentials will be checked.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#180509] border border-white/5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Submission & Deadlines</strong>
                  If the event requires project file uploads or links, ensure submitted files are accessible and uploaded prior to the deadline.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#180509] border border-white/5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Certificate Eligibility</strong>
                  Participation & merit certificates will be issued via the HITian Inside portal upon event completion.
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border border-[#f7f1e5]/10 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-300" />
                <span>Important Details</span>
              </h3>
              <ul className="space-y-2 text-xs text-[#a69181] border-t border-white/10 pt-3">
                <li className="flex justify-between"><span>Host:</span> <strong className="text-white">{event.organizer || 'HITian Inside'}</strong></li>
                <li className="flex justify-between"><span>Format:</span> <strong className="text-cyan-300">{event.mode || 'OFFLINE'}</strong></li>
                <li className="flex justify-between"><span>Date:</span> <strong className="text-[#e6c594]">{event.date}</strong></li>
                <li className="flex justify-between"><span>Location:</span> <strong className="text-white">{event.location}</strong></li>
              </ul>
            </div>

            <Link 
              href={`/events/${eventId}/register`}
              className="btn-primary text-xs w-full py-2.5 justify-center mt-6 shadow-lg shadow-[#e6c594]/20 inline-flex items-center gap-1.5"
            >
              <span>Proceed to Registration Form</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
