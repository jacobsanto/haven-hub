import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  PAGE_CONTENT_SCHEMAS,
  useAllPageContent,
  useBulkUpsertPageContent,
  type PageContentSchema,
  type ContentField,
} from '@/hooks/usePageContent';
import { useAllSectionDisplaySettings, useUpsertSectionDisplay, type SectionDisplaySettings } from '@/hooks/useSectionDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ContentPreview } from '@/components/admin/ContentPreview';
import { ImageUploadWithOptimizer } from '@/components/admin/ImageUploadWithOptimizer';
import { IconPicker, AMENITY_ICONS } from '@/components/admin/IconPicker';
import { IMAGE_PRESETS } from '@/utils/image-optimizer';
import { useIconSuggestion } from '@/hooks/useIconSuggestion';
import { Save, RotateCcw, ChevronDown, FileText, Image, Eye, EyeOff, Sparkles, Palette, LayoutGrid, LayoutList, Star, Play } from 'lucide-react';

export default function AdminPageContent() {
  const [activePage, setActivePage] = useState(PAGE_CONTENT_SCHEMAS[0].pageSlug);
  const activeSchema = PAGE_CONTENT_SCHEMAS.find((p) => p.pageSlug === activePage)!;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-medium">Page Content</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Edit headings, descriptions, and copy across all public pages.
            </p>
          </div>

          <Tabs value={activePage} onValueChange={setActivePage}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {PAGE_CONTENT_SCHEMAS.map((schema) => (
                <TabsTrigger key={schema.pageSlug} value={schema.pageSlug} className="text-xs">
                  {schema.pageTitle}
                </TabsTrigger>
              ))}
            </TabsList>

            {PAGE_CONTENT_SCHEMAS.map((schema) => (
              <TabsContent key={schema.pageSlug} value={schema.pageSlug}>
                <PageEditor schema={schema} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

function PageEditor({ schema }: { schema: PageContentSchema }) {
  const { data: existingContent, isLoading } = useAllPageContent(schema.pageSlug);
  const bulkUpsert = useBulkUpsertPageContent();
  const { toast } = useToast();
  const { suggestIcon, isLoading: isSuggesting } = useIconSuggestion();

  // Local form state: { [sectionKey__contentKey]: value }
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  // Initialize form values from defaults + DB overrides
  useEffect(() => {
    const values: Record<string, string> = {};
    for (const section of schema.sections) {
      for (const field of section.fields) {
        const compositeKey = `${section.sectionKey}__${field.key}`;
        const dbRow = existingContent?.find(
          (r) => r.section_key === section.sectionKey && r.content_key === field.key
        );
        values[compositeKey] = dbRow?.value ?? field.defaultValue;
      }
    }
    setFormValues(values);
    setDirtyFields(new Set());
  }, [existingContent, schema]);

  const handleChange = (sectionKey: string, contentKey: string, value: string) => {
    const compositeKey = `${sectionKey}__${contentKey}`;
    setFormValues((prev) => ({ ...prev, [compositeKey]: value }));
    setDirtyFields((prev) => new Set(prev).add(compositeKey));
  };

  const handleResetField = (sectionKey: string, field: ContentField) => {
    const compositeKey = `${sectionKey}__${field.key}`;
    setFormValues((prev) => ({ ...prev, [compositeKey]: field.defaultValue }));
    setDirtyFields((prev) => new Set(prev).add(compositeKey));
  };

  const handleSaveSection = async (sectionKey: string, fields: ContentField[]) => {
    const entries = fields.map((f) => ({
      content_key: f.key,
      value: formValues[`${sectionKey}__${f.key}`] ?? f.defaultValue,
      content_type: f.type === 'textarea' || f.type === 'richtext' ? 'richtext' : f.type === 'image' ? 'image' : f.type === 'icon' ? 'icon' : 'text',
    }));

    try {
      await bulkUpsert.mutateAsync({
        page_slug: schema.pageSlug,
        section_key: sectionKey,
        entries,
      });

      // Clear dirty flags for this section
      setDirtyFields((prev) => {
        const next = new Set(prev);
        for (const f of fields) {
          next.delete(`${sectionKey}__${f.key}`);
        }
        return next;
      });

      toast({ title: 'Section saved', description: `${sectionKey} content updated.` });
    } catch {
      toast({ title: 'Save failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveAll = async () => {
    for (const section of schema.sections) {
      await handleSaveSection(section.sectionKey, section.fields);
    }
  };

  const hasDirtyFields = dirtyFields.size > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <Button
          onClick={handleSaveAll}
          disabled={!hasDirtyFields || bulkUpsert.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save All Changes
          {hasDirtyFields && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {dirtyFields.size}
            </Badge>
          )}
        </Button>
      </div>

      {schema.sections.map((section) => {
        const sectionDirty = section.fields.some((f) =>
          dirtyFields.has(`${section.sectionKey}__${f.key}`)
        );

        return (
          <Collapsible key={section.sectionKey} defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      {sectionDirty && (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                          Unsaved
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs">
                    {section.fields.length} editable field{section.fields.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {section.fields.map((field) => {
                    const compositeKey = `${section.sectionKey}__${field.key}`;
                    const currentValue = formValues[compositeKey] ?? field.defaultValue;
                    const isDirty = dirtyFields.has(compositeKey);
                    const isDefault = currentValue === field.defaultValue;

                    return (
                      <div key={field.key} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={compositeKey} className="text-sm">
                            {field.label}
                          </Label>
                          {field.type === 'image' && <Image className="h-3 w-3 text-muted-foreground" />}
                          {field.type === 'icon' && <Palette className="h-3 w-3 text-muted-foreground" />}
                          {field.type === 'textarea' && <FileText className="h-3 w-3 text-muted-foreground" />}
                          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                        </div>
                        {field.type === 'textarea' || field.type === 'richtext' ? (
                          <Textarea
                            id={compositeKey}
                            value={currentValue}
                            onChange={(e) => handleChange(section.sectionKey, field.key, e.target.value)}
                            rows={3}
                            className="text-sm"
                          />
                        ) : field.type === 'image' ? (
                          <ImageUploadWithOptimizer
                            value={currentValue || undefined}
                            onUpload={(url) => handleChange(section.sectionKey, field.key, url)}
                            onRemove={() => handleChange(section.sectionKey, field.key, '')}
                            preset={field.key.includes('hero') ? IMAGE_PRESETS.hero : IMAGE_PRESETS.og}
                            storagePath={`page-content/${schema.pageSlug}`}
                            label={field.label}
                            aspectClass={field.key.includes('og') ? 'aspect-[1200/630]' : 'aspect-video'}
                            compact={field.key.includes('og')}
                          />
                        ) : field.type === 'icon' ? (
                          <div className="flex items-center gap-2">
                            <IconPicker
                              value={currentValue}
                              onChange={(icon) => handleChange(section.sectionKey, field.key, icon)}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 shrink-0"
                              disabled={isSuggesting}
                              onClick={async () => {
                                // Find sibling title & description fields for this item
                                const prefix = field.key.replace(/_icon$/, '');
                                const titleKey = `${section.sectionKey}__${prefix}_title`;
                                const descKey = `${section.sectionKey}__${prefix}_description`;
                                const title = formValues[titleKey] || '';
                                const desc = formValues[descKey] || '';
                                if (!title) {
                                  toast({ title: 'Missing title', description: 'Enter a title first so the AI can suggest an icon.', variant: 'destructive' });
                                  return;
                                }
                                const suggested = await suggestIcon(title, desc, AMENITY_ICONS);
                                if (suggested) {
                                  handleChange(section.sectionKey, field.key, suggested);
                                  toast({ title: 'Icon suggested', description: `AI suggested "${suggested}" — review and save.` });
                                }
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                              {isSuggesting ? 'Thinking…' : 'Suggest'}
                            </Button>
                          </div>
                        ) : (
                          <Input
                            id={compositeKey}
                            value={currentValue}
                            onChange={(e) => handleChange(section.sectionKey, field.key, e.target.value)}
                            className="text-sm"
                          />
                        )}
                        {!isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground gap-1"
                            onClick={() => handleResetField(section.sectionKey, field)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset to default
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {showPreview && (
                    <div className="pt-4 border-t border-border">
                      <ContentPreview
                        sectionKey={section.sectionKey}
                        fields={section.fields}
                        values={formValues}
                        pageSlug={schema.pageSlug}
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveSection(section.sectionKey, section.fields)}
                      disabled={!sectionDirty || bulkUpsert.isPending}
                      className="gap-1"
                    >
                      <Save className="h-3 w-3" />
                      Save Section
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Section Display Settings */}
      <SectionDisplayEditor pageSlug={schema.pageSlug} />
    </div>
  );
}

// ── Section Display Settings Editor ──────────────────────────────────
const SECTION_LABELS: Record<string, Record<string, string>> = {
  home: { properties: 'Properties Grid', destinations: 'Destinations Grid', experiences: 'Experiences Grid', blog: 'Blog Posts Grid' },
  properties: { grid: 'Property Listing' },
  destinations: { grid: 'Destinations Listing' },
  experiences: { grid: 'Experiences Listing' },
  about: { values: 'Values Grid' },
};

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'carousel', label: 'Carousel', icon: Play },
  { value: 'list', label: 'List', icon: LayoutList },
  { value: 'featured', label: 'Featured', icon: Star },
] as const;

const ANIMATION_OPTIONS = [
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'scale-in', label: 'Scale In' },
  { value: 'slide-in', label: 'Slide In' },
  { value: 'none', label: 'None' },
] as const;

function SectionDisplayEditor({ pageSlug }: { pageSlug: string }) {
  const { data: allSettings } = useAllSectionDisplaySettings();
  const upsert = useUpsertSectionDisplay();
  const { toast } = useToast();

  const pageSections = SECTION_LABELS[pageSlug];
  if (!pageSections) return null;

  const settings = allSettings?.filter(s => s.page_slug === pageSlug) || [];

  const handleUpdate = async (sectionKey: string, field: string, value: unknown) => {
    const current = settings.find(s => s.section_key === sectionKey) || {
      page_slug: pageSlug,
      section_key: sectionKey,
      layout_mode: 'grid',
      columns: 3,
      animation: 'fade-up',
      autoplay: false,
      autoplay_interval: 5,
      items_per_view: 3,
      show_navigation: true,
      show_dots: false,
    };

    try {
      await upsert.mutateAsync({
        ...current,
        [field]: value,
      } as SectionDisplaySettings);
      toast({ title: 'Display updated', description: `${pageSections[sectionKey]} layout saved.` });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Section Display Settings
        </CardTitle>
        <CardDescription className="text-xs">
          Choose layout mode, animation, and carousel options for each content section.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(pageSections).map(([sectionKey, sectionLabel]) => {
          const setting = settings.find(s => s.section_key === sectionKey);
          const layoutMode = setting?.layout_mode || 'grid';
          const columns = setting?.columns || 3;
          const animation = setting?.animation || 'fade-up';
          const autoplay = setting?.autoplay || false;
          const autoplayInterval = setting?.autoplay_interval || 5;
          const itemsPerView = setting?.items_per_view || 3;
          const showNav = setting?.show_navigation ?? true;
          const showDots = setting?.show_dots || false;

          return (
            <div key={sectionKey} className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <h4 className="font-medium text-sm">{sectionLabel}</h4>

              {/* Layout Mode */}
              <div className="space-y-2">
                <Label className="text-xs">Layout Mode</Label>
                <div className="flex gap-2">
                  {LAYOUT_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      variant={layoutMode === opt.value ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleUpdate(sectionKey, 'layout_mode', opt.value)}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Columns (grid/featured) */}
              {(layoutMode === 'grid' || layoutMode === 'featured') && (
                <div className="space-y-2">
                  <Label className="text-xs">Columns: {columns}</Label>
                  <Slider
                    value={[columns]}
                    onValueChange={([v]) => handleUpdate(sectionKey, 'columns', v)}
                    min={2}
                    max={4}
                    step={1}
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Animation */}
              <div className="space-y-2">
                <Label className="text-xs">Animation</Label>
                <Select value={animation} onValueChange={(v) => handleUpdate(sectionKey, 'animation', v)}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Carousel options */}
              {layoutMode === 'carousel' && (
                <div className="space-y-3 p-3 rounded-md border bg-background">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Carousel Options</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Items per view</Label>
                      <Select value={String(itemsPerView)} onValueChange={(v) => handleUpdate(sectionKey, 'items_per_view', Number(v))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Autoplay interval (s)</Label>
                      <Input
                        type="number"
                        value={autoplayInterval}
                        onChange={e => handleUpdate(sectionKey, 'autoplay_interval', Number(e.target.value))}
                        className="h-8 text-xs"
                        min={2}
                        max={15}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={autoplay} onCheckedChange={(v) => handleUpdate(sectionKey, 'autoplay', v)} />
                      <Label className="text-xs">Autoplay</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={showNav} onCheckedChange={(v) => handleUpdate(sectionKey, 'show_navigation', v)} />
                      <Label className="text-xs">Arrows</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={showDots} onCheckedChange={(v) => handleUpdate(sectionKey, 'show_dots', v)} />
                      <Label className="text-xs">Dots</Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
