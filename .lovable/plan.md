
# Fix: Stripe Health Check - Broken Edge Function Reference

## Problem

The admin dashboard's **Payment System** health widget always shows "Edge Function: Unreachable" because `useStripeHealth.ts` calls a non-existent `create-payment-intent` edge function, producing 404 errors on every dashboard load.

## Root Cause

The hook references `create-payment-intent` but the actual payment function is named `create-checkout-session`.

## Fix

### File: `src/hooks/useStripeHealth.ts`

Update the edge function name from `create-payment-intent` to `create-checkout-session`, and adjust the health check body to match what that function expects. Since `create-checkout-session` does not have a dedicated health check mode, the approach will be:

- Send a request to `create-checkout-session` with a `healthCheck: true` flag
- The function will attempt to parse the body and likely return an error (missing required fields), but the fact that it responds (even with an error) proves the edge function is reachable
- Treat any non-network response (including validation errors) as "reachable"

Specifically:
- Change `'create-payment-intent'` to `'create-checkout-session'`
- Update the reachability check logic: if the function responds at all (even with a business logic error), mark `edgeFunctionReachable = true`. Only network-level failures (timeouts, unreachable) should mark it as unreachable.

## Verification Results

All other pages and functions checked and working:
- Homepage: hero search, navigation, all sections render
- Properties, Destinations, Experiences, Blog, About, Contact pages: all functional
- Admin sidebar: all 20+ links match valid routes in App.tsx
- Admin Analytics: both Revenue and Website tabs working with real data
- All other edge function references (7 functions) point to existing deployed functions
- No other console errors found beyond this single 404
