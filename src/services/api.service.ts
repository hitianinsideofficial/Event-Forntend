import { EventItem, EventStatus, CustomFormField } from '../types/event.types';
import { SubmissionItem } from '../types/submission.types';
import { CertificateItem } from '../types/certificate.types';
import { ApiResponse, BackendHealthResponse } from '../types/api.types';

const LOCAL_API_URL = 'http://localhost:5000/api';
const LIVE_API_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://hitianinside-event-backend.vercel.app/api';

let cachedApiUrl: string | null = null;

// In-Memory Fast Cache with TTL for instant navigation between pages
const apiCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh TTL

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        apiCache.delete(key);
      }
    }
  }
}

export async function getApiBaseUrl(): Promise<string> {
  if (typeof window !== 'undefined' && cachedApiUrl) {
    return cachedApiUrl;
  }

  // If running in browser on HTTPS (production domain), don't ping http://localhost:5000 to avoid Mixed Content / CORS errors & delays
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cachedApiUrl = process.env.NEXT_PUBLIC_API_URL || LIVE_API_URL;
    return cachedApiUrl;
  }

  // Check sessionStorage for previously validated local backend URL
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('hi_api_base_url');
    if (saved) {
      cachedApiUrl = saved;
      return cachedApiUrl;
    }
  }

  // Quick 400ms health check to see if local backend (localhost:5000) is active
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400);
    const res = await fetch(`${LOCAL_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      cachedApiUrl = LOCAL_API_URL;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hi_api_base_url', LOCAL_API_URL);
      }
      return LOCAL_API_URL;
    }
  } catch (e) {
    // Local backend is offline
  }

  cachedApiUrl = process.env.NEXT_PUBLIC_API_URL || LIVE_API_URL;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('hi_api_base_url', cachedApiUrl);
  }
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

export async function fetchEvents(includeDone: boolean = false, admin: boolean = false, forceRefresh: boolean = false): Promise<EventItem[]> {
  const cacheKey = `events_${includeDone}_${admin}`;
  
  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DEFAULT_CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  try {
    const baseUrl = await getApiBaseUrl();
    const url = `${baseUrl}/events?includeDone=${includeDone}&admin=${admin}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result: ApiResponse<EventItem[]> = await res.json();
    const data = result.data || [];
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    // If network error but we have stale cache, return stale data
    const cached = apiCache.get(cacheKey);
    if (cached) return cached.data;
    console.error('Error fetching events:', err);
    throw err;
  }
}

export async function fetchEventById(id: string, forceRefresh: boolean = false): Promise<EventItem> {
  const cacheKey = `event_${id}`;

  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DEFAULT_CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/events/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result: ApiResponse<EventItem> = await res.json();
    const data = result.data!;
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    const cached = apiCache.get(cacheKey);
    if (cached) return cached.data;
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

    clearApiCache('event');
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

    clearApiCache('event');
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
    clearApiCache('event');
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
    clearApiCache('event');
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
    clearApiCache('event');
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
    clearApiCache('event');
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

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('API server route not found (404). Please check backend connection.');
      }
      if (res.status >= 500) {
        throw new Error(data?.message || 'Internal server error (500). Please check backend console.');
      }
      throw new Error(data?.message || `Authentication failed (HTTP ${res.status})`);
    }

    if (!data?.success) {
      throw new Error(data?.message || 'Invalid credentials');
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error('Server connection failed. Could not reach backend server.');
    }
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
              const codePrefix = data?.errorCode ? `[${data.errorCode}] ` : '';
              reject(new Error(`${codePrefix}${data?.message || 'File size exceeds server upload limit (Maximum allowed payload exceeded). Please compress your photo or document before uploading.'}`));
            } else {
              const codePrefix = data?.errorCode ? `[${data.errorCode}] ` : '';
              reject(new Error(`${codePrefix}${data?.message || `Upload failed with HTTP ${xhr.status}`}`));
            }
          } catch (e) {
            if (xhr.status === 413) {
              reject(new Error('[FILE_TOO_LARGE] Uploaded file size exceeds server capacity. Please compress your photo/document or attach a Google Drive link.'));
            } else if (xhr.status === 404) {
              reject(new Error('[ENDPOINT_NOT_FOUND] Backend endpoint /submissions not found (404). Please check backend server status.'));
            } else if (xhr.status >= 500) {
              reject(new Error(`[SERVER_ERROR_${xhr.status}] Server error (${xhr.status}). Please check backend logs or try again shortly.`));
            } else {
              reject(new Error(`[HTTP_${xhr.status}] Failed to submit registration (HTTP ${xhr.status}).`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('[NETWORK_DISCONNECTED] Connection to registration server failed. Please check your internet connection or verify the backend server is reachable.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('[UPLOAD_TIMEOUT] Upload request timed out due to slow network. Please compress your submission files and try again.'));
        };

        xhr.send(formData);
      });
    }

    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const codePrefix = errorData?.errorCode ? `[${errorData.errorCode}] ` : '';
      throw new Error(`${codePrefix}${errorData?.message || `Submission failed with HTTP ${res.status}`}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error('Error submitting event registration:', err);
    throw err;
  }
}

export async function fetchSubmissionsApi(eventId?: string, forceRefresh: boolean = false): Promise<SubmissionItem[]> {
  const cacheKey = `submissions_${eventId || 'all'}`;

  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DEFAULT_CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  try {
    const baseUrl = await getApiBaseUrl();
    const url = eventId ? `${baseUrl}/events/${eventId}/submissions` : `${baseUrl}/submissions`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result: ApiResponse<SubmissionItem[]> = await res.json();
    const data = result.data || [];
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    const cached = apiCache.get(cacheKey);
    if (cached) return cached.data;
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
    clearApiCache('submissions');
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
    clearApiCache('submissions');
    return data;
  } catch (err: any) {
    console.error('Error acknowledging submission:', err);
    throw err;
  }
}

export async function sendConfirmationEmailApi(submissionId: string, instagramPostUrl: string): Promise<ApiResponse<SubmissionItem>> {
  try {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/submissions/${submissionId}/confirmation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instagramPostUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send confirmation email');
    clearApiCache('submissions');
    return data;
  } catch (err: any) {
    console.error('Error sending confirmation email:', err);
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
export async function fetchObserversAdminApi(forceRefresh: boolean = false): Promise<any[]> {
  const cacheKey = 'admin_observers';
  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DEFAULT_CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/observers`, {
    headers: { 'Authorization': `Bearer ${token || ''}` },
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch observers');
  const result = data.data || [];
  apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
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
  clearApiCache('admin_observers');
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
  clearApiCache('admin_observers');
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
  clearApiCache('admin_observers');
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
  clearApiCache('submissions');
  return data;
}

export async function fetchLogsAndAnalyticsApi(forceRefresh: boolean = false): Promise<any> {
  const cacheKey = 'admin_logs_analytics';
  if (!forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DEFAULT_CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/admin/logs-analytics`, {
    headers: { 'Authorization': `Bearer ${token || ''}` },
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch audit logs and analytics');
  const result = data.data;
  apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function sendAppreciationEmailApi(
  submissionId: string,
  formData: FormData
): Promise<ApiResponse<SubmissionItem>> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/appreciation-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token || ''}`
    },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send appreciation email');
  return data;
}

export async function updatePaymentStatusApi(
  submissionId: string,
  paymentStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAID'
): Promise<ApiResponse<SubmissionItem>> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    },
    body: JSON.stringify({ paymentStatus })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update payment verification status');
  clearApiCache('submissions');
  return data;
}

export async function updatePostingExcelApi(
  submissionId: string,
  params: {
    postingStatus?: 'QUALIFIED' | 'POSTED' | 'DISQUALIFIED' | 'MAIL_SENT' | null;
    instagramPostUrl?: string | null;
    isDriveNotPublic?: boolean;
    isDriveNotPublicReason?: string | null;
    moveToPostingExcel?: boolean;
  }
): Promise<ApiResponse<SubmissionItem>> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/posting-excel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update posting details');
  clearApiCache('submissions');
  return data;
}

export async function toggleCouponCollectedApi(
  submissionId: string,
  couponCollected: boolean
): Promise<ApiResponse<SubmissionItem>> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/coupon-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    },
    body: JSON.stringify({ couponCollected })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update coupon status');
  clearApiCache('submissions');
  return data;
}

export async function deleteCertificateApi(
  submissionId: string
): Promise<ApiResponse<SubmissionItem>> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/certificate`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token || ''}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to remove certificate');
  clearApiCache('submissions');
  return data;
}

export async function requestDriveLinkUpdateEmailApi(
  submissionId: string
): Promise<ApiResponse<SubmissionItem> & { updateUrl?: string }> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/request-drive-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send Drive link update email');
  clearApiCache('submissions');
  return data;
}

export async function verifyDriveLinkUpdateTokenApi(params: {
  submissionId?: string;
  ticketId?: string;
  token: string;
  utm_source: string;
}): Promise<ApiResponse<{
  ticketId: string;
  fullName: string;
  eventTitle: string;
  domainTitle?: string;
  currentLink?: string;
  driveLinkUpdated: boolean;
  driveLinkUpdatedAt?: string;
}>> {
  const baseUrl = await getApiBaseUrl();
  const query = new URLSearchParams();
  if (params.submissionId) query.set('submissionId', params.submissionId);
  if (params.ticketId) query.set('ticketId', params.ticketId);
  query.set('token', params.token);
  query.set('utm_source', params.utm_source);

  const res = await fetch(`${baseUrl}/submissions/drive-update/verify?${query.toString()}`, {
    cache: 'no-store'
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || 'Failed to verify update link');
    error.errorCode = data.errorCode;
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function submitDriveLinkUpdateApi(payload: {
  submissionId?: string;
  ticketId?: string;
  token: string;
  utm_source: string;
  newDriveLink: string;
}): Promise<ApiResponse<{ ticketId: string; updatedLink: string; updatedAt: string }>> {
  const baseUrl = await getApiBaseUrl();

  const res = await fetch(`${baseUrl}/submissions/drive-update/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || 'Failed to submit updated link');
    error.errorCode = data.errorCode;
    error.status = res.status;
    throw error;
  }
  clearApiCache('submissions');
  return data;
}

export async function requestResubmissionEmailApi(
  submissionId: string,
  rejectionReason: string
): Promise<ApiResponse<SubmissionItem> & { updateUrl?: string }> {
  const baseUrl = await getApiBaseUrl();
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  const res = await fetch(`${baseUrl}/submissions/${submissionId}/request-resubmission`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    },
    body: JSON.stringify({ rejectionReason })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send resubmission email');
  clearApiCache('submissions');
  return data;
}

export async function verifyResubmissionTokenApi(params: {
  submissionId?: string;
  ticketId?: string;
  token: string;
  utm_source: string;
}): Promise<ApiResponse<{
  ticketId: string;
  fullName: string;
  eventTitle: string;
  domainTitle?: string;
  rejectionReason?: string;
  resubmissionCompleted: boolean;
  resubmissionCompletedAt?: string;
}>> {
  const baseUrl = await getApiBaseUrl();
  const query = new URLSearchParams();
  if (params.submissionId) query.set('submissionId', params.submissionId);
  if (params.ticketId) query.set('ticketId', params.ticketId);
  query.set('token', params.token);
  query.set('utm_source', params.utm_source);

  const res = await fetch(`${baseUrl}/submissions/resubmission/verify?${query.toString()}`, {
    cache: 'no-store'
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || 'Failed to verify re-upload link');
    error.errorCode = data.errorCode;
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function submitResubmissionFileApi(
  formData: FormData
): Promise<ApiResponse<{ ticketId: string; fileName: string; completedAt: string; fileUrl: string }>> {
  const baseUrl = await getApiBaseUrl();

  const res = await fetch(`${baseUrl}/submissions/resubmission/submit`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || 'Failed to submit replacement file');
    error.errorCode = data.errorCode;
    error.status = res.status;
    throw error;
  }
  clearApiCache('submissions');
  return data;
}



