export interface SubmissionFile {
  originalName: string;
  mimeType?: string;
  driveLink?: string;
  localUrl: string;
  size?: number;
  provider?: string;
  fileId?: string;
}

export interface SubmissionItem {
  id: string;
  eventId: string;
  eventTitle: string;
  ticketId: string;
  fullName: string;
  email: string;
  phone?: string;
  answers?: Record<string, any>;
  files?: SubmissionFile[];
  qrCodeUrl?: string;
  attendanceStatus: 'PENDING' | 'CHECKED_IN';
  checkedInAt?: string | null;
  acknowledged?: boolean;
  acknowledgedAt?: string | null;
  appreciationSent?: boolean;
  appreciationSentAt?: string | null;
  certificateFileUrl?: string | null;
  couponCollected?: boolean;
  paymentStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAID';
  paymentVerifiedAt?: string | null;
  createdAt: string;
}
