import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  CalendarDays,
  LogOut,
  ChevronLeft,
  Settings,
  Sparkles,
  Menu,
  MapPin,
  Star,
  MessageSquare,
  FileText,
  FolderOpen,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/properties', icon: Building2, label: 'Properties' },
  { href: '/admin/destinations', icon: MapPin, label: 'Destinations' },
  { href: '/admin/experiences', icon: Star, label: 'Experiences' },
  { href: '/admin/experience-enquiries', icon: MessageSquare, label: 'Enquiries' },
  { href: '/admin/blog', icon: FileText, label: 'Blog Posts' },
  { href: '/admin/blog/authors', icon: Users, label: 'Blog Authors' },
  { href: '/admin/blog/categories', icon: FolderOpen, label: 'Blog Categories' },
  { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/admin/availability', icon: CalendarDays, label: 'Availability' },
  { href: '/admin/amenities', icon: Sparkles, label: 'Amenities' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { brandName, logoUrl } = useBrand();

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={handleNavClick}>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={brandName} 
              className="h-8 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <h1 className="text-xl font-serif">
              <span className="text-primary">{primaryPart}</span>
              {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
            </h1>
          )}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <Link
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Website
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-10 w-10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { brandName, logoUrl } = useBrand();

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');

  if (isMobile) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link to="/admin" className="flex items-center gap-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={brandName} 
                  className="h-6 w-auto max-w-[80px] object-contain"
                />
              ) : (
                <h1 className="text-lg font-serif">
                  <span className="text-primary">{primaryPart}</span>
                  {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
                </h1>
              )}
            </Link>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Admin
          </span>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 md:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
