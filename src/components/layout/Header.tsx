import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { brandName } = useBrand();
  const navigate = useNavigate();

  // Split brand name for styling (e.g., "Arivia Villas" -> "Arivia" + "Villas")
  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-serif font-semibold text-foreground"
          >
            <span className="text-primary">{primaryPart}</span>
            {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/properties"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Properties
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Auth / Admin */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
            <Link
              to="/properties"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Properties
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-primary"
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
                  className="text-sm font-medium text-muted-foreground hover:text-foreground text-left"
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
