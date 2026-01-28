
# Comprehensive Code Quality & Security Fixes

This plan addresses 4 critical issues identified in the audit: XSS vulnerability, console.log statements, hardcoded colors, and missing aria-labels.

---

## Overview

| Fix | Files Affected | Priority |
|-----|---------------|----------|
| XSS/DOMPurify sanitization | 1 file | Critical |
| Remove console.log statements | 2 files | High |
| Replace hardcoded colors | 9 files | Medium |
| Add aria-labels | 11 files | Medium |

---

## 1. Fix XSS Vulnerability (Critical)

**File:** `src/components/blog/MarkdownRenderer.tsx`

**Problem:** Using `dangerouslySetInnerHTML` without sanitization allows potential XSS attacks if blog content contains malicious scripts.

**Solution:**
- Install `dompurify` and `@types/dompurify` packages
- Sanitize HTML output before rendering

```text
Before:
  dangerouslySetInnerHTML={{ __html: htmlContent }}

After:
  import DOMPurify from 'dompurify';
  const sanitizedHtml = DOMPurify.sanitize(htmlContent);
  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
```

---

## 2. Remove Console.log Statements (High Priority)

### File 1: `src/integrations/pms/mock-adapter.ts`
Remove 12 console.log statements from mock PMS adapter functions:
- `testConnection()` - line 187
- `fetchProperties()` - line 193
- `fetchProperty()` - line 200
- `fetchAvailability()` - line 214
- `fetchRates()` - line 228
- `fetchFees()` - line 234
- `createBooking()` - line 257
- `cancelBooking()` - line 275
- `syncAll()` - line 285
- `syncAvailability()` - line 295
- `syncRates()` - line 305

**Alternative:** Keep logs but wrap in development-only check:
```typescript
if (import.meta.env.DEV) {
  console.log('[MockPMS] ...');
}
```

### File 2: `src/hooks/useRealtimeBookings.ts`
Remove 5 console.log statements from realtime subscription handlers (lines 19, 34, 46, 59, 89).

---

## 3. Replace Hardcoded Colors with Semantic Tokens (Medium Priority)

### Status Badge Pattern
Create a reusable utility function in `src/lib/utils.ts`:

```typescript
export function getStatusColors(status: string): string {
  const statusMap: Record<string, string> = {
    // Success states
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    
    // Warning states
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    
    // Error states
    error: 'bg-destructive/10 text-destructive',
    failed: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-destructive/10 text-destructive',
    
    // Info states
    running: 'bg-primary/10 text-primary',
    
    // Default
    default: 'bg-muted text-muted-foreground',
    archived: 'bg-muted text-muted-foreground',
  };
  return statusMap[status] || statusMap.default;
}
```

### Files to Update

| File | Current | Replacement |
|------|---------|-------------|
| `AdminBookings.tsx` | `bg-green-100 text-green-700`, `bg-amber-100 text-amber-700`, `bg-red-100 text-red-700`, `bg-gray-100 text-gray-700` | Use `getStatusColors()` utility |
| `AdminProperties.tsx` | `bg-green-100 text-green-700`, `bg-amber-100 text-amber-700`, `bg-gray-100 text-gray-700` | Use `getStatusColors()` utility |
| `AdminPMSHealth.tsx` | `text-green-600`, `text-red-600`, `text-blue-600`, `text-yellow-600`, `bg-green-100`, `bg-blue-100` | Use semantic tokens |
| `SeasonalRatesHeatmap.tsx` | `text-green-600`, `text-red-600` | Use `text-emerald-600` and `text-destructive` |
| `BookingWidget.tsx` | `text-green-600` | Use `text-emerald-600 dark:text-emerald-400` |
| `SpecialOfferBadge.tsx` | Multiple `text-green-*` and `bg-green-*` | Use semantic success tokens |
| `QuickBookCard.tsx` | `bg-green-100 text-green-700` | Use semantic success tokens |

---

## 4. Add Aria-Labels to Icon-Only Buttons (Medium Priority)

### Pattern for Icon Buttons
Add `aria-label` attribute to all buttons that only contain icons:

```typescript
// Before
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>

// After
<Button variant="ghost" size="icon" aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Files Requiring Updates

| File | Button(s) | Aria-Label |
|------|-----------|------------|
| `Header.tsx` | User icon button (line 99), Mobile menu toggle (line 130-134) | "User menu", "Toggle mobile menu" |
| `AdminLayout.tsx` | Sign out button (line 270), Mobile menu button (line 295) | "Sign out", "Open menu" |
| `PropertyGallery.tsx` | Close button (line 132-138), Previous (line 147-154), Next (line 155-162), Thumbnail buttons | "Close gallery", "Previous image", "Next image", "View image X" |
| `PropertyShareSave.tsx` | Share button (line 67-74, 104-114), Save button (line 75-91, 115-133), Close button (line 155-160) | "Share property", "Save to wishlist", "Close" |
| `BookingWidget.tsx` | Decrease guests (line 179-186), Increase guests (line 188-195) | "Decrease guests", "Increase guests" |
| `AvailabilityCalendar.tsx` | Previous month (line 173), Next month (line 190) | "Previous month", "Next month" |
| `AdminAvailability.tsx` | Previous month (line 116), Next month (line 122) | "Previous month", "Next month" |
| `AdminProperties.tsx` | More options (line 187) | "Property options" |
| `AdminBookings.tsx` | Confirm (line 199-209), Cancel (line 210-220, 224-235), Reopen (line 237-248) | "Confirm booking", "Cancel booking", "Reopen booking" |
| `AdminFees.tsx` | Delete buttons (lines 278, 366) | "Delete fee", "Delete tax" |
| `AdminRatePlans.tsx` | Delete buttons (lines 509, 704) | "Delete rate plan", "Delete seasonal rate" |
| `AdminNewsletterSubscribers.tsx` | Delete button (line 196) | "Delete subscriber" |
| `AdminBlogAuthors.tsx` | Edit button (line 133) | "Edit author" |

---

## Technical Details

### Package Installation Required
```bash
npm install dompurify @types/dompurify
```

### Files Changed Summary
- **New code in 1 file:** `src/lib/utils.ts` (add `getStatusColors` utility)
- **Modified files:** 13 total
  - `src/components/blog/MarkdownRenderer.tsx`
  - `src/integrations/pms/mock-adapter.ts`
  - `src/hooks/useRealtimeBookings.ts`
  - `src/pages/admin/AdminBookings.tsx`
  - `src/pages/admin/AdminProperties.tsx`
  - `src/pages/admin/AdminPMSHealth.tsx`
  - `src/pages/admin/AdminAvailability.tsx`
  - `src/pages/admin/AdminFees.tsx`
  - `src/pages/admin/AdminRatePlans.tsx`
  - `src/pages/admin/AdminNewsletterSubscribers.tsx`
  - `src/pages/admin/AdminBlogAuthors.tsx`
  - `src/components/layout/Header.tsx`
  - `src/components/admin/AdminLayout.tsx`
  - `src/components/properties/PropertyGallery.tsx`
  - `src/components/properties/PropertyShareSave.tsx`
  - `src/components/booking/BookingWidget.tsx`
  - `src/components/booking/AvailabilityCalendar.tsx`
  - `src/components/admin/SeasonalRatesHeatmap.tsx`
  - `src/components/properties/SpecialOfferBadge.tsx`
  - `src/components/booking/QuickBookCard.tsx`

### Estimated Changes
- ~20 files modified
- ~150 lines changed
- 1 new npm package

---

## Benefits After Implementation

| Category | Improvement |
|----------|-------------|
| **Security** | XSS vulnerability eliminated, no user-injectable scripts can execute |
| **Performance** | Cleaner production builds without debug logs |
| **Maintainability** | Centralized status color logic, consistent theming |
| **Accessibility** | Screen reader users can navigate all interactive elements |
| **Dark Mode** | All status badges will properly support dark mode |

