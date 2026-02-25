import { useMemo, useState } from 'react';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIContentGenerator } from '@/components/admin/AIContentGenerator';
import { useDestinations } from '@/hooks/useDestinations';
import { useExperiences } from '@/hooks/useExperiences';
import { useAdminProperties } from '@/hooks/useProperties';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { ContentType, GeneratedContent, BlogContent, DestinationContent, ExperienceContent, PropertyContent } from '@/hooks/useAIContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const ENTITY_TYPES = [
  { value: 'destinations', label: 'Destinations', contentType: 'destination' as ContentType },
  { value: 'experiences', label: 'Experiences', contentType: 'experience' as ContentType },
  { value: 'properties', label: 'Properties', contentType: 'property' as ContentType },
  { value: 'blog', label: 'Blog Posts', contentType: 'blog' as ContentType },
];

const STEPS = [
  { num: 1, label: 'Entity' },
  { num: 2, label: 'Select Item' },
  { num: 3, label: 'Generate' },
];

export default function AdminAIContent() {
  const { data: destinations } = useDestinations();
  const { data: experiences } = useExperiences();
  const { data: properties } = useAdminProperties();
  const { data: posts } = useBlogPosts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const currentStep = selectedEntity ? 2 : 1;

  const entityType = ENTITY_TYPES.find(e => e.value === selectedEntity);

  const items = useMemo(() => {
    switch (selectedEntity) {
      case 'destinations':
        return (destinations || []).map(d => ({ id: d.id, name: d.name, existingData: { country: d.country, description: d.description, highlights: d.highlights } }));
      case 'experiences':
        return (experiences || []).map(e => ({ id: e.id, name: e.name, existingData: { category: e.category, description: e.description, duration: e.duration, price_from: e.price_from } }));
      case 'properties':
        return (properties || []).map(p => ({ id: p.id, name: p.name, existingData: { city: p.city, country: p.country, bedrooms: p.bedrooms, bathrooms: p.bathrooms, short_description: p.short_description, description: p.description, amenities: p.amenities } }));
      case 'blog':
        return (posts || []).map(p => ({ id: p.id, name: p.title, existingData: { title: p.title, excerpt: p.excerpt, tags: p.tags } }));
      default:
        return [];
    }
  }, [selectedEntity, destinations, experiences, properties, posts]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const handleApply = async (itemId: string, content: GeneratedContent, entityName?: string) => {
    try {
      let error;

      // CREATE NEW flow
      if (itemId === '__new__') {
        switch (selectedEntity) {
          case 'destinations': {
            const c = content as DestinationContent;
            const name = entityName || 'New Destination';
            ({ error } = await supabase.from('destinations').insert({
              name, slug: generateSlug(name), country: 'TBD', status: 'draft' as any,
              description: c.description, long_description: c.long_description,
              highlights: c.highlights, best_time_to_visit: c.best_time_to_visit, climate: c.climate,
            }));
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            break;
          }
          case 'experiences': {
            const c = content as ExperienceContent;
            const name = entityName || 'New Experience';
            ({ error } = await supabase.from('experiences').insert({
              name, slug: generateSlug(name), category: 'Cultural', status: 'draft' as any,
              description: c.description, long_description: c.long_description, includes: c.includes,
            }));
            queryClient.invalidateQueries({ queryKey: ['experiences'] });
            break;
          }
          case 'properties': {
            const c = content as PropertyContent;
            const name = entityName || 'New Property';
            ({ error } = await supabase.from('properties').insert({
              name, slug: generateSlug(name), city: 'TBD', country: 'TBD', status: 'draft' as any,
              price_per_night: 0, bedrooms: 1, bathrooms: 1, max_guests: 2,
              short_description: c.short_description, description: c.description,
              highlights: c.highlights, neighborhood_description: c.neighborhood_description,
            }));
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
            break;
          }
          case 'blog': {
            const c = content as BlogContent;
            const title = entityName || c.title;
            ({ error } = await supabase.from('blog_posts').insert({
              title, slug: generateSlug(title), status: 'draft' as any,
              excerpt: c.excerpt, content: c.content, tags: c.tags,
            }));
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
            break;
          }
        }
        if (error) throw error;
        toast({ title: 'Entity created', description: 'New draft entity has been created successfully.' });
        return;
      }

      // UPDATE existing flow
      switch (selectedEntity) {
        case 'destinations': {
          const c = content as DestinationContent;
          ({ error } = await supabase.from('destinations').update({ description: c.description, long_description: c.long_description, highlights: c.highlights, best_time_to_visit: c.best_time_to_visit, climate: c.climate }).eq('id', itemId));
          queryClient.invalidateQueries({ queryKey: ['destinations'] });
          break;
        }
        case 'experiences': {
          const c = content as ExperienceContent;
          ({ error } = await supabase.from('experiences').update({ description: c.description, long_description: c.long_description, includes: c.includes }).eq('id', itemId));
          queryClient.invalidateQueries({ queryKey: ['experiences'] });
          break;
        }
        case 'properties': {
          const c = content as PropertyContent;
          ({ error } = await supabase.from('properties').update({ short_description: c.short_description, description: c.description, highlights: c.highlights, neighborhood_description: c.neighborhood_description }).eq('id', itemId));
          queryClient.invalidateQueries({ queryKey: ['properties'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
          break;
        }
        case 'blog': {
          const c = content as BlogContent;
          ({ error } = await supabase.from('blog_posts').update({ title: c.title, excerpt: c.excerpt, content: c.content, tags: c.tags }).eq('id', itemId));
          queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
          break;
        }
      }
      if (error) throw error;
      toast({ title: 'Content applied', description: 'Changes saved successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-medium flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Content Generator
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate and optimize content in a structured workflow.
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  currentStep >= step.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.num ? <Check className="h-3 w-3" /> : <span>{step.num}</span>}
                  {step.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select entity type */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Step 1 — Select Entity Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ENTITY_TYPES.map(et => (
                  <Button key={et.value} variant={selectedEntity === et.value ? 'default' : 'outline'} className="h-auto py-3 flex flex-col gap-1"
                    onClick={() => setSelectedEntity(et.value)}>
                    <span className="font-medium text-sm">{et.label}</span>
                    <span className="text-xs opacity-70">
                      {et.value === 'destinations' && `${destinations?.length || 0} items`}
                      {et.value === 'experiences' && `${experiences?.length || 0} items`}
                      {et.value === 'properties' && `${properties?.length || 0} items`}
                      {et.value === 'blog' && `${posts?.length || 0} items`}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Steps 2-5: Generate + Review + Apply (handled by AIContentGenerator) */}
          {selectedEntity && entityType && (
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Step 2–5 — Select, Generate, Review & Apply</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedEntity('')}>
                    Change Entity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AIContentGenerator
                  contentType={entityType.contentType}
                  items={items}
                  onApplyContent={handleApply}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
