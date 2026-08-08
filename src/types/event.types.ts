export type EventStatus = 'UPCOMING' | 'LIVE' | 'DONE';
export type EventMode = 'OFFLINE' | 'ONLINE';

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
  id?: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  startDate?: string;
  endDate?: string;
  location: string;
  organizer: string;
  status: EventStatus;
  mode: EventMode;
  bannerUrl?: string;
  coverUrl?: string;
  hasAttendance: boolean;
  requireFileUpload: boolean;
  highlights?: EventHighlight[];
  customFields?: CustomFormField[];
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}
