import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { HeaderSearchBar } from '@/components/search/HeaderSearchBar';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { label: 'Properties', path: '/properties' },
  { label: 'Destinations', path: '/destinations' },
  { label: 'Experiences', path: '/experiences' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();

  // Track scroll position for header style changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search bar is always visible in the header

  // Split brand name for styling (e.g., "Arivia Villas" -> "Arivia" + "Villas")
  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  // Check if a path is currently active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav role="navigation" aria-label="Main navigation" className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo + Nav */}
        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={brandName} 
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <span className="text-2xl font-serif font-semibold text-foreground">
                  <span className="text-primary">{primaryPart}</span>
                  {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
                </span>
              )}
            </motion.div>
          </Link>
          <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={cn(
                "text-sm font-medium transition-colors relative",
                "after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300",
                "hover:after:w-full focus-visible:after:w-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm",
                isActive(item.path)
                  ? "text-foreground after:w-full"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          </div>
        </div>

        {/* Search Bar - Center */}
        <div className="hidden lg:flex flex-1 justify-center min-w-0">
          <HeaderSearchBar />
        </div>

        {/* Currency & Auth */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <CurrencySwitcher variant="icon" />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                <DropdownMenuItem className="text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="rounded-full"
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Logo (visible only on mobile) */}
        <Link to="/" className="flex items-center gap-2 md:hidden">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[140px] object-contain" />
            ) : (
              <span className="text-xl font-serif font-semibold text-foreground">
                <span className="text-primary">{primaryPart}</span>
                {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
              </span>
            )}
          </motion.div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-background border-b border-border"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {/* Mobile Search CTA */}
            <Button
              onClick={() => {
                navigate('/properties');
                setMobileMenuOpen(false);
              }}
              className="rounded-full w-full gap-2"
            >
              <Search className="h-4 w-4" />
              Find Your Stay
            </Button>

            <div className="border-t border-border my-2" />

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={cn(
                  "text-sm font-medium py-2",
                  isActive(item.path)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-primary py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground text-left py-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="rounded-full w-fit"
              >
                Sign In
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
