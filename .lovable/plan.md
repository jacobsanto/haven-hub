

# Configure Tokeet API Credentials

## Problem Identified

The Tokeet API secrets are **not configured** in the project. The edge function requires:
- `TOKEET_API_KEY`
- `TOKEET_ACCOUNT_ID`

## User-Provided Credentials

| Secret | Value |
|--------|-------|
| TOKEET_API_KEY | `4a46a104-6c70-46de-b85f-d3fbbcaf93bb-tk2` |
| TOKEET_ACCOUNT_ID | `1646873878.6746` |

## Implementation Steps

### Step 1: Add TOKEET_API_KEY Secret
Add the API key as a secret in the backend configuration.

### Step 2: Add TOKEET_ACCOUNT_ID Secret
Add the account ID as a secret in the backend configuration.

### Step 3: Test Connection
Navigate to `/admin/pms` and click "Test Connection" to verify the integration works with the Tokeet API.

---

## Technical Details

The edge function (`advancecm-sync`) is already correctly implemented to:
1. Read credentials from environment: `Deno.env.get("TOKEET_API_KEY")` and `Deno.env.get("TOKEET_ACCOUNT_ID")`
2. Call Tokeet API with correct authentication format: `Authorization: {apiKey}` (raw key, not Base64)
3. Use the correct endpoint: `https://capi.tokeet.com/v1/rental?account={accountId}`

Once the secrets are configured, the connection should work immediately.

