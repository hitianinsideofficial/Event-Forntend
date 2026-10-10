'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageViewApi, trackClickApi } from '../services/analytics.service';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  // Auto-track page views on route change
  useEffect(() => {
    if (!pathname) return;
    
    // Avoid double logging exact same route in short succession
    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;
      trackPageViewApi(pathname);
    }
  }, [pathname]);

  // Global click event listener for button & feature tracking
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const trackableElement = target.closest('[data-track-id], button, a') as HTMLElement | null;
      if (!trackableElement) return;

      const elementId = trackableElement.getAttribute('data-track-id') || 
                        trackableElement.id || 
                        trackableElement.innerText?.trim().substring(0, 30) || 
                        'unnamed_button';
      
      const label = trackableElement.getAttribute('data-track-label') || 
                    trackableElement.innerText?.trim() || 
                    trackableElement.getAttribute('aria-label') || 
                    elementId;

      const category = trackableElement.getAttribute('data-track-category') || 
                       (trackableElement.tagName === 'A' ? 'navigation' : 'button_click');

      // Ignore trivial or empty clicks
      if (!elementId || elementId.length < 2) return;

      trackClickApi(elementId, label, category, window.location.pathname);
    };

    window.addEventListener('click', handleGlobalClick, { passive: true });
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return null;
}
