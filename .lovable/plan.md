

# Enhanced PMS Health Dashboard - Generic Multi-Provider Configuration

## Overview

This plan transforms the current AdvanceCM-specific PMS integration into a **generic, extensible architecture** that supports multiple PMS providers with their own unique authentication requirements. The configuration system will be flexible enough to accommodate any PMS provider's connection needs.

---

## Current State Analysis

| Aspect | Current Implementation | Limitation |
|--------|------------------------|------------|
| Configuration Dialog | Hardcoded for AdvanceCM/Tokeet | Cannot add new providers without code changes |
| Secrets | Fixed `TOKEET_API_KEY` + `TOKEET_ACCOUNT_ID` | Not flexible for different auth methods |
| Connection Status | Basic connected/disconnected | No detailed health metrics |
| Edge Function | Single provider logic | Needs provider abstraction |
| Two-way Sync | Pull only (properties, availability) | No booking push visibility |

---

## Proposed Architecture

### 1. Provider Registry System

Create a provider configuration registry that defines each PMS provider's:
- Authentication fields (API keys, OAuth, tokens, account IDs)
- Available sync capabilities (properties, availability, rates, bookings)
- API endpoints and documentation links
- Status check endpoints

```typescript
interface PMSProviderConfig {
  id: string;                          // 'advancecm' | 'hostaway' | 'guesty' | etc.
  name: string;                        // Display name
  description: string;                 // Short description
  logo?: string;                       // Provider logo URL
  docsUrl: string;                     // API documentation link
  
  authFields: AuthFieldConfig[];       // Dynamic auth field definitions
  
  capabilities: {
    pullProperties: boolean;
    pullAvailability: boolean;
    pullRates: boolean;
    pushBookings: boolean;
    webhooksSupported: boolean;
  };
  
  healthCheckEndpoint?: string;        // For connection testing
}

interface AuthFieldConfig {
  key: string;                         // 'api_key', 'account_id', 'client_id', etc.
  label: string;                       // Display label
  type: 'text' | 'password' | 'url';   // Input type
  required: boolean;
  placeholder?: string;
  helpText?: string;
}
```

### 2. Provider Definitions

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROVIDER: AdvanceCM (Tokeet)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth Fields:                                                                │
│    - api_key (password): "Your Tokeet API Key"                              │
│    - account_id (text): "Your Tokeet Account ID"                            │
│                                                                              │
│  Capabilities:                                                               │
│    ✓ Pull Properties    ✓ Pull Availability    ✓ Pull Rates                │
│    ◌ Push Bookings (planned)    ✓ Webhooks Supported                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PROVIDER: Hostaway (Example Future Provider)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth Fields:                                                                │
│    - client_id (text): "OAuth Client ID"                                    │
│    - client_secret (password): "OAuth Client Secret"                        │
│                                                                              │
│  Capabilities:                                                               │
│    ✓ Pull Properties    ✓ Pull Availability    ✓ Pull Rates                │
│    ✓ Push Bookings    ✓ Webhooks Supported                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PROVIDER: Guesty (Example Future Provider)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth Fields:                                                                │
│    - api_token (password): "API Access Token"                               │
│    - integration_id (text): "Integration ID"                                │
│                                                                              │
│  Capabilities:                                                               │
│    ✓ Pull Properties    ✓ Pull Availability    ✓ Pull Rates                │
│    ✓ Push Bookings    ✓ Webhooks Supported                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Enhanced UI Components

### 3. Connection Status Card (Enhanced)

Replace the current basic status card with a comprehensive health dashboard:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔌 PMS Connection Health                                                    │
├──────────────────┬───────────────────┬───────────────────┬─────────────────┤
│  CONNECTION      │   SYNC STATUS     │   LAST ACTIVITY   │   UPTIME        │
│  ━━━━━━━━━━━━━   │   ━━━━━━━━━━━━    │   ━━━━━━━━━━━━    │   ━━━━━━━━━━    │
│  🟢 Connected    │   ✓ Healthy       │   2 min ago       │   99.8%         │
│  AdvanceCM       │   0 errors        │   Pull: Avail.    │   (7 days)      │
├──────────────────┴───────────────────┴───────────────────┴─────────────────┤
│                                                                              │
│  Sync Capabilities:                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ ⬇ Properties │  │ ⬇ Availability│  │ ⬇ Rates     │  │ ⬆ Bookings  │    │
│  │   ✓ Active   │  │   ✓ Active   │  │   ✓ Active  │  │   ◌ Pending │    │
│  │   6 synced   │  │   Last: 2m   │  │   Last: 2m  │  │   Coming    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  [Test Connection]  [Sync Now]  [View Logs]  [⚙ Configure]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Generic Configuration Dialog (New)

Replace the AdvanceCM-specific dialog with a provider-agnostic configurator:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Configure PMS Integration                                           [X]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Select Provider:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [●] AdvanceCM (Tokeet)     Vacation rental management               │    │
│  │ [○] Hostaway               Property management platform              │    │
│  │ [○] Guesty                 End-to-end property management           │    │
│  │ [○] Custom PMS             Configure custom API integration         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  AdvanceCM Configuration:                                                    │
│                                                                              │
│  API Key *                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ••••••••••••••••••••••••••••••••                        [Show]      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  Your API key from Tokeet Settings → Account Info                           │
│                                                                              │
│  Account ID *                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 5f8e3d2c1b0a...                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  Your account identifier from Tokeet                                        │
│                                                                              │
│  Webhook URL (for real-time updates):                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ https://your-project.supabase.co/functions/v1/pms-webhook    [Copy] │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Connection Status: 🟢 Connected (tested 5 min ago)                          │
│                                                                              │
│  📖 View AdvanceCM API Documentation                                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                      [Cancel]     [Test Connection]     [Save & Activate]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Two-Way Sync Visibility

Add a sync direction indicator showing both pull and push operations:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Sync Activity                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Your System                                              External PMS       │
│  ┌──────────┐                                            ┌──────────┐       │
│  │Properties│  ◄────────── PULL ───────────────────────  │ Rentals  │       │
│  │          │              Every 15min                   │          │       │
│  └──────────┘                                            └──────────┘       │
│                                                                              │
│  ┌──────────┐                                            ┌──────────┐       │
│  │Availability│ ◄────────── PULL ─────────────────────  │ Calendar │       │
│  │          │              Real-time webhook            │          │       │
│  └──────────┘                                            └──────────┘       │
│                                                                              │
│  ┌──────────┐                                            ┌──────────┐       │
│  │ Bookings │  ─────────── PUSH (planned) ───────────►  │Reservations│     │
│  │          │              On checkout complete          │          │       │
│  └──────────┘                                            └──────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### Update `pms_connections.config` Structure

The existing JSONB `config` column will store provider-specific configuration:

```json
{
  "provider": "advancecm",
  "auth": {
    "api_key_secret": "TOKEET_API_KEY",      // Reference to secret name
    "account_id_secret": "TOKEET_ACCOUNT_ID"
  },
  "sync_settings": {
    "auto_sync_interval_minutes": 15,
    "sync_properties": true,
    "sync_availability": true,
    "sync_rates": true,
    "push_bookings": false
  },
  "webhook_url": "https://...",
  "last_health_check": "2026-01-28T14:00:00Z",
  "health_status": "healthy"
}
```

---

## Implementation Files

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/pms-providers.ts` | Provider registry with auth field definitions |
| `src/components/admin/PMSProviderSelector.tsx` | Provider selection UI component |
| `src/components/admin/PMSCredentialsForm.tsx` | Dynamic form based on provider auth fields |
| `src/components/admin/PMSSyncStatusPanel.tsx` | Enhanced sync status visualization |
| `src/components/admin/PMSConnectionHealthCard.tsx` | Comprehensive health card component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminPMSHealth.tsx` | Use new modular components, enhanced layout |
| `src/components/admin/PMSConfigDialog.tsx` | Refactor to use generic provider config |
| `src/hooks/useAdminPMSHealth.ts` | Add health check and config update hooks |
| `supabase/functions/advancecm-sync/index.ts` | Add provider abstraction layer |

---

## Technical Details

### Provider Registry (`src/lib/pms-providers.ts`)

```typescript
export const PMS_PROVIDERS: PMSProviderConfig[] = [
  {
    id: 'advancecm',
    name: 'AdvanceCM (Tokeet)',
    description: 'Vacation rental property management and channel manager',
    docsUrl: 'https://capi.tokeet.com/docs',
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
      pushBookings: false,  // Planned
      webhooksSupported: true,
    },
  },
  // Future providers can be added here
];
```

### Dynamic Credentials Form

The form will render fields based on the selected provider's `authFields`:

```typescript
// PMSCredentialsForm.tsx
function PMSCredentialsForm({ provider, onSubmit }: Props) {
  return (
    <form>
      {provider.authFields.map((field) => (
        <div key={field.key}>
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type={field.type}
            placeholder={field.placeholder}
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      ))}
    </form>
  );
}
```

### Health Check Enhancement

Add periodic health checks stored in the connection config:

```typescript
interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  lastCheck: string;
  latencyMs?: number;
  errorCount24h: number;
  syncSuccessRate: number;  // Percentage
}
```

---

## User Experience Flow

1. **No Connection** → Show provider selector with available options
2. **Select Provider** → Show provider-specific auth form
3. **Enter Credentials** → Test connection before saving
4. **Connection Active** → Show health dashboard with sync controls
5. **Switch Provider** → Deactivate current, configure new

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Extensibility** | Add new PMS providers by adding to registry, no code changes |
| **Flexibility** | Each provider defines its own auth requirements |
| **Visibility** | Clear sync direction indicators (pull vs push) |
| **Reliability** | Health checks and error tracking built-in |
| **Future-Proof** | Architecture supports OAuth, webhooks, custom APIs |

