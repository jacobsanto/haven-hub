import { useReducedMotion } from 'framer-motion';
import { MapPin, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';
export { BrightMinimalistHero } from './BrightMinimalistHero';

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
}

/* ─── SLIDER 1: Parallax Depth ─── */
export function ParallaxDepthHero({ properties, activeIndex, onSelect }: SliderProps) {
  const prefersReduced = useReducedMotion();
  const { format } = useFormatCurrency();

  return (
    <div className="absolute inset-0">
      {properties.map((s, i) => {
        const offset = i - activeIndex;
        const isActive = offset === 0;
        return (
          <div
            key={s.id}
            className="absolute inset-0"
            style={{
              transform: `scale(${1 + Math.abs(offset) * 0.05}) translateX(${offset * 100}%)`,
              opacity: isActive ? 1 : 0,
              transition: prefersReduced ? 'none' : 'all 1s cubic-bezier(0.16,1,0.3,1)',
              zIndex: isActive ? 2 : 1,
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${s.hero_image_url})`,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: prefersReduced ? 'none' : 'transform 8s ease-out',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-background/50" />
            <div
              className="absolute bottom-[15%] left-[6%] z-[3]"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `translateY(${isActive ? 0 : 40}px)`,
                transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s',
              }}
            >
              <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase mb-3">
                {s.city}, {s.country}
              </p>
              <h2 className="font-serif text-[clamp(36px,5vw,64px)] font-medium text-foreground leading-[1.1] mb-2">
                {s.display_name || s.name}
              </h2>
              <p className="font-serif text-lg italic text-muted-foreground">
                {s.short_description || `Luxury villa in ${s.city}`}
              </p>
              <p className="font-sans text-[22px] font-medium text-accent mt-5">
                {format(s.base_price)}
                <span className="text-[13px] font-light text-muted-foreground"> / night</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── SLIDER 2: Split Reveal ─── */
export function SplitRevealHero({ properties, activeIndex, onSelect }: SliderProps) {
  const prefersReduced = useReducedMotion();
  const { format } = useFormatCurrency();

  return (
    <div className="absolute inset-0">
      {properties.map((s, i) => {
        const isActive = i === activeIndex;
        return (
          <div key={s.id} className="absolute inset-0 flex" style={{ zIndex: isActive ? 2 : 1 }}>
            {/* Left half — image */}
            <div
              className="w-[55%] h-full relative overflow-hidden"
              style={{
                clipPath: isActive ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                transition: prefersReduced ? 'none' : 'clip-path 1s cubic-bezier(0.77,0,0.175,1)',
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${s.hero_image_url})`,
                  transform: isActive ? 'scale(1)' : 'scale(1.15)',
                  transition: prefersReduced ? 'none' : 'transform 1.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" style={{ backgroundPosition: '60%' }} />
            </div>
            {/* Right half — content */}
            <div className="w-[45%] h-full flex items-center justify-center px-[6%] bg-background">
              <div
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: `translateX(${isActive ? 0 : 60}px)`,
                  transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s',
                }}
              >
                <p className="font-sans text-[11px] tracking-[0.25em] text-accent uppercase mb-4">{s.city}, {s.country}</p>
                <h2 className="font-serif text-[clamp(32px,3.5vw,52px)] font-semibold text-foreground leading-[1.15] mb-3">
                  {s.display_name || s.name}
                </h2>
                <p className="font-serif text-[17px] italic text-muted-foreground mb-7">
                  {s.short_description || `Luxury retreat in ${s.city}`}
                </p>
                <div className="flex gap-6 mb-7 font-sans text-[13px] text-muted-foreground">
                  <span><Users size={14} className="inline mr-1.5 align-middle" />{s.max_guests || 6} guests</span>
                  <span>{s.bedrooms || 3} bedrooms</span>
                </div>
                <p className="font-sans text-[28px] font-bold text-accent">
                  {format(s.base_price)}
                  <span className="text-[14px] font-light text-muted-foreground"> / night</span>
                </p>
                <button
                  onClick={() => onSelect(i)}
                  className="inline-block mt-7 px-9 py-3.5 border border-accent text-accent font-sans text-[13px] tracking-[0.15em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                >
                  View Villa
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── SLIDER 3: Morph Tiles ─── */
export function MorphTilesHero({ properties, activeIndex, onSelect }: SliderProps) {
  const prefersReduced = useReducedMotion();
  const { format } = useFormatCurrency();

  return (
    <div className="absolute inset-0 grid grid-cols-4 gap-1.5 p-1.5">
      {properties.map((s, i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={s.id}
            onClick={() => onSelect(i)}
            className="relative overflow-hidden cursor-pointer"
            style={{
              borderRadius: isActive ? 0 : 8,
              gridColumn: isActive ? '1 / -1' : undefined,
              gridRow: isActive ? '1 / -1' : undefined,
              zIndex: isActive ? 10 : 1,
              transition: prefersReduced ? 'none' : 'all 0.9s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${s.hero_image_url})`,
                filter: isActive ? 'brightness(0.7)' : 'brightness(0.35) grayscale(0.5)',
                transition: prefersReduced ? 'none' : 'filter 0.8s ease',
              }}
            />
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
            )}
            <div
              className="absolute z-[5]"
              style={{
                bottom: isActive ? '12%' : 16,
                left: isActive ? '6%' : 16,
                transition: prefersReduced ? 'none' : 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {!isActive && (
                <p className="font-sans text-[11px] tracking-[0.15em] text-accent uppercase" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                  {s.city}, {s.country}
                </p>
              )}
              {isActive && (
                <>
                  <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase mb-3 animate-[fadeUp_0.6s_0.4s_forwards] opacity-0">
                    {s.city}, {s.country}
                  </p>
                  <h2 className="font-serif text-[clamp(34px,4.5vw,60px)] font-semibold text-foreground leading-[1.1] mb-2 animate-[fadeUp_0.6s_0.5s_forwards] opacity-0">
                    {s.display_name || s.name}
                  </h2>
                  <p className="font-serif text-[17px] italic text-muted-foreground animate-[fadeUp_0.6s_0.6s_forwards] opacity-0">
                    {s.short_description || `Experience ${s.city}`}
                  </p>
                  <p className="font-sans text-2xl font-bold text-accent mt-4 animate-[fadeUp_0.6s_0.7s_forwards] opacity-0">
                    {format(s.base_price)}
                    <span className="text-[13px] font-light text-muted-foreground"> / night</span>
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

/* ─── SLIDER 4: Cinematic Ken Burns ─── */
export function CinematicHero({ properties, activeIndex, onSelect }: SliderProps) {
  const prefersReduced = useReducedMotion();
  const { format } = useFormatCurrency();

  return (
    <div className="absolute inset-0">
      {properties.map((s, i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={s.id}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              transition: prefersReduced ? 'none' : 'opacity 1.2s ease',
              zIndex: isActive ? 2 : 1,
            }}
          >
            <div
              className="absolute"
              style={{
                inset: '-5%',
                backgroundImage: `url(${s.hero_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                animation: isActive && !prefersReduced ? 'kenburns 12s ease-in-out infinite alternate' : 'none',
              }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.3) 40%, hsl(var(--background) / 0.8) 100%)' }} />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8%]"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `scale(${isActive ? 1 : 0.95})`,
                transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s',
              }}
            >
              <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-5">{s.city}, {s.country}</p>
              <h2 className="font-serif text-[clamp(40px,6vw,80px)] font-bold text-foreground leading-[1.05] mb-2.5">
                {s.display_name || s.name}
              </h2>
              <p className="font-serif text-xl italic text-muted-foreground mb-7">
                {s.short_description || `Luxury living in ${s.city}`}
              </p>
              <div className="w-[60px] h-px bg-accent mb-7" />
              <p className="font-sans text-[26px] font-bold text-accent">
                {format(s.base_price)}
                <span className="text-[14px] font-light text-muted-foreground"> / night</span>
              </p>
            </div>
          </div>
        );
      })}
      <style>{`@keyframes kenburns { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(1.08) translate(-1%,-1%)} }`}</style>
    </div>
  );
}

/* ─── SLIDER 5: Vertical Curtain ─── */
export function VerticalCurtainHero({ properties, activeIndex, onSelect }: SliderProps) {
  const prefersReduced = useReducedMotion();
  const { format } = useFormatCurrency();

  return (
    <div className="absolute inset-0">
      {properties.map((s, i) => {
        const isActive = i === activeIndex;
        const dir = i > activeIndex ? 1 : -1;
        return (
          <div
            key={s.id}
            className="absolute inset-0"
            style={{
              zIndex: isActive ? 2 : 1,
              clipPath: isActive ? 'inset(0 0 0 0)' : `inset(${dir > 0 ? '100% 0 0 0' : '0 0 100% 0'})`,
              transition: prefersReduced ? 'none' : 'clip-path 1s cubic-bezier(0.77,0,0.175,1)',
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${s.hero_image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-background/40" />
            <div
              className="absolute bottom-[12%] left-[6%] z-[3]"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `translateY(${isActive ? 0 : 30}px)`,
                transition: prefersReduced ? 'none' : 'all 0.7s ease 0.5s',
              }}
            >
              <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase mb-3">{s.city}, {s.country}</p>
              <h2 className="font-serif text-[clamp(36px,5vw,64px)] font-semibold text-foreground leading-[1.1] mb-2">
                {s.display_name || s.name}
              </h2>
              <p className="font-serif text-lg italic text-muted-foreground">
                {s.short_description || `Discover ${s.city}`}
              </p>
              <p className="font-sans text-2xl font-bold text-accent mt-4">
                {format(s.base_price)}
                <span className="text-[13px] font-light text-muted-foreground"> / night</span>
              </p>
            </div>
          </div>
        );
      })}
      {/* Vertical nav dots on right */}
      <div className="absolute right-[30px] top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {properties.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="border-none cursor-pointer rounded-sm transition-all"
            style={{
              width: 3,
              height: i === activeIndex ? 40 : 20,
              background: i === activeIndex ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
