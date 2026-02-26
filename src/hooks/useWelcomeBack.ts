import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'welcome_back_shown_session';
const LAST_VISIT_KEY = 'haven_last_visit';
const COOLDOWN_HOURS = 4;

export function useWelcomeBack() {
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  useEffect(() => {
    // Don't show if already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Check if there are recently viewed properties
    const recentlyViewed = localStorage.getItem('recently_viewed_properties');
    if (!recentlyViewed) return;

    const items = JSON.parse(recentlyViewed);
    if (!Array.isArray(items) || items.length === 0) return;

    // Check cooldown
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit) {
      const hoursSince = (Date.now() - parseInt(lastVisit, 10)) / (1000 * 60 * 60);
      // Only show if they've been away for at least the cooldown period
      if (hoursSince < COOLDOWN_HOURS) {
        // Still within the same browsing window, don't show
        localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
        return;
      }
    } else {
      // First visit ever but has recently viewed (edge case), record and skip
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
      return;
    }

    // Show the welcome back banner
    setShowWelcomeBack(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
  }, []);

  const dismiss = useCallback(() => {
    setShowWelcomeBack(false);
  }, []);

  return { showWelcomeBack, dismiss };
}
