'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../../../components/Navbar';
import { fetchEventById, submitRegistrationApi } from '../../../../services/api.service';
import { EventItem } from '../../../../types/event.types';
import { SubmissionItem } from '../../../../types/submission.types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Video,
  Send,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react';

export default function DedicatedEventRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [file, setFile] = useState<File | null>(null);

  const [ticket, setTicket] = useState<SubmissionItem | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const loadEventDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err) {
        setError('Failed to load event registration form.');
      } finally {
        setLoading(false);
      }
    };

    loadEventDetails();
  }, [eventId]);

  const handleAnswerChange = (fieldId: string, label: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [label]: value
    }));
  };

  const handleCheckboxToggle = (label: string, option: string) => {
    const currentList: string[] = answers[label] || [];
    const updated = currentList.includes(option)
      ? currentList.filter(item => item !== option)
      : [...currentList, option];
    
    setAnswers(prev => ({ ...prev, [label]: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email) {
      setError('Please provide your Full Name and Email address.');
      return;
    }

    setSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('eventId', eventId);
      formPayload.append('fullName', fullName);
      formPayload.append('email', email);
      if (phone) formPayload.append('phone', phone);
      formPayload.append('answers', JSON.stringify(answers));

      if (file) {
        formPayload.append('files', file);
      }

      const res = await submitRegistrationApi(formPayload);
      if (res.success && res.data) {
        setTicket(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold mb-2 text-white">Event Registration Unavailable</h2>
          <p className="text-xs text-[#a69181] mb-6">The requested event details or registration form could not be loaded.</p>
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <Link 
          href={`/events/${eventId}`} 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Details & Rules</span>
        </Link>

        {ticket ? (
          /* REGISTRATION CONFIRMED TICKET SCREEN */
          <div className="glass-panel p-8 text-center border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/10 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Registration Confirmed!</h1>
            <p className="text-xs text-[#a69181] mb-6">
              You are officially registered for <strong className="text-white">{ticket.eventTitle}</strong>.
            </p>

            {/* Optional QR Code Render */}
            {event.hasAttendance && (
              <div className="bg-white p-6 rounded-2xl inline-block shadow-xl mb-6">
                <QRCodeSVG 
                  value={ticket.qrCodeUrl || JSON.stringify({ ticketId: ticket.ticketId, eventId: ticket.eventId })} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-slate-900 font-mono font-bold text-sm mt-2 tracking-wider">
                  {ticket.ticketId}
                </p>
              </div>
            )}

            <div className="bg-[#180509] p-5 rounded-2xl text-left text-xs space-y-3 mb-6 border border-white/10">
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-[#a69181]">Ticket ID:</span> 
                <span className="font-mono font-bold text-[#e6c594]">{ticket.ticketId}</span>
              </div>
              <div className="flex justify-between"><span className="text-[#a69181]">Attendee Name:</span> <span className="font-semibold text-white">{ticket.fullName}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Email Address:</span> <span className="font-semibold text-white">{ticket.email}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Event Mode:</span> <span className="font-semibold text-cyan-300">{event.mode || 'OFFLINE'}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Status:</span> <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Registered</span></div>

              {ticket.files && ticket.files.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[#a69181]">Uploaded Media:</span>
                  <a href={ticket.files[0].driveLink || ticket.files[0].localUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline truncate max-w-[200px]">
                    {ticket.files[0].originalName}
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => window.print()} className="btn-secondary text-xs inline-flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Confirmation Ticket</span>
              </button>
              <Link href="/" className="btn-primary text-xs">
                Back to Events Catalog
              </Link>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
            <div className="mb-6 pb-4 border-b border-white/10">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#e6c594] px-2.5 py-0.5 rounded bg-[#800020]/30 border border-[#e6c594]/30">
                Official Registration Form
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-1">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a69181] mt-2">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#e6c594]" />
                  {event.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  {event.mode === 'ONLINE' ? <Globe className="w-3.5 h-3.5 text-cyan-400" /> : <MapPin className="w-3.5 h-3.5 text-[#e6c594]" />}
                  {event.location}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Attendee Basic Credentials */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#e6c594] pb-1 border-b border-white/5">
                  1. Participant Information
                </h3>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name..."
                    className="form-input text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@heritageit.edu.in"
                      className="form-input text-sm"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="form-input text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields */}
              {event.customFields && event.customFields.length > 0 && (
                <div className="space-y-5 pt-2">
                  <h3 className="text-sm font-bold text-[#e6c594] pb-1 border-b border-white/5">
                    2. Event Specific Questions
                  </h3>

                  {event.customFields.map((field) => (
                    <div key={field.id} className="form-group bg-[#180509] p-4 rounded-xl border border-white/5">
                      <label className="form-label font-semibold text-white flex justify-between">
                        <span>{field.label} {field.required && <span className="text-rose-400">*</span>}</span>
                        <span className="text-[10px] text-[#a69181] capitalize">({field.type})</span>
                      </label>

                      {field.description && (
                        <p className="text-[11px] text-[#a69181] mb-2">{field.description}</p>
                      )}

                      {/* Render Question Field according to type */}
                      {field.type === 'text' && (
                        <input 
                          type="text"
                          required={field.required}
                          onChange={e => handleAnswerChange(field.id, field.label, e.target.value)}
                          placeholder="Your answer..."
                          className="form-input text-xs"
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea 
                          rows={3}
                          required={field.required}
                          onChange={e => handleAnswerChange(field.id, field.label, e.target.value)}
                          placeholder="Your detailed answer..."
                          className="form-textarea text-xs"
                        />
                      )}

                      {field.type === 'select' && (
                        <select 
                          required={field.required}
                          onChange={e => handleAnswerChange(field.id, field.label, e.target.value)}
                          className="form-select text-xs"
                        >
                          <option value="">Select option...</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'radio' && (
                        <div className="space-y-1.5 pt-1">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs text-[#e6d7c3] cursor-pointer">
                              <input 
                                type="radio" 
                                name={field.id}
                                value={opt}
                                required={field.required}
                                onChange={e => handleAnswerChange(field.id, field.label, e.target.value)}
                                className="text-[#800020]"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <div className="space-y-1.5 pt-1">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs text-[#e6d7c3] cursor-pointer">
                              <input 
                                type="checkbox"
                                value={opt}
                                onChange={() => handleCheckboxToggle(field.label, opt)}
                                className="rounded text-[#800020]"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'url' && (
                        <input 
                          type="url"
                          required={field.required}
                          onChange={e => handleAnswerChange(field.id, field.label, e.target.value)}
                          placeholder="https://github.com/user/project or https://drive.google.com/..."
                          className="form-input text-xs font-mono"
                        />
                      )}

                      {['file', 'image', 'video'].includes(field.type) && (
                        <div className="mt-2">
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] hover:border-[#e6c594]/40 transition-colors cursor-pointer text-center">
                            <UploadCloud className="w-6 h-6 text-[#e6c594] mb-2" />
                            <span className="text-xs font-medium text-white mb-0.5">
                              {file ? file.name : `Click to Upload ${field.type.toUpperCase()} File`}
                            </span>
                            <span className="text-[10px] text-[#a69181]">Max size 50MB (Uploaded to Google Drive)</span>
                            <input 
                              type="file" 
                              required={field.required}
                              onChange={e => setFile(e.target.files?.[0] || null)}
                              accept={
                                field.type === 'image' ? 'image/*' :
                                field.type === 'video' ? 'video/*' : '*/*'
                              }
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <Link href={`/events/${eventId}`} className="btn-secondary text-xs">
                  ← Back to Details
                </Link>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm min-w-[180px] justify-center inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Form...' : 'Complete Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
