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
  Sun,
  Moon,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'admin-sidebar-collapsed-sections';
const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

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
    title: 'Operations',
    items: [
      { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
      { href: '/admin/experience-enquiries', icon: MessageSquare, label: 'Enquiries' },
      { href: '/admin/pms', icon: Activity, label: 'PMS Health' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { href: '/admin/properties', icon: Building2, label: 'Properties' },
      { href: '/admin/amenities', icon: Sparkles, label: 'Amenities' },
      { href: '/admin/destinations', icon: MapPin, label: 'Destinations' },
      { href: '/admin/experiences', icon: Star, label: 'Experiences' },
      { href: '/admin/addons', icon: Package, label: 'Add-ons' },
      { href: '/admin/rate-plans', icon: DollarSign, label: 'Rate Plans' },
      { href: '/admin/seasonal-rates-import', icon: Upload, label: 'Seasonal Rates' },
      { href: '/admin/fees', icon: Receipt, label: 'Fees & Taxes' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { href: '/admin/promotions', icon: Tag, label: 'Promotions' },
      { href: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
      { href: '/admin/exit-intent', icon: LogOut, label: 'Exit Intent' },
      { href: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
      { href: '/admin/content-hub', icon: FileText, label: 'Content Hub' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { href: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/navigation', icon: Navigation, label: 'Navigation' },
      { href: '/admin/content', icon: PenLine, label: 'Page Content' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
      { href: '/admin/user-roles', icon: Shield, label: 'User Roles' },
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
    return collapsedSections[sectionTitle] !== true;
  }, [collapsedSections]);

  return { toggleSection, isSectionOpen };
}

function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return { collapsed, toggle };
}

function NavItemLink({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const link = (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl text-sm font-medium transition-colors min-h-[40px]',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2.5',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { brandName, logoUrl } = useBrand();
  const { toggleSection, isSectionOpen } = useCollapsedSections();
  const { theme, setTheme } = useTheme();

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

  const isSectionActive = (section: NavSection) => {
    return section.items.some(item => location.pathname === item.href);
  };

  return (
    <div className="flex flex-col h-full">
      <div className={cn('border-b border-border', collapsed ? 'p-3 flex justify-center' : 'p-6')}>
        <Link to="/admin" className="flex items-center gap-2" onClick={handleNavClick}>
          {collapsed ? (
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">A</span>
          ) : logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <h1 className="text-xl font-serif">
              <span className="text-primary">{primaryPart}</span>
              {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
            </h1>
          )}
          {!collapsed && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
          )}
        </Link>
      </div>

      <nav className={cn('flex-1 space-y-2 overflow-y-auto', collapsed ? 'p-2' : 'p-4')}>
        {navSections.map((section, sectionIndex) => {
          const hasTitle = !!section.title;
          const isOpen = hasTitle ? isSectionOpen(section.title) : true;
          const hasActiveItem = isSectionActive(section);

          if (!hasTitle) {
            return (
              <div key={sectionIndex} className="space-y-1">
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={location.pathname === item.href}
                    collapsed={collapsed}
                    onClick={handleNavClick}
                  />
                ))}
              </div>
            );
          }

          // In collapsed mode, show items directly (no section headers)
          if (collapsed) {
            return (
              <div key={sectionIndex} className="space-y-1 pt-2 border-t border-border first:border-t-0 first:pt-0">
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={location.pathname === item.href}
                    collapsed={collapsed}
                    onClick={handleNavClick}
                  />
                ))}
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
                  {section.items.map((item) => (
                    <NavItemLink
                      key={item.href}
                      item={item}
                      isActive={location.pathname === item.href}
                      collapsed={false}
                      onClick={handleNavClick}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <div className={cn('border-t border-border', collapsed ? 'p-2 space-y-2' : 'p-4 space-y-4')}>
        {!collapsed && (
          <Link to="/" onClick={handleNavClick} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]">
            <ChevronLeft className="h-4 w-4" />
            Back to Website
          </Link>
        )}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'justify-between')}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {!collapsed && (
              <span className="text-xs text-muted-foreground truncate max-w-[110px]">{user?.email}</span>
            )}
          </div>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8" aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-10 w-10" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { brandName, logoUrl } = useBrand();
  const { theme, setTheme } = useTheme();
  const { collapsed, toggle } = useSidebarCollapsed();

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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
          </div>
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
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-muted/30 flex">
        <aside
          className={cn(
            'bg-card border-r border-border flex flex-col shrink-0 transition-all duration-200',
            collapsed ? 'w-14' : 'w-64'
          )}
        >
          <SidebarContent collapsed={collapsed} />
          {/* Collapse toggle */}
          <div className={cn('border-t border-border', collapsed ? 'p-1' : 'px-4 py-2')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className={cn('w-full gap-2 text-muted-foreground hover:text-foreground', collapsed && 'px-0 justify-center')}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="text-xs">Collapse</span>
                </>
              )}
            </Button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-8">
            {children}
          </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
}
