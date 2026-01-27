import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Send, Loader2, Users } from 'lucide-react';
import { useCreateExperienceEnquiry } from '@/hooks/useExperienceEnquiries';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const enquirySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  preferred_date: z.date().optional(),
  group_size: z.number().min(1).max(50).optional(),
  message: z.string().trim().max(2000).optional(),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface EnquiryFormProps {
  experienceId: string;
  experienceName: string;
}

export function EnquiryForm({ experienceId, experienceName }: EnquiryFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const createEnquiry = useCreateExperienceEnquiry();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const preferredDate = watch('preferred_date');
  const groupSize = watch('group_size');

  const onSubmit = async (data: EnquiryFormData) => {
    try {
      await createEnquiry.mutateAsync({
        experience_id: experienceId,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        preferred_date: data.preferred_date ? format(data.preferred_date, 'yyyy-MM-dd') : undefined,
        group_size: data.group_size,
        message: data.message || undefined,
      });

      setIsSubmitted(true);
      reset();
      toast.success('Enquiry submitted! We\'ll be in touch soon.');
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to submit enquiry. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="card-organic p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Send className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-serif font-medium mb-3">Thank You!</h3>
        <p className="text-muted-foreground mb-6">
          Your enquiry for {experienceName} has been submitted. 
          We'll contact you within 24 hours to discuss the details.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsSubmitted(false)}
          className="rounded-full"
        >
          Send Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card-organic p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-serif font-medium mb-2">Enquire About This Experience</h3>
        <p className="text-sm text-muted-foreground">
          Fill out the form below and we'll get back to you with availability and pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Your name"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (234) 567-890"
            {...register('phone')}
          />
        </div>

        <div className="space-y-2">
          <Label>Preferred Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !preferredDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {preferredDate ? format(preferredDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={preferredDate}
                onSelect={(date) => setValue('preferred_date', date)}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Group Size (Optional)</Label>
        <div className="flex items-center gap-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={50}
            placeholder="Number of guests"
            value={groupSize || ''}
            onChange={(e) => setValue('group_size', e.target.value ? parseInt(e.target.value) : undefined)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          placeholder="Any special requests or questions..."
          rows={4}
          {...register('message')}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Enquiry
          </>
        )}
      </Button>
    </form>
  );
}
