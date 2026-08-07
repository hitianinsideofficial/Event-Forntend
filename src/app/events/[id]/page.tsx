'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { fetchEventById, submitRegistrationApi } from '../../../services/api.service';
import { EventItem } from '../../../types/event.types';
import { SubmissionItem } from '../../../types/submission.types';
import { QRCodeSVG } from 'qrcode.react';

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
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
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
        setEvent({
          id: eventId,
          title: 'HITian Tech Symposium 2026',
          description: 'Annual technical symposium featuring workshops, hackathons, and guest lectures. Upload your project proposal or presentation slides upon registration.',
          date: '2026-09-15',
          location: 'Main Auditorium',
          organizer: 'HITian Tech Club',
          hasAttendance: true,
          requireFileUpload: true,
          customFields: [
            { id: 'field_dept', label: 'Department & Year', type: 'text', required: true }
          ]
        });
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

  const handleCustomChange = (fieldId: string, value: string) => {
    setCustomAnswers(prev => ({ ...prev, [fieldId]: value }));
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
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <Link href="/" className="btn-secondary text-sm">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium">
          ← Back to Events
        </Link>

        <div className="glass-panel p-6 sm:p-8 mb-8 border border-[#f7f1e5]/10 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#800020]/25 text-[#e6c594] border border-[#e6c594]/30">
              {event.organizer || 'HITian Inside'}
            </span>
            <div className="flex items-center gap-3 text-xs text-[#a69181] font-medium">
              <span>📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>📍 {event.location}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            {event.title}
          </h1>

          <p className="text-[#e6d7c3]/80 text-sm sm:text-base leading-relaxed max-w-3xl">
            {event.description}
          </p>
        </div>

        {ticket ? (
          <div className="glass-panel p-8 max-w-xl mx-auto text-center border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/10 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
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
              <button onClick={() => window.print()} className="btn-secondary text-xs">
                🖨️ Print / Download Ticket
              </button>
              <button onClick={() => setTicket(null)} className="btn-primary text-xs">
                Register Another Person
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-8 max-w-2xl mx-auto border border-[#f7f1e5]/10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Event Registration Form</h2>
                <p className="text-xs text-[#a69181] mt-0.5">Please provide your details below.</p>
              </div>
              {event.hasAttendance && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  📲 QR Attendance Enabled
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

              {event.customFields && event.customFields.map(field => (
                <div key={field.id} className="form-group">
                  <label className="form-label">{field.label} {field.required && '*'}</label>
                  <input 
                    type={field.type || 'text'}
                    value={customAnswers[field.id] || ''}
                    onChange={(e) => handleCustomChange(field.id, e.target.value)}
                    className="form-input"
                    required={field.required}
                  />
                </div>
              ))}

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
                  <div className="space-y-1">
                    <span className="text-2xl">📁</span>
                    <p className="text-xs text-[#e6d7c3] font-medium">
                      {selectedFile ? `Selected: ${selectedFile.name}` : 'Click or Drag & Drop PNGs, MP4 videos, or documents'}
                    </p>
                    <p className="text-[10px] text-[#a69181]">Max file size 50MB. Uploads stored automatically in Google Drive.</p>
                  </div>
                </div>
              </div>

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
