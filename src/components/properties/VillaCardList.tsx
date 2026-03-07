import { useState } from 'react';
import { MapPin, Star, Users, Bed, Bath, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Property } from '@/types/database';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface VillaCardListProps {
  property: Property;
  index: number;
  onClick: (property: Property) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function VillaCardList({ property, index, onClick, isFavorite, onToggleFavorite }: VillaCardListProps) {
  const [hovered, setHovered] = useState(false);
  const { format: formatCurrency } = useFormatCurrency();

  const heroImage = property.hero_image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85';

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-[360px_1fr] bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-400',
        hovered ? 'border-border/80' : ''
      )}
      style={{ animationDelay: `${index * 0.06}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(property)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={heroImage}
          alt={property.name}
          className={cn(
            'w-full h-full object-cover min-h-[220px] transition-transform duration-600',
            hovered ? 'scale-[1.04]' : 'scale-100'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/80 hidden md:block" />

        <div className="absolute top-3.5 left-3.5 flex gap-1.5">
          {property.instant_booking && (
            <span className="text-[10px] font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-500">
              Instant
            </span>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(property.id); }}
          className="absolute top-3.5 right-3.5 w-[34px] h-[34px] rounded-full bg-background/50 border border-border/50 flex items-center justify-center cursor-pointer"
        >
          <Heart
            size={15}
            fill={isFavorite ? 'currentColor' : 'none'}
            className={isFavorite ? 'text-destructive' : 'text-muted-foreground'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 md:px-7 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-[11px] tracking-[0.12em] text-accent uppercase flex items-center">
            <MapPin size={11} className="mr-1" />
            {property.city}, {property.country}
          </p>
        </div>

        <h3 className="font-serif text-[22px] font-semibold text-foreground mb-1">
          {property.display_name || property.name}
        </h3>
        {property.short_description && (
          <p className="font-serif text-sm italic text-muted-foreground/60 mb-3">
            {property.short_description}
          </p>
        )}
        {property.description && (
          <p className="font-sans text-[13px] text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {property.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-4 font-sans text-xs text-muted-foreground">
            <span className="flex items-center"><Users size={13} className="mr-1" />{property.max_guests}</span>
            <span className="flex items-center"><Bed size={13} className="mr-1" />{property.bedrooms}</span>
            <span className="flex items-center"><Bath size={13} className="mr-1" />{property.bathrooms}</span>
            {property.area_sqm && <span>{property.area_sqm}m²</span>}
          </div>
          <div>
            <span className="font-sans text-[22px] font-medium text-accent">{formatCurrency(property.base_price)}</span>
            <span className="font-sans text-xs text-muted-foreground/60"> / night</span>
          </div>
        </div>
      </div>
    </div>
  );
}
