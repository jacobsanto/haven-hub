import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
  useExperienceById, useCreateExperience, useUpdateExperience,
} from '@/hooks/useExperiences';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const categories = ['Culinary', 'Adventure', 'Cultural', 'Wellness'];
const priceTypes = ['per person', 'per group', 'custom'];

const experienceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Lowercase with hyphens only'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(500).optional(),
  long_description: z.string().max(5000).optional(),
  hero_image_url: z.string().url().optional().or(z.literal('')),
  duration: z.string().max(100).optional(),
  price_from: z.number().min(0).optional(),
  price_type: z.string().optional(),
  destination_id: z.string().optional().or(z.literal('')),
  is_featured: z.boolean(),
  status: z.enum(['active', 'draft']),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId?: string;
}

export function ExperienceFormDialog({ open, onOpenChange, experienceId }: ExperienceFormDialogProps) {
  const isEditing = !!experienceId;
  const { data: experience } = useExperienceById(experienceId || '');
  const { data: destinations } = useActiveDestinations();
  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      name: '', slug: '', category: 'Cultural', description: '', long_description: '',
      hero_image_url: '', duration: '', price_type: 'per person', destination_id: '',
      is_featured: false, status: 'draft',
    },
  });

  useEffect(() => {
    if (experience && isEditing) {
      reset({
        name: experience.name, slug: experience.slug, category: experience.category,
        description: experience.description || '', long_description: experience.long_description || '',
        hero_image_url: experience.hero_image_url || '', duration: experience.duration || '',
        price_from: experience.price_from || undefined, price_type: experience.price_type || 'per person',
        destination_id: experience.destination_id || '', is_featured: experience.is_featured, status: experience.status,
      });
    } else if (!isEditing) {
      reset({
        name: '', slug: '', category: 'Cultural', description: '', long_description: '',
        hero_image_url: '', duration: '', price_type: 'per person', destination_id: '',
        is_featured: false, status: 'draft',
      });
    }
  }, [experience, isEditing, reset]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const payload = {
        name: data.name, slug: data.slug, category: data.category,
        is_featured: data.is_featured, status: data.status as 'active' | 'draft',
        hero_image_url: data.hero_image_url || null, description: data.description || null,
        long_description: data.long_description || null, duration: data.duration || null,
        price_from: data.price_from || null, price_type: data.price_type || null,
        destination_id: data.destination_id || null, gallery: [], includes: [],
      };
      if (isEditing && experienceId) {
        await updateExperience.mutateAsync({ id: experienceId, ...payload });
        toast.success('Experience updated');
      } else {
        await createExperience.mutateAsync(payload);
        toast.success('Experience created');
      }
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? 'Failed to update' : 'Failed to create');
    }
  };

  const priceFrom = watch('price_from');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="identity">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="logistics">Logistics</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="performance" disabled={!isEditing}>Perf.</TabsTrigger>
            </TabsList>

            {/* TAB 1 — IDENTITY */}
            <TabsContent value="identity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="e.g., Wine Tasting Tour" {...register('name')}
                    onChange={(e) => { register('name').onChange(e); if (!isEditing) setValue('slug', generateSlug(e.target.value)); }} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input placeholder="e.g., wine-tasting-tour" {...register('slug')} />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea placeholder="Brief description for cards…" rows={2} {...register('description')} />
              </div>
              <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea placeholder="Detailed description…" rows={4} {...register('long_description')} />
              </div>
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <ImageFieldWithAI
                  value={watch('hero_image_url') || undefined}
                  onUpload={(url) => setValue('hero_image_url', url)}
                  onRemove={() => setValue('hero_image_url', '')}
                  storagePath="experiences"
                  label="Upload Hero Image"
                  generatePrompt={`A stunning photograph of a ${watch('category')} experience: ${watch('name') || 'travel experience'}.`}
                  generateContext={{ name: watch('name') || undefined, category: watch('category') || undefined }}
                  promptLabel="Generate hero"
                />
              </div>
            </TabsContent>

            {/* TAB 2 — PRICING */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Selling Price (€)</Label>
                  <Input type="number" min={0} placeholder="e.g., 150" {...register('price_from', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Type</Label>
                  <Select value={watch('price_type') || 'per person'} onValueChange={(v) => setValue('price_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{priceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                <p>Internal cost and margin tracking will be available when the cost module is enabled.</p>
                {priceFrom ? <p className="mt-1">Current selling price: <strong>€{priceFrom}</strong></p> : null}
              </div>
            </TabsContent>

            {/* TAB 3 — LOGISTICS */}
            <TabsContent value="logistics" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input placeholder="e.g., Half day, 3 hours" {...register('duration')} />
              </div>
              <div className="space-y-2">
                <Label>Destination (Optional)</Label>
                <Select value={watch('destination_id') || ''} onValueChange={(v) => setValue('destination_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {destinations?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Capacity limits, supplier contact, and weather dependency will be available in a future update.
              </div>
            </TabsContent>

            {/* TAB 4 — VISIBILITY */}
            <TabsContent value="visibility" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={watch('status')} onValueChange={(v: 'active' | 'draft') => setValue('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label className="cursor-pointer">Featured</Label>
                  <Switch checked={watch('is_featured')} onCheckedChange={(c) => setValue('is_featured', c)} />
                </div>
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Booking-flow visibility, post-booking upsell, and seasonality windows will be configurable in a future update.
              </div>
            </TabsContent>

            {/* TAB 5 — PERFORMANCE */}
            <TabsContent value="performance" className="space-y-4 mt-4">
              {!isEditing ? (
                <p className="text-sm text-muted-foreground">Save the experience first to see performance data.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                    <p className="text-sm">Performance metrics (attach rate, revenue, refund rate) will be displayed here once analytics data is available.</p>
                    <Link to="/admin/analytics" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Open Analytics →
                    </Link>
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
