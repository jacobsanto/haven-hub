import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().email('Please enter a valid email address');

interface NewsletterSignupProps {
  className?: string;
}

export function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: 'Invalid email',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.toLowerCase().trim(), source: 'blog' });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - already subscribed
          toast({
            title: 'Already subscribed',
            description: "You're already on our mailing list!",
          });
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: 'Welcome aboard!',
          description: 'You\'ve been added to our newsletter.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Subscription failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-primary/5 rounded-2xl p-8 text-center ${className}`}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-serif text-foreground mb-2">You're on the list!</h3>
        <p className="text-muted-foreground">
          Thank you for subscribing. We'll send you our best travel insights.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 rounded-2xl p-8 md:p-10 ${className}`}
    >
      <div className="max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        
        <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-3">
          Stay Inspired
        </h3>
        <p className="text-muted-foreground mb-8">
          Subscribe to receive exclusive travel insights, destination guides, and curated recommendations 
          delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-12 px-4 bg-background border-border"
            required
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-12 px-6 gap-2"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </motion.div>
  );
}
