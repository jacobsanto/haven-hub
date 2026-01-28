

# Fix Admin Dashboard Access Issue

## Problem Summary

The admin user (`iakovos@ariviagroup.com`) is logged in but the "Admin Dashboard" link is not appearing in the navigation dropdown. Investigation confirmed:

1. The user is properly authenticated and logged in
2. The user has the `admin` role in the `user_roles` table
3. RLS policies are correctly configured
4. The `has_role()` function works properly

The issue is in the frontend code's handling of the admin role check.

---

## Root Cause Analysis

### Issue 1: Silent Error Handling

In `src/hooks/useAuth.tsx`, the admin role check uses `.single()` which throws an error if no row is found:

```typescript
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', session.user.id)
  .eq('role', 'admin')
  .single();  // Throws PGRST116 error if no row found

setIsAdmin(!!roles);  // If error occurs, roles is null, isAdmin stays false
```

The error is not being caught or logged, so if anything fails, `isAdmin` silently remains `false`.

### Issue 2: Race Condition

Both `onAuthStateChange` and `getSession()` run admin checks simultaneously:
- `onAuthStateChange` sets up a listener that may fire immediately
- `getSession()` also checks for admin role
- Both update `isAdmin` state, potentially overwriting each other

### Issue 3: Redundant Loading State

The `setLoading(false)` is called in multiple places, potentially causing premature rendering before the admin check completes.

---

## Solution

### 1. Improve Error Handling

Add proper error handling and logging to the admin role check. Use `.maybeSingle()` instead of `.single()` to avoid throwing when no row exists.

### 2. Consolidate Admin Check Logic

Create a reusable function that properly handles the admin check with error logging.

### 3. Fix Race Condition

Use a single source of truth for the admin check instead of running it in parallel from both `onAuthStateChange` and `getSession()`.

---

## Implementation Details

### File: `src/hooks/useAuth.tsx`

**Changes:**

1. Create a helper function `checkAdminRole` that:
   - Uses `.maybeSingle()` instead of `.single()`
   - Logs errors for debugging
   - Returns boolean result

2. Refactor the auth state handling:
   - Remove duplicate admin checks
   - Ensure `setLoading(false)` only happens after all checks complete
   - Use defer logic in `onAuthStateChange` to prevent blocking the auth listener

3. Add error boundary for failed queries

**Code Changes:**

```typescript
// Add helper function
const checkAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error('Exception checking admin role:', err);
    return false;
  }
};
```

Then update both the `onAuthStateChange` handler and `getSession()` callback to use this helper function.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Fix admin role check with proper error handling |

---

## Technical Notes

- `.maybeSingle()` returns `null` if no row is found (instead of throwing an error)
- Using `setTimeout` with 0ms delay in `onAuthStateChange` prevents Supabase deadlock warnings
- Error logging helps debug RLS policy issues in the future

---

## Testing Steps

After implementation:
1. Refresh the page
2. Click the user icon in the header
3. Verify "Admin Dashboard" option appears in the dropdown
4. Click "Admin Dashboard" to confirm navigation works

