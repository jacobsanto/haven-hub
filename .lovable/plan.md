

# Fix Guesty Authentication - Add Correct OAuth Scope

## Problem
The Guesty Booking Engine API requires the scope `booking_engine:api` in the OAuth2 token request. The code currently sends no scope at all, which causes a 401 authentication failure.

## Evidence
From the official Guesty Booking Engine API docs (https://booking-api-docs.guesty.com/docs/authentication-1), the token request must include:
```
--data-urlencode 'scope=booking_engine:api'
```

## Fix

### File: `supabase/functions/guesty-sync/index.ts`

Add the `scope: "booking_engine:api"` parameter to the OAuth token request body (line 184-188):

```typescript
body: new URLSearchParams({
  grant_type: "client_credentials",
  scope: "booking_engine:api",
  client_id: clientId,
  client_secret: clientSecret,
}),
```

This is a one-line addition. No other files need to change.
