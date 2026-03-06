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

  return (
    <div className="relative w-[380px] h-[480px] lg:w-[420px] lg:h-[530px]">
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

        return (
          <div
            key={property.id}
            onClick={() => onSelect(idx)}
            onMouseEnter={() => onHover(idx)}
            onMouseLeave={() => onHover(null)}
            className="absolute inset-0 rounded-lg overflow-hidden cursor-pointer border border-accent/20"
            style={{
              transform: `translateY(${translateY + hoverLift}px) translateX(${translateX}px) scale(${hoverScale}) rotateZ(${rotateZ}deg)`,
              zIndex,
              opacity: isActive ? 1 : isHovered ? 0.85 : 0.5,
              transition: prefersReduced
                ? 'none'
                : `transform ${TRANSITION_MS}ms ${EASE_SMOOTH}, opacity ${TRANSITION_MS * 0.7}ms ${EASE_SMOOTH}`,
            }}
          >
            {/* Property image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-out"
              style={{
                backgroundImage: `url(${property.hero_image_url})`,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
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
                {property.display_name || property.name}
              </h3>
              <p className="text-primary-foreground/50 text-xs uppercase tracking-[3px] mt-1.5 font-sans flex items-center gap-1.5">
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
