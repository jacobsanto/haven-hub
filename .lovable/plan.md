

# Fix Destination Search to Use Village Dropdown

## Overview

Replace all destination text inputs with dropdown selectors that show the actual villages from the database. This ensures users can only select valid destinations and provides a better UX.

## Components to Update

### 1. SearchBar Component (Hero & Compact variants)
**Location:** `src/components/search/SearchBar.tsx`

Currently uses a text input. Will be updated to use a dropdown/combobox that:
- Fetches active destinations from the database
- Shows village names with country
- Allows selection instead of free-typing

### 2. UnifiedBookingDialog
**Location:** `src/components/booking/UnifiedBookingDialog.tsx`

Currently has a text input in the "search" step. Will be updated to show destination selection with the same villages.

### 3. Constants Cleanup
**Location:** `src/lib/constants.ts`

Remove the static `POPULAR_DESTINATIONS` array since destinations are now dynamic from the database.

## Implementation Details

### SearchBar Changes

Replace the destination text input with a Select/Combobox component:

```text
┌─────────────────────────────────────────────────────────────┐
│  HERO VARIANT                                               │
│                                                              │
│  ┌─────────────────┐ ┌───────────┐ ┌───────────┐ ┌────────┐│
│  │ Destination ▼   │ │ Check In  │ │ Check Out │ │ Guests ││
│  │ Oia, Greece     │ │ Feb 10    │ │ Feb 15    │ │ 2      ││
│  └─────────────────┘ └───────────┘ └───────────┘ └────────┘│
│                                                              │
│  Dropdown options:                                           │
│  ├── Oia, Greece                                             │
│  ├── Fira, Greece                                            │
│  ├── Imerovigli, Greece                                      │
│  ├── Thira, Greece                                           │
│  ├── Megalochori, Greece                                     │
│  ├── Perissa, Greece                                         │
│  ├── Emporio, Greece                                         │
│  ├── Vothonas, Greece                                        │
│  └── Mesaria, Greece                                         │
└─────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────┐
│  COMPACT VARIANT (Header)                                    │
│                                                              │
│  ┌───────────────────┐ ┌────┐ ┌────┐                        │
│  │ 📍 Oia ▼         │ │ 2  │ │ 🔍 │                        │
│  └───────────────────┘ └────┘ └────┘                        │
└──────────────────────────────────────────────────────────────┘
```

### UnifiedBookingDialog Changes

Replace the text input in the search step with a destination grid/list:

```text
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: SELECT DESTINATION                                 │
│                                                              │
│  Where would you like to stay?                               │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 📍 Oia     │  │ 📍 Fira    │  │ 📍 Imerovigli│          │
│  │ Greece     │  │ Greece     │  │ Greece      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 📍 Thira   │  │ 📍 Megalochori│ 📍 Perissa  │          │
│  │ Greece     │  │ Greece       │ │ Greece      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  Or select "All Destinations" to see all properties          │
└─────────────────────────────────────────────────────────────┘
```

### Technical Approach

**SearchBar:**
- Use existing `useActiveDestinations` hook to fetch villages
- Replace `<Input>` with `<Select>` or `<Popover>` with `<Command>` (combobox)
- Include "All Destinations" option that passes empty location
- Show "Loading..." state while fetching

**UnifiedBookingDialog:**
- Fetch destinations with `useActiveDestinations`
- Display as selectable cards/buttons
- Update search step to allow destination selection before dates

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/search/SearchBar.tsx` | Replace text input with destination dropdown using `useActiveDestinations` |
| `src/components/booking/UnifiedBookingDialog.tsx` | Update search step with destination selection grid |
| `src/lib/constants.ts` | Remove outdated `POPULAR_DESTINATIONS` |

## UX Improvements

1. **Type-ahead filtering:** Users can still type to filter the dropdown
2. **Show property count:** Each destination option shows how many properties are available
3. **"All" option:** Always include "All Destinations" to browse everything
4. **Clear selection:** Allow clearing to search without location filter

