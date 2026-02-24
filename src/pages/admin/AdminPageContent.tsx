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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ContentPreview } from '@/components/admin/ContentPreview';
import { ImageUploadWithOptimizer } from '@/components/admin/ImageUploadWithOptimizer';
import { IMAGE_PRESETS } from '@/utils/image-optimizer';
import { Save, RotateCcw, ChevronDown, FileText, Image, Eye, EyeOff } from 'lucide-react';

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
      content_type: f.type === 'textarea' || f.type === 'richtext' ? 'richtext' : f.type === 'image' ? 'image' : 'text',
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
    </div>
  );
}
