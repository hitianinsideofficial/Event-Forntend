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
  FileCheck,
  Link as LinkIcon,
  Video,
  ShieldAlert,
  Zap,
  PlusCircle,
  Check
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
  maxBytesMb: number;
  isDriveLinkRequired?: boolean;
  themes: string[];
  rules: string[];
}

const SWARAJ_DOMAINS: SwarajDomain[] = [
  {
    id: 'tricolens',
    title: 'TRICOLENS',
    subtitle: 'REEL MAKING',
    icon: Film,
    accept: 'Google Drive Link',
    maxSize: '1 GB (MP4 format)',
    maxBytesMb: 1024,
    isDriveLinkRequired: true,
    themes: [
      'The Price of Freedom',
      'One Minute Through India\'s Journey',
      'The Cost of One Flag'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'MANDATORY: Upload your video reel (Max 1GB, MP4) to personal Google Drive and set access to "Anyone with the link can view".',
      'Paste the viewable Google Drive link in the input field below.',
      'Plagiarised submission is strictly forbidden and will be rejected.',
      'Deadline for submission of entries: 15 August, 11:59 pm.'
    ]
  },
  {
    id: 'patriots_palette',
    title: "PATRIOT'S PALETTE",
    subtitle: 'ARTWORK AND DIGITAL ART',
    icon: Palette,
    accept: '.jpg,.jpeg,.png,.psd,.tiff,.ai,image/*',
    maxSize: 'Under 10 MB (Auto-compressed to < 4 MB)',
    maxBytesMb: 10,
    isDriveLinkRequired: false,
    themes: [
      'Threads of Unity',
      'Pixels of Patriotism',
      'Youth: The Voice and Today'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'Judgement for Digital Art and Canvas Art will be done separately.',
      'File size MUST be under 10 MB (our portal automatically compresses image artwork down to < 4 MB to optimize cloud storage).',
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
    maxSize: 'Under 10 MB (Auto-compressed to < 4 MB)',
    maxBytesMb: 10,
    isDriveLinkRequired: false,
    themes: [
      'Roots of India',
      'Unsung Heroes',
      'Tiranga Palette'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'File size MUST be under 10 MB (our portal automatically compresses photos down to < 4 MB to optimize cloud storage).',
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
    maxSize: 'Less than 4 MB',
    maxBytesMb: 4,
    isDriveLinkRequired: false,
    themes: [
      'The Price of Silence',
      'Dreaming India 2047',
      'The Railway Platform, 1947'
    ],
    rules: [
      'Participants can submit a single entry per theme and participate in max of 2 themes.',
      'Participants can submit their entries only in English, Bengali and Hindi.',
      'Word limit: 300 words.',
      'File size MUST be strictly less than 4 MB.',
      'Write-ups should be submitted only in PDF/DOC format.',
      'Plagiarised submission is strictly forbidden and will be rejected.',
      'Deadline for submission of entries: 15 August, 11:59 pm.'
    ]
  }
];

// Helper: Client-Side Image Compressor (Compresses images < 10MB down to < 4MB WebP)
async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxDim = 2500;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/webp', 0.80);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function DedicatedEventRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Step 1: Attendee Credentials
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [rollSuffix, setRollSuffix] = useState<string>('');

  // Step 2: Domain & Theme Selection
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('tricolens');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [driveReelUrl, setDriveReelUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  
  // Track domains submitted by participant during session
  const [submittedDomains, setSubmittedDomains] = useState<string[]>([]);

  // Generic fallback custom field answers
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [file, setFile] = useState<File | null>(null);
  const [ticket, setTicket] = useState<SubmissionItem | null>(null);

  // Load saved student credentials from session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('swaraj_user_credentials');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.selectedDept) setSelectedDept(parsed.selectedDept);
          if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
          if (parsed.rollSuffix) setRollSuffix(parsed.rollSuffix);
        } catch (e) {}
      }

      const savedSubmitted = sessionStorage.getItem('swaraj_submitted_domains');
      if (savedSubmitted) {
        try {
          setSubmittedDomains(JSON.parse(savedSubmitted));
        } catch (e) {}
      }
    }
  }, []);

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

  const isSwarajEHind = Boolean(
    event?.isFlagship || 
    event?.theme === 'TRICOLOUR' || 
    event?.title?.toLowerCase()?.includes('swaraj') ||
    event?.title?.toLowerCase()?.includes('hind')
  );

  // Computed Auto-Prefilled Roll Number Prefix & Normalized Roll (092 === 92)
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

      // Persist credentials in sessionStorage for fast pre-filling on multi-domain submissions
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('swaraj_user_credentials', JSON.stringify({
          fullName, email, phone, selectedDept, selectedYear, rollSuffix
        }));
      }

      // Pick first unsubmitted domain
      const unsubmitted = SWARAJ_DOMAINS.find(d => !submittedDomains.includes(d.id));
      if (unsubmitted) {
        setSelectedDomainId(unsubmitted.id);
      }
    }

    if (isSwarajEHind) {
      setActiveStep(2);
    } else {
      handleFinalSubmission(e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, maxAllowedMb: number) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setError('');
    const rawMb = rawFile.size / (1024 * 1024);

    if (rawMb > maxAllowedMb) {
      setError(`File size (${rawMb.toFixed(1)} MB) exceeds the maximum allowed limit of ${maxAllowedMb} MB.`);
      setSubmissionFile(null);
      e.target.value = '';
      return;
    }

    if (rawFile.type.startsWith('image/')) {
      setCompressing(true);
      try {
        const compressed = await compressImageFile(rawFile);
        setSubmissionFile(compressed);
      } catch (err) {
        setSubmissionFile(rawFile);
      } finally {
        setCompressing(false);
      }
    } else {
      setSubmissionFile(rawFile);
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

      const activeDomainObj = SWARAJ_DOMAINS.find(d => d.id === selectedDomainId);
      if (activeDomainObj?.isDriveLinkRequired && !driveReelUrl.trim()) {
        setError('Google Drive Video Link is mandatory for TRICOLENS Reel submissions. Please upload your video to Google Drive and paste the shareable link.');
        return;
      }

      if (!activeDomainObj?.isDriveLinkRequired && !submissionFile && !file) {
        setError(`Please upload your submission file for ${activeDomainObj?.title}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const activeDomainObj = SWARAJ_DOMAINS.find(d => d.id === selectedDomainId);

      // Construct clean answers without normalized roll string
      const combinedAnswers: Record<string, any> = {
        ...answers,
        'Department': selectedDept,
        'Academic Year': selectedYear,
        'College Roll Number': fullRollNumber
      };

      if (isSwarajEHind && activeDomainObj) {
        combinedAnswers['Selected Domain'] = `${activeDomainObj.title} (${activeDomainObj.subtitle})`;
        combinedAnswers['Selected Theme'] = selectedTheme;
        if (activeDomainObj.isDriveLinkRequired) {
          combinedAnswers['Google Drive Video Reel Link'] = driveReelUrl.trim();
        }
        if (caption) combinedAnswers['Caption / Write-up / Raw Notes'] = caption;
      }

      const formPayload = new FormData();
      formPayload.append('eventId', eventId);
      formPayload.append('fullName', fullName);
      formPayload.append('email', email);
      formPayload.append('phone', phone);
      formPayload.append('answers', JSON.stringify(combinedAnswers));

      const fileToUpload = submissionFile || file;
      if (fileToUpload && !activeDomainObj?.isDriveLinkRequired) {
        formPayload.append('files', fileToUpload);
      }

      const res = await submitRegistrationApi(formPayload);
      if (res.success && res.data) {
        setTicket(res.data);
        
        // Track submitted domain
        if (activeDomainObj) {
          const updatedSubmitted = Array.from(new Set([...submittedDomains, activeDomainObj.id]));
          setSubmittedDomains(updatedSubmitted);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('swaraj_submitted_domains', JSON.stringify(updatedSubmitted));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAnotherDomainSubmission = () => {
    setTicket(null);
    setSelectedTheme('');
    setDriveReelUrl('');
    setCaption('');
    setSubmissionFile(null);
    setFile(null);
    setError('');

    // Pick next unsubmitted domain
    const nextUnsubmitted = SWARAJ_DOMAINS.find(d => !submittedDomains.includes(d.id));
    if (nextUnsubmitted) {
      setSelectedDomainId(nextUnsubmitted.id);
    }
    setActiveStep(2); // Jump straight to domain selection step with personal details pre-filled!
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
  const isSelectedDomainSubmitted = submittedDomains.includes(selectedDomainId);

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link 
          href={`/events/${eventId}`} 
          className="no-print inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Details & Rules</span>
        </Link>

        {ticket ? (
          /* REGISTRATION CONFIRMED TICKET SCREEN WITH STANDALONE PRINTABLE TICKET PASS */
          <div className="space-y-6">
            <div className="no-print glass-panel p-6 text-center border-2 border-emerald-500/40">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Registration & Submission Confirmed!</h1>
              <p className="text-xs text-[#a69181]">
                Official Ticket Pass issued for <strong className="text-white">{ticket.eventTitle}</strong>. A confirmation email has been sent.
              </p>
            </div>

            {/* STANDALONE OFFICIAL TICKET PASS CARD (PRINTABLE) */}
            <div className="print-ticket-container bg-[#1c060b] border-2 border-[#ff9933] rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-2xl shadow-[#ff9933]/10">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#ff9933] uppercase tracking-widest font-mono">🇮🇳 HITian Inside</span>
                    <span className="text-xs text-[#a69181]">• Official Event Ticket</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {ticket.eventTitle}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    ✓ Verified Pass
                  </span>
                </div>
              </div>

              {/* Grid: Details + QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                <div className="sm:col-span-2 space-y-2.5 text-xs">
                  <div className="flex justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[#a69181]">Ticket ID:</span>
                    <span className="font-mono font-extrabold text-[#ff9933] text-sm">{ticket.ticketId}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[#a69181]">Participant Name:</span>
                    <span className="font-bold text-white">{ticket.fullName}</span>
                  </div>

                  {ticket.answers?.['Department'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">Department:</span>
                      <span className="font-semibold text-white">{ticket.answers['Department']}</span>
                    </div>
                  )}

                  {ticket.answers?.['Academic Year'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">Academic Year:</span>
                      <span className="font-semibold text-white">{ticket.answers['Academic Year']}</span>
                    </div>
                  )}

                  {ticket.answers?.['College Roll Number'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">College Roll Number:</span>
                      <span className="font-bold text-[#ff9933] font-mono">{ticket.answers['College Roll Number']}</span>
                    </div>
                  )}

                  {ticket.answers?.['Selected Domain'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">Selected Domain:</span>
                      <span className="font-bold text-emerald-400">{ticket.answers['Selected Domain']}</span>
                    </div>
                  )}

                  {ticket.answers?.['Selected Theme'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">Chosen Theme:</span>
                      <span className="font-semibold text-white italic">{ticket.answers['Selected Theme']}</span>
                    </div>
                  )}

                  {ticket.answers?.['Caption / Write-up / Raw Notes'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">Caption / Write-up / Raw Notes:</span>
                      <span className="font-medium text-white truncate max-w-[200px]">{ticket.answers['Caption / Write-up / Raw Notes']}</span>
                    </div>
                  )}

                  {ticket.answers?.['Google Drive Video Reel Link'] && (
                    <div className="flex justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[#a69181]">Google Drive Reel Link:</span>
                      <a href={ticket.answers['Google Drive Video Reel Link']} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold underline truncate max-w-[200px]">
                        View Reel Link
                      </a>
                    </div>
                  )}

                  {ticket.files && ticket.files.length > 0 && (
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="text-[#a69181]">Submitted Media File:</span>
                      <a href={ticket.files[0].driveLink || ticket.files[0].localUrl} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold underline truncate max-w-[200px]">
                        {ticket.files[0].originalName}
                      </a>
                    </div>
                  )}
                </div>

                {/* QR Code Pass */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-[#ff9933]/50">
                  <QRCodeSVG value={ticket.ticketId} size={140} />
                  <span className="font-mono text-[10px] font-bold text-black mt-2">
                    {ticket.ticketId}
                  </span>
                </div>
              </div>

              {/* Ticket Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#a69181]">
                <span>Issued by <strong>HITian Inside Team</strong></span>
                <span>www.hitianinside.in</span>
              </div>
            </div>

            {/* SEAMLESS MULTI-DOMAIN SUBMISSION ACTION BUTTONS (HIDDEN ON PRINT) */}
            <div className="no-print flex flex-wrap items-center justify-center gap-3 pt-4">
              {isSwarajEHind && submittedDomains.length < SWARAJ_DOMAINS.length && (
                <button 
                  onClick={handleStartAnotherDomainSubmission} 
                  className="btn-tricolour text-xs py-2.5 px-6 font-extrabold inline-flex items-center gap-1.5 shadow-xl animate-pulse"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Entry for Another Domain 🎨</span>
                </button>
              )}

              <button onClick={() => window.print()} className="btn-secondary text-xs py-2.5 px-5 inline-flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>Print Official Ticket Pass</span>
              </button>
              <Link href="/" className="btn-secondary text-xs py-2.5 px-5">
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
                    2. Domain Submission ({submittedDomains.length}/{SWARAJ_DOMAINS.length} Completed)
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
                  <h3 className="text-sm font-bold text-[#ff9933] pb-1 border-b border-white/5 flex items-center justify-between">
                    <span>1. Participant Information & Academic Details</span>
                    {fullName && <span className="text-[10px] text-emerald-400 font-mono">✓ Credentials Pre-filled</span>}
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
                        placeholder="Enter roll number digits (e.g. 92)"
                        className="form-input font-mono text-sm flex-1"
                        required
                      />
                    </div>
                    
                    {fullRollNumber && (
                      <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                        Full Roll Number: <strong>{fullRollNumber}</strong>
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
                      ← Edit Student Info ({fullName} | {fullRollNumber})
                    </button>
                  </div>
                  <p className="text-xs text-[#a69181] mb-4">
                    Participants can submit entries for all 4 domains! If a domain has been submitted, it will be locked.
                  </p>

                  {/* 4 Domain Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {SWARAJ_DOMAINS.map((domain) => {
                      const IconComp = domain.icon;
                      const isSelected = selectedDomainId === domain.id;
                      const isSubmitted = submittedDomains.includes(domain.id);

                      return (
                        <div 
                          key={domain.id}
                          onClick={() => {
                            if (!isSubmitted) {
                              setSelectedDomainId(domain.id);
                              setSelectedTheme('');
                              setSubmissionFile(null);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all ${
                            isSubmitted
                              ? 'bg-emerald-950/30 border-emerald-500/40 cursor-not-allowed opacity-75'
                              : isSelected 
                                ? 'bg-gradient-to-r from-[#ff9933]/20 via-white/5 to-[#138808]/20 border-2 border-[#ff9933] shadow-lg shadow-[#ff9933]/10 cursor-pointer' 
                                : 'bg-[#180509] border-white/10 hover:border-white/30 cursor-pointer opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${isSubmitted ? 'bg-emerald-500/20 text-emerald-400' : isSelected ? 'bg-[#ff9933] text-black' : 'bg-white/10 text-white'}`}>
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-white">{domain.title}</h4>
                                <span className="text-[10px] text-[#ff9933] font-bold block uppercase">{domain.subtitle}</span>
                              </div>
                            </div>

                            {isSubmitted && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/40">
                                <Check className="w-3 h-3" />
                                Submitted
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[10px] text-[#a69181]">
                            {domain.isDriveLinkRequired ? 'Required: Google Drive Video Link' : `Limit: ${domain.maxSize}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isSelectedDomainSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-bold text-white">Domain Already Submitted</h4>
                    <p className="text-xs text-[#a69181]">
                      You have already submitted an entry for <strong className="text-white">{selectedDomainObj.title}</strong>. Please select another unsubmitted domain card above!
                    </p>
                  </div>
                ) : (
                  /* Selected Domain Rules & Theme Options */
                  <div className="glass-panel p-6 border-2 border-[#ff9933]/40 bg-[#180509] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="px-2.5 py-0.5 rounded bg-[#ff9933]/20 text-[#ff9933] text-xs font-bold">
                        {selectedDomainObj.title} ({selectedDomainObj.subtitle})
                      </span>
                      {selectedDomainObj.isDriveLinkRequired && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          Google Drive Link Mandatory
                        </span>
                      )}
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
                        <span>Domain Rules & Submission Instructions:</span>
                      </h5>
                      <ul className="list-disc list-inside text-[11px] text-[#a69181] space-y-1">
                        {selectedDomainObj.rules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    {/* MANDATORY GOOGLE DRIVE LINK FIELD FOR TRICOLENS REEL MAKING */}
                    {selectedDomainObj.isDriveLinkRequired ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-200 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                            <span>⚠️ MANDATORY CAUTION FOR REEL SUBMISSIONS:</span>
                          </div>
                          <p className="leading-relaxed">
                            Direct file uploads for Reels are disabled due to large video sizes. You <strong>MUST</strong> upload your video reel to your personal Google Drive, set sharing access permissions to <strong>"Anyone with the link can view"</strong>, and paste the public link below.
                          </p>
                          <p className="text-[11px] text-amber-300 font-mono">
                            ❌ Submissions with restricted Google Drive links or missing viewing permissions will be automatically disqualified.
                          </p>
                        </div>

                        <div className="form-group bg-[#22080f] p-4 rounded-2xl border-2 border-[#ff9933]/50 space-y-2">
                          <label className="form-label font-bold text-white text-xs flex items-center gap-1.5">
                            <LinkIcon className="w-4 h-4 text-[#ff9933]" />
                            <span>Google Drive Video Reel Link * (Mandatory)</span>
                          </label>

                          <div className="p-3 rounded-xl bg-black/40 text-[11px] text-[#a69181] space-y-1 border border-white/5">
                            <p className="font-bold text-[#ff9933]">How to share your Google Drive link:</p>
                            <p>1. Upload your MP4 Reel (Max 1GB) to your personal Google Drive.</p>
                            <p>2. Right click the video ➔ <strong>Share</strong> ➔ Change General access to <strong>"Anyone with the link can view"</strong>.</p>
                            <p>3. Copy the link and paste it in the field below.</p>
                          </div>

                          <input 
                            type="url" 
                            value={driveReelUrl}
                            onChange={e => setDriveReelUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                            className="form-input font-mono text-xs"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      /* DIRECT FILE UPLOAD DROPZONE FOR ARTWORK, PHOTOGRAPHY & CREATIVE WRITING */
                      <div className="form-group mb-0 space-y-2">
                        <label className="form-label font-bold text-white text-xs flex items-center justify-between">
                          <span>Upload {selectedDomainObj.title} Submission File *</span>
                          <span className="text-[10px] text-[#ff9933] font-mono">Limit: {selectedDomainObj.maxSize}</span>
                        </label>

                        {compressing && (
                          <div className="p-3 rounded-xl bg-[#ff9933]/20 border border-[#ff9933]/40 text-[#ff9933] text-xs flex items-center gap-2 animate-pulse">
                            <Zap className="w-4 h-4" />
                            <span>Auto-Compressing file to save cloud storage... Please wait.</span>
                          </div>
                        )}

                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#ff9933]/40 rounded-2xl bg-white/[0.02] hover:border-[#ff9933] transition-colors cursor-pointer text-center mt-2">
                          <UploadCloud className="w-8 h-8 text-[#ff9933] mb-2 animate-bounce" />
                          <span className="text-xs font-bold text-white mb-1">
                            {submissionFile ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 inline" />
                                {submissionFile.name} ({(submissionFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            ) : (
                              `Click to Upload ${selectedDomainObj.subtitle} File`
                            )}
                          </span>
                          <span className="text-[10px] text-[#a69181]">
                            Accepted: {selectedDomainObj.accept} (Limit: {selectedDomainObj.maxSize})
                          </span>
                          <input 
                            type="file" 
                            onChange={e => handleFileChange(e, selectedDomainObj.maxBytesMb)}
                            accept={selectedDomainObj.accept}
                            className="hidden"
                            required
                          />
                        </label>
                      </div>
                    )}

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
                )}

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
                    disabled={submitting || compressing || isSelectedDomainSubmitted}
                    className="btn-tricolour text-sm min-w-[200px] justify-center inline-flex items-center gap-2 py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
