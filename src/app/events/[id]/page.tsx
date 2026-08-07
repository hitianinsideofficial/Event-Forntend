'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { fetchEventById, submitRegistrationApi } from '../../../services/api.service';
import { EventItem } from '../../../types/event.types';
import { SubmissionItem } from '../../../types/submission.types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Globe,
  QrCode, 
  CheckCircle2, 
  Printer, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Video,
  Sparkles 
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [ticket, setTicket] = useState<SubmissionItem | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const loadDetail = async () => {
      setLoading(true);
      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err) {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomChange = (fieldId: string, value: any) => {
    setCustomAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setCustomAnswers(prev => {
      const currentList: string[] = Array.isArray(prev[fieldId]) ? [...prev[fieldId]] : [];
      if (checked) {
        if (!currentList.includes(option)) currentList.push(option);
      } else {
        const idx = currentList.indexOf(option);
        if (idx > -1) currentList.splice(idx, 1);
      }
      return { ...prev, [fieldId]: currentList };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email) {
      setError('Please fill in your Full Name and Email.');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('eventId', eventId || '1');
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('phone', formData.phone || '');
      data.append('answers', JSON.stringify(customAnswers));
      
      if (selectedFile) {
        data.append('file', selectedFile);
      }

      const res = await submitRegistrationApi(data);
      if (res.success && res.data) {
        setTicket(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Check connection to backend.');
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
          <h2 className="text-2xl font-bold mb-2 text-white">Event Not Found</h2>
          <p className="text-xs text-[#a69181] mb-6">The requested event details are not available or have been unlisted.</p>
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
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events</span>
        </Link>

        {/* Event Header Banner */}
        <div className="glass-panel p-6 sm:p-8 mb-8 border border-[#f7f1e5]/10 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
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

          <p className="text-[#e6d7c3]/80 text-sm sm:text-base leading-relaxed max-w-3xl mb-6">
            {event.description}
          </p>

          {/* Highlights Cards Grid */}
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

        {ticket ? (
          /* TICKET SCREEN */
          <div className="glass-panel p-8 max-w-xl mx-auto text-center border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/10 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Registration Confirmed!</h2>
            <p className="text-xs text-[#a69181] mb-6">Here is your official QR Event Pass for entry.</p>

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

            <div className="bg-[#180509] p-4 rounded-xl text-left text-xs space-y-2 mb-6 border border-white/5">
              <div className="flex justify-between"><span className="text-[#a69181]">Attendee Name:</span> <span className="font-semibold text-white">{ticket.fullName}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Email:</span> <span className="font-semibold text-white">{ticket.email}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Event:</span> <span className="font-semibold text-[#e6c594]">{ticket.eventTitle}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Status:</span> <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">Pending Check-in</span></div>
              {ticket.files && ticket.files.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[#a69181]">Uploaded Media:</span>
                  <a href={ticket.files[0].driveLink || ticket.files[0].localUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline truncate max-w-[200px]">
                    {ticket.files[0].originalName}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => window.print()} className="btn-secondary text-xs inline-flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
              <button onClick={() => setTicket(null)} className="btn-primary text-xs">
                Register Another Person
              </button>
            </div>
          </div>
        ) : (
          /* DYNAMIC REGISTRATION FORM */
          <div className="glass-panel p-6 sm:p-8 max-w-2xl mx-auto border border-[#f7f1e5]/10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Event Registration Form</h2>
                <p className="text-xs text-[#a69181] mt-0.5">Please provide your details below.</p>
              </div>
              {event.hasAttendance && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Attendance Enabled</span>
                </span>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@hit.edu"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number / WhatsApp</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  className="form-input"
                />
              </div>

              {/* Render Dynamic Form Questions */}
              {event.customFields && event.customFields.map(field => (
                <div key={field.id} className="form-group">
                  <label className="form-label">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.description && (
                    <p className="text-[11px] text-[#a69181] -mt-1 mb-1">{field.description}</p>
                  )}

                  {/* Short Answer */}
                  {field.type === 'text' && (
                    <input 
                      type="text"
                      value={customAnswers[field.id] || ''}
                      onChange={(e) => handleCustomChange(field.id, e.target.value)}
                      className="form-input"
                      required={field.required}
                    />
                  )}

                  {/* Long Answer */}
                  {field.type === 'textarea' && (
                    <textarea 
                      rows={3}
                      value={customAnswers[field.id] || ''}
                      onChange={(e) => handleCustomChange(field.id, e.target.value)}
                      className="form-textarea"
                      required={field.required}
                    />
                  )}

                  {/* Dropdown */}
                  {field.type === 'select' && (
                    <select 
                      value={customAnswers[field.id] || ''}
                      onChange={(e) => handleCustomChange(field.id, e.target.value)}
                      className="form-select"
                      required={field.required}
                    >
                      <option value="">Select option...</option>
                      {field.options?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* Checkbox (Multi-select) */}
                  {field.type === 'checkbox' && (
                    <div className="space-y-2 pt-1">
                      {field.options?.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-xs text-[#e6d7c3] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={Array.isArray(customAnswers[field.id]) && customAnswers[field.id].includes(opt)}
                            onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                            className="rounded border-white/20 text-[#800020] focus:ring-0"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Radio Option */}
                  {field.type === 'radio' && (
                    <div className="space-y-2 pt-1">
                      {field.options?.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-xs text-[#e6d7c3] cursor-pointer">
                          <input 
                            type="radio"
                            name={`radio_${field.id}`}
                            value={opt}
                            checked={customAnswers[field.id] === opt}
                            onChange={(e) => handleCustomChange(field.id, e.target.value)}
                            className="text-[#800020] focus:ring-0"
                            required={field.required}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* URL Link */}
                  {field.type === 'url' && (
                    <input 
                      type="url"
                      placeholder="https://..."
                      value={customAnswers[field.id] || ''}
                      onChange={(e) => handleCustomChange(field.id, e.target.value)}
                      className="form-input"
                      required={field.required}
                    />
                  )}

                  {/* File / Image / Video Upload */}
                  {['file', 'image', 'video'].includes(field.type) && (
                    <div className="relative border-2 border-dashed border-[#f7f1e5]/20 rounded-xl p-4 text-center hover:border-[#e6c594]/50 transition-colors bg-[#180509]/60">
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        accept={
                          field.type === 'image' ? 'image/*' :
                          field.type === 'video' ? 'video/*' :
                          'image/*,video/*,application/pdf,application/zip'
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={field.required}
                      />
                      <div className="space-y-2 flex flex-col items-center">
                        {field.type === 'image' ? (
                          <ImageIcon className="w-8 h-8 text-[#e6c594]" />
                        ) : field.type === 'video' ? (
                          <Video className="w-8 h-8 text-[#e6c594]" />
                        ) : (
                          <UploadCloud className="w-8 h-8 text-[#e6c594]" />
                        )}
                        <p className="text-xs text-[#e6d7c3] font-medium">
                          {selectedFile ? `Selected: ${selectedFile.name}` : `Click or Drag & Drop ${field.type.toUpperCase()} file`}
                        </p>
                        <p className="text-[10px] text-[#a69181]">Uploaded files will be stored in Google Drive automatically.</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Standard File Upload Fallback */}
              {(!event.customFields || !event.customFields.some(f => ['file', 'image', 'video'].includes(f.type))) && (
                <div className="form-group">
                  <label className="form-label">
                    Upload Submission File (PNG, JPG, MP4 Video, PDF, ZIP)
                  </label>
                  <div className="relative border-2 border-dashed border-[#f7f1e5]/20 rounded-xl p-4 text-center hover:border-[#e6c594]/50 transition-colors bg-[#180509]/60">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      accept="image/*,video/*,application/pdf,application/zip"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2 flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 text-[#e6c594]" />
                      <p className="text-xs text-[#e6d7c3] font-medium">
                        {selectedFile ? `Selected: ${selectedFile.name}` : 'Click or Drag & Drop PNGs, MP4 videos, or documents'}
                      </p>
                      <p className="text-[10px] text-[#a69181]">Max file size 50MB. Uploads stored automatically in Google Drive.</p>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary w-full py-3 justify-center text-sm font-bold shadow-[#e6c594]/30 mt-6"
              >
                {submitting ? 'Registering & Generating Ticket...' : 'Submit Registration & Get QR Pass'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
