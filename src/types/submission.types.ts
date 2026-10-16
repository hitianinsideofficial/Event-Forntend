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
  confirmationEmailSent?: boolean;
  confirmationEmailSentAt?: string | null;
  instagramPostUrl?: string | null;
  postingStatus?: 'QUALIFIED' | 'POSTED' | 'DISQUALIFIED' | 'MAIL_SENT' | null;
  moveToPostingExcel?: boolean;
  isDriveNotPublic?: boolean;
  isDriveNotPublicReason?: string | null;
  driveLinkUpdateToken?: string | null;
  driveLinkUpdated?: boolean;
  driveLinkUpdatedAt?: string | null;
  driveUpdateMailSent?: boolean;
  driveUpdateMailSentAt?: string | null;
  resubmissionToken?: string | null;
  resubmissionRequested?: boolean;
  resubmissionRequestedAt?: string | null;
  resubmissionReason?: string | null;
  resubmissionCompleted?: boolean;
  resubmissionCompletedAt?: string | null;
  appreciationSent?: boolean;
  appreciationSentAt?: string | null;
  certificateFileUrl?: string | null;
  couponCollected?: boolean;
  paymentStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAID';
  paymentVerifiedAt?: string | null;
  createdAt: string;
}
