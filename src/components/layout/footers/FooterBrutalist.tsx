import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Terminal } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';

export function FooterBrutalist() {
  const { brandName, contactEmail, contactPhone } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-foreground text-background border-t-4 border-accent">
      <div className="container mx-auto px-4 py-12">
        {/* Terminal header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-dashed border-background/20">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-accent" />
            <span className="font-mono text-sm text-accent">arivia@system:~$</span>
            <span className="font-mono text-sm text-background/60">footer --render</span>
          </div>
          <span className="font-mono text-xs text-background/40">{time} UTC</span>
        </div>

        {/* Raw grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-background/20">
          {/* Brand */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-background/20">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-4">[BRAND]</p>
            <div className="font-mono text-2xl font-medium text-background mb-2">{brandName}</div>
            <p className="font-mono text-xs text-background/40">STATUS: OPERATIONAL</p>
            <p className="font-mono text-xs text-background/40">UPTIME: 99.9%</p>
          </div>

          {/* Nav */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-background/20">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-4">[NAV]</p>
            {exploreLinks.map((l, i) => (
              <Link key={l.path} to={l.path} className="block font-mono text-sm text-background/60 py-1.5 hover:text-accent transition-colors">
                <span className="text-background/30 mr-2">{String(i).padStart(2, '0')}</span>{l.label.toUpperCase()}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-background/20">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-4">[LEGAL]</p>
            {companyLinks.map((l, i) => (
              <Link key={l.path} to={l.path} className="block font-mono text-sm text-background/60 py-1.5 hover:text-accent transition-colors">
                <span className="text-background/30 mr-2">{String(i).padStart(2, '0')}</span>{l.label.toUpperCase()}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="p-6">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-4">[CONTACT]</p>
            <p className="font-mono text-xs text-background/60 mb-2">EMAIL: {contactEmail}</p>
            <p className="font-mono text-xs text-background/60 mb-4">TEL: {contactPhone}</p>
            <div className="flex items-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-[10px] text-green-400">LIVE</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed border-background/20">
          <p className="font-mono text-[10px] text-background/30">© {new Date().getFullYear()} // {brandName.toUpperCase()}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-mono text-[10px] text-background/30 hover:text-accent flex items-center gap-1 transition-colors">
            SCROLL_TOP <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
