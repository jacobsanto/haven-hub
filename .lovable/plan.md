
# Fix Checkout Holds Rate Limiting and Test Complete Payment Flow

## Problem Identified

The checkout flow is blocked because:
1. **Stale expired holds**: 20+ checkout holds exist with `released = false` even though their `expires_at` timestamps have passed
2. **Rate limit trigger issue**: The `validate_checkout_hold` trigger counts all non-released holds from the last 30 minutes, but doesn't exclude expired ones
3. **Missing cleanup automation**: The `cleanup_expired_checkout_holds()` function exists but isn't being called on a schedule

## Solution

### Part 1: Immediate Fix - Clean Up Stale Holds (Database Migration)

Run a migration to release all expired holds:

```sql
-- Release all expired checkout holds
UPDATE public.checkout_holds
SET released = true
WHERE expires_at < now() AND released = false;
```

### Part 2: Permanent Fix - Update Rate Limit Trigger (Database Migration)

Modify the `validate_checkout_hold` trigger to only count non-expired holds:

```sql
CREATE OR REPLACE FUNCTION public.validate_checkout_hold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_holds_count INTEGER;
BEGIN
  -- Check for rate limiting: max 3 active holds per session in last 30 minutes
  -- Only count holds that are NOT released AND NOT expired
  SELECT COUNT(*) INTO recent_holds_count
  FROM public.checkout_holds
  WHERE session_id = NEW.session_id
    AND created_at > (now() - INTERVAL '30 minutes')
    AND released = false
    AND expires_at > now();  -- Only count non-expired holds
  
  IF recent_holds_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many active holds for this session';
  END IF;
  
  -- Validate session_id format (must be non-empty, reasonable length)
  IF NEW.session_id IS NULL OR LENGTH(NEW.session_id) < 10 OR LENGTH(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'Invalid session_id format';
  END IF;
  
  RETURN NEW;
END;
$function$;
```

### Part 3: Test Complete Payment Flow

After the database fixes are applied, test the checkout flow:

1. Navigate to a property page
2. Select dates (Feb 18-21, 2026)
3. Proceed through the checkout steps
4. Enter guest details
5. Use Stripe test card: `4242 4242 4242 4242`
6. Verify booking confirmation

## Technical Details

**Files affected:**
- Database only (migration to clean up holds and update trigger)

**What the trigger fix does:**
- Adds `AND expires_at > now()` condition to the rate limit check
- Only counts holds that are both non-released AND not yet expired
- Prevents rate limit false positives from stale expired holds

**Why this is safe:**
- Expired holds are no longer blocking availability (they're filtered out in queries)
- The cleanup just sets `released = true` which is the natural end-state
- The trigger update is additive and doesn't change existing behavior for valid cases
