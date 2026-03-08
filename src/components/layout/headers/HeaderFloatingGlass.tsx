import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, Search, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function HeaderFloatingGlass() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: navItems = [] } = useNavigationItems('header');

  useEffect(() => {
    let raf: number;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setIsScrolled(window.scrollY > 80)); };
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
      <header
        className={cn(
          "fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-500 flex items-center justify-between",
          isScrolled
            ? "top-2 w-[94%] max-w-[1200px] px-6 py-2.5 bg-background/85 backdrop-blur-xl border border-border/30 rounded-2xl shadow-lg"
            : "top-4 w-[90%] max-w-[1200px] px-8 py-3.5 bg-background/40 backdrop-blur-xl border border-border/10 rounded-[20px]"
        )}
      >
        <Link to="/" className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <span className="text-lg font-serif font-medium">
              <span className="text-primary">{primaryPart}</span>
              {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
            </span>
          )}
        </Link>

        <nav className="hidden md:flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                "px-4 py-2 rounded-xl text-sm transition-all",
                isActive(item.path)
                  ? "text-accent bg-accent/10"
                  : "text-muted-foreground hover:text-accent hover:bg-accent/5"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <CurrencySwitcher variant="icon" className="rounded-xl" />
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl"><User className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                <DropdownMenuItem className="text-muted-foreground">{user.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin')}>Admin Dashboard</DropdownMenuItem>}
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/login')} className="rounded-xl">Book</Button>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6">
          <div className="flex flex-col gap-4">
            {navItems.filter(i => i.show_on_mobile).map((item) => (
              <Link key={item.path} to={item.path} className="text-lg font-medium py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
            {user ? (
              <>
                {isAdmin && <Link to="/admin" className="text-lg font-medium py-2 text-primary" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
                <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="text-lg text-muted-foreground text-left py-2">Sign Out</button>
              </>
            ) : (
              <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="rounded-xl mt-4">Sign In</Button>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
