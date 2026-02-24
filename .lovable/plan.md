

# Fix Guesty Connection — Rate Limit Handling

## Root Cause

The Guesty Booking Engine API allows **maximum 3 token requests per 24 hours** per application. Previous connection attempts have exhausted this quota. When the quota is exceeded, Guesty returns HTTP 429 with a `Retry-After` header of ~36,000 seconds (~10 hours).

The current code tries to honor this by waiting `36602 * 1000 = 36.6 million milliseconds`, but edge functions timeout after ~60 seconds -- so it just hangs and dies.

## What Needs to Change

### 1. Cap the Retry-After value in `guesty-sync/index.ts`

In both `getGuestyAccessToken()` and `callGuestyAPI()`, the `Retry-After` value must be capped at a maximum that makes sense for edge functions (e.g., 10 seconds). If the server says "wait 10 hours", there's no point retrying -- fail immediately with a clear message.

**Lines 198-204 and 240-246** in `supabase/functions/guesty-sync/index.ts`:

```text
if (response.status === 429) {
  const retryAfter = parseInt(response.headers.get("Retry-After") || "0", 10);
  // If Guesty says wait more than 30 seconds, don't bother retrying --
  // the token quota (3/24h) is exhausted
  if (retryAfter > 30) {
    await response.text();
    throw new Error(
      `Guesty token quota exhausted. Retry-After: ${retryAfter}s (~${Math.round(retryAfter / 3600)}h). ` +
      `Guesty allows max 3 token requests per 24 hours per application. Please wait and try again later.`
    );
  }
  const backoffMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(2000 * Math.pow(2, attempt), 15000);
  // ... rest of retry logic
}
```

### 2. Same pattern for `callGuestyAPI()`

Apply identical capping logic so API calls also fail fast when rate-limited with a long wait.

### 3. Return clear error message to the UI

Instead of a generic "Connection Failed" toast, the user will see: *"Guesty token quota exhausted. Guesty allows max 3 token requests per 24 hours. Please wait and try again later."*

## Why This Fixes It

- **No more 10-hour waits** that cause timeouts
- **Clear feedback** telling the admin exactly what happened and when to try again
- **Retries still work** for short rate limits (under 30 seconds)
- The underlying credentials and scope configuration are correct -- it's purely a quota issue from prior attempts

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/guesty-sync/index.ts` | Cap `Retry-After` in both `getGuestyAccessToken()` and `callGuestyAPI()`, fail fast with clear message when quota is exhausted |

