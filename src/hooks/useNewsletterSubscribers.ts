import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  source: string | null;
}

export function useNewsletterSubscribers() {
  return useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      
      if (error) throw error;
      return data as NewsletterSubscriber[];
    },
  });
}

export function useUpdateSubscriberStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast({ 
        title: is_active ? 'Subscriber reactivated' : 'Subscriber unsubscribed',
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating subscriber', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast({ title: 'Subscriber deleted' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error deleting subscriber', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
