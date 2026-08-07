export type EventStatus = 'UPCOMING' | 'LIVE' | 'DONE';

export interface EventHighlight {
  icon?: string;
  title: string;
  description: string;
}

export type QuestionType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'url' | 'file' | 'image' | 'video';

export interface CustomFormField {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  description?: string;
}

export interface EventItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  status: EventStatus;
  hasAttendance?: boolean;
  requireFileUpload?: boolean;
  highlights?: EventHighlight[];
  customFields?: CustomFormField[];
  createdAt?: string;
}
