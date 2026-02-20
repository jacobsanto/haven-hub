import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyHighlightsProps {
  highlights: string[];
  variant?: 'badges' | 'list' | 'compact';
  className?: string;
}

// Map common highlight keywords to icons
const highlightIconMap: Record<string, string> = {
  beachfront: 'Umbrella',
  oceanview: 'Waves',
  'ocean view': 'Waves',
  'sea view': 'Ship',
  'mountain view': 'Mountain',
  'city view': 'Building2',
  pool: 'Waves',
  'private pool': 'Waves',
  'infinity pool': 'Waves',
  spa: 'Sparkles',
  gym: 'Dumbbell',
  fitness: 'Dumbbell',
  chef: 'ChefHat',
  "chef's kitchen": 'ChefHat',
  'private chef': 'ChefHat',
  garden: 'Flower2',
  terrace: 'TreeDeciduous',
  balcony: 'Home',
  fireplace: 'Flame',
  'hot tub': 'Bath',
  jacuzzi: 'Bath',
  sauna: 'Thermometer',
  'wine cellar': 'Wine',
  cinema: 'Film',
  'home theater': 'Film',
  butler: 'Bell',
  concierge: 'Bell',
  'pet friendly': 'PawPrint',
  'kids friendly': 'Baby',
  accessible: 'Accessibility',
  parking: 'Car',
  garage: 'Car',
  helipad: 'Plane',
  dock: 'Anchor',
  boat: 'Ship',
  tennis: 'CircleDot',
  golf: 'Flag',
  yacht: 'Ship',
  island: 'TreePalm',
  sunset: 'Sunset',
  sunrise: 'Sunrise',
  historic: 'Landmark',
  modern: 'Hexagon',
  luxury: 'Crown',
  exclusive: 'Star',
  secluded: 'Lock',
  private: 'Shield',
};

function getIconForHighlight(highlight: string): LucideIcon {
  const lowercased = highlight.toLowerCase();
  
  for (const [keyword, iconName] of Object.entries(highlightIconMap)) {
    if (lowercased.includes(keyword)) {
      const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
      if (IconComponent) return IconComponent;
    }
  }
  
  return Sparkles;
}

export function PropertyHighlights({
  highlights,
  variant = 'badges',
  className,
}: PropertyHighlightsProps) {
  if (!highlights || highlights.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {highlights.slice(0, 4).map((highlight, index) => {
          const Icon = getIconForHighlight(highlight);
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border/50 text-foreground rounded-full"
            >
              <Icon className="h-3 w-3 text-foreground/60" />
              {highlight}
            </span>
          );
        })}
        {highlights.length > 4 && (
          <span className="text-xs px-2.5 py-1 border border-border/50 rounded-full text-muted-foreground">
            +{highlights.length - 4} more
          </span>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <ul className={cn('space-y-3', className)}>
        {highlights.map((highlight, index) => {
          const Icon = getIconForHighlight(highlight);
          return (
            <li key={index} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-foreground">{highlight}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  // Default: badges variant — clean two-column grid
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {highlights.map((highlight, index) => {
        const Icon = getIconForHighlight(highlight);
        return (
          <div
            key={index}
            className="flex items-center gap-3 py-2"
          >
            <Icon className="h-4 w-4 text-foreground/50 flex-shrink-0" />
            <span className="text-sm text-foreground">{highlight}</span>
          </div>
        );
      })}
    </div>
  );
}
