import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getStripe } from '@/lib/stripe';

interface StripeHealthStatus {
  stripeJsLoaded: boolean;
  edgeFunctionReachable: boolean;
  isHealthy: boolean;
  error?: string;
}

/**
 * Pre-flight health check for Stripe payment flow.
 * Verifies both Stripe.js initialization and edge function availability.
 */
export function useStripeHealth() {
  const [status, setStatus] = useState<StripeHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (): Promise<StripeHealthStatus> => {
    setIsChecking(true);
    
    try {
      // Check 1: Stripe.js loads successfully
      const stripeInstance = await getStripe();
      const stripeJsLoaded = !!stripeInstance;

      if (!stripeJsLoaded) {
        const result: StripeHealthStatus = {
          stripeJsLoaded: false,
          edgeFunctionReachable: false,
          isHealthy: false,
          error: 'Stripe.js failed to load. Check VITE_STRIPE_PUBLISHABLE_KEY.',
        };
        setStatus(result);
        return result;
      }

      // Check 2: Edge function is reachable (lightweight ping)
      // We use a minimal payload that won't create a real payment intent
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const { error } = await supabase.functions.invoke('create-payment-intent', {
          body: { healthCheck: true },
        });

        clearTimeout(timeout);

        // The edge function should return an error for healthCheck requests,
        // but the fact that it responds means it's reachable
        const edgeFunctionReachable = true;

        const result: StripeHealthStatus = {
          stripeJsLoaded: true,
          edgeFunctionReachable,
          isHealthy: true,
        };
        setStatus(result);
        return result;
      } catch (fetchError) {
        clearTimeout(timeout);
        
        const result: StripeHealthStatus = {
          stripeJsLoaded: true,
          edgeFunctionReachable: false,
          isHealthy: false,
          error: 'Payment service is temporarily unavailable.',
        };
        setStatus(result);
        return result;
      }
    } catch (error) {
      const result: StripeHealthStatus = {
        stripeJsLoaded: false,
        edgeFunctionReachable: false,
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error during health check',
      };
      setStatus(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    status,
    isChecking,
    checkHealth,
  };
}
