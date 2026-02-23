import { useState, useMemo } from 'react';
import { Search, ArrowLeft, Copy, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Comprehensive icon library organised by amenity-relevant categories
const ICON_CATEGORIES: Record<string, string[]> = {
  Essentials: [
    'Wifi', 'Wind', 'Flame', 'Car', 'ChefHat', 'WashingMachine', 'Plug', 'Key',
    'KeyRound', 'DoorOpen', 'DoorClosed', 'Power', 'PlugZap', 'Lightbulb',
  ],
  Wellness: [
    'Waves', 'Sparkles', 'Bath', 'Thermometer', 'Dumbbell', 'Heart', 'Leaf',
    'Hand', 'Cloud', 'Droplets', 'Flower', 'Stethoscope', 'Activity',
  ],
  Views: [
    'Ship', 'Mountain', 'Umbrella', 'Flower2', 'Sunrise', 'Sun', 'Moon',
    'Trees', 'Cloudy', 'Rainbow', 'MountainSnow', 'Sunset',
  ],
  Outdoors: [
    'TreeDeciduous', 'Home', 'Building', 'TreePine', 'Flag', 'Palmtree',
    'Fence', 'Tent', 'Landmark', 'Map', 'Compass',
  ],
  Services: [
    'Bell', 'Crown', 'UtensilsCrossed', 'Plane', 'Phone', 'Headphones',
    'Users', 'ConciergeBell', 'Truck', 'MapPin', 'Mail', 'Calendar',
  ],
  'Food & Drink': [
    'Wine', 'Coffee', 'CupSoda', 'Croissant', 'Salad', 'IceCreamCone',
    'Martini', 'Grape', 'Beef', 'Pizza', 'Soup', 'Cherry',
  ],
  Entertainment: [
    'Clapperboard', 'Gamepad2', 'Music', 'BookOpen', 'Tv', 'Radio',
    'Bike', 'Sailboat', 'Volleyball', 'Fish', 'Palette', 'Dice1',
  ],
  Technology: [
    'Smartphone', 'Zap', 'Monitor', 'Laptop', 'Router', 'Camera',
    'Printer', 'BatteryCharging', 'Cable', 'Bluetooth', 'Cast', 'Cpu',
  ],
  Safety: [
    'Shield', 'ShieldCheck', 'ShieldAlert', 'Lock', 'LockKeyhole', 'ScanFace',
    'Siren', 'FlameKindling', 'BriefcaseMedical', 'Eye', 'Fingerprint',
    'Cctv', 'AlertTriangle', 'BadgeAlert', 'ShieldOff', 'KeySquare',
    'CircleAlert', 'Ban', 'Alarm', 'ScanLine',
  ],
  'Family & Accessibility': [
    'PawPrint', 'Baby', 'Accessibility', 'HeartHandshake', 'PersonStanding',
    'Footprints', 'Users', 'UserPlus',
  ],
  Luxury: [
    'Gem', 'Star', 'Award', 'Diamond', 'Coins', 'Sparkle', 'BadgeCheck',
    'Trophy', 'Crown', 'Ribbon',
  ],
  Storage: [
    'Archive', 'Box', 'Vault', 'Refrigerator', 'AirVent', 'Fan', 'Heater',
    'Shirt', 'Scissors', 'Iron', 'Package', 'FolderLock',
  ],
  Transport: [
    'CarFront', 'Bus', 'TrainFront', 'PlaneTakeoff', 'Anchor', 'Bike',
    'Ship', 'Fuel', 'ParkingSquare',
  ],
};

const ALL_CATEGORIES = Object.keys(ICON_CATEGORIES);

function getIconComponent(iconName: string): LucideIcon | null {
  const IconComp = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return IconComp || null;
}

export default function AdminIconLibrary() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const { toast } = useToast();

  // Build flat list with category info
  const allIcons = useMemo(() => {
    const icons: { name: string; category: string }[] = [];
    const seen = new Set<string>();
    for (const [category, names] of Object.entries(ICON_CATEGORIES)) {
      for (const name of names) {
        if (!seen.has(name)) {
          seen.add(name);
          icons.push({ name, category });
        }
      }
    }
    return icons;
  }, []);

  const filteredIcons = useMemo(() => {
    return allIcons.filter((icon) => {
      const matchesSearch = !search || icon.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || icon.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allIcons, search, categoryFilter]);

  // Group filtered icons by category
  const groupedIcons = useMemo(() => {
    const groups: Record<string, typeof filteredIcons> = {};
    for (const icon of filteredIcons) {
      if (!groups[icon.category]) groups[icon.category] = [];
      groups[icon.category].push(icon);
    }
    return groups;
  }, [filteredIcons]);

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedIcon(name);
    toast({ title: 'Copied!', description: `"${name}" copied to clipboard.` });
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/admin/amenities">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-serif font-medium">Icon Library</h1>
                <p className="text-muted-foreground">
                  Browse {allIcons.length} icons available for amenities
                </p>
              </div>
            </div>
            <Link to="/admin/amenities">
              <Button variant="outline" className="rounded-full">
                Back to Amenities
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="card-organic p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons by name (e.g. shield, lock, wifi)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-base"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                categoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              All ({allIcons.length})
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const count = allIcons.filter((i) => i.category === cat).length;
              const isSafety = cat === 'Safety';
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground'
                      : isSafety
                        ? 'bg-destructive/10 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/20'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {isSafety ? '🛡️ ' : ''}{cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Results summary */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredIcons.length} of {allIcons.length} icons
            {search && ` matching "${search}"`}
            {categoryFilter !== 'all' && ` in ${categoryFilter}`}
          </p>

          {/* Icon Grid grouped by category */}
          <ScrollArea className="h-[calc(100vh-380px)]">
            {Object.keys(groupedIcons).length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No icons match your search. Try a different term.
              </div>
            ) : (
              <div className="space-y-8 pr-4">
                {Object.entries(groupedIcons)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, icons]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                        {category}
                        <Badge variant="secondary" className="text-xs">{icons.length}</Badge>
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {icons.map((icon) => {
                          const IconComp = getIconComponent(icon.name);
                          if (!IconComp) return null;
                          const isCopied = copiedIcon === icon.name;
                          return (
                            <button
                              key={icon.name}
                              type="button"
                              onClick={() => handleCopyName(icon.name)}
                              className={cn(
                                'group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer',
                                isCopied && 'border-primary bg-primary/10'
                              )}
                              title={`Click to copy: ${icon.name}`}
                            >
                              <IconComp className="h-6 w-6 text-foreground/70 group-hover:text-primary transition-colors" />
                              <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">
                                {icon.name}
                              </span>
                              {isCopied && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl">
                                  <Check className="h-5 w-5 text-primary" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
