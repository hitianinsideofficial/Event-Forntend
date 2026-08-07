import { EventItem } from '../types/event.types';
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

export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, { cache: 'no-store' });
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

export async function submitRegistrationApi(formData: FormData): Promise<ApiResponse<SubmissionItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Registration submission failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Error submitting registration:', err);
    throw err;
  }
}

export async function verifyCertificateApi(certId: string): Promise<ApiResponse<CertificateItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates/verify/${certId}`, { cache: 'no-store' });
    const result: ApiResponse<CertificateItem> = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Certificate verification failed');
    }
    return result;
  } catch (err) {
    console.error('Certificate verification error:', err);
    throw err;
  }
}

export async function issueCertificateApi(certData: Partial<CertificateItem>): Promise<ApiResponse<CertificateItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(certData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to issue certificate');
    }

    return await res.json();
  } catch (err) {
    console.error('Certificate issuance error:', err);
    throw err;
  }
}

export async function adminLoginApi(email: string, password: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Invalid email or password');
    }

    return await res.json();
  } catch (err) {
    console.error('Admin login error:', err);
    throw err;
  }
}

export async function fetchSubmissionsApi(eventId: string = 'all'): Promise<SubmissionItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/submissions`, { cache: 'no-store' });
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
      body: JSON.stringify({ ticketId })
    });

    const result: ApiResponse<SubmissionItem> = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Check-in failed');
    }
    return result;
  } catch (err) {
    console.error('Check-in error:', err);
    throw err;
  }
}
