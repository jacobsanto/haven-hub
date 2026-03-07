import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';

export function FooterImmersive() {
  const { brandName, brandTagline, logoUrl, socialInstagram, socialTwitter, socialFacebook, socialYoutube } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const [hl, setHl] = useState<string | null>(null);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  const socials = [
    { url: socialInstagram, icon: Instagram },
    { url: socialTwitter, icon: Twitter },
    { url: socialFacebook, icon: Facebook },
    { url: socialYoutube, icon: Youtube },
  ].filter(s => s.url);

  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* CTA section */}
      <div className="relative z-10 py-20 text-center">
        <p className="text-xs uppercase tracking-[.3em] text-accent mb-4">Your next escape</p>
        <h2 className="font-serif text-4xl md:text-6xl font-medium mb-4">
          Ready to <em className="font-normal text-accent">Escape?</em>
        </h2>
        <p className="text-sm text-background/60 max-w-md mx-auto mb-8">Your perfect villa is waiting.</p>
        <Link to="/properties" className="inline-flex items-center gap-2 px-12 py-4 bg-accent text-accent-foreground rounded-full text-sm font-medium uppercase tracking-wider hover:opacity-90 transition-opacity">
          Explore Villas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Destination ticker */}
      <div className="border-t border-b border-background/10 py-3 overflow-hidden">
        <div className="flex gap-12 animate-[marquee_30s_linear_infinite] whitespace-nowrap w-max">
          {[...Array(2)].map((_, r) => (
            <div key={r} className="flex gap-12">
              {['Santorini', 'Tuscany', 'Bali', 'Maldives', 'Provence', 'Amalfi Coast'].map(d => (
                <span key={d + r} className="font-serif text-sm italic text-background/40 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent/40" />{d}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Links grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain brightness-0 invert mb-4" />
            ) : (
              <h3 className="font-serif text-2xl font-medium text-background mb-4">
                {primaryPart}<span className="text-accent">.</span>
              </h3>
            )}
            {brandTagline && <p className="text-sm text-background/60 mb-5">{brandTagline}</p>}
            <div className="flex gap-2">
              {socials.map(({ url, icon: Icon }, i) => (
                <a key={i} href={url!} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-background/10 flex items-center justify-center text-background/60 hover:border-accent hover:text-accent transition-all">
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          {[{ title: 'Stay', links: exploreLinks }, { title: 'Company', links: companyLinks }].map(col => (
            <div key={col.title}>
              <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-4">{col.title}</p>
              {col.links.map(l => (
                <Link key={l.path} to={l.path} onMouseEnter={() => setHl(l.label)} onMouseLeave={() => setHl(null)}
                  className={`block text-sm mb-2.5 transition-all ${hl === l.label ? 'text-background translate-x-1.5' : 'text-background/50'}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-4">Help</p>
            {[{ label: 'FAQ', path: '/faq' }, { label: 'Contact', path: '/contact' }, { label: 'Privacy', path: '/privacy' }, { label: 'Terms', path: '/terms' }].map(l => (
              <Link key={l.path} to={l.path} className="block text-sm text-background/50 hover:text-background mb-2.5 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 flex justify-between items-center border-t border-background/10 pt-6">
        <p className="text-xs font-mono text-background/40">© {new Date().getFullYear()} {brandName}</p>
        <p className="text-xs font-mono text-background/40">Made with <Heart className="inline h-3 w-3 text-destructive" /> </p>
      </div>
    </footer>
  );
}
