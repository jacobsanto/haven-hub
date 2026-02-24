import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  CalendarDays,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Settings,
  Sparkles,
  Menu,
  MapPin,
  Star,
  MessageSquare,
  FileText,
  FolderOpen,
  Users,
  Mail,
  Package,
  Tag,
  Receipt,
  TrendingUp,
  Activity,
  DollarSign,
  Upload,
  Megaphone,
  Shield,
  PenLine,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'admin-sidebar-collapsed-sections';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Booking Engine',
    items: [
      { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
      { href: '/admin/addons', icon: Package, label: 'Add-ons' },
      { href: '/admin/promotions', icon: Tag, label: 'Promotions' },
      { href: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
      { href: '/admin/exit-intent', icon: LogOut, label: 'Exit Intent' },
      { href: '/admin/fees', icon: Receipt, label: 'Fees & Taxes' },
      { href: '/admin/rate-plans', icon: DollarSign, label: 'Rate Plans' },
      { href: '/admin/seasonal-rates-import', icon: Upload, label: 'Import Rates' },
    ],
  },
  {
    title: 'Properties',
    items: [
      { href: '/admin/properties', icon: Building2, label: 'Properties' },
      { href: '/admin/destinations', icon: MapPin, label: 'Destinations' },
      { href: '/admin/amenities', icon: Sparkles, label: 'Amenities' },
    ],
  },
  {
    title: 'Experiences',
    items: [
      { href: '/admin/experiences', icon: Star, label: 'Experiences' },
      { href: '/admin/experience-enquiries', icon: MessageSquare, label: 'Enquiries' },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/content', icon: PenLine, label: 'Page Content' },
      { href: '/admin/ai-content', icon: Sparkles, label: 'AI Generator' },
      { href: '/admin/content-calendar', icon: CalendarDays, label: 'Content Calendar' },
      { href: '/admin/blog', icon: FileText, label: 'Blog Posts' },
      { href: '/admin/blog/authors', icon: Users, label: 'Authors' },
      { href: '/admin/blog/categories', icon: FolderOpen, label: 'Categories' },
      { href: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/pms', icon: Activity, label: 'PMS Health' },
      { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
      { href: '/admin/user-roles', icon: Shield, label: 'User Roles' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function useCollapsedSections() {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = useCallback((sectionTitle: string) => {
    setCollapsedSections(prev => {
      const updated = { ...prev, [sectionTitle]: !prev[sectionTitle] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isSectionOpen = useCallback((sectionTitle: string) => {
    // Default to open if not explicitly collapsed
    return collapsedSections[sectionTitle] !== true;
  }, [collapsedSections]);

  return { toggleSection, isSectionOpen };
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const { toggleSection, isSectionOpen } = useCollapsedSections();

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

  // Check if any item in a section is active
  const isSectionActive = (section: NavSection) => {
    return section.items.some(item => location.pathname === item.href);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={handleNavClick}>
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <h1 className="text-xl font-serif">
              <span className="text-primary">{primaryPart}</span>
              {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
            </h1>
          )}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navSections.map((section, sectionIndex) => {
          const hasTitle = !!section.title;
          const isOpen = hasTitle ? isSectionOpen(section.title) : true;
          const hasActiveItem = isSectionActive(section);

          // Sections without title render directly
          if (!hasTitle) {
            return (
              <div key={sectionIndex} className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[40px]',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          }

          return (
            <Collapsible
              key={sectionIndex}
              open={isOpen}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-muted/50 min-h-[36px]',
                    hasActiveItem && !isOpen
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {section.title}
                    {hasActiveItem && !isOpen && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <div className="space-y-1 pt-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[40px]',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-4">
        <Link to="/" onClick={handleNavClick} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back to Website
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-10 w-10" aria-label="Sign out">
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
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link to="/admin" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="h-6 w-auto max-w-[80px] object-contain" />
              ) : (
                <h1 className="text-lg font-serif">
                  <span className="text-primary">{primaryPart}</span>
                  {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
                </h1>
              )}
            </Link>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
        </header>

        <main className="flex-1 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
            {children}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <SidebarContent />
      </aside>
      <main className="flex-1 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}
