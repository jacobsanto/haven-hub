

# Fix: Checkout Hold RLS Policy + Infinite Retry Loop

## Root Cause

Two issues working together to create the flooding error behavior:

1. **RLS Policy Misconfiguration**: The `checkout_holds` INSERT policy "Create checkout holds for booking" is RESTRICTIVE. PostgreSQL requires at least one PERMISSIVE policy to grant base access; RESTRICTIVE policies can only further narrow that access. Since no PERMISSIVE INSERT policy exists for anonymous users, all inserts are denied -- even when the `expires_at` condition is valid.

2. **useEffect Retry Loop**: In `Checkout.tsx`, the hold-creation effect depends on `createHold.isPending`. When the mutation fails, `isPending` flips to `false`, re-triggering the effect. Since `holdId` remains `null` (never set on error), the condition passes again, creating an infinite loop of failed INSERT attempts (~3-4 per second).

## Fix 1: Database Migration

Drop the current RESTRICTIVE INSERT policy and recreate it as PERMISSIVE:

```sql
DROP POLICY IF EXISTS "Create checkout holds for booking" ON public.checkout_holds;

CREATE POLICY "Create checkout holds for booking"
  ON public.checkout_holds
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (expires_at > now())
    AND (expires_at < (now() + interval '15 minutes'))
  );
```

This makes the policy PERMISSIVE (the default), which correctly grants INSERT access to anonymous and authenticated users when the `expires_at` window is valid. The existing `validate_checkout_hold` trigger still enforces rate limiting and session ID format validation as an additional safety layer.

## Fix 2: Stop the Infinite Retry Loop

**File: `src/pages/Checkout.tsx`**

Add a `holdFailed` ref that is set to `true` in `onError`. The useEffect checks this ref and skips retrying if a previous attempt already failed. Reset it only when dates change (meaning the user picked new dates and should get a fresh attempt).

```text
Before (simplified):
  useEffect(() => {
    if (checkIn && checkOut && property?.id && !holdId && !holdCreationPending.current && !createHold.isPending) {
      // creates hold...
    }
  }, [checkIn, checkOut, property?.id, holdId, sessionId, createHold.isPending]);

After:
  const holdFailed = useRef(false);

  // Reset failure flag when dates change
  useEffect(() => {
    holdFailed.current = false;
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (checkIn && checkOut && property?.id && !holdId && !holdCreationPending.current && !createHold.isPending && !holdFailed.current) {
      holdCreationPending.current = true;
      createHold.mutate(/* ... */, {
        onError: () => {
          holdCreationPending.current = false;
          holdFailed.current = true;  // prevents retry
          // show toast once
        },
      });
    }
  }, [checkIn, checkOut, property?.id, holdId, sessionId, createHold.isPending]);
```

Also remove `createHold.isPending` from the dependency array since the `holdCreationPending` ref already guards against concurrent calls, and having the mutation state as a dependency is what causes the re-trigger cycle.

## Files Touched

1. **Database migration** -- drop + recreate the checkout_holds INSERT policy as PERMISSIVE
2. **`src/pages/Checkout.tsx`** -- add `holdFailed` ref guard and clean up useEffect dependencies

## What Does NOT Change

- No changes to the hold validation trigger (`validate_checkout_hold`)
- No changes to the check-holds edge function
- No changes to booking logic, payment flow, or availability sync
- All other RLS policies remain unchanged

