

## Add Hero Image to Properties Page via CMS

### Problem
The Properties page hero banner has no admin-controllable hero image. It falls back to the first property's `hero_image_url` or a hardcoded Unsplash URL — neither is reliable or intentional.

### Changes

#### 1. Add `hero_image` field to Properties page content schema

**`src/hooks/usePageContent.ts`** — In the `properties` page schema, add a `hero_image` field to the existing `header` section:

```typescript
{
  sectionKey: 'header',
  title: 'Page Header',
  fields: [
    { key: 'heading', label: 'Default Heading', type: 'text', defaultValue: 'Find & Book Your Perfect Stay' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Best rates guaranteed when you book direct.' },
    { key: 'hero_image', label: 'Hero Background Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=50' },
  ],
}
```

#### 2. Wire the CMS value into the Properties page

**`src/pages/Properties.tsx`** — Use `usePageContent` to fetch the `header` section and pass `hero_image` to the banner:

```typescript
const headerContent = usePageContent('properties', 'header', {
  heading: '...', subtitle: '...', hero_image: '...'
});
// Pass headerContent.hero_image to <PropertiesHeroBanner heroImageUrl={...} />
```

This means the hero image becomes editable from the admin CMS page content editor — no code changes needed after this to update it.

