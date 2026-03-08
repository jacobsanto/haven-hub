

# Flatten Footer Backgrounds — Remove Decorative Effects

## Goal
All 8 footer templates get a flat `bg-foreground` (Aegean Navy) background with no decorative effects. Text, links, and interactive elements keep their current readable contrast colors.

## Changes Per Footer

### FooterEditorial.tsx
- **Remove** the gradient color strip: `<div className="h-0.5 bg-gradient-to-r from-accent via-primary to-accent" />`

### FooterGlassmorphic.tsx
- **Remove** the two background orbs (`bg-accent/10` blur and `bg-primary/10` blur divs)
- **Remove** `backdrop-blur-xl` and `backdrop-blur-sm` from GlassPanel and inner elements — flatten panels to simple `bg-background/5` with `border-background/10`
- **Remove** the top highlight gradient line inside GlassPanel (`h-px bg-gradient-to-r from-transparent via-border/30 to-transparent`)

### FooterBento.tsx
- **Remove** the green status cell entirely (lines 104-108: `bg-green-500 animate-pulse` dot and `text-green-400` text) — or replace with plain background/60 styling without pulse animation

### FooterBrutalist.tsx
- **Remove** `border-t-4 border-accent` (thick accent top border) → replace with plain `border-t border-background/10`
- **Remove** the green live indicator (`bg-green-500 animate-pulse` dot and `text-green-400` text)

### FooterImmersive.tsx
- **Remove** the destination marquee ticker section (scrolling text with `animate-[marquee_30s...]`)
- **Remove** the `Heart` icon with `text-destructive`

### FooterKinetic.tsx
- **Remove** both marquee ticker rows (the two scrolling text bands at the top)

### FooterMinimal.tsx
- **Remove** the accent-colored expand bar (`h-1 bg-accent`) inside hover columns

### FooterChatFirst.tsx
- No decorative background effects to remove — already flat

## Summary

| File | What's Removed |
|------|---------------|
| FooterEditorial | Gradient color strip |
| FooterGlassmorphic | 2 blur orbs, backdrop-blur, gradient highlight line |
| FooterBento | Green status cell (pulse + green text) |
| FooterBrutalist | Thick accent border-top, green live indicator |
| FooterImmersive | Marquee ticker, destructive heart icon |
| FooterKinetic | 2 marquee ticker rows |
| FooterMinimal | Accent expand bar |
| FooterChatFirst | No changes needed |

All backgrounds remain `bg-foreground` (Aegean Navy). No structural layout changes. Text contrast preserved.

