
# Security Remediation Plan

## Summary

This plan addresses **7 active security findings** identified in the security scan:
- **3 Critical Errors**: Data exposure issues requiring RLS policy updates
- **3 Warnings**: Input validation, admin route protection, and authentication concerns  
- **1 Error**: PMS webhook authentication (partially addressed - requires architectural decision)

---

## Phase 1: Fix Critical Data Exposure Issues (Highest Priority)

### 1.1 Fix blog_authors Email Exposure

**Problem**: The public SELECT policy on `blog_authors` allows anyone to read the full table including email addresses, even though a `blog_authors_public` view exists that excludes emails.

**Solution**: Restrict the public policy to only return non-sensitive fields by using column-level security or redirecting public access to the view.

**Database Migration:**
```sql
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active authors without sensitive data" ON public.blog_authors;

-- Recreate policy using the secure view pattern
-- Public users should use blog_authors_public view instead
-- The main table should only be accessible to admins
```

**Note**: Since `blog_authors_public` view already exists and excludes email, we need to ensure frontend code uses this view for public-facing pages.

**Files to Update:**
- Any frontend hooks/queries that read `blog_authors` for public display should be updated to use `blog_authors_public`

---

### 1.2 Fix booking_addons Exposure

**Problem**: The `booking_addons` table currently only has an admin policy, but the security scan indicates it may be publicly readable (needs verification).

**Current State**: 
```sql
-- Only admin policy exists
Policy: "Admin can manage booking addons" (ALL command)
```

**Solution**: Verify RLS is enabled and ensure no public read access exists. The table should only be accessible to admins.

**Database Migration (if needed):**
```sql
-- Ensure RLS is enabled (should already be)
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;

-- Verify no default public access exists
-- The existing admin policy should be sufficient
```

---

### 1.3 Fix checkout_holds Session Validation

**Problem**: The INSERT policy on `checkout_holds` only validates expiration time (within 15 minutes) but doesn't validate:
- Session ID format/ownership
- Rate limiting (users could spam holds to block availability)

**Current Policy:**
```sql
-- Overly permissive INSERT
WITH CHECK: (expires_at > now() AND expires_at < (now() + '00:15:00'::interval))
```

**Solution**: Add session validation and consider rate limiting via a database function.

**Database Migration:**
```sql
-- Create a function to validate checkout hold creation
CREATE OR REPLACE FUNCTION public.validate_checkout_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_holds_count INTEGER;
BEGIN
  -- Check for rate limiting: max 3 active holds per session in last 30 minutes
  SELECT COUNT(*) INTO recent_holds_count
  FROM public.checkout_holds
  WHERE session_id = NEW.session_id
    AND created_at > (now() - INTERVAL '30 minutes')
    AND released = false;
  
  IF recent_holds_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many active holds for this session';
  END IF;
  
  -- Validate session_id format (must be non-empty, reasonable length)
  IF NEW.session_id IS NULL OR LENGTH(NEW.session_id) < 10 OR LENGTH(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'Invalid session_id format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation
CREATE TRIGGER validate_checkout_hold_trigger
  BEFORE INSERT ON public.checkout_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_checkout_hold();
```

---

## Phase 2: Edge Function Input Validation

### 2.1 Add Zod Validation to create-payment-intent

**File**: `supabase/functions/create-payment-intent/index.ts`

Add comprehensive input validation using Zod:

```typescript
// Add at top of file
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const paymentIntentSchema = z.object({
  propertyId: z.string().uuid(),
  propertyName: z.string().min(1).max(200),
  propertySlug: z.string().min(1).max(100),
  propertyCity: z.string().max(100).optional(),
  propertyCountry: z.string().max(100).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().positive().max(365),
  guests: z.number().int().positive().max(50),
  adults: z.number().int().positive().max(50),
  children: z.number().int().min(0).max(50),
  accommodationTotal: z.number().positive(),
  addonsTotal: z.number().min(0),
  feesTotal: z.number().min(0),
  taxesTotal: z.number().min(0),
  discountAmount: z.number().min(0),
  discountCode: z.string().max(50).optional(),
  totalAmount: z.number().positive().max(1000000),
  currency: z.string().length(3),
  paymentType: z.enum(['full', 'deposit']),
  depositPercentage: z.number().min(1).max(100).optional(),
  amountDue: z.number().positive().max(1000000),
  balanceDue: z.number().min(0).optional(),
  cancellationPolicyId: z.string().uuid().optional(),
  cancellationPolicyName: z.string().max(100).optional(),
  guestName: z.string().min(1).max(200),
  guestEmail: z.string().email().max(255),
  guestCountry: z.string().max(100).optional(),
  sessionId: z.string().min(10).max(100),
  bookingReference: z.string().max(50).optional(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "checkOut must be after checkIn" }
);
```

**Validation at start of handler:**
```typescript
const validation = paymentIntentSchema.safeParse(body);
if (!validation.success) {
  return new Response(
    JSON.stringify({ 
      error: "Validation failed", 
      details: validation.error.issues 
    }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

### 2.2 Add Zod Validation to confirm-payment

**File**: `supabase/functions/confirm-payment/index.ts`

Add similar schema validation for the booking payload:

```typescript
const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().startsWith("pi_"),
  paymentType: z.enum(['full', 'deposit']),
  bookingId: z.string().uuid().optional(),
  bookingPayload: z.object({
    propertyId: z.string().uuid(),
    propertyName: z.string().min(1).max(200),
    // ... full schema matching interface
  }).optional(),
}).refine(
  (data) => data.bookingId || data.bookingPayload,
  { message: "Either bookingId or bookingPayload is required" }
);
```

---

### 2.3 Add Validation to advancecm-sync

**File**: `supabase/functions/advancecm-sync/index.ts`

Add action-specific validation schemas to prevent malformed requests.

---

## Phase 3: PMS Webhook Authentication Decision

### Current State
The `pms-webhook` edge function has HMAC signature verification implemented, but:
- Tokeet/AdvanceCM uses a **pull-based Data Feed model**, not push webhooks
- The webhook secret (`PMS_WEBHOOK_SECRET`) is not configured
- If no secret is set, the function logs a warning but processes requests

### Recommended Action
Since Tokeet doesn't support webhook signing and uses the Data Feed (pull) model:

**Option A (Recommended)**: Remove the webhook authentication finding as "not applicable"
- Update the security finding to ignore since this endpoint isn't used in the current architecture
- The PMS sync happens via the `pms-sync-cron` function calling Tokeet's API

**Option B**: Add URL token authentication
- Store a token in secrets (`PMS_WEBHOOK_TOKEN`)
- Update the function to verify `?token=xxx` query parameter
- Configure this URL in Tokeet if webhooks are ever enabled

---

## Phase 4: Enable Leaked Password Protection

**Action**: Use the configure-auth tool to enable leaked password protection.

This checks user passwords against the HaveIBeenPwned database during signup/password change.

---

## Phase 5: Admin Role Verification in Edge Functions

### Current State
- RLS policies on database tables use `has_role()` function correctly
- Edge functions use service role client, bypassing RLS
- Admin operations in edge functions should explicitly verify role

### Recommended Enhancement
Create a shared helper for role verification in edge functions that need admin-only access:

```typescript
async function verifyAdminRole(
  supabaseClient: SupabaseClient,
  authHeader: string | null
): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing auth header' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, error: 'Invalid token' };
  }
  
  // Check admin role using service client
  const { data: roleData } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  
  return { isAdmin: !!roleData, userId: user.id };
}
```

---

## Implementation Order

1. **Phase 1**: Database migrations for RLS fixes (critical)
2. **Phase 4**: Enable leaked password protection (quick win)
3. **Phase 2**: Edge function input validation
4. **Phase 3**: Update PMS webhook finding status
5. **Phase 5**: Admin role verification in edge functions

---

## Files to Create/Modify

### Database Migrations:
1. Add checkout_holds validation trigger with rate limiting
2. Verify blog_authors policy (may need to restrict public SELECT)

### Edge Functions to Modify:
1. `supabase/functions/create-payment-intent/index.ts` - Add Zod validation
2. `supabase/functions/confirm-payment/index.ts` - Add Zod validation
3. `supabase/functions/advancecm-sync/index.ts` - Add action validation

### Frontend Files to Check:
1. Verify blog author queries use `blog_authors_public` view for public pages

---

## Expected Outcomes

After implementation:
- No publicly accessible PII or financial data
- Input validation prevents malformed/malicious requests
- Rate limiting on checkout holds prevents availability blocking attacks
- Password security enhanced with breach detection
- Clear documentation of intentional security decisions (PMS webhook)

