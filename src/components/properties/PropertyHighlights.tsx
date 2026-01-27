import { motion } from 'framer-motion';
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
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
            >
              <Icon className="h-3 w-3" />
              {highlight}
            </span>
          );
        })}
        {highlights.length > 4 && (
          <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
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
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <span className="text-foreground">{highlight}</span>
            </motion.li>
          );
        })}
      </ul>
    );
  }

  // Default: badges variant
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {highlights.map((highlight, index) => {
        const Icon = getIconForHighlight(highlight);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full"
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{highlight}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
