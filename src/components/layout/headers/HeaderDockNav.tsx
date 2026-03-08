import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Search, Moon, Sun, Home, Globe, Compass, BookOpen, Heart, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const DOCK_ICONS: Record<string, any> = {
  '/': Home, '/properties': Layers, '/destinations': Globe,
  '/experiences': Compass, '/blog': BookOpen, '/about': Heart,
};

export function HeaderDockNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hovItem, setHovItem] = useState<string | null>(null);
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
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <>
      {/* Top bar */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all",
        isScrolled ? "bg-background/90 backdrop-blur-md" : "bg-transparent"
      )}>
        <div className="container mx-auto px-4 h-[56px] flex items-center justify-between">
          <Link to="/">
            {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : (
              <span className="text-lg font-serif font-medium text-primary">{primaryPart}</span>
            )}
          </Link>
          <div className="flex items-center gap-2">
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
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Dock */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 hidden md:flex gap-1.5 px-4 py-2.5 bg-card/85 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl">
        {navItems.map(item => {
          const Icon = DOCK_ICONS[item.path] || Globe;
          const isHov = hovItem === item.path;
          const isAct = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => setHovItem(item.path)}
              onMouseLeave={() => setHovItem(null)}
              className="relative flex flex-col items-center"
            >
              <div className={cn(
                "flex items-center justify-center rounded-xl border transition-all duration-300",
                isHov ? "w-12 h-12 bg-accent/15 border-accent -translate-y-2 scale-110" : "w-10 h-10 bg-muted/50 border-border",
                isAct && !isHov && "border-accent/50"
              )}>
                <Icon className={cn("transition-all", isHov ? "h-5 w-5 text-accent" : "h-4 w-4 text-muted-foreground")} />
              </div>
              {isHov && (
                <span className="absolute -bottom-5 text-[9px] font-mono text-accent whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

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
