import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const { brandName, brandTagline, logoUrl, contactEmail, contactPhone, contactAddress } = useBrand();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.trim(), source: 'footer' });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'You\'re already subscribed!' });
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({ title: 'Successfully subscribed!' });
      }
    } catch {
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Split brand name for styling
  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={brandName} 
                className="h-10 w-auto max-w-[160px] object-contain brightness-0 invert"
              />
            ) : (
              <h3 className="text-2xl font-serif">
                <span className="text-primary-foreground">{primaryPart}</span>
                {secondaryPart && <span className="opacity-60"> {secondaryPart}</span>}
              </h3>
            )}
            <p className="text-sm opacity-70 leading-relaxed">
              {brandTagline || 'Discover extraordinary vacation homes in the world\'s most desirable destinations.'}
            </p>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
              Newsletter
            </h4>
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-sm opacity-80">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Thanks for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <p className="text-sm opacity-70">
                  Get travel inspiration and exclusive offers.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/50 h-10"
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isSubmitting}
                    className="h-10 w-10 shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/properties" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/destinations" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Destinations
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Experiences
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm opacity-80">
                <MapPin className="h-4 w-4" />
                <span>{contactAddress}</span>
              </li>
              <li className="flex items-center gap-3 text-sm opacity-80">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${contactEmail}`} className="hover:opacity-100 transition-opacity">
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm opacity-80">
                <Phone className="h-4 w-4" />
                <a href={`tel:${contactPhone?.replace(/\D/g, '')}`} className="hover:opacity-100 transition-opacity">
                  {contactPhone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-60">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
              Instagram
            </a>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
              Facebook
            </a>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
