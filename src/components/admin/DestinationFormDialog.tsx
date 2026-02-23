import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDestinationById,
  useCreateDestination,
  useUpdateDestination,
} from '@/hooks/useDestinations';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import { toast } from 'sonner';

const destinationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
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

export function DestinationFormDialog({
  open,
  onOpenChange,
  destinationId,
}: DestinationFormDialogProps) {
  const isEditing = !!destinationId;
  const { data: destination } = useDestinationById(destinationId || '');
  const createDestination = useCreateDestination();
  const updateDestination = useUpdateDestination();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: '',
      slug: '',
      country: '',
      description: '',
      long_description: '',
      hero_image_url: '',
      best_time_to_visit: '',
      climate: '',
      is_featured: false,
      status: 'draft',
    },
  });

  useEffect(() => {
    if (destination && isEditing) {
      reset({
        name: destination.name,
        slug: destination.slug,
        country: destination.country,
        description: destination.description || '',
        long_description: destination.long_description || '',
        hero_image_url: destination.hero_image_url || '',
        best_time_to_visit: destination.best_time_to_visit || '',
        climate: destination.climate || '',
        is_featured: destination.is_featured,
        status: destination.status,
      });
    } else if (!isEditing) {
      reset({
        name: '',
        slug: '',
        country: '',
        description: '',
        long_description: '',
        hero_image_url: '',
        best_time_to_visit: '',
        climate: '',
        is_featured: false,
        status: 'draft',
      });
    }
  }, [destination, isEditing, reset]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const onSubmit = async (data: DestinationFormData) => {
    try {
      if (isEditing && destinationId) {
        await updateDestination.mutateAsync({
          id: destinationId,
          name: data.name,
          slug: data.slug,
          country: data.country,
          is_featured: data.is_featured,
          status: data.status,
          hero_image_url: data.hero_image_url || null,
          description: data.description || null,
          long_description: data.long_description || null,
          best_time_to_visit: data.best_time_to_visit || null,
          climate: data.climate || null,
        });
        toast.success('Destination updated successfully');
      } else {
        await createDestination.mutateAsync({
          name: data.name,
          slug: data.slug,
          country: data.country,
          is_featured: data.is_featured,
          status: data.status,
          hero_image_url: data.hero_image_url || null,
          description: data.description || null,
          long_description: data.long_description || null,
          best_time_to_visit: data.best_time_to_visit || null,
          climate: data.climate || null,
          gallery: [],
          highlights: [],
          latitude: null,
          longitude: null,
        });
        toast.success('Destination created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update destination' : 'Failed to create destination');
    }
  };

  const name = watch('name');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Destination' : 'Add Destination'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Santorini"
                {...register('name')}
                onChange={(e) => {
                  register('name').onChange(e);
                  if (!isEditing) {
                    setValue('slug', generateSlug(e.target.value));
                  }
                }}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., santorini"
                {...register('slug')}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              placeholder="e.g., Greece"
              {...register('country')}
            />
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              placeholder="A brief description for cards and previews..."
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description">Full Description</Label>
            <Textarea
              id="long_description"
              placeholder="Detailed description for the destination page..."
              rows={4}
              {...register('long_description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Hero Image</Label>
            <ImageFieldWithAI
              value={watch('hero_image_url') || undefined}
              onUpload={(url) => setValue('hero_image_url', url)}
              onRemove={() => setValue('hero_image_url', '')}
              storagePath="destinations"
              label="Upload Hero Image"
              generatePrompt={`Beautiful high-resolution travel hero photograph of ${name || 'a destination'}, ${watch('country') || 'scenic landscape'}. Ultra high resolution, cinematic lighting, editorial travel photography style.`}
              promptLabel="Generate destination hero"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="best_time_to_visit">Best Time to Visit</Label>
              <Input
                id="best_time_to_visit"
                placeholder="e.g., April to October"
                {...register('best_time_to_visit')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="climate">Climate</Label>
              <Input
                id="climate"
                placeholder="e.g., Mediterranean"
                {...register('climate')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: 'active' | 'draft') => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="is_featured" className="cursor-pointer">
                Featured Destination
              </Label>
              <Switch
                id="is_featured"
                checked={watch('is_featured')}
                onCheckedChange={(checked) => setValue('is_featured', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Destination' : 'Create Destination'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
