
# Generic PMS Connection System — IMPLEMENTED ✅

## What Was Built

### Database
- **`pms_provider_registry`** table with RLS (admin full access, public read)
- Seeded with 3 built-in providers: AdvanceCM, Guesty, Hostaway (with setup steps, auth fields, capabilities)

### Edge Functions
- **`pms-generic-test`** — Generic connection tester supporting API key, OAuth2, and Bearer token auth
- **`pms-analyze-docs`** — AI-powered docs analyzer that reads API documentation and suggests auth config, setup steps, and capabilities

### Frontend Hooks
- **`usePMSProviders`** — Fetches provider registry from DB, converts to `PMSProviderConfig` format
- **`useAIPMSSetup`** — Calls AI to analyze PMS API documentation

### Components
- **`PMSConnectionWizard`** — 4-step wizard (Choose → Setup Guide → Credentials → Test & Activate)
- **`PMSSetupGuide`** — Renders step-by-step setup instructions
- **`PMSCustomProviderForm`** — Custom PMS form with AI docs analysis

### Modified Files
- **`AdminPMSHealth.tsx`** — Now uses `PMSConnectionWizard` instead of `PMSConfigDialog`
- **`supabase/config.toml`** — Added new edge function entries

## How Custom Providers Work
1. Admin selects "Custom PMS" and provides name + API docs URL
2. AI analyzes docs and suggests: auth type, credential fields, base URL, setup steps
3. Admin reviews/edits, confirms → saved to `pms_provider_registry`
4. Admin enters credentials, tests with `pms-generic-test`, activates
5. Custom providers support connection testing + iCal availability sync; full import requires dedicated adapter
