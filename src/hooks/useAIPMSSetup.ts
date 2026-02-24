import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AISuggestion {
  authType: 'api_key' | 'oauth2_client_credentials' | 'bearer_token';
  authFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required: boolean;
    placeholder?: string;
    helpText?: string;
  }>;
  baseUrl: string;
  tokenUrl?: string;
  tokenScope?: string;
  setupSteps: Array<{
    title: string;
    description: string;
    docsLink?: string;
  }>;
  capabilities: {
    pullProperties?: boolean;
    pullAvailability?: boolean;
    pullRates?: boolean;
    pushBookings?: boolean;
    webhooksSupported?: boolean;
  };
}

/** Call AI to analyze PMS API docs and suggest configuration */
export function useAnalyzePMSDocs() {
  return useMutation({
    mutationFn: async ({
      docsUrl,
      providerName,
    }: {
      docsUrl: string;
      providerName?: string;
    }): Promise<AISuggestion> => {
      const { data, error } = await supabase.functions.invoke('pms-analyze-docs', {
        body: { docsUrl, providerName },
      });

      if (error) throw new Error(error.message || 'Failed to analyze docs');
      if (!data?.success) throw new Error(data?.error || 'AI analysis failed');

      return data.suggestion as AISuggestion;
    },
  });
}
