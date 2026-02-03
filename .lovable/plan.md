

# Fix: PMS Connection Test Authentication Issue

## Root Cause Analysis

The PMS connection **IS working** - the database shows:
- Active connection with successful sync status
- Last sync just 9 minutes ago
- Auto-sync enabled and running every 5 minutes

The "Test Connection" button fails with "Authentication required" because:

1. **Default adapter uses Mock**: `pmsAdapter = getPMSAdapter(false)` returns MockPMSAdapter
2. **AdvanceCMAdapter requires authentication**: The `testConnection()` method calls an edge function that checks for `supabase.auth.getSession()` - if no session exists, it throws "Authentication required"

---

## Why the UI Shows Disconnected

Looking at the `PMSConnectionHealthCard` component, it displays connection status based on:
- `connection.is_active` - which IS true
- `connection.sync_status` - which IS "success"

The issue is the **Test Connection button** throwing errors, which may be confusing you into thinking it's disconnected.

---

## Solution: Fix the PMS Adapter Selection

### Change 1: Update `src/integrations/pms/index.ts`

Currently:
```typescript
export const pmsAdapter = getPMSAdapter(false); // Always uses Mock
```

Change to use the real AdvanceCM adapter:
```typescript
export const pmsAdapter = getPMSAdapter(true); // Use real adapter
```

Or better, create a dynamic adapter that checks if credentials are configured:
```typescript
export const pmsAdapter = new AdvanceCMAdapter();
```

---

### Change 2: Improve Error Handling in Test Connection

The `AdvanceCMAdapter.testConnection()` method catches errors and returns `false`, but doesn't distinguish between:
- "No session" (user not logged in)
- "API credentials invalid"
- "Network error"

We should improve the error handling to show more helpful messages.

---

### Change 3: Verify Admin Login Status

The edge function calls require a valid auth session. Ensure:
1. You are logged in as an admin user
2. The session hasn't expired
3. The edge function has access to the TOKEET_API_KEY secret

---

## Implementation Steps

1. **Update `src/integrations/pms/index.ts`**:
   - Change default adapter from Mock to AdvanceCM
   - This ensures all PMS operations use the real adapter

2. **Update `useTestPMSConnection` hook**:
   - Add better error messaging
   - Check for auth session before calling adapter

3. **Verify Secrets**:
   - Confirm `TOKEET_API_KEY` and `TOKEET_ACCOUNT_ID` are configured in backend

---

## Quick Verification

The PMS sync IS working. Evidence:
- Edge function logs show: "Sync complete: 20 synced, 0 failed"
- Database shows last sync 9 minutes ago with status "success"
- The cron job is running every 5 minutes as expected

The only issue is the "Test Connection" button failing due to the mock adapter being used.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/integrations/pms/index.ts` | Use `AdvanceCMAdapter` as default |
| `src/hooks/useAdminPMSHealth.ts` | Add auth check before test connection |

---

## Expected Outcome

After fix:
- "Test Connection" button will work when logged in as admin
- Clear error message if not authenticated
- Connection status will continue to show correctly from database

