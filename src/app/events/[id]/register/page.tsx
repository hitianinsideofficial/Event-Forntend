'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  Send, 
  Calendar, 
  MapPin, 
  Globe,
  Flag,
  Film,
  Palette,
  Camera,
  BookOpen,
  AlertCircle,
  FileCheck
} from 'lucide-react';

const DEPT_CODES: Record<string, string> = {
  'Agriculture Engineering': 'AGE',
  'Applied Electronics and Instrumentation Engineering': 'AEIE',
  'Biotechnology': 'BT',
  'Computer Science Engineering': 'CSE',
  'Computer Science Engineering (AIML)': 'AIML',
  'Computer Science Engineering (CS)': 'CS',
  'Computer Science Engineering (DS)': 'DS',
  'Chemical Engineering': 'CHE',
  'Electrical Engineering': 'EE',
  'Electronics and Communication Engineering': 'ECE',
  'Civil Engineering': 'CE',
  'Food Technology': 'FT',
  'Mechanical Engineering': 'ME'
};

const YEAR_CODES: Record<string, string> = {
  'First Year (26)': '26',
  'Second Year (25)': '25',
  'Third Year (27)': '27',
  'Fourth Year (28)': '28'
};

interface SwarajDomain {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  accept: string;
  maxSize: string;
  themes: string[];
  rules: string[];
}

const SWARAJ_DOMAINS: SwarajDomain[] = [
  {
    id: 'tricolens',
    title: 'TRICOLENS',
    subtitle: 'REEL MAKING',
    icon: Film,
    accept: 'video/mp4,video/*',
    maxSize: '1 GB',
    themes: [
      'The Price of Freedom',
      'One Minute Through India\'s Journey',
      'The Cost of One Flag'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'Reel size should be within 1 GB.',
      'Videos should be submitted only in MP4 format.',
      'Plagiarised submission is strictly forbidden and will be rejected.',
      'All submission should be done through this portal only.',
      'Deadline for submission of entries: 15 August, 11:59 pm.'
    ]
  },
  {
    id: 'patriots_palette',
    title: "PATRIOT'S PALETTE",
    subtitle: 'ARTWORK AND DIGITAL ART',
    icon: Palette,
    accept: '.jpg,.jpeg,.png,.psd,.tiff,.ai,image/*',
    maxSize: '100 MB',
    themes: [
      'Threads of Unity',
      'Pixels of Patriotism',
      'Youth: The Voice and Today'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'Judgement for Digital Art and Canvas Art will be done separately.',
      'File size should not exceed 100 MB.',
      'The raw file of Digital Art (psd, tiff or ai) has to be attached with the edited artwork.',
      'Artworks should be submitted only in JPG/PNG format.',
      'Plagiarised submission is strictly forbidden and will be rejected.',
      'Deadline for submission of entries: 15 August, 11:59 pm.'
    ]
  },
  {
    id: 'aperture',
    title: 'APERTURE OF FREEDOM',
    subtitle: 'PHOTOGRAPHY',
    icon: Camera,
    accept: '.jpg,.jpeg,.png,image/*',
    maxSize: '100 MB',
    themes: [
      'Roots of India',
      'Unsung Heroes',
      'Tiranga Palette'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'The clicked pictures should be in line with the themes mentioned.',
      'The pictures clicked should be of size less than 100 MB.',
      'Write a caption along with your submission mentioning the theme (not compulsory).',
      'If necessary, you can be asked to submit the raw file of the submission.',
      'Only minimal editing is allowed. Any use of AI is strictly prohibited.',
      'Pictures should be submitted only in JPG/PNG format.',
      'Deadline for submission of entries: 15 August, 11:59 pm.'
    ]
  },
  {
    id: 'inkquilab',
    title: 'INKQUILAB',
    subtitle: 'CREATIVE WRITING',
    icon: BookOpen,
    accept: '.pdf,.doc,.docx',
    maxSize: '10 MB',
    themes: [
      'The Price of Silence',
      'Dreaming India 2047',
      'The Railway Platform, 1947'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'Participants can submit their entries only in English, Bengali and Hindi.',
      'Word limit: 300 words.',
      'File size should not exceed 10 MB.',
      'Write-ups should be submitted only in PDF/DOC format.',
      'Plagiarised submission is strictly forbidden and will be rejected.',
      'Deadline for submission of entries: 15 August, 11:59 pm.'
    ]
  }
];

export default function DedicatedEventRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Step 1: Attendee Info
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [rollSuffix, setRollSuffix] = useState<string>('');

  // Step 2: Domain & Theme Selection
  const [activeStep, setActiveStep] = useState<number>(1); // 1 = Registration, 2 = Domain Submission
  const [selectedDomainId, setSelectedDomainId] = useState<string>('tricolens');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  // Generic fallback custom field answers
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

  const isSwarajEHind = event?.isFlagship || event?.theme === 'TRICOLOUR' || event?.title.toLowerCase().includes('swaraj');

  // Computed Auto-Prefilled Roll Number Prefix
  const deptCode = DEPT_CODES[selectedDept] || '';
  const yearCode = YEAR_CODES[selectedYear] || '';
  const computedRollPrefix = (yearCode && deptCode) ? `${yearCode}/${deptCode}/` : '';
  const fullRollNumber = computedRollPrefix ? `${computedRollPrefix}${rollSuffix.trim()}` : rollSuffix.trim();

  const handleNextToDomainSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !phone) {
      setError('Please provide your Full Name, Email address, and Mobile Phone Number.');
      return;
    }

    if (isSwarajEHind) {
      if (!selectedDept || !selectedYear || !rollSuffix) {
        setError('Please select your Department, Academic Year, and enter your Roll Number.');
        return;
      }
    }

    // Advance to Step 2 for Swaraj-E-Hind domain & theme submission
    if (isSwarajEHind) {
      setActiveStep(2);
    } else {
      handleFinalSubmission(e);
    }
  };

  const handleFinalSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSwarajEHind) {
      if (!selectedTheme) {
        setError('Please select a theme for your chosen competition domain.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const activeDomainObj = SWARAJ_DOMAINS.find(d => d.id === selectedDomainId);

      const combinedAnswers: Record<string, any> = {
        ...answers,
        'Department': selectedDept,
        'Academic Year': selectedYear,
        'College Roll Number': fullRollNumber
      };

      if (isSwarajEHind && activeDomainObj) {
        combinedAnswers['Selected Domain'] = `${activeDomainObj.title} (${activeDomainObj.subtitle})`;
        combinedAnswers['Selected Theme'] = selectedTheme;
        if (caption) combinedAnswers['Caption / Write-up / Raw Notes'] = caption;
      }

      const formPayload = new FormData();
      formPayload.append('eventId', eventId);
      formPayload.append('fullName', fullName);
      formPayload.append('email', email);
      formPayload.append('phone', phone);
      formPayload.append('answers', JSON.stringify(combinedAnswers));

      const fileToUpload = submissionFile || file;
      if (fileToUpload) {
        formPayload.append('files', fileToUpload);
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

  const selectedDomainObj = SWARAJ_DOMAINS.find(d => d.id === selectedDomainId) || SWARAJ_DOMAINS[0];

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link 
          href={`/events/${eventId}`} 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Details & Rules</span>
        </Link>

        {ticket ? (
          /* REGISTRATION CONFIRMED TICKET SCREEN */
          <div className="glass-panel p-8 text-center border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Registration & Submission Confirmed!</h1>
            <p className="text-xs text-[#a69181] mb-6">
              You are officially registered for <strong className="text-white">{ticket.eventTitle}</strong>. A confirmation email with your ticket details has been dispatched.
            </p>

            {/* Ticket Badge */}
            <div className="bg-[#180509] p-6 rounded-2xl text-left text-xs space-y-3 mb-6 border border-white/10 max-w-lg mx-auto">
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-[#a69181]">Ticket ID:</span> 
                <span className="font-mono font-bold text-[#ff9933] text-sm">{ticket.ticketId}</span>
              </div>
              <div className="flex justify-between"><span className="text-[#a69181]">Attendee Name:</span> <span className="font-semibold text-white">{ticket.fullName}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Email Address:</span> <span className="font-semibold text-white">{ticket.email}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Mobile Number:</span> <span className="font-semibold text-white">{ticket.phone}</span></div>
              <div className="flex justify-between"><span className="text-[#a69181]">Status:</span> <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Registered & Submitted</span></div>

              {ticket.answers && (
                <div className="pt-3 border-t border-white/10 space-y-1.5">
                  <span className="text-[11px] text-[#ff9933] font-bold uppercase block">Submission Details:</span>
                  {Object.entries(ticket.answers).map(([key, val], idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-[#a69181]">{key}:</span>
                      <span className="text-white font-medium truncate max-w-[240px]">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {ticket.files && ticket.files.length > 0 && (
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-[#a69181]">Submitted Media File:</span>
                  <a href={ticket.files[0].driveLink || ticket.files[0].localUrl} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold underline truncate max-w-[200px]">
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
              <Link href="/" className="btn-tricolour text-xs py-2 px-5">
                Back to Events Catalog
              </Link>
            </div>
          </div>
        ) : (
          /* REGISTRATION WIZARD */
          <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
            <div className="mb-6 pb-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-[#ff9933] px-2.5 py-0.5 rounded bg-[#ff9933]/20 border border-[#ff9933]/40">
                  🇮🇳 {isSwarajEHind ? 'SWARAJ-E-HIND FLAGSHIP PORTAL' : 'Official Registration Form'}
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-1">
                  {event.title}
                </h1>
              </div>

              {isSwarajEHind && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeStep === 1 ? 'bg-[#ff9933] text-black' : 'bg-white/10 text-white'}`}>
                    1. Student Info
                  </span>
                  <span className="text-xs text-[#a69181]">→</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeStep === 2 ? 'bg-[#138808] text-white' : 'bg-white/10 text-[#a69181]'}`}>
                    2. Domain & File Submission
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: PARTICIPANT INFORMATION & AUTO ROLL NUMBER PREFILL */}
            {activeStep === 1 && (
              <form onSubmit={handleNextToDomainSubmission} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#ff9933] pb-1 border-b border-white/5 flex items-center gap-2">
                    <span>1. Participant Information & Academic Details</span>
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
                      <label className="form-label">Mobile Phone Number *</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="form-input text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Department & Academic Year Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#180509] p-4 rounded-2xl border border-white/10">
                    <div className="form-group mb-0">
                      <label className="form-label text-xs text-white">Department *</label>
                      <select 
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        className="form-select text-xs"
                        required
                      >
                        <option value="">Select Department...</option>
                        {Object.keys(DEPT_CODES).map((dept, i) => (
                          <option key={i} value={dept}>{dept} ({DEPT_CODES[dept]})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mb-0">
                      <label className="form-label text-xs text-white">Academic Year *</label>
                      <select 
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        className="form-select text-xs"
                        required
                      >
                        <option value="">Select Academic Year...</option>
                        {Object.keys(YEAR_CODES).map((yr, i) => (
                          <option key={i} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Smart Roll Number Auto-Prefilled Input */}
                  <div className="form-group bg-[#180509] p-4 rounded-2xl border border-[#ff9933]/30">
                    <label className="form-label font-bold text-white flex items-center justify-between text-xs mb-1">
                      <span>College Roll Number *</span>
                      <span className="text-[10px] text-[#ff9933] font-mono">Format: [Year_code]/[Dept_code]/[number]</span>
                    </label>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {computedRollPrefix ? (
                        <span className="px-3 py-2 rounded-xl bg-[#800020] text-[#ff9933] font-mono font-bold text-sm border border-[#ff9933]/40 shrink-0">
                          {computedRollPrefix}
                        </span>
                      ) : (
                        <span className="px-3 py-2 rounded-xl bg-white/5 text-[#a69181] font-mono text-xs border border-white/10 shrink-0">
                          [Select Year & Dept First]
                        </span>
                      )}

                      <input 
                        type="text" 
                        value={rollSuffix}
                        onChange={e => setRollSuffix(e.target.value)}
                        placeholder="Enter roll number digits (e.g. 042)"
                        className="form-input font-mono text-sm flex-1"
                        required
                      />
                    </div>
                    
                    {fullRollNumber && (
                      <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                        Formatted Full Roll: <strong>{fullRollNumber}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <Link href={`/events/${eventId}`} className="btn-secondary text-xs">
                    ← Cancel
                  </Link>

                  <button 
                    type="submit"
                    className="btn-tricolour text-sm py-2.5 px-6 inline-flex items-center gap-2"
                  >
                    <span>Proceed to Domain Selection →</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: DOMAIN SELECTION & FILE SUBMISSION PORTAL */}
            {activeStep === 2 && isSwarajEHind && (
              <form onSubmit={handleFinalSubmission} className="space-y-6 animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#ff9933]">
                      2. Choose Competition Domain & Theme
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setActiveStep(1)}
                      className="text-xs text-[#a69181] hover:text-white underline"
                    >
                      ← Edit Student Info
                    </button>
                  </div>
                  <p className="text-xs text-[#a69181] mb-4">
                    Participants can participate in up to 2 domains and submit 1 entry per theme.
                  </p>

                  {/* 4 Domain Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {SWARAJ_DOMAINS.map((domain) => {
                      const IconComp = domain.icon;
                      const isSelected = selectedDomainId === domain.id;
                      return (
                        <div 
                          key={domain.id}
                          onClick={() => {
                            setSelectedDomainId(domain.id);
                            setSelectedTheme(''); // Reset theme choice on domain change
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-gradient-to-r from-[#ff9933]/20 via-white/5 to-[#138808]/20 border-2 border-[#ff9933] shadow-lg shadow-[#ff9933]/10' 
                              : 'bg-[#180509] border-white/10 hover:border-white/30 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#ff9933] text-black' : 'bg-white/10 text-white'}`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-white">{domain.title}</h4>
                              <span className="text-[10px] text-[#ff9933] font-bold block uppercase">{domain.subtitle}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#a69181]">Max File: {domain.maxSize}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Domain Rules & Theme Options */}
                <div className="glass-panel p-6 border-2 border-[#ff9933]/40 bg-[#180509] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <span className="px-2.5 py-0.5 rounded bg-[#ff9933]/20 text-[#ff9933] text-xs font-bold">
                      {selectedDomainObj.title} ({selectedDomainObj.subtitle})
                    </span>
                  </div>

                  {/* Theme Selector */}
                  <div className="form-group mb-4">
                    <label className="form-label font-bold text-white text-xs">
                      Select Theme for {selectedDomainObj.title} *
                    </label>
                    <div className="space-y-2 mt-2">
                      {selectedDomainObj.themes.map((thm, idx) => (
                        <label 
                          key={idx} 
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedTheme === thm ? 'bg-[#ff9933]/20 border-[#ff9933] text-white font-bold' : 'bg-black/30 border-white/10 text-[#e6d7c3]'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="swarajTheme" 
                            value={thm} 
                            checked={selectedTheme === thm}
                            onChange={() => setSelectedTheme(thm)}
                            className="text-[#ff9933] accent-[#ff9933]"
                            required
                          />
                          <span className="text-xs">{thm}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Domain Specific Rules */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                    <h5 className="text-xs font-bold text-[#ff9933] flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Domain Rules & Submission Requirements:</span>
                    </h5>
                    <ul className="list-disc list-inside text-[11px] text-[#a69181] space-y-1">
                      {selectedDomainObj.rules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>

                  {/* File Upload Dropzone */}
                  <div className="form-group mb-0">
                    <label className="form-label font-bold text-white text-xs">
                      Upload {selectedDomainObj.title} Submission File *
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#ff9933]/40 rounded-2xl bg-white/[0.02] hover:border-[#ff9933] transition-colors cursor-pointer text-center mt-2">
                      <UploadCloud className="w-8 h-8 text-[#ff9933] mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-white mb-1">
                        {submissionFile ? submissionFile.name : `Click to Upload ${selectedDomainObj.subtitle} File`}
                      </span>
                      <span className="text-[10px] text-[#a69181]">
                        Accepted: {selectedDomainObj.accept} (Max Size: {selectedDomainObj.maxSize})
                      </span>
                      <input 
                        type="file" 
                        onChange={e => setSubmissionFile(e.target.files?.[0] || null)}
                        accept={selectedDomainObj.accept}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>

                  {/* Caption / Note Optional */}
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Caption / Description / Raw File Notes (Optional)</label>
                    <textarea 
                      rows={2}
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="Write a brief caption or mention raw file link if applicable..."
                      className="form-textarea text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(1)} 
                    className="btn-secondary text-xs"
                  >
                    ← Back to Step 1
                  </button>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="btn-tricolour text-sm min-w-[200px] justify-center inline-flex items-center gap-2 py-3 px-6"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting to Swaraj-E-Hind...' : 'Submit to Swaraj-E-Hind 🇮🇳'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
