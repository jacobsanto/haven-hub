import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Bell, Mail, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().email('Please enter a valid email address');

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OfferType = 'discount' | 'price-drop' | null;

export function ExitIntentModal({ isOpen, onClose }: ExitIntentModalProps) {
  const [email, setEmail] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<OfferType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: 'Invalid email',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!selectedOffer) {
      toast({
        title: 'Please select an offer',
        description: 'Choose what you\'d like to receive.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const source = selectedOffer === 'discount' ? 'exit_intent_discount' : 'exit_intent_price_drop';
      
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.toLowerCase().trim(), source });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already subscribed',
            description: "You're already on our list! Check your inbox for exclusive offers.",
          });
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: selectedOffer === 'discount' ? '10% discount unlocked!' : 'Price alerts activated!',
          description: 'Check your inbox for your exclusive offer.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedOffer(null);
    setIsSubscribed(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="relative overflow-hidden rounded-2xl bg-background shadow-2xl border border-border">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {isSubscribed ? (
                /* Success State */
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                  >
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-serif text-foreground mb-3">
                    You're all set!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {selectedOffer === 'discount' 
                      ? "Your 10% discount code has been sent to your inbox. Happy booking!"
                      : "We'll notify you when prices drop on properties you've viewed."}
                  </p>
                  <Button onClick={handleClose} className="w-full">
                    Continue Browsing
                  </Button>
                </div>
              ) : (
                /* Form State */
                <>
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 pb-6">
                    <div className="flex items-center gap-2 text-primary mb-4">
                      <Sparkles className="h-5 w-5" />
                      <span className="text-sm font-medium uppercase tracking-wide">
                        Wait! Before you go...
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-2">
                      Don't miss out on your dream getaway
                    </h2>
                    <p className="text-muted-foreground">
                      Choose an exclusive offer just for you
                    </p>
                  </div>

                  {/* Offer Selection */}
                  <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
                    <div className="grid gap-3">
                      {/* Discount Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedOffer('discount')}
                        className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                          selectedOffer === 'discount'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                          selectedOffer === 'discount' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <Gift className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Get 10% off your first booking
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Exclusive discount code sent to your inbox instantly
                          </p>
                        </div>
                      </button>

                      {/* Price Drop Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedOffer('price-drop')}
                        className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                          selectedOffer === 'price-drop'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                          selectedOffer === 'price-drop' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <Bell className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Get notified when prices drop
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Be the first to know about deals on properties you love
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label htmlFor="exit-email" className="text-foreground">
                        Your email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="exit-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 gap-2"
                      disabled={isLoading || !selectedOffer}
                    >
                      {isLoading ? 'Processing...' : 'Claim My Offer'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {/* Privacy Note */}
                    <p className="text-center text-xs text-muted-foreground">
                      By subscribing, you agree to receive marketing emails. 
                      Unsubscribe anytime.
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
