import { useReducedMotion } from 'framer-motion';
import { CARD_SPACING, CARD_ROTATION, CARD_SCALE_BASE, CARD_SCALE_STEP, TRANSITION_MS } from './heroStyles';

interface Property {
  id: string;
  name: string;
  display_name?: string | null;
  city: string;
  country: string;
  hero_image_url?: string | null;
  slug: string;
  originalIndex: number;
}

interface CardDeckProps {
  properties: Property[];
  onSelect: (originalIndex: number) => void;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

export function CardDeck({ properties, onSelect, hoveredIndex, onHover }: CardDeckProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative w-[380px] h-[480px] lg:w-[420px] lg:h-[530px]">
      {properties.map((property, idx) => {
        const isTop = idx === 0;
        const isHovered = hoveredIndex === idx;

        const translateY = idx * CARD_SPACING;
        const rotateZ = idx * CARD_ROTATION;
        const scale = idx === 0 ? 1 : CARD_SCALE_BASE + idx * CARD_SCALE_STEP;
        const zIndex = 10 - idx;

        return (
          <div
            key={property.id}
            onClick={() => onSelect(property.originalIndex)}
            onMouseEnter={() => onHover(idx)}
            onMouseLeave={() => onHover(null)}
            className="absolute inset-0 rounded-lg overflow-hidden cursor-pointer border border-accent/20"
            style={{
              transform: `translateY(${translateY}px) scale(${scale}) rotateZ(${rotateZ}deg)`,
              zIndex,
              opacity: isTop ? 1 : isHovered ? 0.85 : 0.5,
              transition: prefersReduced
                ? 'none'
                : `all ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          >
            {/* Property image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${property.hero_image_url})` }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Accent tint */}
            <div className="absolute inset-0 bg-accent/5" />

            {/* Card label */}
            <div
              className="absolute bottom-0 left-0 right-0 p-5 lg:p-6"
              style={{
                opacity: isTop ? 1 : 0,
                transform: isTop ? 'translateY(0)' : 'translateY(16px)',
                transition: prefersReduced
                  ? 'none'
                  : `all ${TRANSITION_MS}ms ease-out 0.15s`,
              }}
            >
              <h3 className="text-white font-serif text-xl lg:text-2xl leading-tight">
                {property.display_name || property.name}
              </h3>
              <p className="text-white/50 text-xs uppercase tracking-[3px] mt-1.5 font-sans">
                {property.city}, {property.country}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
