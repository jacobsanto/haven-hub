import { useState } from 'react';
import { MapPin, Star, Users, Bed, Bath, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Property } from '@/types/database';
import { PROPERTY_TYPE_LABELS } from '@/lib/constants';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface VillaCardGridProps {
  property: Property;
  index: number;
  onClick: (property: Property) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function VillaCardGrid({ property, index, onClick, isFavorite, onToggleFavorite }: VillaCardGridProps) {
  const [hovered, setHovered] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const { format: formatCurrency } = useFormatCurrency();

  const images = [property.hero_image_url, ...(property.gallery || [])].filter(Boolean) as string[];
  const displayImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85'];

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-all duration-500',
        hovered ? '-translate-y-1.5 shadow-2xl border-border/80' : 'shadow-lg'
      )}
      style={{ animationDelay: `${index * 0.08}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setImgIdx(0); }}
      onClick={() => onClick(property)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={displayImages[imgIdx]}
          alt={property.name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-700',
            hovered ? 'scale-105' : 'scale-100'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />

        {/* Image dots on hover */}
        {hovered && displayImages.length > 1 && (
          <div
            className="absolute bottom-0 left-0 right-0 grid h-10 z-[5]"
            style={{ gridTemplateColumns: `repeat(${displayImages.length}, 1fr)` }}
          >
            {displayImages.map((_, i) => (
              <div key={i} onMouseEnter={() => setImgIdx(i)} className="cursor-pointer relative">
                <div
                  className={cn(
                    'absolute bottom-2 h-[3px] transition-colors duration-200',
                    i === imgIdx ? 'bg-accent' : 'bg-foreground/20'
                  )}
                  style={{
                    left: '4%',
                    width: '92%',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3.5 left-3.5 flex gap-1.5">
          {property.instant_booking && (
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-500">
              Instant
            </span>
          )}
        </div>

        {/* Fav button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(property.id); }}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-background/50 backdrop-blur-lg border border-border/50 flex items-center justify-center cursor-pointer transition-all hover:bg-background/70 z-10"
        >
          <Heart
            size={16}
            fill={isFavorite ? 'currentColor' : 'none'}
            className={isFavorite ? 'text-destructive' : 'text-muted-foreground'}
          />
        </button>

        {/* Instant Book overlay */}
        {property.instant_booking && hovered && (
          <div className="absolute inset-0 flex items-center justify-center z-[4]">
            <button
              onClick={(e) => { e.stopPropagation(); onInstantBook(property); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
            >
              <Zap size={16} className="fill-current" />
              Instant Book
            </button>
          </div>
        )}

        {/* Price pill */}
        <div className="absolute bottom-3.5 right-3.5 bg-background/70 backdrop-blur-lg rounded-lg px-3 py-1.5 border border-border/30">
          <span className="font-sans text-lg font-bold text-accent">{formatCurrency(property.base_price)}</span>
          <span className="font-sans text-[11px] text-muted-foreground/60"> / night</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 pb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-[11px] tracking-[0.12em] text-accent uppercase flex items-center">
            <MapPin size={11} className="mr-1" />
            {property.city}, {property.country}
          </p>
        </div>

        <h3 className="font-serif text-xl font-semibold text-foreground mb-1 leading-tight">
          {property.display_name || property.name}
        </h3>
        {property.short_description && (
          <p className="font-serif text-[13px] italic text-muted-foreground/60 mb-4">
            {property.short_description}
          </p>
        )}

        <div className="flex gap-4 font-sans text-xs text-muted-foreground">
          <span className="flex items-center"><Users size={13} className="mr-1" />{property.max_guests}</span>
          <span className="flex items-center"><Bed size={13} className="mr-1" />{property.bedrooms}</span>
          <span className="flex items-center"><Bath size={13} className="mr-1" />{property.bathrooms}</span>
          <span className="ml-auto text-muted-foreground/60 text-[11px]">
            {PROPERTY_TYPE_LABELS[property.property_type] || property.property_type}
          </span>
        </div>
      </div>
    </div>
  );
}
