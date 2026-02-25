import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AddonCatalog {
  id: string;
  property_id: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  price_type: string;
  max_quantity: number | null;
  requires_lead_time_hours: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  visibility: string;
  internal_cost: number | null;
  confirmation_type: string;
  availability_mode: string;
  daily_capacity: number | null;
  season_start: string | null;
  season_end: string | null;
  created_at: string;
  updated_at: string;
}

export type AddonFormData = {
  property_id: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  price_type: string;
  max_quantity: number | null;
  requires_lead_time_hours: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  visibility: string;
  internal_cost: number | null;
  confirmation_type: string;
  availability_mode: string;
  daily_capacity: number | null;
  season_start: string | null;
  season_end: string | null;
};

export function useAdminAddons(propertyId?: string) {
  return useQuery({
    queryKey: ['admin', 'addons', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('addons_catalog')
        .select('*')
        .order('sort_order', { ascending: true });

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AddonCatalog[];
    },
  });
}

export function useAddonPerformance() {
  return useQuery({
    queryKey: ['admin', 'addon-performance'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [addonsRes, bookingAddonsRes, bookingsRes] = await Promise.all([
        supabase.from('addons_catalog').select('*').order('sort_order'),
        supabase.from('booking_addons').select('*'),
        supabase.from('bookings').select('id, created_at'),
      ]);

      if (addonsRes.error) throw addonsRes.error;
      if (bookingAddonsRes.error) throw bookingAddonsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      const recentBookings = (bookingsRes.data || []).filter(
        b => new Date(b.created_at) >= thirtyDaysAgo
      );
      const recentBookingIds = new Set(recentBookings.map(b => b.id));
      const totalRecentBookings = recentBookings.length;

      const allBookingAddons = bookingAddonsRes.data || [];
      const recentBookingAddons = allBookingAddons.filter(ba => recentBookingIds.has(ba.booking_id));

      return (addonsRes.data || []).map((addon: any) => {
        const addonBookings = recentBookingAddons.filter(ba => ba.addon_id === addon.id);
        const revenue30d = addonBookings.reduce((sum: number, ba: any) => sum + Number(ba.total_price), 0);
        const uniqueBookings = new Set(addonBookings.map((ba: any) => ba.booking_id)).size;
        const attachRate = totalRecentBookings > 0 ? (uniqueBookings / totalRecentBookings) * 100 : 0;
        const refunds = addonBookings.filter((ba: any) => ba.status === 'refunded').length;
        const refundRate = addonBookings.length > 0 ? (refunds / addonBookings.length) * 100 : 0;
        const margin = addon.internal_cost != null && addon.price > 0
          ? ((addon.price - addon.internal_cost) / addon.price) * 100
          : null;

        return {
          id: addon.id,
          name: addon.name,
          category: addon.category,
          revenue30d,
          attachRate: Math.round(attachRate * 10) / 10,
          totalBookingsWithAddon: uniqueBookings,
          refundRate: Math.round(refundRate * 10) / 10,
          margin: margin != null ? Math.round(margin * 10) / 10 : null,
          is_active: addon.is_active,
        };
      });
    },
  });
}

export function useCreateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addon: AddonFormData) => {
      const { data, error } = await supabase
        .from('addons_catalog')
        .insert(addon as any)
        .select()
        .single();

      if (error) throw error;
      return data as AddonCatalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'addon-performance'] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

export function useUpdateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...addon }: Partial<AddonCatalog> & { id: string }) => {
      const { data, error } = await supabase
        .from('addons_catalog')
        .update(addon as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AddonCatalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'addon-performance'] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

export function useDeleteAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('addons_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'addon-performance'] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

export function useReorderAddons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const promises = items.map(item =>
        supabase
          .from('addons_catalog')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
    },
  });
}
