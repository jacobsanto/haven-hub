import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Clock, Send, ArrowUp, Instagram, Twitter, Youtube } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function FooterEditorial() {
  const { brandName, brandTagline, logoUrl, contactEmail, contactPhone, contactAddress, socialInstagram, socialTwitter, socialYoutube } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hl, setHl] = useState<string | null>(null);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim(), source: 'footer' });
      if (error) { if (error.code === '23505') setIsSubscribed(true); else throw error; }
      else { setIsSubscribed(true); toast({ title: 'Subscribed!' }); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  return (
    <footer className="bg-foreground text-background">
      {/* Color strip */}
      <div className="h-0.5 bg-gradient-to-r from-accent via-primary to-accent" />
      <div className="container mx-auto px-4 py-16">
        {/* Giant watermark */}
        <div className="relative mb-12">
          <h2 className="font-serif text-[clamp(60px,9vw,140px)] font-bold leading-none tracking-tighter opacity-[0.06] select-none">{brandName.toUpperCase()}</h2>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-5">
            {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 brightness-0 invert" /> : <span className="font-serif text-2xl font-bold">{primaryPart}<span className="text-accent">.</span></span>}
            <div className="w-10 h-px bg-accent" />
            {brandTagline && <p className="font-serif text-sm italic text-background/50">{brandTagline}</p>}
          </div>
        </div>

        {/* 4-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-background/10">
          {/* Contact */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.25em] text-accent mb-5 pb-2 border-b border-background/10">Contact</p>
            {[
              { icon: Mail, text: contactEmail },
              { icon: Phone, text: contactPhone },
              { icon: MapPin, text: contactAddress },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-background/5">
                <c.icon className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="text-sm text-background/60">{c.text}</span>
              </div>
            ))}
          </div>

          {/* Explore - numbered */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.25em] text-accent mb-5 pb-2 border-b border-background/10">Explore</p>
            {exploreLinks.map((l, i) => (
              <Link key={l.path} to={l.path} onMouseEnter={() => setHl(l.label)} onMouseLeave={() => setHl(null)}
                className={`block text-sm py-2.5 border-b border-background/5 transition-colors ${hl === l.label ? 'text-background' : 'text-background/50'}`}>
                <span className="font-mono text-[10px] text-background/30 mr-2.5">0{i + 1}</span>{l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.25em] text-accent mb-5 pb-2 border-b border-background/10">Legal</p>
            {[{ label: 'Privacy Policy', path: '/privacy' }, { label: 'Terms of Service', path: '/terms' }, { label: 'FAQ', path: '/faq' }].map(l => (
              <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-2.5 border-b border-background/5 hover:text-background transition-colors">{l.label}</Link>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.25em] text-accent mb-5 pb-2 border-b border-background/10">Newsletter</p>
            <p className="font-serif text-lg font-semibold text-background mb-2">The {primaryPart} Letter</p>
            <p className="text-sm text-background/50 mb-4">Monthly. No spam.</p>
            {!isSubscribed ? (
              <form onSubmit={handleSubscribe} className="flex gap-1.5 mb-6">
                <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-background/10 border-background/20 text-background placeholder:text-background/40 h-10" />
                <button type="submit" className="px-4 h-10 bg-accent text-accent-foreground rounded-lg flex items-center"><Send className="h-3.5 w-3.5" /></button>
              </form>
            ) : <p className="text-sm text-accent mb-6">✓ Subscribed</p>}
            <div className="flex gap-2.5">
              {socialInstagram && <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-background/5 border border-background/10 rounded-lg text-background/60 hover:border-accent transition-colors"><Instagram className="h-3 w-3 text-accent" /><span className="text-[10px] font-mono">IG</span></a>}
              {socialTwitter && <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-background/5 border border-background/10 rounded-lg text-background/60 hover:border-accent transition-colors"><Twitter className="h-3 w-3 text-accent" /><span className="text-[10px] font-mono">X</span></a>}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-5">
          <p className="text-xs font-mono text-background/40">© {new Date().getFullYear()} {brandName}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1.5 text-xs font-mono text-background/40 hover:text-accent transition-colors">
            Back to top <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
