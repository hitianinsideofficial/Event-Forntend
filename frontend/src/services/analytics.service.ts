import { getApiBaseUrl } from './api.service';

export interface AnalyticsSummaryData {
  totalPageViews: number;
  todayPageViews: number;
  uniqueVisitorsCount: number;
  totalClicks: number;
  topClickedElements: Array<{
    _id: string;
    count: number;
    label: string;
    category: string;
  }>;
  topPages: Array<{
    _id: string;
    count: number;
  }>;
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let visitorId = localStorage.getItem('hi_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('hi_visitor_id', visitorId);
  }
  return visitorId;
}

export async function trackPageViewApi(path: string): Promise<void> {
  try {
    const baseUrl = await getApiBaseUrl();
    const visitorId = getVisitorId();
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    await fetch(`${baseUrl}/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, visitorId, referrer })
    });
  } catch (err) {
    // Ignore analytics tracking network errors silently
  }
}

export async function trackClickApi(elementId: string, label: string, category = 'interaction', path = '/'): Promise<void> {
  try {
    const baseUrl = await getApiBaseUrl();
    const visitorId = getVisitorId();

    await fetch(`${baseUrl}/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elementId, label, category, path, visitorId })
    });
  } catch (err) {
    // Ignore analytics tracking network errors silently
  }
}

export async function fetchAnalyticsDashboardApi(): Promise<AnalyticsSummaryData> {
  const baseUrl = await getApiBaseUrl();
  const res = await fetch(`${baseUrl}/analytics/dashboard`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch analytics summary');
  }
  return data.data;
}
