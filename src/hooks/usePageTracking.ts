import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Page title mapping for friendly names
const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/properties': 'Properties',
  '/destinations': 'Destinations',
  '/experiences': 'Experiences',
  '/blog': 'Blog',
  '/about': 'About',
  '/contact': 'Contact',
  '/checkout': 'Checkout',
  '/login': 'Login',
  '/signup': 'Sign Up',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
};

const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const getDeviceType = (): string => {
  if (typeof navigator === 'undefined') return 'Desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
};

const getBrowser = (): string => {
  if (typeof navigator === 'undefined') return 'Unknown';
  
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
  
  return 'Other';
};

const getPageTitle = (path: string): string => {
  // Check exact match first
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  
  // Check pattern matches
  if (path.startsWith('/properties/')) return 'Property Detail';
  if (path.startsWith('/destinations/')) return 'Destination Detail';
  if (path.startsWith('/experiences/')) return 'Experience Detail';
  if (path.startsWith('/blog/')) return 'Blog Post';
  if (path.startsWith('/admin')) return 'Admin';
  
  return 'Page';
};

const getUTMParams = (search: string): { utm_source?: string; utm_medium?: string; utm_campaign?: string } => {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
  };
};

export function usePageTracking() {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce to prevent duplicate tracking on rapid navigations
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const currentPath = location.pathname;
      
      // Skip if same path (prevents double tracking)
      if (lastTrackedPath.current === currentPath) return;
      
      // Skip admin pages from public analytics
      if (currentPath.startsWith('/admin')) return;
      
      lastTrackedPath.current = currentPath;

      const trackPageView = async () => {
        try {
          const sessionId = getSessionId();
          if (!sessionId) return;

          const utmParams = getUTMParams(location.search);
          
          const pageView = {
            session_id: sessionId,
            path: currentPath,
            page_title: getPageTitle(currentPath),
            referrer: document.referrer || null,
            device_type: getDeviceType(),
            browser: getBrowser(),
            country_code: null, // Would require server-side IP lookup
            utm_source: utmParams.utm_source || null,
            utm_medium: utmParams.utm_medium || null,
            utm_campaign: utmParams.utm_campaign || null,
          };

          const { error } = await supabase
            .from('page_views')
            .insert(pageView);

          if (error) {
            console.error('Failed to track page view:', error.message);
          }
        } catch (err) {
          // Silently fail - analytics should never break the app
          console.error('Page tracking error:', err);
        }
      };

      trackPageView();
    }, 100); // 100ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [location.pathname, location.search]);
}
