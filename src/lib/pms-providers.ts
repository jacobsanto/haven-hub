// PMS Provider Registry - Generic multi-provider configuration system

export interface AuthFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  secretName: string;
}

export interface PMSProviderConfig {
  id: string;
  name: string;
  description: string;
  logo?: string;
  docsUrl: string;
  edgeFunctionName: string;
  authFields: AuthFieldConfig[];
  capabilities: {
    pullProperties: boolean;
    pullAvailability: boolean;
    pullRates: boolean;
    pushBookings: boolean;
    webhooksSupported: boolean;
  };
  healthCheckEndpoint?: string;
}

export interface PMSConnectionConfig {
  provider: string;
  auth: Record<string, string>; // Maps auth field keys to secret names
  sync_settings: {
    auto_sync_interval_minutes: number;
    sync_properties: boolean;
    sync_availability: boolean;
    sync_rates: boolean;
    push_bookings: boolean;
  };
  webhook_url?: string;
  last_health_check?: string;
  health_status?: 'healthy' | 'degraded' | 'error' | 'unknown';
}

export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  lastCheck: string | null;
  latencyMs?: number;
  errorCount24h: number;
  syncSuccessRate: number;
}

export const PMS_PROVIDERS: PMSProviderConfig[] = [
  {
    id: 'advancecm',
    name: 'AdvanceCM (Tokeet)',
    description: 'Vacation rental property management and channel manager',
    docsUrl: 'https://capi.tokeet.com/docs',
    edgeFunctionName: 'advancecm-sync',
    authFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Your Tokeet API key',
        helpText: 'Found in Tokeet Settings → Account Info',
        secretName: 'TOKEET_API_KEY',
      },
      {
        key: 'account_id',
        label: 'Account ID',
        type: 'text',
        required: true,
        placeholder: 'Your Tokeet account ID',
        helpText: 'Found in Tokeet Settings → Account Info',
        secretName: 'TOKEET_ACCOUNT_ID',
      },
    ],
    capabilities: {
      pullProperties: true,
      pullAvailability: true,
      pullRates: true,
      pushBookings: false, // Planned for future
      webhooksSupported: true,
    },
    healthCheckEndpoint: '/rental',
  },
  {
    id: 'hostaway',
    name: 'Hostaway',
    description: 'Property management platform with channel distribution',
    docsUrl: 'https://api.hostaway.com/documentation',
    edgeFunctionName: 'hostaway-sync',
    authFields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Your Hostaway Client ID',
        helpText: 'Found in Hostaway Settings → API',
        secretName: 'HOSTAWAY_CLIENT_ID',
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Your Hostaway Client Secret',
        helpText: 'Found in Hostaway Settings → API',
        secretName: 'HOSTAWAY_CLIENT_SECRET',
      },
    ],
    capabilities: {
      pullProperties: true,
      pullAvailability: true,
      pullRates: true,
      pushBookings: true,
      webhooksSupported: true,
    },
  },
  {
    id: 'guesty',
    name: 'Guesty',
    description: 'End-to-end property management solution',
    docsUrl: 'https://docs.guesty.com/',
    edgeFunctionName: 'guesty-sync',
    authFields: [
      {
        key: 'api_token',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Your Guesty API Token',
        helpText: 'Found in Guesty Dashboard → Marketplace → API',
        secretName: 'GUESTY_API_TOKEN',
      },
      {
        key: 'integration_id',
        label: 'Integration ID',
        type: 'text',
        required: true,
        placeholder: 'Your Guesty Integration ID',
        helpText: 'Provided when creating an API integration',
        secretName: 'GUESTY_INTEGRATION_ID',
      },
    ],
    capabilities: {
      pullProperties: true,
      pullAvailability: true,
      pullRates: true,
      pushBookings: true,
      webhooksSupported: true,
    },
  },
];

export function getProviderById(id: string): PMSProviderConfig | undefined {
  return PMS_PROVIDERS.find(p => p.id === id);
}

export function getProviderByName(name: string): PMSProviderConfig | undefined {
  return PMS_PROVIDERS.find(p => 
    p.name.toLowerCase().includes(name.toLowerCase()) ||
    p.id.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get the edge function name for a given PMS provider.
 * Falls back to 'advancecm-sync' if provider not found.
 */
export function getEdgeFunctionForProvider(providerId: string): string {
  const provider = getProviderById(providerId);
  return provider?.edgeFunctionName || 'advancecm-sync';
}

export function getDefaultSyncSettings() {
  return {
    auto_sync_interval_minutes: 15,
    sync_properties: true,
    sync_availability: true,
    sync_rates: true,
    push_bookings: false,
  };
}
