import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateAddon, useUpdateAddon, AddonCatalog, AddonFormData } from '@/hooks/useAdminAddons';
import { useAdminProperties } from '@/hooks/useProperties';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  price_type: z.string().min(1, 'Price type is required'),
  property_id: z.string().optional().nullable(),
  max_quantity: z.coerce.number().optional().nullable(),
  requires_lead_time_hours: z.coerce.number().optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean(),
  sort_order: z.coerce.number().default(0),
  visibility: z.string().default('booking'),
  internal_cost: z.coerce.number().optional().nullable(),
  confirmation_type: z.string().default('auto'),
  availability_mode: z.string().default('unlimited'),
  daily_capacity: z.coerce.number().optional().nullable(),
  season_start: z.string().optional().nullable(),
  season_end: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: AddonCatalog | null;
}

const ADDON_CATEGORIES = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'experience', label: 'Experience' },
  { value: 'service', label: 'Service' },
  { value: 'package', label: 'Package' },
];

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'per_night', label: 'Per Night' },
  { value: 'per_person_per_night', label: 'Per Person Per Night' },
];

const defaults: FormValues = {
  name: '', description: '', category: 'service', price: 0, price_type: 'fixed',
  property_id: null, max_quantity: null, requires_lead_time_hours: null,
  image_url: null, is_active: true, sort_order: 0,
  visibility: 'booking', internal_cost: null, confirmation_type: 'auto',
  availability_mode: 'unlimited', daily_capacity: null, season_start: null, season_end: null,
};

export function AddonFormDialog({ open, onOpenChange, addon }: AddonFormDialogProps) {
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const { data: properties } = useAdminProperties();

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaults });

  useEffect(() => {
    if (addon) {
      form.reset({
        name: addon.name,
        description: addon.description || '',
        category: addon.category,
        price: addon.price,
        price_type: addon.price_type,
        property_id: addon.property_id || null,
        max_quantity: addon.max_quantity || null,
        requires_lead_time_hours: addon.requires_lead_time_hours || null,
        image_url: addon.image_url || null,
        is_active: addon.is_active,
        sort_order: addon.sort_order,
        visibility: addon.visibility || 'booking',
        internal_cost: addon.internal_cost ?? null,
        confirmation_type: addon.confirmation_type || 'auto',
        availability_mode: addon.availability_mode || 'unlimited',
        daily_capacity: addon.daily_capacity ?? null,
        season_start: addon.season_start || null,
        season_end: addon.season_end || null,
      });
    } else {
      form.reset(defaults);
    }
  }, [addon, form]);

  const watchPrice = form.watch('price');
  const watchCost = form.watch('internal_cost');
  const calculatedMargin = watchCost != null && watchPrice > 0
    ? Math.round(((watchPrice - watchCost) / watchPrice) * 100)
    : null;

  const onSubmit = async (values: FormValues) => {
    try {
      const formData: AddonFormData = {
        name: values.name,
        category: values.category,
        price: values.price,
        price_type: values.price_type,
        is_active: values.is_active,
        sort_order: values.sort_order,
        property_id: values.property_id || null,
        description: values.description || null,
        max_quantity: values.max_quantity || null,
        requires_lead_time_hours: values.requires_lead_time_hours || null,
        image_url: values.image_url || null,
        visibility: values.visibility,
        internal_cost: values.internal_cost ?? null,
        confirmation_type: values.confirmation_type,
        availability_mode: values.availability_mode,
        daily_capacity: values.daily_capacity ?? null,
        season_start: values.season_start || null,
        season_end: values.season_end || null,
      };

      if (addon) {
        await updateAddon.mutateAsync({ id: addon.id, ...formData });
        toast.success('Add-on updated');
      } else {
        await createAddon.mutateAsync(formData);
        toast.success('Add-on created');
      }
      onOpenChange(false);
    } catch {
      toast.error(addon ? 'Failed to update' : 'Failed to create');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{addon ? 'Edit Add-on' : 'Create Add-on'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Airport Transfer" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ADDON_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Brief description…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Pricing & Cost */}
            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Pricing & Cost</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (€)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PRICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="internal_cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Cost (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Optional"
                      {...field} value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                  {calculatedMargin != null && (
                    <p className="text-xs text-muted-foreground">Margin: {calculatedMargin}%</p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Visibility & Confirmation */}
            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Visibility & Confirmation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="visibility" render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="booking">Booking Page</SelectItem>
                      <SelectItem value="post_booking">Post-Booking</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirmation_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="auto">Auto-confirm</SelectItem>
                      <SelectItem value="manual">Manual Approval</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Availability & Capacity */}
            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Availability</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="availability_mode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="limited">Limited Daily Capacity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {form.watch('availability_mode') === 'limited' && (
                <FormField control={form.control} name="daily_capacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10"
                        {...field} value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="max_quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Qty per Booking</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="No limit"
                      {...field} value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Seasonality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="season_start" render={({ field }) => (
                <FormItem>
                  <FormLabel>Season Start (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value || null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="season_end" render={({ field }) => (
                <FormItem>
                  <FormLabel>Season End (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value || null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Property & Lead Time */}
            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Assignment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="property_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={v => field.onChange(v === 'global' ? null : v)} value={field.value || 'global'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="All Properties" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="global">All Properties (Global)</SelectItem>
                      {properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="requires_lead_time_hours" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Time (Hours)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 24"
                      {...field} value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Image */}
            <FormField control={form.control} name="image_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <ImageFieldWithAI
                    value={field.value || undefined}
                    onUpload={url => form.setValue('image_url', url)}
                    onRemove={() => form.setValue('image_url', null)}
                    storagePath="addons"
                    preset={{ maxWidth: 800, maxHeight: 600, quality: 0.82, format: 'webp' }}
                    label="Upload Add-on Image"
                    generatePrompt={[
                      `High quality photo of a luxury ${form.watch('category') || 'service'} add-on: ${form.watch('name') || 'travel add-on'}.`,
                      form.watch('description') ? `Details: ${form.watch('description')}.` : '',
                      'Professional hospitality photography, inviting and aspirational.',
                    ].filter(Boolean).join(' ')}
                    generateContext={{
                      name: form.watch('name') || undefined,
                      category: form.watch('category') || undefined,
                      description: form.watch('description') || undefined,
                    }}
                    promptLabel="Generate add-on image"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Active toggle */}
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Active</FormLabel>
                  <p className="text-sm text-muted-foreground">Make this add-on available</p>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createAddon.isPending || updateAddon.isPending}>
                {addon ? 'Update' : 'Create'} Add-on
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
