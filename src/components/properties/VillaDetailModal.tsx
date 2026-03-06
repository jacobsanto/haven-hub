import { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import {
  X, Heart, Share2, ChevronLeft, ChevronRight, MapPin,
  Users, Bed, Bath, Expand, Star, Calendar, ArrowRight, Check,
  Wifi, Waves, Car, UtensilsCrossed, Wind, Tv, Sparkles, Mountain, TreePine, Sun, Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Property } from '@/types/database';
import { Button } from '@/components/ui/button';
import { AMENITY_LABELS, Amenity } from '@/lib/constants';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

const AMENITY_ICON_MAP: Record<string, React.ElementType> = {
  'wifi': Wifi, 'pool': Waves, 'spa': Sparkles, 'kitchen': UtensilsCrossed,
  'air-conditioning': Wind, 'parking': Car, 'ocean-view': Waves, 'mountain-view': Mountain,
  'garden': TreePine, 'terrace': Sun, 'fireplace': Coffee, 'gym': Mountain, 'hot-tub': Waves,
  'balcony': Sun, 'heating': Wind, 'sauna': Wind, 'laundry': Wind,
  'beach-access': Waves, 'concierge': Star, 'room-service': UtensilsCrossed,
  'restaurant': UtensilsCrossed, 'bar': Coffee, 'pet-friendly': Star,
  'kids-friendly': Star, 'wheelchair-accessible': Star, 'tv': Tv,
};

interface VillaDetailModalProps {
  property: Property | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function VillaDetailModal({ property, onClose, isFavorite, onToggleFavorite }: VillaDetailModalProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState<'overview' | 'amenities' | 'highlights'>('overview');
  const { openBooking } = useBooking();
  const { format: formatCurrency } = useFormatCurrency();

  useEffect(() => {
    if (property) {
      document.body.style.overflow = 'hidden';
      setImgIdx(0);
      setTab('overview');
    }
    return () => { document.body.style.overflow = ''; };
  }, [property]);

  if (!property) return null;

  const images = [property.hero_image_url, ...(property.gallery || [])].filter(Boolean) as string[];
  const displayImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85'];

  const handleBooking = () => {
    onClose();
    openBooking({ mode: 'direct', property });
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-foreground/70 backdrop-blur-sm flex justify-center items-start overflow-y-auto py-10 px-5 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-muted border border-border rounded-2xl w-full max-w-[1000px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gallery */}
        <div className="relative aspect-[21/9] overflow-hidden">
          <img
            src={displayImages[imgIdx]}
            alt={property.name}
            className="w-full h-full object-cover transition-opacity duration-400"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-muted via-transparent to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-lg border border-border/50 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          {/* Actions */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={() => onToggleFavorite(property.id)}
              className="w-10 h-10 rounded-full bg-background/60 border border-border/50 flex items-center justify-center cursor-pointer"
            >
              <Heart
                size={16}
                fill={isFavorite ? 'currentColor' : 'none'}
                className={isFavorite ? 'text-destructive' : 'text-muted-foreground'}
              />
            </button>
            <button className="w-10 h-10 rounded-full bg-background/60 border border-border/50 flex items-center justify-center cursor-pointer text-muted-foreground">
              <Share2 size={16} />
            </button>
          </div>

          {/* Gallery nav */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx((i) => (i - 1 + displayImages.length) % displayImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/50 border border-border/50 flex items-center justify-center cursor-pointer text-muted-foreground"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setImgIdx((i) => (i + 1) % displayImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/50 border border-border/50 flex items-center justify-center cursor-pointer text-muted-foreground"
              >
                <ChevronRight size={16} />
              </button>

              {/* Thumbnails */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {displayImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      'h-1 rounded-sm border-none cursor-pointer transition-all',
                      i === imgIdx ? 'w-7 bg-accent' : 'w-2 bg-foreground/20'
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute bottom-5 left-7 flex gap-2">
            {property.instant_booking && (
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-500">
                Instant Book
              </span>
            )}
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-accent/15 text-accent">
              {property.property_type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-9 pb-9 pt-5">
          {/* Title row */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-sans text-[11px] tracking-[0.2em] text-accent uppercase mb-2 flex items-center">
                <MapPin size={11} className="mr-1" />
                {property.city}, {property.country}
              </p>
              <h2 className="font-serif text-[32px] font-bold text-foreground leading-[1.1]">
                {property.display_name || property.name}
              </h2>
              {property.short_description && (
                <p className="font-serif text-base italic text-muted-foreground/60 mt-1.5">{property.short_description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-sans text-[32px] font-bold text-accent">{formatCurrency(property.base_price)}</p>
              <p className="font-sans text-xs text-muted-foreground/60">per night</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-5 mb-7 pb-6 border-b border-border">
            {[
              { icon: <Users size={16} />, label: `${property.max_guests} Guests` },
              { icon: <Bed size={16} />, label: `${property.bedrooms} Bedrooms` },
              { icon: <Bath size={16} />, label: `${property.bathrooms} Bathrooms` },
              ...(property.area_sqm ? [{ icon: <Expand size={16} />, label: `${property.area_sqm} m²` }] : []),
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 font-sans text-[13px] text-muted-foreground">
                <span className="text-accent">{s.icon}</span>{s.label}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-7 bg-background rounded-[10px] p-1 border border-border w-fit">
            {(['overview', 'amenities', 'highlights'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-5 py-2.5 rounded-[7px] border-none cursor-pointer text-xs font-sans font-semibold capitalize transition-all',
                  tab === t ? 'bg-accent/15 text-accent' : 'bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview' && (
            <div>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6">{property.description}</p>
              {property.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {property.highlights.slice(0, 6).map((h) => (
                    <span key={h} className="text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-accent/15 text-accent">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'amenities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {property.amenities.map((a) => {
                const Icon = AMENITY_ICON_MAP[a] || Star;
                const label = AMENITY_LABELS[a as Amenity] || a;
                return (
                  <div key={a} className="flex items-center gap-3 p-3.5 bg-background border border-border rounded-[10px]">
                    <Icon size={18} className="text-accent shrink-0" />
                    <span className="font-sans text-[13px] text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'highlights' && (
            <div className="flex flex-col gap-3">
              {property.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3.5 p-3.5 bg-background border border-border rounded-[10px]">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span className="font-sans text-sm text-muted-foreground">{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex gap-3 justify-end">
            <Button variant="outline" onClick={handleBooking} className="gap-2">
              <Calendar size={15} /> Check Availability
            </Button>
            <Button onClick={handleBooking} className="gap-2">
              Book This Villa <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
