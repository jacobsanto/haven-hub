import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, CheckCircle, Loader2, Search, ArrowRight, Shield, Clock, Instagram, Facebook, Twitter, ArrowUp, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useBrand } from '@/contexts/BrandContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const {
    brandName,
    brandTagline,
    logoUrl,
    contactEmail,
    contactPhone,
    contactAddress
  } = useBrand();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({
        email: email.trim(),
        source: 'footer'
      });
      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'You\'re already subscribed!'
          });
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: 'Successfully subscribed!'
        });
      }
    } catch {
      toast({
        title: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Split brand name for styling
  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  return (
    <footer role="contentinfo" className="bg-foreground text-background">
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
              variant="gold" 
              className="rounded-full gap-2 px-8"
            >
              <Search className="h-5 w-5" />
              Find Your Stay
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10 mt-8 pt-6 border-t border-primary-foreground/20">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Shield className="h-4 w-4" />
              <span>Best Price Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Clock className="h-4 w-4" />
              <span>Free Cancellation</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Verified Properties</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand + Newsletter Column */}
            <div className="space-y-6 sm:col-span-2 lg:col-span-1">
              {/* Brand */}
              <div className="space-y-3">
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
                {brandTagline && (
                  <p className="text-sm opacity-70 max-w-xs">{brandTagline}</p>
                )}
              </div>

              {/* Newsletter */}
              <div className="space-y-3">
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
                        onChange={e => setEmail(e.target.value)} 
                        className="bg-background/10 border-background/20 text-background placeholder:text-background/50 h-11" 
                        disabled={isSubmitting}
                        aria-label="Email address for newsletter"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={isSubmitting} 
                        className="h-11 w-11 shrink-0"
                        aria-label="Subscribe to newsletter"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Explore Column */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
                Explore
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/properties" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    All Properties
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/destinations" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/experiences" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    Experiences
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/blog" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/about" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-background/60 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm uppercase tracking-wider opacity-60">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm opacity-80">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{contactAddress}</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-80">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a 
                    href={`mailto:${contactEmail}`} 
                    className="hover:opacity-100 transition-opacity"
                  >
                    {contactEmail}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-80">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a 
                    href={`tel:${contactPhone?.replace(/\D/g, '')}`} 
                    className="hover:opacity-100 transition-opacity"
                  >
                    {contactPhone}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-background/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm opacity-60 order-2 sm:order-1">
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4 order-1 sm:order-2">
              <a 
                href="#" 
                aria-label="Follow us on Instagram"
                className="opacity-60 hover:opacity-100 hover:text-gold-accent transition-all duration-200 hover:-translate-y-0.5 p-2"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                aria-label="Follow us on Facebook"
                className="opacity-60 hover:opacity-100 hover:text-gold-accent transition-all duration-200 hover:-translate-y-0.5 p-2"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                aria-label="Follow us on X (Twitter)"
                className="opacity-60 hover:opacity-100 hover:text-gold-accent transition-all duration-200 hover:-translate-y-0.5 p-2"
              >
                <Twitter className="h-5 w-5" />
              </a>
              
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle dark mode"
                className="rounded-full border border-background/20 hover:bg-background/10 ml-2 h-10 w-10"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Back to Top Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="rounded-full border border-background/20 hover:bg-background/10 ml-2 h-10 w-10"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
