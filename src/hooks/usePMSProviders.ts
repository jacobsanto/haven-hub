import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PMSProviderConfig, AuthFieldConfig } from '@/lib/pms-providers';

export interface DBProviderRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  api_docs_url: string | null;
  auth_type: string;
  auth_fields: AuthFieldConfig[];
  base_url: string | null;
  token_url: string | null;
  token_scope: string | null;
  setup_steps: Array<{ title: string; description: string; docsLink?: string }>;
  edge_function_name: string | null;
  capabilities: {
    pullProperties?: boolean;
    pullAvailability?: boolean;
    pullRates?: boolean;
    pushBookings?: boolean;
    webhooksSupported?: boolean;
  };
  is_builtin: boolean;
  created_at: string;
}

/** Convert a DB record to the PMSProviderConfig interface used by existing components */
function toProviderConfig(record: DBProviderRecord): PMSProviderConfig {
  return {
    id: record.slug,
    name: record.name,
    description: record.description || '',
    docsUrl: record.api_docs_url || '',
    edgeFunctionName: record.edge_function_name || 'pms-generic-test',
    authFields: record.auth_fields || [],
    capabilities: {
      pullProperties: record.capabilities?.pullProperties ?? false,
      pullAvailability: record.capabilities?.pullAvailability ?? false,
      pullRates: record.capabilities?.pullRates ?? false,
      pushBookings: record.capabilities?.pushBookings ?? false,
      webhooksSupported: record.capabilities?.webhooksSupported ?? false,
    },
  };
}

/** Fetch all PMS providers from the database registry */
export function usePMSProviders() {
  return useQuery({
    queryKey: ['pms-provider-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_provider_registry')
        .select('*')
        .order('is_builtin', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      const records = (data || []) as unknown as DBProviderRecord[];
      return {
        records,
        providers: records.map(toProviderConfig),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/** Get a single provider record by slug */
export function usePMSProviderBySlug(slug: string | null) {
  return useQuery({
    queryKey: ['pms-provider-registry', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('pms_provider_registry')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as DBProviderRecord | null;
    },
    enabled: !!slug,
  });
}

/** Save a new custom provider to the registry */
export function useSaveCustomProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: {
      slug: string;
      name: string;
      description?: string;
      apiDocsUrl?: string;
      authType: string;
      authFields: AuthFieldConfig[];
      baseUrl?: string;
      tokenUrl?: string;
      tokenScope?: string;
      setupSteps?: Array<{ title: string; description: string; docsLink?: string }>;
      capabilities?: Record<string, boolean>;
    }) => {
      const insertData = {
        slug: provider.slug,
        name: provider.name,
        description: provider.description || null,
        api_docs_url: provider.apiDocsUrl || null,
        auth_type: provider.authType,
        auth_fields: JSON.parse(JSON.stringify(provider.authFields)),
        base_url: provider.baseUrl || null,
        token_url: provider.tokenUrl || null,
        token_scope: provider.tokenScope || null,
        setup_steps: JSON.parse(JSON.stringify(provider.setupSteps || [])),
        capabilities: JSON.parse(JSON.stringify(provider.capabilities || {})),
        is_builtin: false,
      };

      const { data, error } = await supabase
        .from('pms_provider_registry')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DBProviderRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pms-provider-registry'] });
    },
  });
}
