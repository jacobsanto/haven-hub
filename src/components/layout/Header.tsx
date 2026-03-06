import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, Search, Heart, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { HeaderSearchBar } from '@/components/search/HeaderSearchBar';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomepage = location.pathname === '/';
  const isTransparent = isHomepage && !isScrolled && !mobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: navItems = [] } = useNavigationItems('header');

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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
      )}
    >
      <nav role="navigation" aria-label="Main navigation" className="container mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
        {/* Logo + Nav Links */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 mr-4">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[140px] object-contain" />
              ) : (
                <span className={cn(
                  "text-xl font-serif font-semibold transition-colors duration-300",
                  isTransparent ? "text-primary-foreground" : "text-foreground"
                )}>
                  <span className={isTransparent ? "text-primary-foreground" : "text-primary"}>{primaryPart}</span>
                  {secondaryPart && <span className={isTransparent ? "text-primary-foreground/80" : "text-muted-foreground"}> {secondaryPart}</span>}
                </span>
              )}
            </motion.div>
          </Link>
          {navItems.map((item, index) => (
            <div key={item.path + item.label} className={cn("flex items-center", !item.priority && "hidden xl:flex")}>
              {index > 0 && (
                <span className={cn(
                  "mx-2 text-xs select-none",
                  isTransparent ? "text-primary-foreground/30" : "text-border"
                )}>|</span>
              )}
              <Link
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={cn(
                  "text-sm font-medium transition-colors whitespace-nowrap tracking-wide",
                  isTransparent
                    ? isActive(item.path) ? "text-primary-foreground" : "text-primary-foreground/80 hover:text-primary-foreground"
                    : isActive(item.path) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Search Bar - Center (hidden on homepage) */}
        {!isHomepage && (
          <div className="hidden lg:flex flex-1 justify-center min-w-0">
            <HeaderSearchBar />
          </div>
        )}

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <CurrencySwitcher variant="icon" className={cn("rounded-full", isTransparent && "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10")} />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full",
              isTransparent && "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            )}
            aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full",
                    isTransparent && "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
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
              variant={isTransparent ? "outline" : "gold"}
              onClick={() => navigate('/login')}
              className={cn(
                "rounded-full",
                isTransparent && "border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              )}
            >
              Log In
            </Button>
          )}
        </div>

        {/* Mobile Logo */}
        <Link to="/" className="flex items-center gap-2 md:hidden">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[140px] object-contain" />
            ) : (
              <span className={cn(
                "text-xl font-serif font-semibold transition-colors duration-300",
                isTransparent ? "text-primary-foreground" : "text-foreground"
              )}>
                <span className={isTransparent ? "text-primary-foreground" : "text-primary"}>{primaryPart}</span>
                {secondaryPart && <span className={isTransparent ? "text-primary-foreground/80" : "text-muted-foreground"}> {secondaryPart}</span>}
              </span>
            )}
          </motion.div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className={cn("md:hidden p-2", isTransparent && "text-primary-foreground")}
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
            <Button
              variant="gold"
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

            {navItems.filter(item => item.show_on_mobile).map((item) => (
              <Link
                key={item.path + item.label}
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
