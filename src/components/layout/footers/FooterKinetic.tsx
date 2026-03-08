import { Link } from 'react-router-dom';
import { ArrowUp, Instagram, Twitter } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';

export function FooterKinetic() {
  const { brandName, brandTagline, socialInstagram, socialTwitter } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;

  const tickerText = `${brandName} · Luxury Villas · Direct Booking · Concierge · `;

  return (
    <footer className="bg-foreground text-background overflow-hidden">

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="font-serif text-4xl font-medium text-background mb-4">{primaryPart}<span className="text-accent">.</span></div>
            {brandTagline && <p className="text-sm text-background/50 max-w-xs">{brandTagline}</p>}
          </div>

          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-5">Navigate</p>
            {exploreLinks.map(l => (
              <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-2 hover:text-background transition-colors">{l.label}</Link>
            ))}
          </div>

          <div>
            <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-5">Info</p>
            {companyLinks.map(l => (
              <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-2 hover:text-background transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="container mx-auto px-4 pb-8 flex justify-between items-center border-t border-background/10 pt-6">
        <p className="text-xs font-mono text-background/30">© {new Date().getFullYear()} {brandName}</p>
        <div className="flex items-center gap-4">
          {socialInstagram && <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-background/30 hover:text-accent transition-colors"><Instagram className="h-4 w-4" /></a>}
          {socialTwitter && <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-background/30 hover:text-accent transition-colors"><Twitter className="h-4 w-4" /></a>}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-8 h-8 rounded-full border border-background/10 flex items-center justify-center text-background/30 hover:text-accent transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
