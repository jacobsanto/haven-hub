import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Instagram, Twitter } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';

export function FooterMinimal() {
  const { brandName, brandTagline, socialInstagram, socialTwitter } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const [activeCol, setActiveCol] = useState<string | null>(null);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;

  const COLS = [
    { id: 'explore', label: 'Explore', links: exploreLinks, accent: 'text-accent' },
    { id: 'company', label: 'Company', links: companyLinks, accent: 'text-primary' },
    { id: 'support', label: 'Support', links: [{ label: 'FAQ', path: '/faq' }, { label: 'Contact', path: '/contact' }, { label: 'Privacy', path: '/privacy' }], accent: 'text-muted-foreground' },
  ];

  return (
    <footer className="bg-foreground text-background border-t border-background/10 py-20">
      <div className="container mx-auto px-4">
        {/* Centered brand */}
        <div className="text-center mb-16">
          <div className="font-serif text-5xl font-bold mb-5">{primaryPart}<span className="text-accent">.</span></div>
          <div className="w-10 h-px bg-accent mx-auto mb-5" />
          {brandTagline && <p className="font-serif text-base italic text-background/50">{brandTagline}</p>}
        </div>

        {/* Hover-expand columns */}
        <div className="flex gap-0.5 mb-16 rounded-2xl overflow-hidden border border-background/10">
          {COLS.map(col => {
            const isActive = activeCol === col.id;
            return (
              <div
                key={col.id}
                onMouseEnter={() => setActiveCol(col.id)}
                onMouseLeave={() => setActiveCol(null)}
                className={`transition-all duration-500 cursor-pointer overflow-hidden border-r border-background/5 last:border-r-0 p-6 ${
                  isActive ? 'flex-[3] bg-background/5' : 'flex-1 bg-background/[0.02]'
                }`}
              >
                <div className={`relative ${isActive ? 'h-1 bg-accent mb-5' : 'h-0 mb-0'} transition-all rounded`} />
                <p className={`text-[10px] font-mono uppercase tracking-wider ${isActive ? col.accent : 'text-background/40'} transition-colors whitespace-nowrap mb-4`}>{col.label}</p>
                <div className={`transition-all duration-500 overflow-hidden ${isActive ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {col.links.map(l => (
                    <Link key={l.path} to={l.path} className="flex items-center justify-between text-sm text-background/50 py-2 border-b border-background/5 hover:text-background transition-colors">
                      {l.label}<ArrowUpRight className="h-3 w-3 text-accent opacity-50" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="flex justify-between items-center">
          <p className="text-xs font-mono text-background/40">© {new Date().getFullYear()}</p>
          <div className="flex gap-5">
            {[{ label: 'Privacy', path: '/privacy' }, { label: 'Terms', path: '/terms' }].map(l => (
              <Link key={l.path} to={l.path} className="text-xs font-mono text-background/40 hover:text-background transition-colors">{l.label}</Link>
            ))}
          </div>
          <div className="flex gap-2">
            {socialInstagram && <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-background/40 hover:text-accent transition-colors"><Instagram className="h-4 w-4" /></a>}
            {socialTwitter && <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-background/40 hover:text-accent transition-colors"><Twitter className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
