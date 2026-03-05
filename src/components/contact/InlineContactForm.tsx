import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const inlineContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

type InlineContactData = z.infer<typeof inlineContactSchema>;

export function InlineContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InlineContactData>({
    resolver: zodResolver(inlineContactSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  const onSubmit = async (data: InlineContactData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: data.name,
          email: data.email,
          subject: 'General Inquiry',
          message: data.message,
        });
      if (error) throw error;
      setIsSubmitted(true);
      reset();
      toast.success("Message sent! We'll get back to you soon.");
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-serif text-foreground mb-2">Thank you!</p>
        <p className="text-muted-foreground text-sm mb-4">We'll be in touch within 24-48 hours.</p>
        <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)} className="rounded-full">
          Send Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="Your Name"
          {...register('name')}
          className={`bg-background ${errors.name ? 'border-destructive' : ''}`}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email Address"
          {...register('email')}
          className={`bg-background ${errors.email ? 'border-destructive' : ''}`}
        />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Textarea
          placeholder="Your Message"
          rows={4}
          {...register('message')}
          className={`bg-background resize-none ${errors.message ? 'border-destructive' : ''}`}
        />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="gold"
        className="w-full rounded-full gap-2"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
        ) : (
          <>Connect with Us <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </form>
  );
}
