export interface CertificateItem {
  certificateId: string;
  participantName: string;
  email?: string;
  eventTitle: string;
  issueDate: string;
  certificateType: string;
  issuer: string;
  status: 'VALID' | 'REVOKED';
}
