'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { 
  adminLoginApi, 
  fetchEvents, 
  updateEventStatusApi,
  deleteEventApi
} from '../../services/api.service';
import { EventItem, EventStatus } from '../../types/event.types';
import { 
  Lock, 
  LogOut, 
  Plus, 
  Calendar, 
  FileText, 
  Users, 
  CalendarX,
  Trash2,
  Pencil
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await adminLoginApi(emailInput, passwordInput);
      if (res.success && res.token) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminToken', res.token);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid Admin Email or Password');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadAdminEvents = async () => {
    setLoading(true);
    try {
      // Pass includeDone=true so admins see ALL events (including DONE)
      const eventsList = await fetchEvents(true);
      setEvents(eventsList);
    } catch (err) {
      console.error('Failed loading admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken');
      if (token) setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminEvents();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    setUpdatingStatusId(eventId);
    try {
      await updateEventStatusApi(eventId, newStatus);
      await loadAdminEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(eventId);
    try {
      await deleteEventApi(eventId);
      await loadAdminEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full border border-[#f7f1e5]/10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#800020]/30 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Admin Portal Access</h1>
            <p className="text-xs text-[#a69181] mb-6">Enter admin email & password to manage events, QR check-ins, and submissions.</p>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="form-group text-left">
                <label className="form-label">Admin Email</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="admin@hitianinside.in"
                  className="form-input text-sm"
                  required
                />
              </div>

              <div className="form-group text-left">
                <label className="form-label">Admin Password</label>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="form-input text-sm font-mono"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="btn-primary w-full py-2.5 justify-center text-sm font-semibold mt-2 inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{authLoading ? 'Verifying...' : 'Unlock Admin Panel'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Admin Console & <span className="gradient-text">Event Management</span>
            </h1>
            <p className="text-xs text-[#a69181] mt-1">Host new events, design custom registration forms, and manage event statuses.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin/events/create"
              className="btn-primary text-xs inline-flex items-center gap-1.5 shadow-lg shadow-[#800020]/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Event</span>
            </Link>
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                if (typeof window !== 'undefined') sessionStorage.removeItem('adminToken');
              }}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Hosted Events Directory */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Hosted Events Directory</h2>
              <p className="text-xs text-[#a69181] mt-0.5">Control status visibility (`UPCOMING`, `LIVE`, `DONE`) and open form builders.</p>
            </div>
            <span className="text-xs font-mono text-[#e6c594]">Total: {events.length}</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#a69181]">
              <div className="inline-block w-6 h-6 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-[#a69181] border border-dashed border-white/10 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#a69181]">
                <CalendarX className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No Events Created Yet</p>
              <p className="text-xs text-[#a69181] mb-6">Click "+ Create New Event" to publish your first official event!</p>
              <Link 
                href="/admin/events/create" 
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Event</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(ev => {
                const eventId = ev.id || ev._id || '';
                return (
                  <div key={eventId} className="bg-[#180509] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#e6c594]/30 transition-all">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{ev.title}</h3>
                        
                        {/* Status Switcher Badge */}
                        <select 
                          value={ev.status || 'UPCOMING'}
                          disabled={updatingStatusId === eventId}
                          onChange={(e) => handleStatusChange(eventId, e.target.value as EventStatus)}
                          className={`text-[10px] font-bold rounded-full px-3 py-1 border outline-none cursor-pointer ${
                            ev.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            ev.status === 'DONE' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                            'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <option value="UPCOMING">UPCOMING (Registration Open)</option>
                          <option value="LIVE">LIVE NOW</option>
                          <option value="DONE">DONE (Hidden from Public)</option>
                        </select>
                      </div>

                      <p className="text-xs text-[#a69181] line-clamp-2">{ev.description}</p>
                      
                      <div className="flex items-center gap-4 text-[11px] text-[#a69181]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#e6c594]" />
                          {ev.date}
                        </span>
                        <span>📍 {ev.location}</span>
                        <span>🏢 {ev.organizer}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link 
                        href={`/admin/events/${eventId}/edit`}
                        className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                        title="Edit Details & Upload Banners"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Banners & Details</span>
                      </Link>

                      <Link 
                        href={`/admin/events/${eventId}/form-builder`}
                        className="px-3 py-2 rounded-xl bg-[#800020]/30 hover:bg-[#800020] text-[#e6c594] border border-[#e6c594]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Form Builder</span>
                      </Link>

                      <Link 
                        href={`/admin/events/${eventId}/submissions`}
                        className="btn-secondary text-xs py-2 inline-flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Registrations</span>
                      </Link>

                      {/* Delete Event Button */}
                      <button
                        onClick={() => handleDeleteEvent(eventId, ev.title)}
                        disabled={deletingId === eventId}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all text-xs font-semibold"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
