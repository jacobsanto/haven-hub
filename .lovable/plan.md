

# AdvanceCM PMS Integration - Property Sync Implementation

## Overview

This plan implements the **AdvanceCM (Tokeet) API integration** to pull properties directly from the PMS, eliminating manual property entry. The integration will sync rental listings with all relevant fields into the local database.

---

## Tokeet API Reference

Based on the official Tokeet Client API documentation:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /v1/rental?account={account}` | GET | Retrieve all rentals |
| `GET /v1/rental/{rental_pkey}?account={account}` | GET | Retrieve single rental |
| `GET /v1/rental/{rental_pkey}/availability?account={account}` | GET | Get rental availability |

**Authentication**: HTTP Basic Auth via `Authorization` header with API key
**Base URL**: `https://capi.tokeet.com/v1`

---

## Tokeet Rental Fields → Local Property Mapping

| Tokeet Field | Local Property Field | Notes |
|--------------|---------------------|-------|
| `pkey` | `external_property_id` | Stored in pms_property_map |
| `name` | `name` | Direct mapping |
| `display_name` | Used for slug generation | Fallback to `name` |
| `description` | `description` | Direct mapping |
| `bedrooms` | `bedrooms` | Number |
| `bathrooms` | `bathrooms` | Number |
| `sleep_max` | `max_guests` | Maximum guests |
| `address.city` | `city` | Nested in address object |
| `address.state` | `region` | State/province |
| `address.CC` | `country` | Country code, needs lookup |
| `gps.lat`, `gps.long` | `nearby_attractions` coordinates | GPS coordinates |
| `type` | `property_type` | Villa, House, Apartment, etc. |
| `size` | — | Could add to description |
| `tags` | `highlights` | Array of feature tags |
| `images` | `gallery` | If available in extended API |

---

## Implementation Components

### 1. Database: Store API Credentials

Add Tokeet API credentials as secrets:
- `TOKEET_API_KEY` - The Tokeet account API key
- `TOKEET_ACCOUNT_ID` - The Tokeet account ID

### 2. Edge Function: `advancecm-sync`

Create a new edge function to handle PMS API calls server-side:

```
supabase/functions/advancecm-sync/index.ts
```

**Capabilities:**
- `action: 'test'` - Test API connection
- `action: 'fetch-properties'` - Fetch all rentals from Tokeet
- `action: 'fetch-property'` - Fetch single rental details
- `action: 'fetch-availability'` - Fetch availability for a rental
- `action: 'sync-all'` - Full sync (properties + availability + rates)
- `action: 'import-property'` - Import a Tokeet rental as a local property

### 3. Real AdvanceCM Adapter

Replace the mock adapter with a real implementation:

```
src/integrations/pms/advancecm-adapter.ts
```

This adapter will:
- Call the edge function for all API operations
- Transform Tokeet response format to our PMSProperty interface
- Handle pagination for large property lists

### 4. Admin UI: PMS Health Dashboard Enhancements

Update `AdminPMSHealth.tsx` to add:
- **Configuration panel** for API credentials (stored via secrets)
- **"Import Properties" button** to fetch and display available Tokeet rentals
- **Import dialog** showing unlinked Tokeet properties with checkbox selection
- **Field mapping preview** before import
- **Import progress** with status indicators

### 5. Property Import Flow

```text
User Flow:
┌─────────────────────────────────────────────────────────────────┐
│  Admin → PMS Health → "Import Properties from AdvanceCM"        │
├─────────────────────────────────────────────────────────────────┤
│  1. Click "Fetch Properties" → Edge function calls Tokeet API   │
│  2. Display list of Tokeet rentals not yet linked locally       │
│  3. User selects properties to import (checkbox list)           │
│  4. Click "Import Selected" → Creates local properties          │
│  5. Automatically creates pms_property_map entries              │
│  6. Status shows success/failure per property                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/advancecm-sync/index.ts` | Edge function for Tokeet API calls |
| `src/integrations/pms/advancecm-adapter.ts` | Real PMS adapter implementation |
| `src/components/admin/PMSConfigDialog.tsx` | Dialog for API credential configuration |
| `src/components/admin/PMSPropertyImportDialog.tsx` | Dialog to preview and import properties |
| `src/hooks/useAdvanceCMSync.ts` | React hooks for PMS sync operations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/integrations/pms/index.ts` | Switch to real adapter when credentials available |
| `src/pages/admin/AdminPMSHealth.tsx` | Add configuration and import UI |
| `src/hooks/useAdminPMSHealth.ts` | Add hooks for import operations |

---

## Technical Details

### Edge Function: advancecm-sync

```typescript
// Key operations:
interface SyncRequest {
  action: 'test' | 'fetch-properties' | 'fetch-property' | 'fetch-availability' | 'import-property';
  externalId?: string;
  startDate?: string;
  endDate?: string;
  propertyData?: TokeetRental; // For import
}

// Tokeet rental response structure (based on API docs):
interface TokeetRental {
  pkey: string;
  name: string;
  display_name?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sleep_min?: number;
  sleep_max?: number;
  type?: string; // Villa, House, Apartment, etc.
  address?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    CC?: string; // Country code
  };
  gps?: {
    lat?: number;
    long?: number;
  };
  tags?: string[];
  images?: Array<{ url: string }>;
  // Additional fields from API
}
```

### Property Import Logic

When importing a Tokeet rental:

1. **Map fields** to local property schema:
   ```typescript
   const localProperty = {
     name: rental.name || rental.display_name,
     slug: generateSlug(rental.name),
     description: rental.description || null,
     city: rental.address?.city || 'Unknown',
     region: rental.address?.state || null,
     country: mapCountryCode(rental.address?.CC) || 'Unknown',
     bedrooms: rental.bedrooms || 1,
     bathrooms: rental.bathrooms || 1,
     max_guests: rental.sleep_max || 2,
     property_type: mapPropertyType(rental.type),
     highlights: rental.tags || [],
     base_price: 0, // Will be synced from rates
     status: 'draft', // Start as draft for review
   };
   ```

2. **Create property** in `properties` table

3. **Create mapping** in `pms_property_map`:
   ```typescript
   {
     pms_connection_id: connectionId,
     property_id: newProperty.id,
     external_property_id: rental.pkey,
     external_property_name: rental.name,
     sync_enabled: true,
   }
   ```

4. **Trigger initial availability/rate sync** for the new property

### Admin UI Components

**PMS Configuration Panel:**
- Input for Tokeet API Key
- Input for Tokeet Account ID
- "Test Connection" button
- Connection status indicator

**Property Import Dialog:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  Import Properties from AdvanceCM                               │
├─────────────────────────────────────────────────────────────────┤
│  Found 4 properties in your Tokeet account:                     │
│                                                                 │
│  ☑ Villa Caldera Sunset (tok_123456) - 4 bed, 8 guests         │
│      Location: Oia, Santorini, Greece                           │
│      → Will create as: villa-caldera-sunset (draft)             │
│                                                                 │
│  ☑ Villa Aegean Blue (tok_234567) - 3 bed, 6 guests            │
│      Location: Fira, Santorini, Greece                          │
│      → Will create as: villa-aegean-blue (draft)                │
│                                                                 │
│  ☐ Beach House Miami (tok_345678) - Already linked             │
│      ✓ Linked to: beach-house-miami                             │
│                                                                 │
│  [Cancel]                        [Import 2 Selected Properties] │
└─────────────────────────────────────────────────────────────────┘
```

---

## Secrets Required

The user will need to provide:

| Secret Name | Description |
|-------------|-------------|
| `TOKEET_API_KEY` | API key from Tokeet Settings → Account Info |
| `TOKEET_ACCOUNT_ID` | Account ID from Tokeet Settings → Account Info |

These will be stored via the Lovable secrets system and accessed by the edge function using `Deno.env.get()`.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Missing API credentials | Show configuration prompt |
| API connection failed | Display error with retry option |
| Rate limiting (429) | Implement exponential backoff |
| Partial import failure | Show per-property status, allow retry |
| Duplicate property | Skip with warning, show as "already linked" |

---

## Future Enhancements (Not in This Plan)

- Webhook handler for real-time updates from Tokeet
- Scheduled sync (cron job) for availability/rates
- Bidirectional sync (push bookings back to Tokeet)
- Image import from Tokeet CDN
- Rate import with seasonal pricing mapping

