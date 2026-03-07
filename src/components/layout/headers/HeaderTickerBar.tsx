import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Moon, Sun, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderTickerBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(true);
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

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const tickerMessages = [
    'Book direct — best price guaranteed',
    'Free cancellation on all bookings',
    'New properties added weekly',
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Ticker ribbon */}
        {tickerVisible && (
          <div className={cn(
            "bg-accent overflow-hidden relative transition-all",
            isScrolled ? "h-0 opacity-0" : "h-7 opacity-100"
          )}>
            <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap w-max">
              {[...Array(2)].map((_, r) => (
                <div key={r} className="flex gap-10">
                  {tickerMessages.map((t) => (
                    <span key={t + r} className="text-[11px] font-medium text-accent-foreground flex items-center gap-2 px-5">
                      <Sparkles className="h-3 w-3" />{t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={() => setTickerVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-foreground/40 hover:text-accent-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {/* Nav bar */}
        <header className="bg-background/95 backdrop-blur-md border-b border-border/50 transition-all">
          <nav className="container mx-auto px-4 h-[56px] flex items-center justify-between">
            <Link to="/">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="text-lg font-serif font-semibold">
                  <span className="text-primary">{primaryPart}</span>
                  {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
                </span>
              )}
            </Link>
            <div className="hidden md:flex gap-7">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={cn(
                  "text-sm tracking-wide transition-colors",
                  isActive(item.path) ? "text-accent" : "text-muted-foreground hover:text-accent"
                )}>{item.label}</Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-2">
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
                <Button variant="default" size="sm" onClick={() => navigate('/login')} className="rounded-full">Book Now</Button>
              )}
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </nav>
        </header>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-24 px-6 md:hidden">
          {navItems.filter(i => i.show_on_mobile).map((item) => (
            <Link key={item.path} to={item.path} className="block text-lg py-3" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
          ))}
          {!user && <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="mt-4 w-full">Sign In</Button>}
        </div>
      )}
    </>
  );
}
