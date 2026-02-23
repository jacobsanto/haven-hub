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
  useExperienceById,
  useCreateExperience,
  useUpdateExperience,
} from '@/hooks/useExperiences';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import { toast } from 'sonner';

const categories = ['Culinary', 'Adventure', 'Cultural', 'Wellness'];
const priceTypes = ['per person', 'per group', 'custom'];

const experienceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
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

export function ExperienceFormDialog({
  open,
  onOpenChange,
  experienceId,
}: ExperienceFormDialogProps) {
  const isEditing = !!experienceId;
  const { data: experience } = useExperienceById(experienceId || '');
  const { data: destinations } = useActiveDestinations();
  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      name: '',
      slug: '',
      category: 'Cultural',
      description: '',
      long_description: '',
      hero_image_url: '',
      duration: '',
      price_type: 'per person',
      destination_id: '',
      is_featured: false,
      status: 'draft',
    },
  });

  useEffect(() => {
    if (experience && isEditing) {
      reset({
        name: experience.name,
        slug: experience.slug,
        category: experience.category,
        description: experience.description || '',
        long_description: experience.long_description || '',
        hero_image_url: experience.hero_image_url || '',
        duration: experience.duration || '',
        price_from: experience.price_from || undefined,
        price_type: experience.price_type || 'per person',
        destination_id: experience.destination_id || '',
        is_featured: experience.is_featured,
        status: experience.status,
      });
    } else if (!isEditing) {
      reset({
        name: '',
        slug: '',
        category: 'Cultural',
        description: '',
        long_description: '',
        hero_image_url: '',
        duration: '',
        price_type: 'per person',
        destination_id: '',
        is_featured: false,
        status: 'draft',
      });
    }
  }, [experience, isEditing, reset]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        category: data.category,
        is_featured: data.is_featured,
        status: data.status as 'active' | 'draft',
        hero_image_url: data.hero_image_url || null,
        description: data.description || null,
        long_description: data.long_description || null,
        duration: data.duration || null,
        price_from: data.price_from || null,
        price_type: data.price_type || null,
        destination_id: data.destination_id || null,
        gallery: [],
        includes: [],
      };

      if (isEditing && experienceId) {
        await updateExperience.mutateAsync({ id: experienceId, ...payload });
        toast.success('Experience updated successfully');
      } else {
        await createExperience.mutateAsync(payload);
        toast.success('Experience created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update experience' : 'Failed to create experience');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Experience' : 'Add Experience'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Wine Tasting Tour"
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
                placeholder="e.g., wine-tasting-tour"
                {...register('slug')}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination_id">Destination (Optional)</Label>
              <Select
                value={watch('destination_id') || ''}
                onValueChange={(value) => setValue('destination_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {destinations?.map((dest) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      {dest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              placeholder="Detailed description for the experience page..."
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
              storagePath="experiences"
              label="Upload Hero Image"
              generatePrompt={[
                `A stunning photograph of a ${watch('category') || 'luxury'} experience: ${watch('name') || 'travel experience'}.`,
                watch('description') ? `Details: ${watch('description')}.` : '',
                watch('duration') ? `Duration: ${watch('duration')}.` : '',
                'Show the activity in action within its authentic setting.',
              ].filter(Boolean).join(' ')}
              generateContext={{
                name: watch('name') || undefined,
                category: watch('category') || undefined,
                description: watch('description') || undefined,
                duration: watch('duration') || undefined,
              }}
              promptLabel="Generate experience hero"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., Half day"
                {...register('duration')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_from">Price From (€)</Label>
              <Input
                id="price_from"
                type="number"
                min={0}
                placeholder="e.g., 150"
                {...register('price_from', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_type">Price Type</Label>
              <Select
                value={watch('price_type') || 'per person'}
                onValueChange={(value) => setValue('price_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Featured Experience
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
                isEditing ? 'Update Experience' : 'Create Experience'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
