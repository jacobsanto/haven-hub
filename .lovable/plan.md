

# Make Header, Hero, and Navigation Fully Editable Across All Pages

## Overview

Currently, the header navigation links, homepage hero quick-nav icons, homepage featured villa card, and footer navigation links are all **hardcoded arrays** in component files. The existing CMS (`page_content` table) handles text/image fields well but has no concept of **dynamic lists** -- items that can be added, removed, or reordered.

This plan introduces two new database tables and a dedicated admin page to make all of these elements fully manageable.

---

## What Becomes Editable

| Element | Current State | After This Change |
|---------|--------------|-------------------|
| Header nav links (5 items) | Hardcoded in `Header.tsx` | Database-driven, add/remove/reorder/hide |
| Hero quick-nav icons (4 items) | Hardcoded in `Index.tsx` | Database-driven, add/remove/reorder/hide |
| Footer "Explore" links (4 items) | Hardcoded in `Footer.tsx` | Database-driven, same source as header |
| Footer "Company" links (4 items) | Hardcoded in `Footer.tsx` | Database-driven, add/remove/reorder/hide |
| Hero search bar visibility | Always shown | Toggleable via settings |
| Hero featured villa card | Auto-selects first property | Choose specific property or hide entirely |
| Hero quick-nav section | Always shown | Toggleable via settings |

---

## Database Changes

### Table 1: `navigation_items`

Stores all navigation links for header, hero quick-nav, and footer columns.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid (PK) | Primary key |
| `placement` | text | `header`, `hero_quicknav`, `footer_explore`, or `footer_company` |
| `label` | text | Display text |
| `path` | text | Route path (e.g., `/properties`) |
| `icon` | text | Lucide icon name (optional, used for hero icons) |
| `sort_order` | integer | Display order |
| `is_visible` | boolean | Toggle visibility |
| `show_on_mobile` | boolean | Show in mobile menu |
| `priority` | boolean | Show on large screens vs extra-large only (header) |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

**RLS**: Public read for visible items, admin full CRUD.

**Seed data**: All current hardcoded items inserted as initial rows so nothing changes visually until the admin makes edits.

### Table 2: `hero_settings`

Simple key-value configuration for homepage hero toggles.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid (PK) | Primary key |
| `key` | text (unique) | Setting name |
| `value` | text | Setting value |
| `updated_at` | timestamptz | Auto-set |

Initial settings:
- `show_search_bar` = `true`
- `show_featured_villa` = `true`
- `featured_property_id` = `auto` (first featured property)
- `show_quick_nav` = `true`

**RLS**: Public read, admin full CRUD.

---

## New Admin Page: Navigation Manager

A new admin page at `/admin/navigation` with tabs:

- **Header Navigation** -- Table of links with add/edit/delete, visibility toggle, mobile toggle, sort order
- **Hero Quick Nav** -- Same UI but includes icon picker for each item
- **Footer Explore** -- Links for the "Explore" footer column
- **Footer Company** -- Links for the "Company" footer column
- **Hero Settings** -- Toggle switches for search bar, featured villa, quick-nav visibility; property selector for featured villa

---

## Frontend Component Updates

### `Header.tsx`
- Replace static `navItems` array with data from `useNavigationItems('header')`
- Fallback to current hardcoded items if the database returns empty (safety net)

### `Index.tsx` (Hero Section)
- Replace hardcoded quick-nav icons with `useNavigationItems('hero_quicknav')`
- Read `useHeroSettings()` to conditionally show/hide search bar, featured villa card, and quick-nav
- Use `featured_property_id` setting to select a specific property or auto-select

### `Footer.tsx`
- Replace hardcoded "Explore" links with `useNavigationItems('footer_explore')`
- Replace hardcoded "Company" links with `useNavigationItems('footer_company')`

---

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useNavigationItems.ts` | Hook to fetch visible, sorted nav items by placement; admin CRUD mutations |
| `src/hooks/useHeroSettings.ts` | Hook to read hero settings (public) and update them (admin) |
| `src/components/admin/NavigationItemFormDialog.tsx` | Add/edit dialog for nav items (label, path, icon, placement, visibility, mobile, priority) |
| `src/pages/admin/AdminNavigation.tsx` | Full navigation management page with tabs for each placement |

## Modified Files

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Use `useNavigationItems('header')` instead of static array |
| `src/pages/Index.tsx` | Use `useNavigationItems('hero_quicknav')` and `useHeroSettings()` |
| `src/components/layout/Footer.tsx` | Use `useNavigationItems('footer_explore')` and `useNavigationItems('footer_company')` |
| `src/components/admin/AdminLayout.tsx` | Add "Navigation" link to Content section in sidebar |
| `src/App.tsx` | Add `/admin/navigation` route |

---

## Safety Measures

- All components fall back to their current hardcoded defaults if the database query returns empty or fails, so the site never shows a blank header/footer
- Seed data ensures the migration itself populates the tables with the current values
- No changes to booking logic, PMS integrations, or any operational systems

