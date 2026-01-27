import { useState, useEffect, useCallback } from 'react';

interface UseExitIntentOptions {
  threshold?: number;
  delay?: number;
  cookieExpiry?: number; // days
}

export function useExitIntent(options: UseExitIntentOptions = {}) {
  const { threshold = 10, delay = 1000, cookieExpiry = 7 } = options;
  const [showExitIntent, setShowExitIntent] = useState(false);

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
  }, [threshold, delay, hasShownRecently, markAsShown]);

  return { showExitIntent, dismiss, setShowExitIntent };
}
