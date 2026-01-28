import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookingGuestWithCounts, 
  SelectedAddon, 
  PriceBreakdown, 
  PaymentType, 
  CouponPromo 
} from '@/types/booking-engine';
import { CancellationPolicyKey } from '@/lib/cancellation-policies';
import { format, differenceInDays } from 'date-fns';

// Generate a unique booking reference
function generateBookingReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

// Format price breakdown for PMS notes
function formatBreakdownForPMS(breakdown: PriceBreakdown): string {
  const lines: string[] = [];
  
  breakdown.lineItems.forEach(item => {
    const sign = item.type === 'discount' ? '-' : '';
    lines.push(`${item.label}: ${sign}€${Math.abs(item.amount).toFixed(2)}`);
  });
  
  lines.push('---');
  lines.push(`Total: €${breakdown.total.toFixed(2)}`);
  
  if (breakdown.depositAmount) {
    lines.push(`Deposit paid: €${breakdown.depositAmount.toFixed(2)}`);
    lines.push(`Balance due: €${breakdown.balanceAmount?.toFixed(2) || '0'}`);
  }
  
  return lines.join('\n');
}

export interface CompleteBookingParams {
  propertyId: string;
  property: {
    id: string;
    name: string;
    slug: string;
    instant_booking: boolean;
  };
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  guestInfo: BookingGuestWithCounts;
  selectedAddons: SelectedAddon[];
  priceBreakdown: PriceBreakdown;
  appliedCoupon?: CouponPromo | null;
  paymentType: PaymentType;
  cancellationPolicy?: CancellationPolicyKey;
  holdId?: string;
  sessionId: string;
}

export interface CompleteBookingResult {
  bookingId: string;
  bookingReference: string;
  status: 'confirmed' | 'pending';
  pmsSyncStatus: 'synced' | 'pending' | 'failed';
  externalBookingId?: string;
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CompleteBookingParams): Promise<CompleteBookingResult> => {
      const {
        propertyId,
        property,
        checkIn,
        checkOut,
        nights,
        guests,
        adults,
        children,
        guestInfo,
        selectedAddons,
        priceBreakdown,
        appliedCoupon,
        paymentType,
        cancellationPolicy = 'moderate',
        holdId,
      } = params;

      // 1. Generate booking reference
      const bookingReference = generateBookingReference();
      
      // 2. Determine status based on instant_booking flag
      const initialStatus = property.instant_booking ? 'confirmed' : 'pending';

      // 3. Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          property_id: propertyId,
          booking_reference: bookingReference,
          guest_name: `${guestInfo.firstName} ${guestInfo.lastName}`,
          guest_email: guestInfo.email,
          guest_phone: guestInfo.phone || null,
          guest_country: guestInfo.country || null,
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd'),
          nights,
          guests,
          adults,
          children,
          total_price: priceBreakdown.total,
          status: initialStatus,
          source: 'direct',
          payment_status: paymentType === 'deposit' ? 'partial' : 'unpaid',
          special_requests: guestInfo.specialRequests || null,
          cancellation_policy: cancellationPolicy,
          pms_sync_status: 'pending',
        })
        .select()
        .single();

      if (bookingError) {
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      // 4. Insert price breakdown line items
      const breakdownItems = priceBreakdown.lineItems.map(item => ({
        booking_id: booking.id,
        line_type: item.type,
        label: item.label,
        amount: item.type === 'discount' ? -Math.abs(item.amount) : item.amount,
        quantity: 1,
        details: item.details ? { notes: item.details } : null,
      }));

      if (breakdownItems.length > 0) {
        const { error: breakdownError } = await supabase
          .from('booking_price_breakdown')
          .insert(breakdownItems);

        if (breakdownError) {
          console.error('Failed to insert price breakdown:', breakdownError);
        }
      }

      // 5. Insert booking addons
      if (selectedAddons.length > 0) {
        const addonItems = selectedAddons.map(selected => ({
          booking_id: booking.id,
          addon_id: selected.addon.id,
          quantity: selected.quantity,
          unit_price: selected.addon.price,
          total_price: selected.calculatedPrice,
          guest_count: selected.guestCount || null,
          scheduled_date: selected.scheduledDate || null,
          status: 'pending',
        }));

        const { error: addonsError } = await supabase
          .from('booking_addons')
          .insert(addonItems);

        if (addonsError) {
          console.error('Failed to insert booking addons:', addonsError);
        }
      }

      // 6. Create payment record
      const { error: paymentError } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: booking.id,
          payment_type: paymentType === 'deposit' ? 'deposit' : 'full',
          amount: paymentType === 'deposit' 
            ? (priceBreakdown.depositAmount || priceBreakdown.total * 0.3) 
            : priceBreakdown.total,
          currency: priceBreakdown.currency || 'EUR',
          status: 'pending', // Will be updated when Stripe payment completes
        });

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
      }

      // 7. Release checkout hold if exists
      if (holdId) {
        await supabase
          .from('checkout_holds')
          .update({ released: true })
          .eq('id', holdId);
      }

      // 8. If instant booking, push to PMS
      let pmsSyncStatus: 'synced' | 'pending' | 'failed' = 'pending';
      let externalBookingId: string | undefined;

      if (property.instant_booking) {
        try {
          // Get property mapping to find external property ID
          const { data: mapping } = await supabase
            .from('pms_property_map')
            .select('external_property_id')
            .eq('property_id', propertyId)
            .eq('sync_enabled', true)
            .maybeSingle();

          if (mapping?.external_property_id) {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (token) {
              const response = await supabase.functions.invoke('advancecm-sync', {
                body: {
                  action: 'create-booking',
                  externalPropertyId: mapping.external_property_id,
                  bookingReference,
                  checkIn: format(checkIn, 'yyyy-MM-dd'),
                  checkOut: format(checkOut, 'yyyy-MM-dd'),
                  guests,
                  adults,
                  children,
                  guestInfo: {
                    firstName: guestInfo.firstName,
                    lastName: guestInfo.lastName,
                    email: guestInfo.email,
                    phone: guestInfo.phone,
                    country: guestInfo.country,
                  },
                  totalPrice: priceBreakdown.total,
                  currency: priceBreakdown.currency || 'EUR',
                  priceBreakdownNotes: formatBreakdownForPMS(priceBreakdown),
                },
              });

              if (response.data?.success) {
                pmsSyncStatus = 'synced';
                externalBookingId = response.data.externalBookingId;

                // Update booking with PMS sync status
                await supabase
                  .from('bookings')
                  .update({
                    pms_sync_status: 'synced',
                    pms_synced_at: new Date().toISOString(),
                    external_booking_id: externalBookingId,
                  })
                  .eq('id', booking.id);
              } else {
                pmsSyncStatus = 'failed';
                await supabase
                  .from('bookings')
                  .update({
                    pms_sync_status: 'failed',
                    pms_last_error: response.data?.error || 'Unknown error',
                  })
                  .eq('id', booking.id);
              }
            }
          }
        } catch (syncError) {
          console.error('PMS sync error:', syncError);
          pmsSyncStatus = 'failed';
          
          await supabase
            .from('bookings')
            .update({
              pms_sync_status: 'failed',
              pms_last_error: syncError instanceof Error ? syncError.message : 'Sync failed',
            })
            .eq('id', booking.id);
        }
      }

      return {
        bookingId: booking.id,
        bookingReference,
        status: initialStatus,
        pmsSyncStatus,
        externalBookingId,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Hook for admin to confirm pending bookings and sync to PMS
export function useConfirmBookingWithPMS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string): Promise<{ success: boolean; externalBookingId?: string }> => {
      // 1. Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, name, slug)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      // 2. Update status to confirmed
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      // 3. Get property mapping
      const { data: mapping } = await supabase
        .from('pms_property_map')
        .select('external_property_id')
        .eq('property_id', booking.property_id)
        .eq('sync_enabled', true)
        .maybeSingle();

      if (!mapping?.external_property_id) {
        // No PMS mapping, just confirm locally
        return { success: true };
      }

      // 4. Push to PMS
      try {
        const nameParts = booking.guest_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const response = await supabase.functions.invoke('advancecm-sync', {
          body: {
            action: 'create-booking',
            externalPropertyId: mapping.external_property_id,
            bookingReference: booking.booking_reference,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            guests: booking.guests,
            adults: booking.adults || booking.guests,
            children: booking.children || 0,
            guestInfo: {
              firstName,
              lastName,
              email: booking.guest_email,
              phone: booking.guest_phone,
              country: booking.guest_country,
            },
            totalPrice: booking.total_price,
            currency: 'EUR',
            priceBreakdownNotes: `Booking confirmed via admin dashboard`,
          },
        });

        if (response.data?.success) {
          await supabase
            .from('bookings')
            .update({
              pms_sync_status: 'synced',
              pms_synced_at: new Date().toISOString(),
              external_booking_id: response.data.externalBookingId,
            })
            .eq('id', bookingId);

          return { success: true, externalBookingId: response.data.externalBookingId };
        } else {
          await supabase
            .from('bookings')
            .update({
              pms_sync_status: 'failed',
              pms_last_error: response.data?.error || 'Unknown error',
            })
            .eq('id', bookingId);

          throw new Error(response.data?.error || 'PMS sync failed');
        }
      } catch (error) {
        await supabase
          .from('bookings')
          .update({
            pms_sync_status: 'failed',
            pms_last_error: error instanceof Error ? error.message : 'Sync failed',
          })
          .eq('id', bookingId);

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking-detail'] });
    },
  });
}

// Hook to retry PMS sync for failed bookings
export function useRetryPMSSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string): Promise<{ success: boolean; externalBookingId?: string }> => {
      // Get booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        throw new Error('Booking not found');
      }

      // Get mapping
      const { data: mapping } = await supabase
        .from('pms_property_map')
        .select('external_property_id')
        .eq('property_id', booking.property_id)
        .eq('sync_enabled', true)
        .maybeSingle();

      if (!mapping?.external_property_id) {
        throw new Error('No PMS mapping found for this property');
      }

      // Retry sync
      const nameParts = booking.guest_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await supabase.functions.invoke('advancecm-sync', {
        body: {
          action: 'create-booking',
          externalPropertyId: mapping.external_property_id,
          bookingReference: booking.booking_reference,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          guests: booking.guests,
          adults: booking.adults || booking.guests,
          children: booking.children || 0,
          guestInfo: {
            firstName,
            lastName,
            email: booking.guest_email,
            phone: booking.guest_phone,
            country: booking.guest_country,
          },
          totalPrice: booking.total_price,
          currency: 'EUR',
          priceBreakdownNotes: `Retry sync from admin dashboard`,
        },
      });

      if (response.data?.success) {
        await supabase
          .from('bookings')
          .update({
            pms_sync_status: 'synced',
            pms_synced_at: new Date().toISOString(),
            external_booking_id: response.data.externalBookingId,
            pms_retry_count: (booking.pms_retry_count || 0) + 1,
            pms_last_error: null,
          })
          .eq('id', bookingId);

        return { success: true, externalBookingId: response.data.externalBookingId };
      } else {
        await supabase
          .from('bookings')
          .update({
            pms_sync_status: 'failed',
            pms_last_error: response.data?.error || 'Unknown error',
            pms_retry_count: (booking.pms_retry_count || 0) + 1,
          })
          .eq('id', bookingId);

        throw new Error(response.data?.error || 'PMS sync failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking-detail'] });
    },
  });
}
