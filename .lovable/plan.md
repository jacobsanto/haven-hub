

# Generic PMS Connection System

## Vision

Replace the hardcoded 3-provider registry with a database-driven system where admins can connect **any** PMS by providing its API documentation link and being guided through setup. This makes the platform future-proof -- no code changes needed to add a 4th, 5th, or 10th PMS provider.

## Architecture Overview

```text
+---------------------------+
|   Admin clicks            |
|   "Add Connection"        |
+-----------+---------------+
            |
            v
+---------------------------+
|  Step 1: Provider Setup   |
|  - Pick known provider    |
|    OR "Custom PMS"        |
|  - Provide API docs URL   |
+-----------+---------------+
            |
            v
+---------------------------+
|  Step 2: AI-Assisted      |
|  Setup Guide              |
|  - AI reads the docs URL  |
|  - Generates setup steps  |
|  - Suggests auth fields   |
|  - Admin confirms/adjusts |
+-----------+---------------+
            |
            v
+---------------------------+
|  Step 3: Credentials      |
|  - Dynamic auth fields    |
|  - Stored as secrets      |
|  - Test connection        |
+-----------+---------------+
            |
            v
+---------------------------+
|  Step 4: Activate         |
|  - Save to DB             |
|  - Ready for import/sync  |
+---------------------------+
```

## What Changes

### 1. New database table: `pms_provider_registry`

Stores provider configurations in the database instead of hardcoded TypeScript. Seeded with the 3 existing providers but new ones can be added by admins.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| slug | text | Unique identifier (e.g. "guesty", "lodgify") |
| name | text | Display name |
| description | text | Short description |
| api_docs_url | text | Link to API documentation |
| auth_type | text | "oauth2_client_credentials", "api_key", "bearer_token" |
| auth_fields | jsonb | Array of field configs (label, key, type, required, help text) |
| base_url | text | API base URL |
| token_url | text | OAuth token URL (if applicable) |
| token_scope | text | OAuth scope (if applicable) |
| setup_steps | jsonb | Array of step-by-step setup instructions |
| edge_function_name | text | Which edge function handles sync (null for custom) |
| capabilities | jsonb | What this provider supports |
| is_builtin | boolean | true for the 3 pre-seeded providers |
| created_at | timestamptz | When added |

### 2. New component: `PMSConnectionWizard.tsx`

A multi-step wizard that replaces the current `PMSConfigDialog`:

**Step 1 - Choose Provider**: Shows existing providers from the DB registry + a "Custom PMS" card. When "Custom PMS" is selected, the admin provides a name and API docs URL.

**Step 2 - AI Setup Guide**: For custom providers, AI reads the docs URL and generates:
- Step-by-step setup instructions (where to find credentials, what to enable)
- Suggested auth type and fields
- The admin reviews and can adjust before proceeding

For known providers, the pre-configured setup steps are shown.

**Step 3 - Credentials**: Dynamic form based on the provider's `auth_fields`. Credentials are saved as backend secrets.

**Step 4 - Test and Activate**: Tests the connection using a generic test endpoint, then activates.

### 3. New edge function: `pms-generic-test/index.ts`

A generic connection tester that:
- Takes a base URL, auth type, and credentials
- Attempts authentication based on the auth type (OAuth2, API key, bearer token)
- Returns success/failure
- Works for ANY provider without needing a dedicated edge function

### 4. AI setup guide generation via existing AI infrastructure

Uses the project's existing Lovable AI integration to:
- Fetch and read the API docs URL
- Generate setup steps in a structured format
- Suggest auth configuration (fields, type, base URL)
- All output is **advisory** -- admin confirms before saving (per project rules: AI is advisory, never authoritative)

### 5. Update `pms-providers.ts` to be a thin client over the DB

Instead of a hardcoded array, `pms-providers.ts` becomes a utility that:
- Exports a hook `usePMSProviders()` that fetches from `pms_provider_registry`
- Falls back to built-in defaults if DB is unreachable
- Keeps the same `PMSProviderConfig` interface for backward compatibility

### 6. Update existing components

- `PMSProviderSelector` -- reads from DB instead of hardcoded array, adds "Custom PMS" option
- `PMSCredentialsForm` -- already dynamic, no major changes needed
- `AdminPMSHealth` -- uses the new wizard instead of `PMSConfigDialog`
- `PMSConnectionHealthCard` -- shows provider info from DB

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/PMSConnectionWizard.tsx` | Multi-step connection wizard |
| `src/components/admin/PMSSetupGuide.tsx` | AI-generated setup instructions display |
| `src/components/admin/PMSCustomProviderForm.tsx` | Form for adding a custom PMS provider |
| `src/hooks/usePMSProviders.ts` | Hook to fetch provider registry from DB |
| `src/hooks/useAIPMSSetup.ts` | Hook to call AI for docs parsing |
| `supabase/functions/pms-generic-test/index.ts` | Generic connection tester edge function |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/pms-providers.ts` | Keep types, remove hardcoded array, add DB fallback |
| `src/pages/admin/AdminPMSHealth.tsx` | Use new wizard instead of config dialog |
| `src/hooks/useAdminPMSHealth.ts` | Add `useTestGenericPMSConnection` mutation |

## Database Migration

```sql
-- Provider registry table
CREATE TABLE public.pms_provider_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  api_docs_url text,
  auth_type text NOT NULL DEFAULT 'api_key',
  auth_fields jsonb NOT NULL DEFAULT '[]',
  base_url text,
  token_url text,
  token_scope text,
  setup_steps jsonb DEFAULT '[]',
  edge_function_name text,
  capabilities jsonb DEFAULT '{}',
  is_builtin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seed with existing providers
INSERT INTO public.pms_provider_registry (slug, name, description, ...) 
VALUES 
  ('advancecm', 'AdvanceCM (Tokeet)', ...),
  ('guesty', 'Guesty', ...),
  ('hostaway', 'Hostaway', ...);

-- RLS: admin read/write
ALTER TABLE public.pms_provider_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage provider registry"
  ON public.pms_provider_registry FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

## How Custom Providers Work (End-to-End)

1. Admin clicks "Add Connection" and selects "Custom PMS"
2. Enters provider name (e.g. "Lodgify") and API docs URL
3. AI reads the docs and suggests: auth type = "api_key", fields = [{key: "api_key", label: "API Key", type: "password"}], base_url = "https://api.lodgify.com/v2"
4. Admin reviews, adjusts if needed, confirms
5. Provider is saved to `pms_provider_registry`
6. Admin enters credentials, tests connection using `pms-generic-test`
7. Connection is activated in `pms_connections`
8. For sync/import: since there's no dedicated edge function, the system uses the generic test for connectivity but property import/sync would need a dedicated adapter added later

## Important Constraints

- **AI is advisory only** -- it suggests configuration, admin must confirm (per project rules)
- **Sync operations for custom providers** will initially be limited to connection testing and manual iCal import (which is already provider-agnostic). Full property import requires a dedicated edge function per provider
- **Built-in providers** (AdvanceCM, Guesty, Hostaway) keep their existing edge functions and full sync capabilities
- **No breaking changes** -- existing connections continue to work unchanged

