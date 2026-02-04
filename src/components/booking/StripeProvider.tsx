import { ReactNode, useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Appearance } from '@stripe/stripe-js';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const appearance: Appearance = useMemo(() => ({
    theme: 'stripe',
    variables: {
      colorPrimary: 'hsl(16 50% 48%)', // Primary color from design system
      colorBackground: 'hsl(35 30% 96%)',
      colorText: 'hsl(25 30% 15%)',
      colorDanger: 'hsl(0 84% 60%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid hsl(25 10% 80%)',
        boxShadow: 'none',
        padding: '12px',
      },
      '.Input:focus': {
        border: '1px solid hsl(16 50% 48%)',
        boxShadow: '0 0 0 1px hsl(16 50% 48%)',
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '8px',
      },
    },
  }), []);

  const options = useMemo(() => ({
    appearance,
    locale: 'en' as const,
  }), [appearance]);

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
