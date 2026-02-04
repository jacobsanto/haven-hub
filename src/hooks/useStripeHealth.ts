import { useState, useCallback, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

export type StripeHealthStatus = 'checking' | 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface StripeHealthCheck {
  status: StripeHealthStatus;
  stripeLoaded: boolean;
  edgeFunctionReachable: boolean;
  lastChecked: Date | null;
  error: string | null;
}

const HEALTH_CHECK_TIMEOUT_MS = 5000;
const CACHE_DURATION_MS = 60000; // 1 minute cache

let cachedHealth: StripeHealthCheck | null = null;
let lastCheckTime: number = 0;

/**
 * Hook to perform preflight health checks on Stripe connectivity
 * before entering the payment step. This prevents users from entering
 * card details only to encounter failures.
 */
export function useStripeHealth() {
  const [health, setHealth] = useState<StripeHealthCheck>({
    status: 'unknown',
    stripeLoaded: false,
    edgeFunctionReachable: false,
    lastChecked: null,
    error: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (forceRefresh = false): Promise<StripeHealthCheck> => {
    // Return cached result if still valid
    const now = Date.now();
    if (!forceRefresh && cachedHealth && (now - lastCheckTime) < CACHE_DURATION_MS) {
      setHealth(cachedHealth);
      return cachedHealth;
    }

    setIsChecking(true);
    setHealth(prev => ({ ...prev, status: 'checking' }));

    let stripeLoaded = false;
    let edgeFunctionReachable = false;
    let error: string | null = null;

    try {
      // Check 1: Can Stripe.js load?
      const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
      const stripeLoadTimeout = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Stripe load timeout')), HEALTH_CHECK_TIMEOUT_MS)
      );
      
      const stripe = await Promise.race([stripePromise, stripeLoadTimeout]);
      stripeLoaded = stripe !== null;
    } catch (e) {
      error = 'Unable to load payment system';
      console.warn('Stripe health check - Stripe.js load failed:', e);
    }

    try {
      // Check 2: Can we reach the edge function?
      const healthCheckPromise = supabase.functions.invoke('create-payment-intent', {
        body: { healthCheck: true },
      });
      
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => 
        setTimeout(() => resolve({ data: null, error: new Error('Edge function timeout') }), HEALTH_CHECK_TIMEOUT_MS)
      );

      const { error: funcError } = await Promise.race([healthCheckPromise, timeoutPromise]);
      
      // A specific error response (like validation error) means the function is reachable
      // We expect a validation error since we're sending a health check
      edgeFunctionReachable = !funcError || funcError.message.includes('validation') || funcError.message.includes('Invalid');
      
      if (!edgeFunctionReachable && !error) {
        error = 'Payment service temporarily unavailable';
      }
    } catch (e) {
      if (!error) {
        error = 'Unable to connect to payment service';
      }
      console.warn('Stripe health check - Edge function check failed:', e);
    }

    // Determine overall status
    let status: StripeHealthStatus;
    if (stripeLoaded && edgeFunctionReachable) {
      status = 'healthy';
    } else if (stripeLoaded || edgeFunctionReachable) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const result: StripeHealthCheck = {
      status,
      stripeLoaded,
      edgeFunctionReachable,
      lastChecked: new Date(),
      error: status === 'healthy' ? null : error,
    };

    // Cache the result
    cachedHealth = result;
    lastCheckTime = now;

    setHealth(result);
    setIsChecking(false);

    return result;
  }, []);

  // Auto-check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    ...health,
    isChecking,
    checkHealth,
    isHealthy: health.status === 'healthy',
    canProceed: health.status === 'healthy' || health.status === 'degraded',
  };
}
