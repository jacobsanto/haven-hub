import { Link, useNavigate, useLocation } from 'react-router-dom';
import { X, User, Moon, Sun, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { cn } from '@/lib/utils';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderFullOverlay() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovItem, setHovItem] = useState<string | null>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName, logoUrl, contactEmail, contactPhone } = useBrand();
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
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all",
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/50" : "bg-transparent",
      )}>
        <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
          <Link to="/">
            {logoUrl ? <img src={logoUrl} alt={brandName} width={140} height={40} className="h-10 w-auto object-contain" /> : (
              <span className="text-xl font-serif font-semibold">
                <span className={isScrolled ? "text-primary" : "text-primary-foreground"}>{primaryPart}</span>
                {secondaryPart && <span className={isScrolled ? "text-muted-foreground" : "text-primary-foreground/70"}> {secondaryPart}</span>}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={() => navigate('/properties')} className="rounded-full">Book Now</Button>
            {/* Hamburger */}
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className={cn(
                "w-10 h-10 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors",
                isScrolled ? "border-border bg-muted/50 hover:border-accent" : "border-primary-foreground/20 hover:border-primary-foreground/50"
              )}
            >
              <span className={cn("w-4 h-0.5 rounded", isScrolled ? "bg-foreground" : "bg-primary-foreground")} />
              <span className={cn("w-3 h-0.5 rounded", isScrolled ? "bg-accent" : "bg-accent")} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background"
          >
            <div className="container mx-auto px-4 h-full flex flex-col">
              <div className="flex items-center justify-between h-[72px]">
                <Link to="/" onClick={() => setOpen(false)}>
                  {logoUrl ? <img src={logoUrl} alt={brandName} width={140} height={40} className="h-10 w-auto object-contain" /> : (
                    <span className="text-xl font-serif font-semibold text-primary">{primaryPart}</span>
                  )}
                </Link>
                <button aria-label="Close menu" onClick={() => setOpen(false)} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:border-accent transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 flex items-center">
                <div className="w-full max-w-2xl">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setHovItem(item.label)}
                        onMouseLeave={() => setHovItem(null)}
                        className="flex items-center justify-between py-5 border-b border-border group"
                      >
                        <span className={cn(
                          "font-serif text-3xl md:text-4xl font-semibold transition-all",
                          hovItem === item.label ? "text-accent" : "text-foreground"
                        )}>{item.label}</span>
                        <ArrowRight className={cn(
                          "h-5 w-5 text-accent transition-all",
                          hovItem === item.label ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                        )} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pb-8 flex items-center justify-between text-sm text-muted-foreground">
                <span>{contactEmail}</span>
                <span>{contactPhone}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  {user && isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => { navigate('/admin'); setOpen(false); }}>Admin</Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
