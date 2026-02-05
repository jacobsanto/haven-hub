
# Fix Website Analytics Edge Function

## Problem Identified

The `website-analytics` edge function is returning 404 errors due to two issues:

1. **Framework Mismatch**: The function uses the Hono framework (`app.post('/')` with `Deno.serve(app.fetch)`), while all other working functions in this project use direct `Deno.serve(async (req) => {...})` pattern.

2. **Network Requests Failing**: The POST requests from the frontend are failing with "Failed to fetch" which typically indicates either CORS issues or the function not responding correctly.

## Solution

Rewrite the edge function to match the project's established pattern (like `exchange-rates` and `generate-content`).

## Changes Required

### 1. Rewrite `supabase/functions/website-analytics/index.ts`

Replace the Hono-based implementation with the standard pattern:

```text
Before (Hono pattern - NOT WORKING):
┌─────────────────────────────────────────┐
│ import { Hono } from '...'              │
│ const app = new Hono()                  │
│ app.options('*', ...)                   │
│ app.post('/', async (c) => {...})       │
│ Deno.serve(app.fetch)                   │
└─────────────────────────────────────────┘

After (Standard pattern - WORKING):
┌─────────────────────────────────────────┐
│ import { createClient } from '...'      │
│ Deno.serve(async (req) => {             │
│   if (req.method === 'OPTIONS') {...}   │
│   // Handle POST directly               │
│   return new Response(...)              │
│ })                                      │
└─────────────────────────────────────────┘
```

Key changes:
- Remove Hono framework dependency
- Use `Deno.serve(async (req) => {...})` directly
- Handle CORS preflight with direct Response
- Use `await supabase.auth.getUser()` pattern (matching `generate-content` function) instead of `getClaims` for more reliable authentication
- Return proper `Response` objects with JSON and CORS headers

### 2. Technical Details

The rewritten function will:
- Handle OPTIONS preflight requests correctly
- Verify authentication using `getUser()` (same pattern as generate-content)
- Check admin role via `user_roles` table
- Parse request body for date range
- Return mock analytics data with proper JSON response
- Include correct CORS headers on all responses

No database schema changes required.
