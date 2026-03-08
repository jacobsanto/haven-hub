import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowUpRight, ArrowUp, Instagram, Twitter, Youtube, CheckCircle, Loader2 } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function BentoCell({ id, hovCell, setHovCell, children, className = '' }: { id: string; hovCell: string | null; setHovCell: (id: string | null) => void; children: React.ReactNode; className?: string }) {
  return (
    <div
      onMouseEnter={() => setHovCell(id)} onMouseLeave={() => setHovCell(null)}
      className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 relative ${hovCell === id ? '-translate-y-1 shadow-xl border-accent/20' : ''} ${className}`}
    >{children}</div>
  );
}

export function FooterBento() {
  const { brandName, brandTagline, logoUrl, contactEmail, socialInstagram, socialTwitter } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hovCell, setHovCell] = useState<string | null>(null);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim(), source: 'footer' });
      if (error) { if (error.code === '23505') { setIsSubscribed(true); } else throw error; }
      else { setIsSubscribed(true); toast({ title: 'Successfully subscribed!' }); }
    } catch { toast({ title: 'Something went wrong.', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  return (
    <footer className="bg-foreground text-background border-t border-background/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Brand cell */}
          <BentoCell id="brand" hovCell={hovCell} setHovCell={setHovCell} className="md:col-span-2 p-8 !bg-foreground !border-background/10">
            <h3 className="font-serif text-xl font-medium mb-3">
              <span className="text-background">{primaryPart}</span>
              {secondaryPart && <span className="text-background/60"> {secondaryPart}</span>}
            </h3>
            {brandTagline && <p className="text-sm text-background/60 mb-5">{brandTagline}</p>}
            <div className="flex gap-2">
              {socialInstagram && <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center text-background/60 hover:text-accent hover:bg-accent/10 transition-all"><Instagram className="h-4 w-4" /></a>}
              {socialTwitter && <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center text-background/60 hover:text-accent hover:bg-accent/10 transition-all"><Twitter className="h-4 w-4" /></a>}
            </div>
          </BentoCell>

          {/* Explore cell */}
          <BentoCell id="explore" hovCell={hovCell} setHovCell={setHovCell} className="p-6 !bg-foreground !border-background/10">
            <p className="text-[10px] font-mono uppercase tracking-wider text-accent mb-4">Explore</p>
            {exploreLinks.map((link) => (
              <Link key={link.path} to={link.path} className="flex items-center justify-between text-sm text-background/60 py-2 border-b border-background/5 hover:text-background transition-colors">
                {link.label}<ArrowUpRight className="h-3 w-3 text-accent opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </BentoCell>

          {/* Company cell */}
          <BentoCell id="company" hovCell={hovCell} setHovCell={setHovCell} className="p-6 !bg-foreground !border-background/10">
            <p className="text-[10px] font-mono uppercase tracking-wider text-accent mb-4">Company</p>
            {companyLinks.map((link) => (
              <Link key={link.path} to={link.path} className="flex items-center justify-between text-sm text-background/60 py-2 border-b border-background/5 hover:text-background transition-colors">
                {link.label}
              </Link>
            ))}
          </BentoCell>

          {/* Newsletter cell */}
          <BentoCell id="news" hovCell={hovCell} setHovCell={setHovCell} className="md:col-span-2 p-6 !bg-foreground !border-background/10">
            <p className="text-[10px] font-mono uppercase tracking-wider text-accent mb-2 flex items-center gap-1"><Mail className="h-3 w-3" />Newsletter</p>
            <p className="font-serif text-base font-medium text-background mb-3">Travel stories, delivered monthly.</p>
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-sm text-background/80"><CheckCircle className="h-4 w-4 text-accent" />Thanks for subscribing!</div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-background/10 border-background/20 text-background placeholder:text-background/40 h-11" />
                <button type="submit" disabled={isSubmitting} className="px-5 h-11 bg-accent text-accent-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            )}
          </BentoCell>

          {/* Email cell */}
          <BentoCell id="email" hovCell={hovCell} setHovCell={setHovCell} className="p-5 flex flex-col items-center justify-center text-center !bg-foreground !border-background/10">
            <Mail className="h-5 w-5 text-accent mb-2" />
            <p className="text-xs font-mono text-background/70">{contactEmail}</p>
          </BentoCell>

          {/* Status cell */}
          <BentoCell id="status" hovCell={hovCell} setHovCell={setHovCell} className="p-5 flex flex-col items-center justify-center text-center !bg-foreground !border-background/10">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mb-2 animate-pulse" />
            <p className="text-xs font-mono text-green-400">Online</p>
          </BentoCell>
        </div>

        <div className="flex justify-between items-center mt-5 pt-4 border-t border-background/10">
          <p className="text-xs font-mono text-background/40">© {new Date().getFullYear()} {brandName}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-8 h-8 rounded-lg bg-background/5 border border-background/10 flex items-center justify-center text-background/40 hover:text-accent transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
