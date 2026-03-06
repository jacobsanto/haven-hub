import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useDestinationById, useCreateDestination, useUpdateDestination,
} from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { useExperiences } from '@/hooks/useExperiences';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const destinationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Lowercase with hyphens only'),
  country: z.string().min(1, 'Country is required').max(100),
  description: z.string().max(500).optional(),
  long_description: z.string().max(5000).optional(),
  hero_image_url: z.string().url().optional().or(z.literal('')),
  best_time_to_visit: z.string().max(200).optional(),
  climate: z.string().max(200).optional(),
  is_featured: z.boolean(),
  status: z.enum(['active', 'draft']),
});

type DestinationFormData = z.infer<typeof destinationSchema>;

interface DestinationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationId?: string;
}

export function DestinationFormDialog({ open, onOpenChange, destinationId }: DestinationFormDialogProps) {
  const isEditing = !!destinationId;
  const { data: destination } = useDestinationById(destinationId || '');
  const { data: properties } = useProperties();
  const { data: experiences } = useExperiences();
  const createDestination = useCreateDestination();
  const updateDestination = useUpdateDestination();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: '', slug: '', country: '', description: '', long_description: '',
      hero_image_url: '', best_time_to_visit: '', climate: '',
      is_featured: false, status: 'draft',
    },
  });

  useEffect(() => {
    if (destination && isEditing) {
      reset({
        name: destination.name, slug: destination.slug, country: destination.country,
        description: destination.description || '', long_description: destination.long_description || '',
        hero_image_url: destination.hero_image_url || '',
        best_time_to_visit: destination.best_time_to_visit || '', climate: destination.climate || '',
        is_featured: destination.is_featured, status: destination.status,
      });
    } else if (!isEditing) {
      reset({
        name: '', slug: '', country: '', description: '', long_description: '',
        hero_image_url: '', best_time_to_visit: '', climate: '',
        is_featured: false, status: 'draft',
      });
    }
  }, [destination, isEditing, reset]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const onSubmit = async (data: DestinationFormData) => {
    try {
      if (isEditing && destinationId) {
        await updateDestination.mutateAsync({
          id: destinationId, name: data.name, slug: data.slug, country: data.country,
          is_featured: data.is_featured, status: data.status,
          hero_image_url: data.hero_image_url || null, description: data.description || null,
          long_description: data.long_description || null,
          best_time_to_visit: data.best_time_to_visit || null, climate: data.climate || null,
        });
        toast.success('Destination updated');
      } else {
        await createDestination.mutateAsync({
          name: data.name, slug: data.slug, country: data.country,
          is_featured: data.is_featured, status: data.status,
          hero_image_url: data.hero_image_url || null, description: data.description || null,
          long_description: data.long_description || null,
          best_time_to_visit: data.best_time_to_visit || null, climate: data.climate || null,
          gallery: [], highlights: [], latitude: null, longitude: null, featured_sort_order: 0,
        });
        toast.success('Destination created');
      }
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? 'Failed to update' : 'Failed to create');
    }
  };

  const name = watch('name');
  const linkedProperties = properties?.filter((p: any) => p.destination_id === destinationId) || [];
  const linkedExperiences = experiences?.filter((e: any) => e.destination_id === destinationId) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Destination' : 'Add Destination'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="identity">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="linked" disabled={!isEditing}>Linked</TabsTrigger>
            </TabsList>

            {/* TAB 1 — IDENTITY */}
            <TabsContent value="identity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="e.g., Santorini" {...register('name')}
                    onChange={(e) => { register('name').onChange(e); if (!isEditing) setValue('slug', generateSlug(e.target.value)); }} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input placeholder="e.g., santorini" {...register('slug')} />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input placeholder="e.g., Greece" {...register('country')} />
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={watch('status')} onValueChange={(v: 'active' | 'draft') => setValue('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label className="cursor-pointer">Featured</Label>
                  <Switch checked={watch('is_featured')} onCheckedChange={(c) => setValue('is_featured', c)} />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2 — CONTENT */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Short Summary</Label>
                <Textarea placeholder="Brief description for cards..." rows={2} {...register('description')} />
              </div>
              <div className="space-y-2">
                <Label>Long Editorial Description</Label>
                <Textarea placeholder="Detailed description for the destination page..." rows={5} {...register('long_description')} />
              </div>
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <ImageFieldWithAI
                  value={watch('hero_image_url') || undefined}
                  onUpload={(url) => setValue('hero_image_url', url)}
                  onRemove={() => setValue('hero_image_url', '')}
                  storagePath="destinations"
                  label="Upload Hero Image"
                  generatePrompt={[
                    `A breathtaking photograph of ${name || 'a destination'}${watch('country') ? `, ${watch('country')}` : ''}.`,
                    watch('description') ? `The scene shows: ${watch('description')}.` : '',
                  ].filter(Boolean).join(' ')}
                  generateContext={{ name: name || undefined, country: watch('country') || undefined }}
                  promptLabel="Generate hero"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Best Time to Visit</Label>
                  <Input placeholder="e.g., April to October" {...register('best_time_to_visit')} />
                </div>
                <div className="space-y-2">
                  <Label>Climate</Label>
                  <Input placeholder="e.g., Mediterranean" {...register('climate')} />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3 — SEO */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                <p className="text-sm">SEO fields (meta title, meta description, primary keyword) will be available once the SEO module is enabled.</p>
                <p className="text-xs mt-2">Currently, the destination name and description are used for page metadata.</p>
              </div>
            </TabsContent>

            {/* TAB 4 — LINKED ASSETS (read-only) */}
            <TabsContent value="linked" className="space-y-4 mt-4">
              {!isEditing ? (
                <p className="text-sm text-muted-foreground">Save the destination first to see linked assets.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Properties ({linkedProperties.length})</h4>
                    {linkedProperties.length > 0 ? (
                      <div className="space-y-1">
                        {linkedProperties.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/50">
                            <span>{p.name}</span>
                            <Link to={`/admin/properties/${p.id}`} className="text-primary hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No properties linked to this destination.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Experiences ({linkedExperiences.length})</h4>
                    {linkedExperiences.length > 0 ? (
                      <div className="space-y-1">
                        {linkedExperiences.map((e: any) => (
                          <div key={e.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/50">
                            <span>{e.name}</span>
                            <Link to={`/admin/experiences`} className="text-primary hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No experiences linked.</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? 'Updating…' : 'Creating…'}</> : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
