import { useState, useEffect, useCallback } from 'react';
import { useExitIntentSettings, ExitIntentSettings } from '@/hooks/useExitIntentSettings';

interface UseExitIntentOptions {
  threshold?: number;
}

export function useExitIntent(options: UseExitIntentOptions = {}) {
  const { threshold = 10 } = options;
  const [showExitIntent, setShowExitIntent] = useState(false);
  const { data: settings, isLoading } = useExitIntentSettings();

  // Use settings from DB or defaults
  const delay = (settings?.delay_seconds ?? 1) * 1000;
  const cookieExpiry = settings?.cooldown_days ?? 7;
  const isEnabled = settings?.is_enabled ?? true;

  const hasShownRecently = useCallback(() => {
    const lastShown = localStorage.getItem('exit_intent_shown');
    if (!lastShown) return false;
    
    const lastShownDate = new Date(lastShown);
    const expiryDate = new Date(lastShownDate);
    expiryDate.setDate(expiryDate.getDate() + cookieExpiry);
    
    return new Date() < expiryDate;
  }, [cookieExpiry]);

  const markAsShown = useCallback(() => {
    localStorage.setItem('exit_intent_shown', new Date().toISOString());
  }, []);

  const dismiss = useCallback(() => {
    setShowExitIntent(false);
    markAsShown();
  }, [markAsShown]);

  useEffect(() => {
    // Don't do anything while loading or if disabled
    if (isLoading || !isEnabled) return;
    if (hasShownRecently()) return;

    let timeoutId: NodeJS.Timeout;
    let hasTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggered) return;
      
      // Only trigger when mouse leaves through top of viewport
      if (e.clientY <= threshold) {
        hasTriggered = true;
        setShowExitIntent(true);
        markAsShown();
      }
    };

    // Delay before enabling exit intent detection
    timeoutId = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [threshold, delay, hasShownRecently, markAsShown, isLoading, isEnabled]);

  return { showExitIntent, dismiss, setShowExitIntent, settings, isEnabled };
}
