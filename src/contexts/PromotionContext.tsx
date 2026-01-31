import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivePromotion, PromotionalCampaign } from '@/hooks/useActivePromotion';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface PromotionContextType {
  activePromotion: PromotionalCampaign | null;
  isLoading: boolean;
  showPromotion: boolean;
  hasBeenDismissed: boolean;
  dismissPromotion: () => void;
  triggerPromotion: () => void;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'promo_dismissed_';
const DISMISS_DURATION_DAYS = 1; // Don't show again for 1 day after dismiss

interface PromotionProviderProps {
  children: ReactNode;
}

export function PromotionProvider({ children }: PromotionProviderProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showPromotion, setShowPromotion] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const { data: activePromotion, isLoading } = useActivePromotion({
    currentPage: location.pathname,
  });

  // Check if this promotion was recently dismissed
  const checkDismissed = useCallback((campaignId: string): boolean => {
    const dismissedAt = localStorage.getItem(`${STORAGE_KEY_PREFIX}${campaignId}`);
    if (!dismissedAt) return false;

    const dismissedDate = new Date(dismissedAt);
    const expiryDate = new Date(dismissedDate);
    expiryDate.setDate(expiryDate.getDate() + DISMISS_DURATION_DAYS);

    return new Date() < expiryDate;
  }, []);

  // Dismiss the current promotion
  const dismissPromotion = useCallback(() => {
    if (activePromotion) {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${activePromotion.id}`,
        new Date().toISOString()
      );
    }
    setShowPromotion(false);
    setHasBeenDismissed(true);
  }, [activePromotion]);

  // Manually trigger the promotion (for exit intent scenarios)
  const triggerPromotion = useCallback(() => {
    if (activePromotion && !hasBeenDismissed && !checkDismissed(activePromotion.id)) {
      setShowPromotion(true);
      // Increment impression count
      incrementImpression(activePromotion.id);
    }
  }, [activePromotion, hasBeenDismissed, checkDismissed]);

  // Increment impression count in database
  const incrementImpression = async (campaignId: string) => {
    try {
      // Get current count and increment
      const { data: current } = await supabase
        .from('promotional_campaigns')
        .select('impressions_count')
        .eq('id', campaignId)
        .single();

      if (current) {
        await supabase
          .from('promotional_campaigns')
          .update({ impressions_count: (current.impressions_count || 0) + 1 })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error('Failed to increment impression:', error);
    }
  };

  // Handle automatic triggering based on trigger_type
  useEffect(() => {
    if (!activePromotion || isLoading || hasTriggered || hasBeenDismissed) return;
    if (checkDismissed(activePromotion.id)) return;

    // Check mobile visibility
    if (isMobile && !activePromotion.show_on_mobile) return;

    const { trigger_type, trigger_delay_seconds } = activePromotion;

    // Entry trigger - show immediately or after delay
    if (trigger_type === 'entry' || trigger_type === 'both') {
      const delay = (trigger_delay_seconds || 0) * 1000;
      
      const timer = setTimeout(() => {
        setShowPromotion(true);
        setHasTriggered(true);
        incrementImpression(activePromotion.id);
      }, delay);

      return () => clearTimeout(timer);
    }

    // Timed trigger
    if (trigger_type === 'timed') {
      const delay = (trigger_delay_seconds || 5) * 1000;
      
      const timer = setTimeout(() => {
        setShowPromotion(true);
        setHasTriggered(true);
        incrementImpression(activePromotion.id);
      }, delay);

      return () => clearTimeout(timer);
    }

    // Exit intent is handled separately via useExitIntent hook
  }, [activePromotion, isLoading, hasTriggered, hasBeenDismissed, isMobile, checkDismissed]);

  // Reset when navigating to new page
  useEffect(() => {
    setHasTriggered(false);
    setShowPromotion(false);
  }, [location.pathname]);

  return (
    <PromotionContext.Provider
      value={{
        activePromotion: activePromotion || null,
        isLoading,
        showPromotion,
        hasBeenDismissed,
        dismissPromotion,
        triggerPromotion,
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotion() {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
}
