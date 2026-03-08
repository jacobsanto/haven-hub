import { useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { CARD_SPACING, CARD_ROTATION, CARD_SCALE_BASE, CARD_SCALE_STEP, TRANSITION_MS, EASE_SMOOTH } from './heroStyles';

interface Property {
  id: string;
  name: string;
  display_name?: string | null;
  city: string;
  country: string;
  hero_image_url?: string | null;
  slug: string;
}

interface CardDeckProps {
  properties: Property[];
  activeIndex: number;
  onSelect: (index: number) => void;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

export function CardDeck({ properties, activeIndex, onSelect, hoveredIndex, onHover }: CardDeckProps) {
  const prefersReduced = useReducedMotion();
  // Front card shows a different property than the featured one (offset by 1)
  const cardFrontIndex = (activeIndex + 1) % properties.length;

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(idx);
    }
  };

  return (
    <div className="relative w-[380px] h-[480px] lg:w-[420px] lg:h-[530px]" role="group" aria-label="Property cards">
      <style>{`
        @keyframes card-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
      `}</style>
      {properties.map((property, idx) => {
        const offset = idx - cardFrontIndex;
        const isActive = idx === cardFrontIndex;
        const isHovered = hoveredIndex === idx;

        const translateY = isActive ? 0 : offset * CARD_SPACING;
        const translateX = isActive ? 0 : offset * 6;
        const rotateZ = isActive ? 0 : offset * CARD_ROTATION;
        const scale = isActive ? 1 : CARD_SCALE_BASE - Math.abs(offset) * CARD_SCALE_STEP;
        const zIndex = isActive ? 10 : 5 - Math.abs(offset);

        // Hover lift for active card
        const hoverLift = isActive && isHovered ? -6 : 0;
        const hoverScale = isActive && isHovered ? 1.02 : scale;

        const cardLabel = property.display_name || property.name;

        return (
          <div
            key={property.id}
            role="button"
            tabIndex={isActive ? 0 : -1}
            aria-label={`View ${cardLabel} in ${property.city}, ${property.country}`}
            onClick={() => onSelect(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onMouseEnter={() => onHover(idx)}
            onMouseLeave={() => onHover(null)}
            className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer border border-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            style={{
              transform: isActive && !isHovered ? undefined : `translateY(${translateY + hoverLift}px) translateX(${translateX}px) scale(${hoverScale}) rotateZ(${rotateZ}deg)`,
              zIndex,
              opacity: isActive ? 1 : isHovered ? 0.85 : 0.5,
              animation: isActive && !prefersReduced && !isHovered ? 'card-float 4s ease-in-out infinite' : 'none',
              transition: prefersReduced
                ? 'none'
                : `transform ${TRANSITION_MS}ms ${EASE_SMOOTH}, opacity ${TRANSITION_MS * 0.7}ms ${EASE_SMOOTH}`,
            }}
          >
            {/* All cards use <img> so browser can discover LCP image from HTML */}
            <img
              src={property.hero_image_url || '/placeholder.svg'}
              alt={isActive ? (property.display_name || property.name) : ''}
              aria-hidden={!isActive}
              fetchPriority={isActive ? 'high' : 'auto'}
              loading={isActive ? 'eager' : 'lazy'}
              sizes="(max-width: 1024px) 380px, 420px"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out scale-105"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

            {/* Accent tint */}
            <div className="absolute inset-0 bg-accent/5" />

            {/* Card label */}
            <div
              className="absolute bottom-0 left-0 right-0 p-5 lg:p-6"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                transition: prefersReduced
                  ? 'none'
                  : `opacity ${TRANSITION_MS * 0.6}ms ${EASE_SMOOTH} ${isActive ? '0.2s' : '0s'}, transform ${TRANSITION_MS * 0.8}ms ${EASE_SMOOTH} ${isActive ? '0.15s' : '0s'}`,
              }}
            >
              <h3 className="text-primary-foreground font-serif text-xl lg:text-2xl leading-tight">
                {cardLabel}
              </h3>
              <p className="text-primary-foreground/70 text-xs uppercase tracking-[3px] mt-1.5 font-sans flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {property.city}, {property.country}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
