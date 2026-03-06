import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, CheckCircle, Loader2, Search, ArrowRight, Shield, Clock, Instagram, Facebook, Twitter, ArrowUp, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const {
    brandName, brandTagline, logoUrl, contactEmail, contactPhone, contactAddress,
    socialInstagram, socialFacebook, socialTwitter,
  } = useBrand();
  const ctaContent = usePageContent('footer', 'cta', {
    heading: 'Ready to Book Your Dream Escape?',
    subtitle: 'Browse our curated collection of luxury properties',
  });
  const newsletterContent = usePageContent('footer', 'newsletter', {
    heading: 'Exclusive Offers',
    subtitle: 'Get early access to deals & new properties.',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const { theme, setTheme } = useTheme();
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
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim(), source: 'footer' });
      if (error) {
        if (error.code === '23505') { toast({ title: "You're already subscribed!" }); setIsSubscribed(true); }
        else throw error;
      } else { setIsSubscribed(true); toast({ title: 'Successfully subscribed!' }); }
    } catch { toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  const socials = [
    { icon: Instagram, href: socialInstagram, label: 'Instagram' },
    { icon: Facebook, href: socialFacebook, label: 'Facebook' },
    { icon: Twitter, href: socialTwitter, label: 'X (Twitter)' },
  ].filter(s => s.href);

  return (
    <footer role="contentinfo" className="bg-foreground text-background">
      {/* Booking CTA */}
      <div className="border-b border-background/10 py-14">
        <div className="max-w-[1100px] mx-auto px-[5%] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif font-semibold text-background mb-2">{ctaContent.heading}</h3>
            <p className="text-background/60 text-sm">{ctaContent.subtitle}</p>
          </div>
          <Button onClick={() => navigate('/properties')} size="lg" className="rounded-lg gap-2 px-8 bg-accent text-accent-foreground hover:bg-accent/90">
            <Search className="h-4 w-4" />
            Find Your Stay
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="py-16">
        <div className="max-w-[1100px] mx-auto px-[5%]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand + Newsletter */}
            <div className="space-y-6 sm:col-span-2 lg:col-span-1">
              <div className="space-y-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[160px] object-contain brightness-0 invert" />
                ) : (
                  <h3 className="text-2xl font-serif">
                    <span className="text-background">{primaryPart}</span>
                    {secondaryPart && <span className="opacity-60"> {secondaryPart}</span>}
                  </h3>
                )}
                {brandTagline && <p className="text-sm opacity-50 max-w-xs leading-relaxed">{brandTagline}</p>}
              </div>
              <div className="space-y-3">
                <h4 className="font-sans font-semibold text-[11px] uppercase tracking-[0.15em] opacity-40">{newsletterContent.heading}</h4>
                {isSubscribed ? (
                  <div className="flex items-center gap-2 text-sm opacity-70">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span>Thanks for subscribing!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-3">
                    <p className="text-sm opacity-50">{newsletterContent.subtitle}</p>
                    <div className="flex gap-2">
                      <Input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className="bg-background/10 border-background/15 text-background placeholder:text-background/40 h-11" disabled={isSubmitting} />
                      <Button type="submit" size="icon" disabled={isSubmitting} className="h-11 w-11 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Explore */}
            <div className="space-y-4">
              <h4 className="font-sans font-semibold text-[11px] uppercase tracking-[0.15em] opacity-40">Explore</h4>
              <ul className="space-y-3">
                {exploreLinks.map(link => (
                  <li key={link.path + link.label}>
                    <Link to={link.path} className="text-sm opacity-60 hover:opacity-100 hover:text-accent transition-all duration-300">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-sans font-semibold text-[11px] uppercase tracking-[0.15em] opacity-40">Company</h4>
              <ul className="space-y-3">
                {companyLinks.map(link => (
                  <li key={link.path + link.label}>
                    <Link to={link.path} className="text-sm opacity-60 hover:opacity-100 hover:text-accent transition-all duration-300">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-sans font-semibold text-[11px] uppercase tracking-[0.15em] opacity-40">Contact</h4>
              <ul className="space-y-3">
                {contactAddress && (
                  <li className="flex items-start gap-3 text-sm opacity-60">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{contactAddress}</span>
                  </li>
                )}
                {contactEmail && (
                  <li className="flex items-center gap-3 text-sm opacity-60 hover:opacity-100 transition-opacity">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  </li>
                )}
                {contactPhone && (
                  <li className="flex items-center gap-3 text-sm opacity-60 hover:opacity-100 transition-opacity">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${contactPhone?.replace(/\D/g, '')}`}>{contactPhone}</a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-background/8 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm opacity-40 order-2 sm:order-1">
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>

            <div className="flex items-center gap-3 order-1 sm:order-2">
              {/* Social Icons - Circular with hover accent border */}
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${s.label}`}
                  className="w-10 h-10 rounded-full border border-background/15 flex items-center justify-center opacity-50 hover:opacity-100 hover:border-accent hover:text-accent transition-all duration-300"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}

              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle dark mode"
                className="rounded-full border border-background/15 hover:border-accent hover:bg-transparent ml-1 h-10 w-10 opacity-50 hover:opacity-100 transition-all"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Back to top */}
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="rounded-full border border-background/15 hover:border-accent hover:bg-transparent ml-1 h-10 w-10 opacity-50 hover:opacity-100 transition-all"
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
