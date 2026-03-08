import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Search, Moon, Sun, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderMegaMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: navItems = [] } = useNavigationItems('header');

  useEffect(() => {
    let raf: number;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setIsScrolled(window.scrollY > 40)); };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); cancelAnimationFrame(raf); };
  }, []);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 transition-all">
        <nav className="container mx-auto px-4 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[140px] object-contain" />
            ) : (
              <span className="text-xl font-serif font-semibold">
                <span className="text-primary">{primaryPart}</span>
                {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-1" onMouseLeave={() => setOpenMenu(null)}>
            {navItems.map((item) => (
              <div key={item.path + item.label} className="relative" onMouseEnter={() => setOpenMenu(item.label)}>
                <Link
                  to={item.path}
                  className={cn(
                    "px-4 py-2 text-sm flex items-center gap-1 transition-colors rounded-lg",
                    isActive(item.path) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", openMenu === item.label && "rotate-180")} />
                </Link>
              </div>
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

        {/* Mega dropdown panel */}
        {openMenu && (
          <div
            onMouseEnter={() => {}}
            onMouseLeave={() => setOpenMenu(null)}
            className="absolute top-[72px] left-0 right-0 bg-card/97 backdrop-blur-xl border-b border-border animate-in slide-in-from-top-2 duration-200"
          >
            <div className="container mx-auto px-4 py-8">
              <p className="text-xs font-medium uppercase tracking-wider text-accent mb-4">{openMenu}</p>
              <p className="text-sm text-muted-foreground">Navigate to <strong>{openMenu}</strong> to explore more.</p>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-20 px-6 md:hidden">
          {navItems.filter(i => i.show_on_mobile).map((item) => (
            <Link key={item.path} to={item.path} className="block text-lg py-3 text-foreground" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
          ))}
          {!user && <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="mt-4 w-full">Sign In</Button>}
        </div>
      )}
    </>
  );
}
