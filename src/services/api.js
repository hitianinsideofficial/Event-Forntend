const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.data || [];
  } catch (err) {
    console.error('Error fetching events:', err);
    throw err;
  }
}

export async function fetchEventById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.data;
  } catch (err) {
    console.error('Error fetching event details:', err);
    throw err;
  }
}

export async function createEventApi(eventData) {
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

export async function submitRegistrationApi(formData) {
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

export async function verifyCertificateApi(certId) {
  try {
    const res = await fetch(`${API_BASE_URL}/certificates/verify/${certId}`, { cache: 'no-store' });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Certificate verification failed');
    }
    return result;
  } catch (err) {
    console.error('Certificate verification error:', err);
    throw err;
  }
}

export async function issueCertificateApi(certData) {
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

export async function adminLoginApi(password) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Invalid password');
    }

    return await res.json();
  } catch (err) {
    console.error('Admin login error:', err);
    throw err;
  }
}

export async function fetchSubmissionsApi(eventId = 'all') {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/submissions`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.data || [];
  } catch (err) {
    console.error('Error fetching submissions:', err);
    throw err;
  }
}

export async function checkInAttendeeApi(ticketId) {
  try {
    const res = await fetch(`${API_BASE_URL}/submissions/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Check-in failed');
    }
    return result;
  } catch (err) {
    console.error('Check-in error:', err);
    throw err;
  }
}
