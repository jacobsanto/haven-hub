
# Fix AdvanceCM Connection - Authentication Format Issue

## Problem Identified

The Tokeet API is returning "Unauthorized" because our edge function is using the **wrong authentication format**.

**Current (incorrect) implementation:**
```typescript
Authorization: `Basic ${btoa(apiKey + ":")}`  
// Results in: "Basic dG9rZWVUX2FwaV9rZXk6"
```

**Tokeet documentation requirement:**
```bash
-H 'Authorization: {{apikey}}'
// Results in: "your-raw-api-key-here"
```

Tokeet expects the **raw API key directly** in the Authorization header, not Base64-encoded Basic authentication.

---

## Fix Required

### File: `supabase/functions/advancecm-sync/index.ts`

**Change the `callTokeetAPI` function** (around line 97-112):

```typescript
// BEFORE (incorrect):
async function callTokeetAPI(
  endpoint: string,
  apiKey: string,
  accountId: string
): Promise<Response> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://capi.tokeet.com/v1${endpoint}${separator}account=${accountId}`;

  return await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,  // <-- WRONG
      "Content-Type": "application/json",
    },
  });
}

// AFTER (correct):
async function callTokeetAPI(
  endpoint: string,
  apiKey: string,
  accountId: string
): Promise<Response> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://capi.tokeet.com/v1${endpoint}${separator}account=${accountId}`;

  return await fetch(url, {
    method: "GET",
    headers: {
      Authorization: apiKey,  // <-- Direct API key, no encoding
      "Content-Type": "application/json",
    },
  });
}
```

---

## Summary

| Item | Details |
|------|---------|
| **Root Cause** | Wrong auth format - was using `Basic` + Base64, should be raw API key |
| **File to Change** | `supabase/functions/advancecm-sync/index.ts` |
| **Change Location** | Line 108 in `callTokeetAPI` function |
| **Change** | Replace `Authorization: \`Basic \${btoa(apiKey + ":")}\`` with `Authorization: apiKey` |

After this fix, the edge function will be redeployed automatically and the connection test should succeed.
