import { useState, useCallback } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { PriceBreakdown, SelectedAddon, BookingGuestWithCounts, PaymentType } from '@/types/booking-engine';

export interface CreatePaymentIntentParams {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  guestInfo: BookingGuestWithCounts;
  selectedAddons: SelectedAddon[];
  priceBreakdown: PriceBreakdown;
  paymentType: PaymentType;
  holdId?: string;
  couponCode?: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  bookingReference: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentResult {
  success: boolean;
  bookingId: string;
  bookingReference: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalPaid: number;
  alreadyProcessed?: boolean;
}

export interface StripePaymentState {
  isInitializing: boolean;
  isProcessing: boolean;
  clientSecret: string | null;
  paymentIntentId: string | null;
  bookingReference: string | null;
  error: string | null;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Exponential backoff retry helper
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export function useStripePayment() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [state, setState] = useState<StripePaymentState>({
    isInitializing: false,
    isProcessing: false,
    clientSecret: null,
    paymentIntentId: null,
    bookingReference: null,
    error: null,
    retryCount: 0,
  });

  // Create a payment intent
  const createPaymentIntent = useCallback(async (params: CreatePaymentIntentParams): Promise<PaymentIntentResult | null> => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            propertyId: params.propertyId,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            nights: params.nights,
            guests: params.guests,
            adults: params.adults,
            children: params.children,
            guestInfo: {
              firstName: params.guestInfo.firstName,
              lastName: params.guestInfo.lastName,
              email: params.guestInfo.email,
              phone: params.guestInfo.phone,
              country: params.guestInfo.country,
              specialRequests: params.guestInfo.specialRequests,
            },
            selectedAddons: params.selectedAddons.map(sa => ({
              addonId: sa.addon.id,
              quantity: sa.quantity,
              calculatedPrice: sa.calculatedPrice,
            })),
            priceBreakdown: params.priceBreakdown,
            paymentType: params.paymentType,
            holdId: params.holdId,
            couponCode: params.priceBreakdown.discountCode,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.message || 'Failed to create payment intent');
        
        return data as PaymentIntentResult;
      });

      setState(prev => ({
        ...prev,
        isInitializing: false,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        bookingReference: result.bookingReference,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
      setState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: errorMessage,
        retryCount: prev.retryCount + 1,
      }));
      return null;
    }
  }, []);

  // Process payment with Stripe Elements
  const processPayment = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!stripe || !elements || !state.clientSecret) {
      return { success: false, error: 'Payment not initialized' };
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return { success: false, error: 'Card element not found' };
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(state.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: error.message || 'Payment failed',
        }));
        return { success: false, error: error.message };
      }

      if (paymentIntent?.status === 'succeeded') {
        return { success: true };
      }

      // Handle other statuses (requires_action, etc.)
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: `Payment status: ${paymentIntent?.status}`,
      }));
      return { success: false, error: `Payment status: ${paymentIntent?.status}` };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [stripe, elements, state.clientSecret]);

  // Confirm payment and create booking
  const confirmPayment = useCallback(async (): Promise<ConfirmPaymentResult | null> => {
    if (!state.paymentIntentId) {
      setState(prev => ({ ...prev, error: 'No payment intent to confirm' }));
      return null;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('confirm-payment', {
          body: { paymentIntentId: state.paymentIntentId },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.message || 'Failed to confirm payment');
        
        return data as ConfirmPaymentResult;
      });

      setState(prev => ({ ...prev, isProcessing: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm booking';
      setState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
      return null;
    }
  }, [state.paymentIntentId]);

  // Reset state for retry
  const reset = useCallback(() => {
    setState({
      isInitializing: false,
      isProcessing: false,
      clientSecret: null,
      paymentIntentId: null,
      bookingReference: null,
      error: null,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    isReady: !!stripe && !!elements,
    canRetry: state.retryCount < MAX_RETRIES,
    createPaymentIntent,
    processPayment,
    confirmPayment,
    reset,
  };
}
