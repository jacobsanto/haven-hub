import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExitIntentSettings {
  id: string;
  is_enabled: boolean;
  delay_seconds: number;
  cooldown_days: number;
  discount_offer_enabled: boolean;
  discount_percent: number;
  price_drop_offer_enabled: boolean;
  headline: string;
  subheadline: string;
  updated_at: string;
}

export function useExitIntentSettings() {
  return useQuery({
    queryKey: ['exit-intent-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exit_intent_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as ExitIntentSettings;
    },
  });
}

export function useUpdateExitIntentSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<ExitIntentSettings> & { id: string }) => {
      const { id, ...updates } = settings;
      const { data, error } = await supabase
        .from('exit_intent_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-intent-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Exit intent settings have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useExitIntentAnalytics() {
  return useQuery({
    queryKey: ['exit-intent-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .or('source.eq.exit_intent_discount,source.eq.exit_intent_price_drop')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;

      const discountCount = data.filter(s => s.source === 'exit_intent_discount').length;
      const priceDropCount = data.filter(s => s.source === 'exit_intent_price_drop').length;

      return {
        total: data.length,
        discountCount,
        priceDropCount,
        recentSignups: data.slice(0, 10),
      };
    },
  });
}
