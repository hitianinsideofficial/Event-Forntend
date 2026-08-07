export interface SubmissionFile {
  originalName: string;
  mimeType?: string;
  driveLink?: string;
  localUrl: string;
  size?: number;
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
  createdAt: string;
}
