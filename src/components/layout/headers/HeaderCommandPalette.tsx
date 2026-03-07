import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Search, Moon, Sun, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderCommandPalette() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: navItems = [] } = useNavigationItems('header');

  useEffect(() => {
    const f = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', f);
    return () => window.removeEventListener('scroll', f);
  }, []);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  useEffect(() => { if (cmdOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [cmdOpen]);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const allItems = navItems.map(i => ({ label: i.label, path: i.path }));
  const filtered = query ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase())) : allItems;

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all border-b border-border/50",
        isScrolled ? "bg-background/95 backdrop-blur-md" : "bg-background/60 backdrop-blur-md"
      )}>
        <nav className="container mx-auto px-4 h-[64px] flex items-center justify-between">
          <Link to="/">
            {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : (
              <span className="text-lg font-serif font-semibold"><span className="text-primary">{primaryPart}</span>{secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}</span>
            )}
          </Link>
          <div className="hidden md:flex gap-7">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="text-sm text-muted-foreground hover:text-accent transition-colors">{item.label}</Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => setCmdOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground hover:border-accent transition-colors">
              <Search className="h-3 w-3" />Search
              <kbd className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded ml-1">⌘K</kbd>
            </button>
            <CurrencySwitcher variant="icon" className="rounded-full" />
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><User className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card">
                  <DropdownMenuItem className="text-muted-foreground">{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin')}>Admin Dashboard</DropdownMenuItem>}
                  <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate('/login')} className="rounded-full">Book</Button>
            )}
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </header>

      {/* Command palette overlay */}
      {cmdOpen && (
        <div className="fixed inset-0 z-[200] bg-foreground/30 backdrop-blur-sm flex justify-center pt-[15vh]" onClick={() => setCmdOpen(false)}>
          <div className="w-full max-w-[560px] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[60vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search className="h-5 w-5 text-accent shrink-0" />
              <input ref={inputRef} placeholder="Search pages..." value={query} onChange={e => setQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground" />
              <button onClick={() => setCmdOpen(false)} className="px-2 py-1 bg-muted border border-border rounded text-[10px] text-muted-foreground font-mono">ESC</button>
            </div>
            <div className="overflow-y-auto p-2">
              {filtered.map(item => (
                <button key={item.path} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground text-left transition-colors"
                  onClick={() => { navigate(item.path); setCmdOpen(false); setQuery(''); }}>
                  <ChevronRight className="h-3 w-3 text-accent/50" />{item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-20 px-6 md:hidden">
          {navItems.filter(i => i.show_on_mobile).map((item) => (
            <Link key={item.path} to={item.path} className="block text-lg py-3" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
          ))}
        </div>
      )}
    </>
  );
}
