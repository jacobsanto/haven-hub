import { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

// Curated list of icons relevant to property amenities
const AMENITY_ICONS = [
  // Essentials
  'Wifi', 'Wind', 'Flame', 'Car', 'ChefHat', 'WashingMachine', 'Plug', 'Key',
  // Wellness
  'Waves', 'Sparkles', 'Bath', 'Thermometer', 'Dumbbell', 'Heart', 'Leaf', 'Hand', 'Cloud',
  // Views
  'Ship', 'Mountain', 'Umbrella', 'Flower2', 'Sunrise', 'Sun', 'Moon', 'Trees',
  // Outdoors
  'TreeDeciduous', 'Home', 'Building', 'TreePine', 'Flag', 'Circle', 'Palmtree',
  // Services
  'Bell', 'Crown', 'UtensilsCrossed', 'Plane', 'Phone', 'Headphones', 'Users',
  // Entertainment
  'Clapperboard', 'Gamepad2', 'Music', 'BookOpen', 'Wine', 'Tv', 'Radio',
  // Technology
  'Smartphone', 'Zap', 'Monitor', 'Laptop', 'Router', 'Camera',
  // Family & Accessibility
  'PawPrint', 'Baby', 'Accessibility', 'HeartHandshake',
  // Luxury
  'Gem', 'Star', 'Award', 'Diamond', 'Coins',
  // General
  'Check', 'Plus', 'Settings', 'Gift', 'Package', 'Shield', 'Lock',
] as const;

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return AMENITY_ICONS;
    return AMENITY_ICONS.filter((icon) =>
      icon.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const getIconComponent = (iconName: string): LucideIcon | null => {
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
    return IconComponent || null;
  };

  const SelectedIcon = getIconComponent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start gap-2', className)}
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4" />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select an icon...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[280px]">
          <div className="grid grid-cols-6 gap-1 p-3">
            {filteredIcons.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              if (!IconComponent) return null;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors',
                    value === iconName && 'bg-primary text-primary-foreground'
                  )}
                  title={iconName}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No icons found
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Helper component to render an icon by name
interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  
  if (!IconComponent) {
    const FallbackIcon = LucideIcons.Sparkles;
    return <FallbackIcon className={className} />;
  }

  return <IconComponent className={className} />;
}
