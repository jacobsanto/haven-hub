import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookingGuest } from '@/types/booking-engine';
import { COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Minus, Plus, Users } from 'lucide-react';

const guestFormSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Please select a country'),
  adults: z.number().min(1, 'At least 1 adult required'),
  children: z.number().min(0),
  specialRequests: z.string().optional(),
  marketingConsent: z.boolean().default(false),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

interface GuestFormProps {
  onSubmit: (data: BookingGuest & { 
    marketingConsent: boolean; 
    termsAccepted: boolean;
    adults: number;
    children: number;
  }) => void;
  defaultValues?: Partial<GuestFormValues>;
  isLoading?: boolean;
  className?: string;
  maxGuests?: number;
  initialGuests?: number;
  hidePreferences?: boolean;
}

export function GuestForm({
  onSubmit,
  defaultValues,
  isLoading,
  className,
  maxGuests = 10,
  initialGuests = 2,
  hidePreferences = false,
}: GuestFormProps) {
  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      adults: defaultValues?.adults ?? Math.min(initialGuests, maxGuests),
      children: defaultValues?.children ?? 0,
      specialRequests: '',
      marketingConsent: false,
      termsAccepted: false,
      ...defaultValues,
    },
  });

  const adults = form.watch('adults');
  const children = form.watch('children');
  const totalGuests = adults + children;

  const handleSubmit = (values: GuestFormValues) => {
    onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      country: values.country,
      specialRequests: values.specialRequests,
      marketingConsent: values.marketingConsent,
      termsAccepted: values.termsAccepted,
      adults: values.adults,
      children: values.children,
    });
  };

  return (
    <Form {...form}>
      <form id="guest-form" onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-6', className)}>
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-serif text-lg font-medium mb-4">Guest Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+30 123 456 7890" {...field} />
                  </FormControl>
                  <FormDescription>For booking updates</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Country *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Guest Count Breakdown */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-serif text-lg font-medium mb-4">Guest Breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Maximum {maxGuests} guests allowed
          </p>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="adults"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base">Adults</FormLabel>
                      <p className="text-sm text-muted-foreground">Age 13+</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => field.onChange(Math.max(1, field.value - 1))}
                        disabled={field.value <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{field.value}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => field.onChange(Math.min(maxGuests - children, field.value + 1))}
                        disabled={totalGuests >= maxGuests}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="children"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base">Children</FormLabel>
                      <p className="text-sm text-muted-foreground">Age 0-12</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => field.onChange(Math.max(0, field.value - 1))}
                        disabled={field.value <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{field.value}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => field.onChange(Math.min(maxGuests - adults, field.value + 1))}
                        disabled={totalGuests >= maxGuests}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 pt-2 border-t">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Total: <strong>{totalGuests}</strong> guest{totalGuests !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div className="bg-card rounded-xl border p-6">
          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requests</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any special requests or notes for your stay..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Allergies, accessibility needs, celebration occasions, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preferences & Terms */}
        {!hidePreferences && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-serif text-lg font-medium">Preferences & Terms</h3>

            <FormField
              control={form.control}
              name="marketingConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Send me exclusive offers and updates
                    </FormLabel>
                    <FormDescription>
                      Get early access to deals and new properties
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      I accept the <a href="/terms" className="text-primary underline" target="_blank">Terms & Conditions</a> and <a href="/privacy" className="text-primary underline" target="_blank">Privacy Policy</a> *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}
      </form>
    </Form>
  );
}

// Re-export form for parent control
export { guestFormSchema };
export type { GuestFormValues };
