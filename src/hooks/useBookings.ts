import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingFormData, BookingStatus, BookingWithProperty } from '@/types/database';
import { differenceInDays } from 'date-fns';

// Generate a unique booking reference
function generateBookingReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

// Create a new booking
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: BookingFormData & { 
      basePrice: number;
      adults?: number;
      children?: number;
      guestCountry?: string;
      specialRequests?: string;
    }) => {
      const nights = differenceInDays(formData.checkOut, formData.checkIn);
      const totalPrice = nights * formData.basePrice;
      const adults = formData.adults ?? formData.guests;
      const children = formData.children ?? 0;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          property_id: formData.propertyId,
          booking_reference: generateBookingReference(),
          guest_name: formData.guestName,
          guest_email: formData.guestEmail,
          guest_phone: formData.guestPhone || null,
          guest_country: formData.guestCountry || null,
          check_in: formData.checkIn.toISOString().split('T')[0],
          check_out: formData.checkOut.toISOString().split('T')[0],
          nights,
          guests: formData.guests,
          adults,
          children,
          total_price: totalPrice,
          status: 'pending',
          source: 'direct',
          payment_status: 'unpaid',
          special_requests: formData.specialRequests || null,
          pms_sync_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// Admin: Fetch all bookings
export function useAdminBookings(filters?: {
  status?: BookingStatus;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, name, slug, hero_image_url)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId);
      }

      if (filters?.startDate) {
        query = query.gte('check_in', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('check_out', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BookingWithProperty[];
    },
  });
}

// Admin: Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });
}

// Get booking stats for admin dashboard
export function useBookingStats() {
  return useQuery({
    queryKey: ['admin', 'booking-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get total bookings count
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get pending bookings
      const { count: pendingBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get upcoming check-ins (next 7 days)
      const { data: upcomingCheckIns } = await supabase
        .from('bookings')
        .select('*')
        .gte('check_in', today)
        .lte('check_in', nextWeek)
        .eq('status', 'confirmed');

      // Get total revenue from confirmed bookings
      const { data: revenueData } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('status', 'confirmed');

      const totalRevenue = revenueData?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0;

      return {
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        upcomingCheckIns: upcomingCheckIns?.length || 0,
        totalRevenue,
      };
    },
  });
}
