import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, CheckCircle, Loader2, Search, ArrowRight, Shield, Clock } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const { brandName, brandTagline, logoUrl, contactEmail, contactPhone, contactAddress } = useBrand();
  const { toast } = useToast();
  const navigate = useNavigate();
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
    <footer className="bg-foreground text-background">
      {/* Booking CTA Section */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-serif font-medium text-primary-foreground mb-2">
                Ready to Book Your Dream Escape?
              </h3>
              <p className="text-primary-foreground/80 text-sm">
                Browse our curated collection of luxury properties
              </p>
            </div>
            <Button
              onClick={() => navigate('/properties')}
              size="lg"
              variant="secondary"
              className="rounded-full gap-2 px-8"
            >
              <Search className="h-5 w-5" />
              Find Your Stay
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-8 pt-6 border-t border-primary-foreground/20">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Shield className="h-4 w-4" />
              <span>Best Price Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Clock className="h-4 w-4" />
              <span>Free Cancellation</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-primary-foreground/80 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Verified Properties</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-16">
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
                Exclusive Offers
              </h4>
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Thanks for subscribing!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <p className="text-sm opacity-70">
                    Get early access to deals & new properties.
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
                Book
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/properties" className="text-sm opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
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
      </div>
    </footer>
  );
}
