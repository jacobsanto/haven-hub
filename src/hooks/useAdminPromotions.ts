import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CouponPromo {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_nights: number | null;
  min_booking_value: number | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string;
  applicable_properties: string[] | null;
  stackable: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SpecialOffer {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property?: { id: string; name: string };
}

export type CouponFormData = {
  code: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_nights: number | null;
  min_booking_value: number | null;
  max_uses: number | null;
  valid_from: string;
  valid_until: string;
  applicable_properties: string[] | null;
  stackable: boolean;
  is_active: boolean;
};

export type SpecialOfferFormData = {
  property_id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
};

// Coupons
export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons_promos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CouponPromo[];
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: CouponFormData) => {
      const { data, error } = await supabase
        .from('coupons_promos')
        .insert({ ...coupon, uses_count: 0 })
        .select()
        .single();

      if (error) throw error;
      return data as CouponPromo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...coupon }: Partial<CouponPromo> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons_promos')
        .update(coupon)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CouponPromo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons_promos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

// Special Offers
export function useAdminSpecialOffers() {
  return useQuery({
    queryKey: ['admin', 'special-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select(`
          *,
          property:properties(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SpecialOffer[];
    },
  });
}

export function useCreateSpecialOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: SpecialOfferFormData) => {
      const { data, error } = await supabase
        .from('special_offers')
        .insert(offer)
        .select()
        .single();

      if (error) throw error;
      return data as SpecialOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'special-offers'] });
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });
}

export function useUpdateSpecialOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...offer }: Partial<SpecialOffer> & { id: string }) => {
      const { property, ...offerData } = offer;
      const { data, error } = await supabase
        .from('special_offers')
        .update(offerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SpecialOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'special-offers'] });
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });
}

export function useDeleteSpecialOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('special_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'special-offers'] });
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });
}
