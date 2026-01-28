import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Info, Building2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCreateCoupon, useUpdateCoupon, CouponPromo, CouponFormData } from '@/hooks/useAdminPromotions';
import { useProperties } from '@/hooks/useProperties';
import { toast } from 'sonner';

const formSchema = z.object({
  code: z.string().min(1, 'Code is required').toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discount_type: z.string(),
  discount_value: z.coerce.number().min(0),
  min_nights: z.coerce.number().optional().nullable(),
  min_booking_value: z.coerce.number().optional().nullable(),
  max_uses: z.coerce.number().optional().nullable(),
  valid_from: z.date(),
  valid_until: z.date(),
  stackable: z.boolean(),
  is_active: z.boolean(),
  applicable_properties: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: CouponPromo | null;
}

export function CouponFormDialog({ open, onOpenChange, coupon }: CouponFormDialogProps) {
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const { data: properties } = useProperties();
  const [propertySearch, setPropertySearch] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_nights: null,
      min_booking_value: null,
      max_uses: null,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stackable: false,
      is_active: true,
      applicable_properties: [],
    },
  });

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_nights: coupon.min_nights,
        min_booking_value: coupon.min_booking_value,
        max_uses: coupon.max_uses,
        valid_from: new Date(coupon.valid_from),
        valid_until: new Date(coupon.valid_until),
        stackable: coupon.stackable,
        is_active: coupon.is_active,
        applicable_properties: coupon.applicable_properties || [],
      });
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_nights: null,
        min_booking_value: null,
        max_uses: null,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stackable: false,
        is_active: true,
        applicable_properties: [],
      });
    }
  }, [coupon, form, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const formData: CouponFormData = {
        code: values.code.toUpperCase(),
        name: values.name,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        valid_from: format(values.valid_from, 'yyyy-MM-dd'),
        valid_until: format(values.valid_until, 'yyyy-MM-dd'),
        stackable: values.stackable,
        is_active: values.is_active,
        description: values.description || null,
        min_nights: values.min_nights || null,
        min_booking_value: values.min_booking_value || null,
        max_uses: values.max_uses || null,
        applicable_properties: values.applicable_properties.length > 0 ? values.applicable_properties : null,
      };
      
      if (coupon) {
        await updateCoupon.mutateAsync({ id: coupon.id, ...formData });
        toast.success('Coupon updated');
      } else {
        await createCoupon.mutateAsync(formData);
        toast.success('Coupon created');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(coupon ? 'Failed to update coupon' : 'Failed to create coupon');
    }
  };

  const selectedProperties = form.watch('applicable_properties');
  const discountType = form.watch('discount_type');

  const filteredProperties = properties?.filter(p => 
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.city.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const toggleProperty = (propertyId: string) => {
    const current = form.getValues('applicable_properties');
    if (current.includes(propertyId)) {
      form.setValue('applicable_properties', current.filter(id => id !== propertyId));
    } else {
      form.setValue('applicable_properties', [...current, propertyId]);
    }
  };

  const removeProperty = (propertyId: string) => {
    const current = form.getValues('applicable_properties');
    form.setValue('applicable_properties', current.filter(id => id !== propertyId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          <DialogDescription>
            Configure discount codes with usage limits, stacking rules, and property restrictions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="SUMMER20" 
                        {...field} 
                        className="uppercase font-mono"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Customers enter this code at checkout
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Sale 2024" {...field} />
                    </FormControl>
                    <FormDescription>
                      For internal reference only
                    </FormDescription>
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Internal notes about this promotion..." 
                      {...field} 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                        <SelectItem value="free_addon">Free Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {discountType === 'percentage' ? 'Discount Percentage' : 
                       discountType === 'fixed' ? 'Discount Amount (€)' : 'Add-on ID'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        min={0}
                        max={discountType === 'percentage' ? 100 : undefined}
                      />
                    </FormControl>
                    {discountType === 'percentage' && (
                      <FormDescription>Maximum 100%</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Settings */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="restrictions">
                <AccordionTrigger className="text-sm font-medium">
                  Usage Restrictions
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="min_nights"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Minimum Nights
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Coupon only applies to bookings with at least this many nights
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="No minimum"
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
                      name="min_booking_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Minimum Value (€)
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Coupon only applies to bookings worth at least this amount
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="No minimum"
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
                      name="max_uses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Usage Limit
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Maximum number of times this coupon can be redeemed
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Unlimited"
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
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="properties">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property Restrictions
                    {selectedProperties.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedProperties.length} selected
                      </Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Leave empty to apply to all properties, or select specific properties.
                  </p>

                  {/* Selected Properties */}
                  {selectedProperties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProperties.map(propertyId => {
                        const property = properties?.find(p => p.id === propertyId);
                        return (
                          <Badge key={propertyId} variant="secondary" className="gap-1">
                            {property?.name || 'Unknown'}
                            <button
                              type="button"
                              onClick={() => removeProperty(propertyId)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Property Search */}
                  <Input
                    placeholder="Search properties..."
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                  />

                  {/* Property List */}
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {filteredProperties?.map(property => (
                      <label
                        key={property.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedProperties.includes(property.id)}
                          onCheckedChange={() => toggleProperty(property.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{property.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {property.city}, {property.country}
                          </p>
                        </div>
                      </label>
                    ))}
                    {filteredProperties?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No properties found
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 p-4 bg-muted/50 rounded-lg">
              <FormField
                control={form.control}
                name="stackable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="!mt-0">Stackable</FormLabel>
                      <FormDescription className="text-xs">
                        Can be combined with other coupons
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="!mt-0">Active</FormLabel>
                      <FormDescription className="text-xs">
                        Coupon is available for use
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCoupon.isPending || updateCoupon.isPending}>
                {coupon ? 'Update' : 'Create'} Coupon
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
