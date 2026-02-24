import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useIconSuggestion() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const suggestIcon = async (
    title: string,
    description: string,
    availableIcons: readonly string[]
  ): Promise<string | null> => {
    if (!title || title.length < 2) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-icon', {
        body: { title, description, availableIcons: [...availableIcons] },
      });

      if (error) {
        const status = (error as any)?.status;
        if (status === 429) {
          toast({ title: 'Rate limit exceeded', description: 'Please try again in a moment.', variant: 'destructive' });
        } else if (status === 402) {
          toast({ title: 'Credits required', description: 'Please add credits to continue using AI features.', variant: 'destructive' });
        } else {
          toast({ title: 'Suggestion failed', description: 'Could not suggest an icon. Try again.', variant: 'destructive' });
        }
        return null;
      }

      return data?.icon || null;
    } catch {
      toast({ title: 'Suggestion failed', description: 'Could not suggest an icon. Try again.', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { suggestIcon, isLoading };
}
