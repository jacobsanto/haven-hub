import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, parseISO } from 'date-fns';

export interface RevenueStats {
  totalRevenue: number;
  confirmedBookings: number;
  averageBookingValue: number;
  averageStayLength: number;
  pendingRevenue: number;
}

export interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  revenue: number;
  bookingsCount: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  bookings: number;
}

export interface AddonPerformance {
  addonId: string;
  addonName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface OccupancyMetrics {
  propertyId: string;
  propertyName: string;
  totalNights: number;
  bookedNights: number;
  occupancyRate: number;
}

export function useRevenueStats(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(new Date());
  const end = dateRange?.end || endOfMonth(new Date());

  return useQuery({
    queryKey: ['admin', 'analytics', 'revenue-stats', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<RevenueStats> => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('total_price, nights, status')
        .gte('check_in', format(start, 'yyyy-MM-dd'))
        .lte('check_in', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const confirmed = bookings?.filter(b => b.status === 'confirmed') || [];
      const pending = bookings?.filter(b => b.status === 'pending') || [];

      const totalRevenue = confirmed.reduce((sum, b) => sum + Number(b.total_price), 0);
      const pendingRevenue = pending.reduce((sum, b) => sum + Number(b.total_price), 0);
      const totalNights = confirmed.reduce((sum, b) => sum + b.nights, 0);

      return {
        totalRevenue,
        confirmedBookings: confirmed.length,
        averageBookingValue: confirmed.length > 0 ? totalRevenue / confirmed.length : 0,
        averageStayLength: confirmed.length > 0 ? totalNights / confirmed.length : 0,
        pendingRevenue,
      };
    },
  });
}

export function useRevenueByProperty(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(subMonths(new Date(), 11));
  const end = dateRange?.end || endOfMonth(new Date());

  return useQuery({
    queryKey: ['admin', 'analytics', 'revenue-by-property', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<PropertyRevenue[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          total_price,
          status,
          property:properties(id, name)
        `)
        .eq('status', 'confirmed')
        .gte('check_in', format(start, 'yyyy-MM-dd'))
        .lte('check_in', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const propertyMap = new Map<string, PropertyRevenue>();

      data?.forEach(booking => {
        if (booking.property) {
          const property = booking.property as { id: string; name: string };
          const existing = propertyMap.get(property.id);
          if (existing) {
            existing.revenue += Number(booking.total_price);
            existing.bookingsCount += 1;
          } else {
            propertyMap.set(property.id, {
              propertyId: property.id,
              propertyName: property.name,
              revenue: Number(booking.total_price),
              bookingsCount: 1,
            });
          }
        }
      });

      return Array.from(propertyMap.values()).sort((a, b) => b.revenue - a.revenue);
    },
  });
}

export function useMonthlyTrends(months: number = 12) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'monthly-trends', months],
    queryFn: async (): Promise<MonthlyTrend[]> => {
      const end = endOfMonth(new Date());
      const start = startOfMonth(subMonths(new Date(), months - 1));

      const { data, error } = await supabase
        .from('bookings')
        .select('total_price, check_in, status')
        .eq('status', 'confirmed')
        .gte('check_in', format(start, 'yyyy-MM-dd'))
        .lte('check_in', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const monthlyMap = new Map<string, MonthlyTrend>();

      // Initialize all months
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(new Date(), months - 1 - i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyMap.set(monthKey, {
          month: format(monthDate, 'MMM yyyy'),
          revenue: 0,
          bookings: 0,
        });
      }

      // Populate with data
      data?.forEach(booking => {
        const monthKey = format(parseISO(booking.check_in), 'yyyy-MM');
        const existing = monthlyMap.get(monthKey);
        if (existing) {
          existing.revenue += Number(booking.total_price);
          existing.bookings += 1;
        }
      });

      return Array.from(monthlyMap.values());
    },
  });
}

export function useAddonPerformance(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(subMonths(new Date(), 2));
  const end = dateRange?.end || endOfMonth(new Date());

  return useQuery({
    queryKey: ['admin', 'analytics', 'addon-performance', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<AddonPerformance[]> => {
      const { data, error } = await supabase
        .from('booking_addons')
        .select(`
          quantity,
          total_price,
          addon:addons_catalog(id, name)
        `)
        .gte('created_at', format(start, 'yyyy-MM-dd'))
        .lte('created_at', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const addonMap = new Map<string, AddonPerformance>();

      data?.forEach(item => {
        if (item.addon) {
          const addon = item.addon as { id: string; name: string };
          const existing = addonMap.get(addon.id);
          if (existing) {
            existing.totalSold += item.quantity;
            existing.totalRevenue += Number(item.total_price);
          } else {
            addonMap.set(addon.id, {
              addonId: addon.id,
              addonName: addon.name,
              totalSold: item.quantity,
              totalRevenue: Number(item.total_price),
            });
          }
        }
      });

      return Array.from(addonMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
  });
}

export function useOccupancyMetrics(dateRange?: { start: Date; end: Date }) {
  const start = dateRange?.start || startOfMonth(new Date());
  const end = dateRange?.end || endOfMonth(new Date());

  return useQuery({
    queryKey: ['admin', 'analytics', 'occupancy', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<OccupancyMetrics[]> => {
      // Get all properties
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('status', 'active');

      if (propError) throw propError;

      // Get confirmed bookings in date range
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('property_id, check_in, check_out, nights')
        .eq('status', 'confirmed')
        .or(`check_in.gte.${format(start, 'yyyy-MM-dd')},check_out.lte.${format(end, 'yyyy-MM-dd')}`);

      if (bookError) throw bookError;

      const totalDays = eachDayOfInterval({ start, end }).length;

      return (properties || []).map(property => {
        const propertyBookings = bookings?.filter(b => b.property_id === property.id) || [];
        const bookedNights = propertyBookings.reduce((sum, b) => sum + b.nights, 0);

        return {
          propertyId: property.id,
          propertyName: property.name,
          totalNights: totalDays,
          bookedNights: Math.min(bookedNights, totalDays),
          occupancyRate: totalDays > 0 ? (Math.min(bookedNights, totalDays) / totalDays) * 100 : 0,
        };
      }).sort((a, b) => b.occupancyRate - a.occupancyRate);
    },
  });
}

export function useCheckoutHoldsStats() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'checkout-holds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkout_holds')
        .select('id, expires_at, released')
        .eq('released', false)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return {
        activeHolds: data?.length || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTodayActivity() {
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['admin', 'analytics', 'today-activity', today],
    queryFn: async () => {
      const [checkIns, checkOuts, newBookings] = await Promise.all([
        supabase
          .from('bookings')
          .select('id')
          .eq('check_in', today)
          .eq('status', 'confirmed'),
        supabase
          .from('bookings')
          .select('id')
          .eq('check_out', today)
          .eq('status', 'confirmed'),
        supabase
          .from('bookings')
          .select('id')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
      ]);

      return {
        checkInsToday: checkIns.data?.length || 0,
        checkOutsToday: checkOuts.data?.length || 0,
        newBookingsToday: newBookings.data?.length || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
