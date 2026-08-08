import { EventItem, EventStatus, CustomFormField } from '../types/event.types';
import { SubmissionItem } from '../types/submission.types';
import { CertificateItem } from '../types/certificate.types';
import { ApiResponse, BackendHealthResponse } from '../types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { online: true, data };
  } catch (err: any) {
    return { online: false, error: err.message };
  }
}

export async function fetchEvents(includeDone: boolean = false): Promise<EventItem[]> {
  try {
    const url = includeDone ? `${API_BASE_URL}/events?includeDone=true` : `${API_BASE_URL}/events`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result: ApiResponse<EventItem[]> = await res.json();
    return result.data || [];
  } catch (err) {
    console.error('Error fetching events:', err);
    throw err;
  }
}

export async function fetchEventById(id: string): Promise<EventItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result: ApiResponse<EventItem> = await res.json();
    return result.data!;
  } catch (err) {
    console.error('Error fetching event details:', err);
    throw err;
  }
}

export async function createEventApi(eventData: Partial<EventItem>): Promise<ApiResponse<EventItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create event');
    }

    return await res.json();
  } catch (err) {
    console.error('Error creating event:', err);
    throw err;
  }
}

export async function updateEventDetailsApi(id: string, eventData: Partial<EventItem>): Promise<ApiResponse<EventItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update event details');
    }

    return await res.json();
  } catch (err) {
    console.error('Error updating event details:', err);
    throw err;
  }
}

export async function updateEventStatusApi(id: string, status: EventStatus): Promise<ApiResponse<EventItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error updating event status:', err);
    throw err;
  }
}

export async function updateEventFormApi(id: string, customFields: CustomFormField[]): Promise<ApiResponse<EventItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}/form`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customFields }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error updating event form schema:', err);
    throw err;
  }
}

export async function deleteEventApi(id: string): Promise<ApiResponse<void>> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error deleting event:', err);
    throw err;
  }
}

export async function uploadToImageKitApi(file: File): Promise<{ url: string; fileId: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE_URL}/upload/imagekit`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'ImageKit upload failed');
    }

    const result = await res.json();
    return result.data;
  } catch (err) {
    console.error('Error uploading to ImageKit:', err);
    throw err;
  }
}

export async function adminLoginApi(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return await res.json();
  } catch (err: any) {
    throw new Error(err.message || 'Login failed');
  }
}

export async function submitRegistrationApi(formData: FormData): Promise<ApiResponse<SubmissionItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to submit registration');
    }

    return await res.json();
  } catch (err) {
    console.error('Error submitting event registration:', err);
    throw err;
  }
}

export async function fetchSubmissionsApi(eventId?: string): Promise<SubmissionItem[]> {
  try {
    const url = eventId ? `${API_BASE_URL}/events/${eventId}/submissions` : `${API_BASE_URL}/submissions`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result: ApiResponse<SubmissionItem[]> = await res.json();
    return result.data || [];
  } catch (err) {
    console.error('Error fetching submissions:', err);
    throw err;
  }
}

export async function checkInAttendeeApi(ticketId: string): Promise<ApiResponse<SubmissionItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/submissions/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Check-in failed');
    return data;
  } catch (err: any) {
    console.error('Error checking in attendee:', err);
    throw err;
  }
}

export async function verifyCertificateApi(certificateId: string): Promise<ApiResponse<CertificateItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates/verify/${certificateId}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Certificate verification failed');
    return data;
  } catch (err: any) {
    console.error('Error verifying certificate:', err);
    throw err;
  }
}
