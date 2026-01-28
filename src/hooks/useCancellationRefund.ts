import { useMemo } from 'react';
import { 
  CancellationPolicyKey, 
  calculateRefund, 
  RefundCalculation,
  CANCELLATION_POLICIES 
} from '@/lib/cancellation-policies';

export interface CancellationRefundInput {
  cancellationPolicy: CancellationPolicyKey | null;
  checkIn: string | Date;
  totalPrice: number;
}

/**
 * Hook to calculate refund amount for a booking cancellation
 * Used by admin when processing cancellation requests
 */
export function useCancellationRefund(booking: CancellationRefundInput): RefundCalculation | null {
  return useMemo(() => {
    if (!booking.cancellationPolicy || !booking.checkIn || !booking.totalPrice) {
      return null;
    }

    const checkInDate = typeof booking.checkIn === 'string' 
      ? new Date(booking.checkIn) 
      : booking.checkIn;

    const cancellationDate = new Date(); // Current time

    return calculateRefund(
      booking.cancellationPolicy,
      checkInDate,
      cancellationDate,
      booking.totalPrice
    );
  }, [booking.cancellationPolicy, booking.checkIn, booking.totalPrice]);
}

/**
 * Get policy details for display
 */
export function useCancellationPolicyDetails(policyKey: CancellationPolicyKey | null) {
  return useMemo(() => {
    if (!policyKey) return null;
    return CANCELLATION_POLICIES[policyKey];
  }, [policyKey]);
}
