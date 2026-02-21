import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { HeaderSearchToggle } from '@/components/booking/HeaderSearchToggle';
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

  // Scroll threshold: 60px as specified
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    handleScroll(); // check on mount
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showSearch = location.pathname !== '/';
  const isHomepage = location.pathname === '/';

  // Transparent-over-hero only on homepage
  const isTransparent = isHomepage && !isScrolled;

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "transition-[background-color,border-color,backdrop-filter] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]",
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-white/95 dark:bg-background/95 backdrop-blur-[14px] border-b border-border/40 shadow-soft"
      )}
    >
      <nav role="navigation" aria-label="Main navigation" className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.4, 1] }}
            className="flex items-center"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                className={cn(
                  "h-10 w-auto max-w-[160px] object-contain transition-[filter] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]",
                  isTransparent ? "brightness-0 invert" : ""
                )}
              />
            ) : (
              <span className={cn(
                "text-2xl font-serif font-semibold transition-colors [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]",
                isTransparent ? "text-white" : "text-foreground"
              )}>
                <span className={cn(
                  isTransparent ? "text-white" : "text-primary"
                )}>{primaryPart}</span>
                {secondaryPart && (
                  <span className={cn(
                    isTransparent ? "text-white/80" : "text-muted-foreground"
                  )}> {secondaryPart}</span>
                )}
              </span>
            )}
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={cn(
                "text-sm font-medium relative",
                "transition-colors [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]",
                "after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:transition-all after:duration-300",
                "hover:after:w-full focus-visible:after:w-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm",
                isTransparent
                  ? cn(
                      "after:bg-white",
                      isActive(item.path)
                        ? "text-white after:w-full"
                        : "text-white/70 hover:text-white"
                    )
                  : cn(
                      "after:bg-primary",
                      isActive(item.path)
                        ? "text-foreground after:w-full"
                        : "text-muted-foreground hover:text-foreground"
                    )
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Search, Currency & Auth */}
        <div className="hidden md:flex items-center gap-2">
          {showSearch && <HeaderSearchToggle />}
          <CurrencySwitcher variant="icon" />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full",
                    isTransparent && "text-white hover:bg-white/10"
                  )}
                  aria-label="User menu"
                >
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
              className={cn(
                "rounded-full",
                isTransparent && "border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white"
              )}
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={cn(
            "md:hidden p-2 transition-colors [transition-duration:var(--duration-hover)]",
            isTransparent ? "text-white" : "text-foreground"
          )}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu — always solid background */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white/95 dark:bg-background/95 backdrop-blur-[14px] border-b border-border/40"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
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
