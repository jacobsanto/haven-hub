import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface Property {
  id: string;
  name: string;
  display_name?: string | null;
  short_description?: string | null;
  city: string;
  country: string;
  hero_image_url?: string | null;
  slug: string;
  base_price: number;
  bedrooms?: number | null;
  max_guests?: number | null;
}

interface SliderProps {
  properties: Property[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const COLOR_PALETTE = [
  { color: '#FF6B35', lightBg: '30 80% 96%' },
  { color: '#1B7B8B', lightBg: '190 40% 94%' },
  { color: '#2D9C6F', lightBg: '155 40% 94%' },
  { color: '#E67E22', lightBg: '30 90% 95%' },
  { color: '#8B5CF6', lightBg: '260 60% 96%' },
  { color: '#EC4899', lightBg: '330 60% 96%' },
];

export function BrightMinimalistHero({ properties, activeIndex, onSelect, onNext, onPrev }: SliderProps) {
  const prefersReduced = useReducedMotion();
  const { format } = useFormatCurrency();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const count = properties.length;

  const handlePrev = () => {
    if (onPrev) onPrev();
    else onSelect((activeIndex - 1 + count) % count);
  };

  const handleNext = () => {
    if (onNext) onNext();
    else onSelect((activeIndex + 1) % count);
  };

  const getColor = (i: number) => COLOR_PALETTE[i % COLOR_PALETTE.length];

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-muted/60 overflow-hidden">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content */}
      <div className="relative h-full flex items-center justify-between px-8 md:px-20 z-10">
        {/* Left side — Typography */}
        <div className="flex-1 max-w-xl">
          {properties.map((prop, idx) => {
            const isActive = idx === activeIndex;
            const palette = getColor(idx);
            return (
              <div
                key={prop.id}
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateX(0)' : 'translateX(-40px)',
                  transition: prefersReduced ? 'none' : 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: isActive ? 'auto' : 'none',
                  position: isActive ? 'relative' : 'absolute',
                }}
              >
                <div className="space-y-6 md:space-y-8">
                  {/* Number indicator */}
                  <p className="text-muted-foreground text-xs tracking-[3px] font-sans font-light uppercase">
                    0{idx + 1} — {prop.city.toUpperCase()}, {prop.country.toUpperCase()}
                  </p>

                  {/* Main title */}
                  <h2 className="font-serif text-[clamp(40px,7vw,88px)] font-normal text-foreground leading-[1.1] tracking-tight">
                    {prop.display_name || prop.name}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground text-base leading-relaxed max-w-[400px] font-sans font-light">
                    {prop.short_description || `Experience the ultimate escape to ${prop.city}. Luxury accommodations with breathtaking views await.`}
                  </p>

                  {/* Price */}
                  <p className="font-sans text-xl font-semibold text-foreground">
                    {format(prop.base_price)}
                    <span className="text-sm font-light text-muted-foreground"> / night</span>
                  </p>

                  {/* Accent line */}
                  <div
                    className="w-[60px] h-[2px] rounded-sm opacity-80"
                    style={{ background: palette.color }}
                  />

                  {/* CTA */}
                  <Link
                    to={`/properties/${prop.slug}`}
                    className="inline-flex items-center gap-2 text-foreground text-sm uppercase tracking-[2px] font-sans hover:opacity-70 transition-opacity"
                  >
                    View Villa →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side — Stacked Cards (desktop only) */}
        <div className="hidden md:flex flex-1 items-center justify-end">
          <div className="relative" style={{ width: 400, height: 500 }}>
            {properties.map((prop, idx) => {
              const isActive = idx === activeIndex;
              const palette = getColor(idx);
              return (
                <div
                  key={prop.id}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelect(idx)}
                  className="absolute inset-0 rounded-xl cursor-pointer overflow-hidden"
                  style={{
                    background: `hsl(${palette.lightBg})`,
                    border: `1px solid ${palette.color}30`,
                    transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isActive
                      ? 'translateY(0) scale(1) rotateZ(0deg)'
                      : `translateY(${(idx - activeIndex) * 30}px) scale(${0.85 + idx * 0.05}) rotateZ(${(idx - activeIndex) * 2}deg)`,
                    zIndex: isActive ? 10 : 5 - Math.abs(idx - activeIndex),
                    opacity: isActive || hoveredIndex === idx ? 1 : 0.6,
                    boxShadow: isActive ? `0 12px 32px ${palette.color}15` : 'none',
                  }}
                >
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${palette.color}08, ${palette.color}04)` }}
                  />

                  {/* Decorative accent circle */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                    style={{
                      background: palette.color,
                      transform: `translate(${isActive ? 0 : 20}px, -${isActive ? 0 : 20}px)`,
                      transition: prefersReduced ? 'none' : 'transform 0.8s ease-out',
                    }}
                  />

                  {/* Card content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-8 z-[5]">
                    {/* Top — location */}
                    <div
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'translateY(0)' : 'translateY(-20px)',
                        transition: prefersReduced ? 'none' : 'all 0.8s ease-out',
                      }}
                    >
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[1.5px] uppercase pb-3"
                        style={{ color: palette.color }}
                      >
                        <MapPin size={10} />
                        {prop.city}, {prop.country}
                      </span>
                    </div>

                    {/* Bottom — title and meta */}
                    <div
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                        transition: prefersReduced ? 'none' : 'all 0.8s ease-out 0.2s',
                      }}
                    >
                      <h3 className="font-serif text-[32px] font-normal text-foreground mb-2">
                        {prop.display_name || prop.name}
                      </h3>
                      <p className="text-muted-foreground text-[13px] tracking-[1px] font-light uppercase">
                        {prop.bedrooms || 3} beds · {prop.max_guests || 6} guests
                      </p>
                      <div
                        className="mt-4 pt-4"
                        style={{ borderTop: `1px solid ${palette.color}30` }}
                      >
                        <p className="text-foreground font-sans font-semibold text-lg">
                          {format(prop.base_price)}
                          <span className="text-muted-foreground text-xs font-light"> / night</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-16 md:bottom-20 left-8 md:left-20 z-20 flex gap-8 md:gap-12 items-center">
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-full bg-background border border-foreground/10 text-foreground flex items-center justify-center cursor-pointer hover:bg-muted hover:border-foreground/20 transition-all shadow-sm"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex gap-2 items-center">
          {properties.map((_, idx) => {
            const palette = getColor(idx);
            return (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className="border-none cursor-pointer rounded transition-all"
                style={{
                  width: idx === activeIndex ? 24 : 8,
                  height: 8,
                  background: idx === activeIndex ? palette.color : 'hsl(var(--foreground) / 0.2)',
                  borderRadius: 4,
                  transition: 'all 0.4s ease',
                  boxShadow: idx === activeIndex ? `0 2px 8px ${palette.color}40` : 'none',
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            );
          })}
        </div>

        <button
          onClick={handleNext}
          className="w-10 h-10 rounded-full bg-background border border-foreground/10 text-foreground flex items-center justify-center cursor-pointer hover:bg-muted hover:border-foreground/20 transition-all shadow-sm"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Counter pill top-right */}
      <div className="absolute top-8 right-8 z-20 text-[13px] font-medium text-muted-foreground tracking-[1px] bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-foreground/5">
        0{activeIndex + 1} / 0{count}
      </div>
    </div>
  );
}
