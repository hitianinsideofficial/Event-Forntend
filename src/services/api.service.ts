import { EventItem, EventStatus, CustomFormField } from '../types/event.types';
import { SubmissionItem } from '../types/submission.types';
import { CertificateItem } from '../types/certificate.types';
import { ApiResponse, BackendHealthResponse } from '../types/api.types';

const LOCAL_API_URL = 'http://localhost:5000/api';
const LIVE_API_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://hitianinside-event-backend.vercel.app/api';

let cachedApiUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (typeof window !== 'undefined' && cachedApiUrl) {
    return cachedApiUrl;
  }

  // If running in browser on HTTPS (production domain), don't ping http://localhost:5000 to avoid Mixed Content / CORS errors & delays
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cachedApiUrl = process.env.NEXT_PUBLIC_API_URL || LIVE_API_URL;
    return cachedApiUrl;
  }

  // Quick 600ms health check to see if local backend (localhost:5000) is active
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`${LOCAL_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      cachedApiUrl = LOCAL_API_URL;
      return LOCAL_API_URL;
    }
  } catch (e) {
    // Local backend is offline
  }

  cachedApiUrl = process.env.NEXT_PUBLIC_API_URL || LIVE_API_URL;
  return cachedApiUrl;
}

export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { online: true, data };
  } catch (err: any) {
    return { online: false, error: err.message };
  }
}

export async function fetchEvents(includeDone: boolean = false, admin: boolean = false): Promise<EventItem[]> {
  try {
    const baseUrl = await getApiBaseUrl();
    const url = `${baseUrl}/events?includeDone=${includeDone}&admin=${admin}`;
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}`, { cache: 'no-store' });
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events`, {
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}`, {
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}/status`, {
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

export async function toggleEventVisibilityApi(id: string, isHidden: boolean): Promise<ApiResponse<EventItem>> {
  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error toggling event visibility:', err);
    throw err;
  }
}

export async function updateEventFormApi(id: string, customFields: CustomFormField[]): Promise<ApiResponse<EventItem>> {
  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}/form`, {
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}`, {
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
    const baseUrl = await getApiBaseUrl();
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${baseUrl}/upload/imagekit`, {
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return await res.json();
  } catch (err: any) {
    throw new Error(err.message || 'Login failed');
  }
}

export async function submitRegistrationApi(
  formData: FormData, 
  onProgress?: (progress: number) => void
): Promise<ApiResponse<SubmissionItem>> {
  try {
    const baseUrl = await getApiBaseUrl();

    if (onProgress && typeof window !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${baseUrl}/submissions`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else if (xhr.status === 413) {
              reject(new Error('File size exceeds server upload limit (Max 4 MB). Please compress your file or use Google Drive link.'));
            } else {
              reject(new Error(data.message || `Failed to submit registration (Server Status ${xhr.status})`));
            }
          } catch (e) {
            if (xhr.status === 413) {
              reject(new Error('File size exceeds server upload limit (Max 4 MB). Please compress your file or use Google Drive link.'));
            } else {
              reject(new Error('Invalid server response during file submission'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during file submission. If your file is larger than 4 MB, please compress it or use a Google Drive link.'));
        };

        xhr.send(formData);
      });
    }

    const res = await fetch(`${baseUrl}/submissions`, {
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
    const baseUrl = await getApiBaseUrl();
    const url = eventId ? `${baseUrl}/events/${eventId}/submissions` : `${baseUrl}/submissions`;
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/submissions/checkin`, {
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
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/certificates/verify/${certificateId}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Certificate verification failed');
    return data;
  } catch (err: any) {
    console.error('Error verifying certificate:', err);
    throw err;
  }
}

export async function acknowledgeSubmissionApi(submissionId: string): Promise<ApiResponse<SubmissionItem>> {
  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/submissions/${submissionId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to acknowledge submission');
    return data;
  } catch (err: any) {
    console.error('Error acknowledging submission:', err);
    throw err;
  }
}

// Observer Authentication & Submission APIs
export async function observerLoginApi(email: string, password: string): Promise<{ success: boolean; token?: string; message?: string; observer?: any }> {
  const baseUrl = await getApiBaseUrl();
  const res = await fetch(`${baseUrl}/observer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Observer authentication failed');
  return data;
}

export async function fetchObserverSubmissionsApi(eventId?: string): Promise<SubmissionItem[]> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('observerToken') : null;

  const targetUrl = eventId ? `${baseUrl}/observer/events/${eventId}/submissions` : `${baseUrl}/observer/submissions`;

  const res = await fetch(targetUrl, {
    headers: {
      'Authorization': `Bearer ${token || ''}`
    },
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch observer submissions');
  return data.data || [];
}

// Admin Observer Credentials Management APIs
export async function fetchObserversAdminApi(): Promise<any[]> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/observers`, {
    headers: { 'Authorization': `Bearer ${token || ''}` },
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch observers');
  return data.data || [];
}

export async function createObserverAdminApi(name: string, email: string, password: string): Promise<any> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/observers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create observer credentials');
  return data;
}

export async function toggleObserverStatusAdminApi(id: string, isActive: boolean): Promise<any> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/observers/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    },
    body: JSON.stringify({ isActive })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update observer status');
  return data;
}

export async function deleteObserverAdminApi(id: string): Promise<any> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/observers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token || ''}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete observer credentials');
  return data;
}

export async function deleteSubmissionApi(submissionId: string): Promise<any> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token || ''}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete submission');
  return data;
}

export async function fetchLogsAndAnalyticsApi(): Promise<any> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/logs-analytics`, {
    headers: { 'Authorization': `Bearer ${token || ''}` },
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch audit logs and analytics');
  return data.data;
}
