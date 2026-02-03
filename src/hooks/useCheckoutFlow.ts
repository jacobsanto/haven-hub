import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { pmsAdapter } from '@/integrations/pms';
import { AvailabilityCalendarDay } from '@/types/booking-engine';
import { format, eachDayOfInterval, parseISO, addDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Generate a session ID for checkout holds
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Fetch availability calendar for a property
// Now reads from local availability table which is synced from PMS
export function useAvailabilityCalendar(
  propertyId: string,
  startDate: string,
  endDate: string,
  _externalPropertyId?: string // Kept for API compatibility but no longer used
) {
  return useQuery({
    queryKey: ['availability-calendar', propertyId, startDate, endDate],
    queryFn: async () => {
      // The availability table is now the source of truth, synced from PMS
      // No need to call PMS adapter directly - data is already in local DB
      let pmsAvailability: AvailabilityCalendarDay[] = [];
      
      // Note: externalPropertyId lookup is no longer needed here
      // The sync-availability edge function handles the PMS sync
      // This hook now just reads from the local availability table
      {
      }

      // Get availability from local table (synced from PMS)
      const { data: localBlocks } = await supabase
        .from('availability')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', startDate)
        .lte('date', endDate);

      // Check for active checkout holds (other than our own session)
      const { data: holds } = await supabase
        .from('checkout_holds')
        .select('*')
        .eq('property_id', propertyId)
        .eq('released', false)
        .gt('expires_at', new Date().toISOString());

      // Get confirmed/pending bookings that may not yet be in availability table
      const { data: directBookings } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed'])
        .gte('check_out', startDate)
        .lte('check_in', endDate);

      // Merge PMS availability with local overrides, holds, and direct bookings
      const localBlocksMap = new Map(localBlocks?.map(b => [b.date, b]) || []);
      const heldDates = new Set<string>();
      const bookedDates = new Set<string>();
      
      holds?.forEach(hold => {
        const start = parseISO(hold.check_in);
        const end = parseISO(hold.check_out);
        // Block check-in through day BEFORE check-out (checkout day is available)
        const days = eachDayOfInterval({ start, end: addDays(end, -1) });
        days.forEach(d => heldDates.add(format(d, 'yyyy-MM-dd')));
      });

      // Mark dates from direct bookings as blocked (check-in to day before check-out)
      directBookings?.forEach(booking => {
        const start = parseISO(booking.check_in);
        const end = parseISO(booking.check_out);
        // Block check-in through day BEFORE check-out (checkout day is available)
        const days = eachDayOfInterval({ start, end: addDays(end, -1) });
        days.forEach(d => bookedDates.add(format(d, 'yyyy-MM-dd')));
      });

      // If no PMS data, generate from local data
      if (pmsAvailability.length === 0) {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const days = eachDayOfInterval({ start, end });

        // Get property base price
        const { data: property } = await supabase
          .from('properties')
          .select('base_price')
          .eq('id', propertyId)
          .single();

        pmsAvailability = days.map(d => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const localBlock = localBlocksMap.get(dateStr);
          const isHeld = heldDates.has(dateStr);
          const isBooked = bookedDates.has(dateStr);
          const isUnavailable = !localBlock?.available || isHeld || isBooked;

          return {
            date: dateStr,
            available: localBlock ? localBlock.available && !isHeld && !isBooked : !isHeld && !isBooked,
            price: property?.base_price || 500,
            minStay: 2,
            checkInAllowed: true,
            checkOutAllowed: true,
            isBlocked: isUnavailable,
            blockReason: isHeld ? 'held' : isBooked ? 'booked' : localBlock?.available === false ? 'blocked' : undefined,
          };
        });
      } else {
        // Merge with local overrides and direct bookings
        pmsAvailability = pmsAvailability.map(day => {
          const localBlock = localBlocksMap.get(day.date);
          const isHeld = heldDates.has(day.date);
          const isBooked = bookedDates.has(day.date);

          if (localBlock && !localBlock.available) {
            return { ...day, available: false, isBlocked: true, blockReason: 'blocked' };
          }
          if (isHeld) {
            return { ...day, available: false, isBlocked: true, blockReason: 'held' };
          }
          if (isBooked) {
            return { ...day, available: false, isBlocked: true, blockReason: 'booked' };
          }
          return day;
        });
      }

      return pmsAvailability;
    },
    enabled: !!propertyId && !!startDate && !!endDate,
    staleTime: 30000, // 30 seconds
  });
}

// Get property timezone for date calculations
export function usePropertyTimezone(propertyId: string) {
  return useQuery({
    queryKey: ['property-timezone', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('timezone')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      return data?.timezone || 'Europe/Athens';
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes - timezone rarely changes
  });
}

// Get "today" in a specific timezone
export function getTodayInTimezone(timezone: string = 'Europe/Athens'): Date {
  return startOfDay(toZonedTime(new Date(), timezone));
}

// Check if a date range is available
export function useCheckDateRangeAvailability(
  propertyId: string,
  checkIn: string,
  checkOut: string
) {
  return useQuery({
    queryKey: ['check-date-range', propertyId, checkIn, checkOut],
    queryFn: async () => {
      // Check local availability table
      const { data: blockedDates } = await supabase
        .from('availability')
        .select('date')
        .eq('property_id', propertyId)
        .eq('available', false)
        .gte('date', checkIn)
        .lt('date', checkOut);

      // Check existing bookings
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed'])
        .or(`check_in.lt.${checkOut},check_out.gt.${checkIn}`);

      // Check active holds (excluding expired)
      const { data: activeHolds } = await supabase
        .from('checkout_holds')
        .select('check_in, check_out, session_id')
        .eq('property_id', propertyId)
        .eq('released', false)
        .gt('expires_at', new Date().toISOString());

      const hasBlockedDates = (blockedDates?.length || 0) > 0;
      const hasOverlappingBookings = (existingBookings?.length || 0) > 0;
      const hasActiveHolds = (activeHolds?.length || 0) > 0;

      return {
        isAvailable: !hasBlockedDates && !hasOverlappingBookings && !hasActiveHolds,
        blockedDates: blockedDates?.map(d => d.date) || [],
        overlappingBookings: existingBookings || [],
        activeHolds: activeHolds || [],
      };
    },
    enabled: !!propertyId && !!checkIn && !!checkOut,
  });
}

// Create a checkout hold (temporary lock)
export function useCreateCheckoutHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      checkIn,
      checkOut,
      sessionId,
      ttlMinutes = 10,
    }: {
      propertyId: string;
      checkIn: string;
      checkOut: string;
      sessionId: string;
      ttlMinutes?: number;
    }) => {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('checkout_holds')
        .insert({
          property_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
          session_id: sessionId,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability-calendar', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['check-date-range', data.property_id] });
    },
  });
}

// Release a checkout hold
export function useReleaseCheckoutHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holdId: string) => {
      const { error } = await supabase
        .from('checkout_holds')
        .update({ released: true })
        .eq('id', holdId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['check-date-range'] });
    },
  });
}

// Extend a checkout hold
export function useExtendCheckoutHold() {
  return useMutation({
    mutationFn: async ({
      holdId,
      additionalMinutes = 5,
    }: {
      holdId: string;
      additionalMinutes?: number;
    }) => {
      const { data: hold } = await supabase
        .from('checkout_holds')
        .select('expires_at')
        .eq('id', holdId)
        .single();

      if (!hold) throw new Error('Hold not found');

      const currentExpiry = new Date(hold.expires_at);
      const newExpiry = new Date(currentExpiry.getTime() + additionalMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('checkout_holds')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', holdId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
