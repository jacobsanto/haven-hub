
# Add Quick Actions Section to Admin Dashboard

## Overview

Add a Quick Actions card to the Admin Dashboard with clickable icons that serve as shortcuts to key admin sections. Each icon will navigate to its corresponding page when clicked.

## Design

```text
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Quick Actions                                               │
│                                                                 │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │  🏠    │  │  📅    │  │  🏷️    │  │  ⭐    │  │  📝    │    │
│  │Property│  │Bookings│  │ Promos │  │ Experi │  │ Blog   │    │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘    │
│                                                                 │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │  📊    │  │  📦    │  │  ⚙️    │  │  📧    │  │  💵    │    │
│  │Analytic│  │ Addons │  │Settings│  │ News   │  │  Fees  │    │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Actions to Include

Based on the navigation structure in `AdminLayout.tsx`:

| Action | Icon | Route | Description |
|--------|------|-------|-------------|
| Add Property | Building2 | /admin/properties | Manage properties |
| Bookings | Calendar | /admin/bookings | View/manage bookings |
| Promotions | Tag | /admin/promotions | Manage promotions |
| Experiences | Star | /admin/experiences | Manage experiences |
| Blog Posts | FileText | /admin/blog | Create/edit blog posts |
| Analytics | TrendingUp | /admin/analytics | View analytics |
| Add-ons | Package | /admin/addons | Manage add-ons |
| Settings | Settings | /admin/settings | System settings |
| Newsletter | Mail | /admin/newsletter | Manage subscribers |
| Fees & Taxes | Receipt | /admin/fees | Configure fees |

## Technical Implementation

### File to Modify
`src/pages/admin/AdminDashboard.tsx`

### Changes Required

1. **Add imports**:
   - Add `useNavigate` from `react-router-dom`
   - Add icons: `Settings`, `Star`, `FileText`, `Package`, `Tag`, `Receipt`, `Zap` (for Quick Actions header)

2. **Create Quick Actions data array**:
```typescript
const quickActions = [
  { label: 'Properties', icon: Building2, href: '/admin/properties', color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Bookings', icon: Calendar, href: '/admin/bookings', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { label: 'Promotions', icon: Tag, href: '/admin/promotions', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { label: 'Experiences', icon: Star, href: '/admin/experiences', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { label: 'Blog', icon: FileText, href: '/admin/blog', color: 'text-green-600', bgColor: 'bg-green-100' },
  { label: 'Analytics', icon: TrendingUp, href: '/admin/analytics', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { label: 'Add-ons', icon: Package, href: '/admin/addons', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { label: 'Newsletter', icon: Mail, href: '/admin/newsletter', color: 'text-violet-600', bgColor: 'bg-violet-100' },
  { label: 'Fees', icon: Receipt, href: '/admin/fees', color: 'text-teal-600', bgColor: 'bg-teal-100' },
];
```

3. **Add Quick Actions Card** (after Occupancy Overview, before Recent Bookings):
```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
  <Card className="card-organic">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <p className="font-semibold">Quick Actions</p>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.href}
            onClick={() => navigate(action.href)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
          >
            <div className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </CardContent>
  </Card>
</motion.div>
```

## Placement in Dashboard

The Quick Actions card will be placed after the Occupancy Overview card and before the Recent Bookings section, following the natural flow:

1. Header
2. Real-time Activity Strip (4 cards)
3. Stats Grid (4 cards)
4. Revenue Trend Card
5. Payment Health Card
6. Newsletter Growth Card
7. Occupancy Overview Card
8. **Quick Actions Card** (NEW)
9. Recent Bookings

## User Experience

- Each icon is clickable and navigates to the corresponding admin section
- Hover effects provide visual feedback (scale animation + color change)
- Icons use consistent color coding matching the sidebar
- Responsive grid: 5 columns on mobile, 10 on desktop
- Smooth animation on page load
