import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

export function AddonFormDialog({ open, onOpenChange, addon }: AddonFormDialogProps) {
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const { data: properties } = useAdminProperties();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'service',
      price: 0,
      price_type: 'fixed',
      property_id: null,
      max_quantity: null,
      requires_lead_time_hours: null,
      image_url: null,
      is_active: true,
      sort_order: 0,
    },
  });

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
      });
    } else {
      form.reset({
        name: '',
        description: '',
        category: 'service',
        price: 0,
        price_type: 'fixed',
        property_id: null,
        max_quantity: null,
        requires_lead_time_hours: null,
        image_url: null,
        is_active: true,
        sort_order: 0,
      });
    }
  }, [addon, form]);

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
      };
      
      if (addon) {
        await updateAddon.mutateAsync({
          id: addon.id,
          ...formData,
        });
        toast.success('Add-on updated successfully');
      } else {
        await createAddon.mutateAsync(formData);
        toast.success('Add-on created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(addon ? 'Failed to update add-on' : 'Failed to create add-on');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Airport Transfer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ADDON_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the add-on..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select price type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'global' ? null : value)}
                      value={field.value || 'global'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All properties (global)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">All Properties (Global)</SelectItem>
                        {properties?.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {prop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="No limit"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requires_lead_time_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time (Hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 24"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this add-on available for booking
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
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
