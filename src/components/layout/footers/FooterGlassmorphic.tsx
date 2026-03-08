import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, Instagram, Twitter, Youtube, MessageCircle, Phone } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function FooterGlassmorphic() {
  const { brandName, brandTagline, contactEmail, socialInstagram, socialTwitter, socialYoutube } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim(), source: 'footer' });
      if (error) {if (error.code === '23505') setIsSubscribed(true);else throw error;} else
      {setIsSubscribed(true);toast({ title: 'Subscribed!' });}
    } catch {toast({ title: 'Error', variant: 'destructive' });} finally
    {setIsSubmitting(false);}
  };

  const GlassPanel = ({ children, className = '' }: {children: React.ReactNode;className?: string;}) =>
  <div className={`bg-background/5 border border-background/10 rounded-3xl relative overflow-hidden ${className}`}>
      {children}
    </div>;


  return (
    <footer className="bg-foreground text-background relative overflow-hidden py-20">

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Brand + Newsletter panel */}
          <GlassPanel className="md:row-span-2 p-8 !bg-background/5 !border-background/10">
            <div className="font-serif text-2xl font-medium text-background mb-5">{primaryPart}<span className="text-accent">.</span></div>
            <p className="text-sm text-background/50 leading-relaxed mb-6">{brandTagline}</p>
            <div className="w-full h-px bg-background/10 mb-6" />
            <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-3">Newsletter</p>
            {!isSubscribed ?
            <form onSubmit={handleSubscribe} className="flex gap-1.5">
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/5 border-background/10 text-background placeholder:text-background/40 h-11" />
                <button type="submit" className="w-11 h-11 bg-accent text-accent-foreground rounded-xl flex items-center justify-center"><Send className="h-4 w-4" /></button>
              </form> :
            <p className="text-sm text-accent">✓ Subscribed!</p>}
            <div className="flex gap-2 mt-6">
              {[{ url: socialInstagram, icon: Instagram }, { url: socialTwitter, icon: Twitter }, { url: socialYoutube, icon: Youtube }].filter((s) => s.url).map(({ url, icon: Icon }, i) =>
              <a key={i} href={url!} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center text-background/50 hover:text-accent hover:border-accent transition-all"><Icon className="h-4 w-4" /></a>
              )}
            </div>
          </GlassPanel>

          {/* Explore */}
          <GlassPanel className="p-7 !bg-background/[0.03] !border-background/10">
            <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-4">Explore</p>
            {exploreLinks.map((l) =>
            <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-2 border-b border-background/5 hover:text-background hover:pl-2 transition-all">{l.label}</Link>
            )}
          </GlassPanel>

          {/* Support */}
          <GlassPanel className="p-7 !bg-background/[0.03] !border-background/10">
            <p className="text-[9px] font-mono uppercase tracking-[.2em] mb-4 text-accent">Support</p>
            {companyLinks.map((l) =>
            <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-2 border-b border-background/5 hover:text-background hover:pl-2 transition-all">{l.label}</Link>
            )}
          </GlassPanel>

          {/* Contact panel */}
          <GlassPanel className="md:col-span-2 p-6 flex items-center gap-8 !bg-background/[0.04] !border-background/10">
            <div className="flex-1">
              <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-2">Get in Touch</p>
              <p className="font-serif text-lg font-medium text-background">Talk to our concierge</p>
            </div>
            <div className="flex gap-3">
              {[{ icon: Mail, label: 'Email' }, { icon: Phone, label: 'Call' }, { icon: MessageCircle, label: 'Chat' }].map(({ icon: Icon, label }) =>
              <div key={label} className="flex flex-col items-center gap-1.5 px-5 py-3 bg-background/5 border border-background/10 rounded-2xl cursor-pointer hover:border-accent transition-all backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-accent" />
                  <span className="text-[9px] font-mono text-background/50">{label}</span>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-background/5">
          <p className="text-xs font-mono text-background/30">© {new Date().getFullYear()} {brandName}</p>
          <div className="flex gap-4">
            {['Privacy', 'Terms'].map((t) =>
            <Link key={t} to={`/${t.toLowerCase()}`} className="text-xs font-mono text-background/30 hover:text-background transition-colors">{t}</Link>
            )}
          </div>
        </div>
      </div>
    </footer>);

}