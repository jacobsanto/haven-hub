

# Plan: Secure PMS Webhook Without HMAC Signature Support

## Problem Statement

The security scan flagged `pms_webhook_no_secret` because the webhook accepts unsigned requests when `PMS_WEBHOOK_SECRET` is not configured. However, after researching both the Tokeet API documentation and AdvanceCM help center:

**Tokeet/AdvanceCM does not support HMAC webhook signing.**

Their HTTP webhook triggers:
- Only support HTTP POST (no other methods)
- Have no option for custom headers or secrets
- Only allow configuring a destination URL
- Handle failures "quietly" with no retry mechanism

The current HMAC verification code in `pms-webhook/index.ts` expects an `x-tokeet-signature` header that **Tokeet will never send**.

---

## Recommended Solution: Secret URL Path Token

Since HMAC signing is impossible, implement **URL-based token authentication** as the primary security mechanism:

```text
Current URL:  /pms-webhook
Secured URL:  /pms-webhook?token=<secret-token>
```

This is a widely-accepted alternative when webhook providers don't support signing (used by many PMS integrations).

---

## Implementation Details

### 1. Add Token Validation to Edge Function

**File:** `supabase/functions/pms-webhook/index.ts`

Replace the HMAC verification logic with URL token validation:

```typescript
// Extract token from query string
const url = new URL(req.url);
const providedToken = url.searchParams.get("token");
const expectedToken = Deno.env.get("PMS_WEBHOOK_TOKEN");

// Require token when configured
if (expectedToken) {
  if (!providedToken) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", reason: "missing_token" }),
      { status: 401 }
    );
  }
  
  // Timing-safe comparison
  if (providedToken.length !== expectedToken.length || 
      !crypto.timingSafeEqual(
        new TextEncoder().encode(providedToken),
        new TextEncoder().encode(expectedToken)
      )) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", reason: "invalid_token" }),
      { status: 401 }
    );
  }
}
```

### 2. Remove Dead HMAC Code

Remove the following since Tokeet doesn't support it:
- `verifyWebhookSignature()` function
- `x-tokeet-signature` header check
- `PMS_WEBHOOK_SECRET` references
- `x-tokeet-timestamp` header check (Tokeet doesn't send this either)

### 3. Add Secret for Webhook Token

Create a new secret `PMS_WEBHOOK_TOKEN` with a cryptographically secure random value:
- Generate: 32+ character random string
- Store in backend secrets
- Configure in AdvanceCM webhook URL

### 4. Keep Existing Mitigations

The function already has valuable defense-in-depth:
- **Idempotency check**: Prevents duplicate processing via `pms_raw_events` table
- **Property mapping validation**: Only processes webhooks for known properties
- **External booking ID check**: Prevents duplicate bookings

### 5. Update Security Finding

Change the finding to reflect the actual limitation and implemented mitigation.

---

## Security Trade-offs

| Aspect | HMAC Signature | URL Token |
|--------|---------------|-----------|
| Payload integrity | Yes | No |
| Authentication | Yes | Yes |
| Tokeet compatible | No | Yes |
| Replay protection | Via timestamp | Via idempotency check |
| Secret exposure | In header | In URL (logged by proxies) |

**Mitigation for URL token logging**: Use HTTPS (enforced by Supabase Edge Functions) to encrypt the token in transit.

---

## Configuration Instructions (for Admin)

After implementation, the admin will need to:

1. Generate a secure token (the system can generate one)
2. Add it as `PMS_WEBHOOK_TOKEN` in backend secrets
3. Update the AdvanceCM webhook URL to:
   ```
   https://xavjbiuhcmupsoocrmhf.supabase.co/functions/v1/pms-webhook?token=YOUR_TOKEN_HERE
   ```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/pms-webhook/index.ts` | Replace HMAC with URL token validation, remove dead code |

---

## Technical Considerations

- **HTTPS encryption**: Supabase Edge Functions enforce HTTPS, so the token is encrypted in transit
- **No Tokeet logging**: Tokeet doesn't log webhook URLs with full query strings in their UI
- **Token rotation**: If compromised, admin can regenerate and update in both places
- **Graceful degradation**: If token not configured, log warning and reject (no "allow by default")

