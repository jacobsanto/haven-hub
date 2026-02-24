import type { ContentField } from '@/hooks/usePageContent';

interface ContentPreviewProps {
  sectionKey: string;
  fields: ContentField[];
  values: Record<string, string>;
  pageSlug: string;
}

function SeoPreview({ values, pageSlug }: { values: Record<string, string>; pageSlug: string }) {
  const title = values.meta_title || '';
  const description = values.meta_description || '';
  const ogImage = values.og_image || '';
  const displayUrl = `havenhub.com/${pageSlug === 'home' ? '' : pageSlug}`;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Google Search Preview</h4>
      <div className="bg-background border border-border rounded-lg p-4 max-w-xl space-y-1">
        <p className="text-xs text-muted-foreground">{displayUrl}</p>
        <p className="text-primary text-lg leading-snug font-medium truncate">{title || 'Page Title'}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{description || 'Meta description will appear here...'}</p>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className={title.length > 60 ? 'text-destructive' : ''}>
          Title: {title.length}/60
        </span>
        <span className={description.length > 160 ? 'text-destructive' : ''}>
          Description: {description.length}/160
        </span>
      </div>
      {ogImage && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">OG Image Preview</h4>
          <img
            src={ogImage}
            alt="OG preview"
            className="rounded-lg border border-border max-h-40 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}

function HeroPreview({ values }: { values: Record<string, string> }) {
  const heading = values.heading || values.heading_prefix || '';
  const subtitle = values.subtitle || values.subtitle_default || '';
  const heroImage = values.hero_image || '';

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hero Preview</h4>
      <div
        className="rounded-lg bg-muted/50 border border-border p-8 text-center space-y-3"
        style={heroImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <h2 className={`text-2xl font-serif font-medium ${heroImage ? 'text-white' : 'text-foreground'}`}>
          {heading || 'Heading'}
        </h2>
        <p className={`text-sm ${heroImage ? 'text-white/80' : 'text-muted-foreground'}`}>
          {subtitle || 'Subtitle text'}
        </p>
      </div>
    </div>
  );
}

function GeneralPreview({ fields, values }: { fields: ContentField[]; values: Record<string, string> }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Preview</h4>
      <div className="rounded-lg bg-muted/50 border border-border p-6 space-y-3">
        {fields.map((field) => {
          const val = values[field.key] || '';
          if (!val) return null;

          if (field.type === 'image') {
            return (
              <img
                key={field.key}
                src={val}
                alt={field.label}
                className="rounded border border-border max-h-32 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            );
          }

          // Heuristic: fields with "heading" or "title" in key render as headings
          const isHeading = /heading|title/i.test(field.key);
          if (isHeading) {
            return <h3 key={field.key} className="text-lg font-serif font-medium text-foreground">{val}</h3>;
          }

          return <p key={field.key} className="text-sm text-muted-foreground">{val}</p>;
        })}
      </div>
    </div>
  );
}

export function ContentPreview({ sectionKey, fields, values, pageSlug }: ContentPreviewProps) {
  // Build a values map with just the content keys (strip the sectionKey__ prefix)
  const sectionValues: Record<string, string> = {};
  for (const field of fields) {
    const compositeKey = `${sectionKey}__${field.key}`;
    sectionValues[field.key] = values[compositeKey] ?? field.defaultValue;
  }

  if (sectionKey === 'seo') {
    return <SeoPreview values={sectionValues} pageSlug={pageSlug} />;
  }

  if (sectionKey === 'hero') {
    return <HeroPreview values={sectionValues} />;
  }

  return <GeneralPreview fields={fields} values={sectionValues} />;
}
