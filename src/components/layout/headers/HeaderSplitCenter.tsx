import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderSplitCenter() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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

  const half = Math.ceil(navItems.length / 2);
  const leftNav = navItems.slice(0, half);
  const rightNav = navItems.slice(half);

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm" : "bg-transparent border-b border-transparent"
      )}>
        <div className="container mx-auto px-4">
          <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-[72px]">
            {/* Left nav */}
            <nav className="flex gap-7 justify-end pr-10">
              {leftNav.map((item) => (
                <Link key={item.path} to={item.path} className={cn(
                  "text-sm tracking-wide transition-colors relative group",
                  isActive(item.path) ? "text-accent" : "text-muted-foreground hover:text-accent"
                )}>
                  {item.label}
                  <span className={cn("absolute -bottom-1 left-0 right-0 h-px bg-accent transition-transform origin-center", isActive(item.path) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </Link>
              ))}
            </nav>
            {/* Center logo */}
            <Link to="/" className="flex items-center">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} width={140} height={40} className="h-10 w-auto max-w-[140px] object-contain" />
              ) : (
                <span className={cn("font-serif font-semibold transition-all", isScrolled ? "text-xl" : "text-2xl")}>
                  <span className="text-primary">{primaryPart}</span>
                  {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
                </span>
              )}
            </Link>
            {/* Right nav */}
            <nav className="flex gap-7 pl-10 items-center">
              {rightNav.map((item) => (
                <Link key={item.path} to={item.path} className={cn(
                  "text-sm tracking-wide transition-colors relative group",
                  isActive(item.path) ? "text-accent" : "text-muted-foreground hover:text-accent"
                )}>
                  {item.label}
                  <span className={cn("absolute -bottom-1 left-0 right-0 h-px bg-accent transition-transform origin-center", isActive(item.path) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </Link>
              ))}
              <div className="flex items-center gap-2 ml-3">
                <CurrencySwitcher variant="icon" className="rounded-full" />
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode">
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
                  <Button variant="default" size="sm" onClick={() => navigate('/login')} className="rounded-full ml-2">Book</Button>
                )}
              </div>
            </nav>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center justify-between h-[72px]">
            <Link to="/">
              {logoUrl ? <img src={logoUrl} alt={brandName} width={120} height={32} className="h-8" /> : <span className="text-xl font-serif font-semibold text-primary">{primaryPart}</span>}
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-20 px-6 md:hidden">
          {navItems.filter(i => i.show_on_mobile).map((item) => (
            <Link key={item.path} to={item.path} className="block text-lg py-3 text-foreground" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
          ))}
          {!user && <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="mt-4 w-full rounded-full">Sign In</Button>}
        </div>
      )}
    </>
  );
}
