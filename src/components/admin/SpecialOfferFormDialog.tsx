import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import { useCreateSpecialOffer, useUpdateSpecialOffer, SpecialOffer, SpecialOfferFormData } from '@/hooks/useAdminPromotions';
import { useAdminProperties } from '@/hooks/useProperties';
import { toast } from 'sonner';

const formSchema = z.object({
  property_id: z.string().min(1, 'Property is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  discount_percent: z.coerce.number().min(1).max(100),
  valid_from: z.string(),
  valid_until: z.string(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface SpecialOfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: SpecialOffer | null;
}

export function SpecialOfferFormDialog({ open, onOpenChange, offer }: SpecialOfferFormDialogProps) {
  const createOffer = useCreateSpecialOffer();
  const updateOffer = useUpdateSpecialOffer();
  const { data: properties } = useAdminProperties();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_id: '',
      title: '',
      description: '',
      discount_percent: 10,
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      is_active: true,
    },
  });

  useEffect(() => {
    if (offer) {
      form.reset({
        property_id: offer.property_id,
        title: offer.title,
        description: offer.description || '',
        discount_percent: offer.discount_percent,
        valid_from: offer.valid_from,
        valid_until: offer.valid_until,
        is_active: offer.is_active,
      });
    } else {
      form.reset({
        property_id: '',
        title: '',
        description: '',
        discount_percent: 10,
        valid_from: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        is_active: true,
      });
    }
  }, [offer, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const formData: SpecialOfferFormData = {
        property_id: values.property_id,
        title: values.title,
        discount_percent: values.discount_percent,
        valid_from: values.valid_from,
        valid_until: values.valid_until,
        is_active: values.is_active,
        description: values.description || null,
      };
      
      if (offer) {
        await updateOffer.mutateAsync({ id: offer.id, ...formData });
        toast.success('Offer updated');
      } else {
        await createOffer.mutateAsync(formData);
        toast.success('Offer created');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(offer ? 'Failed to update offer' : 'Failed to create offer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{offer ? 'Edit Special Offer' : 'Create Special Offer'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Early Bird Special" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Book early and save..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOffer.isPending || updateOffer.isPending}>
                {offer ? 'Update' : 'Create'} Offer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
