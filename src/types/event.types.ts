export interface CustomFormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

export interface EventItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  hasAttendance?: boolean;
  requireFileUpload?: boolean;
  customFields?: CustomFormField[];
  createdAt?: string;
}
