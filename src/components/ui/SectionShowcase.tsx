import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SectionDisplaySettings } from '@/hooks/useSectionDisplay';
import { SectionRenderer } from '@/components/ui/SectionRenderer';

export interface ShowcaseItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  link: string;
  meta?: string;
  location?: string;
  extra?: string;
}

interface SectionShowcaseProps {
  settings: SectionDisplaySettings & { isLoading?: boolean };
  items: ShowcaseItem[];
  children?: ReactNode;
  className?: string;
}

const SHOWCASE_MODES = [
  'parallax-depth', 'split-reveal', 'morph-tiles', 'cinematic',
  'vertical-curtain', 'card-deck', 'bright-minimalist',
];

export function SectionShowcase({ settings, items, children, className }: SectionShowcaseProps) {
  // If it's a legacy card layout mode, delegate to SectionRenderer
  if (!SHOWCASE_MODES.includes(settings.layout_mode)) {
    return <SectionRenderer settings={settings} className={className}>{children}</SectionRenderer>;
  }

  return <ShowcaseEngine settings={settings} items={items} className={className} />;
}

/* ─── Showcase engine with activeIndex + autoplay ─── */
function ShowcaseEngine({ settings, items, className }: { settings: SectionDisplaySettings; items: ShowcaseItem[]; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = items.length;

  const next = useCallback(() => setActiveIndex(i => (i + 1) % count), [count]);
  const prev = useCallback(() => setActiveIndex(i => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (!settings.autoplay || count <= 1) return;
    const id = setInterval(next, (settings.autoplay_interval || 5) * 1000);
    return () => clearInterval(id);
  }, [settings.autoplay, settings.autoplay_interval, next, count]);

  if (count === 0) return null;

  const Variant = VARIANT_MAP[settings.layout_mode] || ParallaxDepthSection;

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        <Variant items={items} activeIndex={activeIndex} onSelect={setActiveIndex} />
      </div>
      {/* Nav arrows */}
      {settings.show_navigation !== false && count > 1 && (
        <div className="flex items-center gap-3 mt-5">
          <button onClick={prev} className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors" aria-label="Previous">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          {settings.show_dots !== false && (
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)} className={cn('h-1.5 rounded-full transition-all', i === activeIndex ? 'w-5 bg-accent' : 'w-1.5 bg-muted-foreground/25')} />
              ))}
            </div>
          )}
          <button onClick={next} className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors" aria-label="Next">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Shared types ─── */
interface VariantProps {
  items: ShowcaseItem[];
  activeIndex: number;
  onSelect: (i: number) => void;
}

/* ─── Variant map ─── */
const VARIANT_MAP: Record<string, React.FC<VariantProps>> = {
  'parallax-depth': ParallaxDepthSection,
  'split-reveal': SplitRevealSection,
  'morph-tiles': MorphTilesSection,
  'cinematic': CinematicSection,
  'vertical-curtain': VerticalCurtainSection,
  'card-deck': CardDeckSection,
  'bright-minimalist': BrightMinimalistSection,
};

/* ─── 1. Parallax Depth ─── */
function ParallaxDepthSection({ items, activeIndex }: VariantProps) {
  const prefersReduced = useReducedMotion();
  return (
    <>
      {items.map((item, i) => {
        const offset = i - activeIndex;
        const isActive = offset === 0;
        return (
          <div key={item.id} className="absolute inset-0" style={{
            transform: `scale(${1 + Math.abs(offset) * 0.05}) translateX(${offset * 100}%)`,
            opacity: isActive ? 1 : 0,
            transition: prefersReduced ? 'none' : 'all 1s cubic-bezier(0.16,1,0.3,1)',
            zIndex: isActive ? 2 : 1,
          }}>
            <div className="absolute inset-0 bg-cover bg-center" style={{
              backgroundImage: `url(${item.image})`,
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              transition: prefersReduced ? 'none' : 'transform 8s ease-out',
            }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-background/50" />
            <Link to={item.link} className="absolute bottom-[12%] left-[6%] z-[3] block" style={{
              opacity: isActive ? 1 : 0,
              transform: `translateY(${isActive ? 0 : 40}px)`,
              transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s',
            }}>
              {item.location && <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase mb-3">{item.location}</p>}
              <h3 className="font-serif text-[clamp(28px,4vw,48px)] font-semibold text-foreground leading-[1.1] mb-2">{item.title}</h3>
              {item.subtitle && <p className="font-serif text-base italic text-muted-foreground">{item.subtitle}</p>}
              
              {item.badge && <span className="inline-block mt-3 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium">{item.badge}</span>}
            </Link>
          </div>
        );
      })}
    </>
  );
}

/* ─── 2. Split Reveal ─── */
function SplitRevealSection({ items, activeIndex }: VariantProps) {
  const prefersReduced = useReducedMotion();
  return (
    <>
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <div key={item.id} className="absolute inset-0 flex" style={{ zIndex: isActive ? 2 : 1 }}>
            <div className="w-[55%] h-full relative overflow-hidden" style={{
              clipPath: isActive ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: prefersReduced ? 'none' : 'clip-path 1s cubic-bezier(0.77,0,0.175,1)',
            }}>
              <div className="absolute inset-0 bg-cover bg-center" style={{
                backgroundImage: `url(${item.image})`,
                transform: isActive ? 'scale(1)' : 'scale(1.15)',
                transition: prefersReduced ? 'none' : 'transform 1.2s cubic-bezier(0.16,1,0.3,1)',
              }} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" style={{ backgroundPosition: '60%' }} />
            </div>
            <div className="w-[45%] h-full flex items-center justify-center px-[6%] bg-background">
              <Link to={item.link} className="block" style={{
                opacity: isActive ? 1 : 0,
                transform: `translateX(${isActive ? 0 : 60}px)`,
                transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s',
              }}>
                {item.location && <p className="font-sans text-[11px] tracking-[0.25em] text-accent uppercase mb-4">{item.location}</p>}
                <h3 className="font-serif text-[clamp(24px,3vw,40px)] font-semibold text-foreground leading-[1.15] mb-3">{item.title}</h3>
                {item.subtitle && <p className="font-serif text-[15px] italic text-muted-foreground mb-5">{item.subtitle}</p>}
                {item.extra && <p className="text-[13px] text-muted-foreground mb-5">{item.extra}</p>}
                
                <span className="inline-block mt-5 px-7 py-3 border border-accent text-accent font-sans text-[12px] tracking-[0.15em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors">
                  View Details
                </span>
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ─── 3. Morph Tiles ─── */
function MorphTilesSection({ items, activeIndex, onSelect }: VariantProps) {
  const prefersReduced = useReducedMotion();
  return (
    <>
      <div className="absolute inset-0 grid grid-cols-4 gap-1.5 p-1.5">
        {items.slice(0, 6).map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={item.id} onClick={() => onSelect(i)} className="relative overflow-hidden cursor-pointer" style={{
              borderRadius: isActive ? 0 : 8,
              gridColumn: isActive ? '1 / -1' : undefined,
              gridRow: isActive ? '1 / -1' : undefined,
              zIndex: isActive ? 10 : 1,
              transition: prefersReduced ? 'none' : 'all 0.9s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div className="absolute inset-0 bg-cover bg-center" style={{
                backgroundImage: `url(${item.image})`,
                filter: isActive ? 'brightness(0.7)' : 'brightness(0.35) grayscale(0.5)',
                transition: prefersReduced ? 'none' : 'filter 0.8s ease',
              }} />
              {isActive && <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />}
              <div className="absolute z-[5]" style={{
                bottom: isActive ? '10%' : 16,
                left: isActive ? '6%' : 16,
                transition: prefersReduced ? 'none' : 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}>
                {!isActive && (
                  <p className="font-sans text-[11px] tracking-[0.15em] text-accent uppercase" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                    {item.location || item.title}
                  </p>
                )}
                {isActive && (
                  <Link to={item.link} className="block">
                    {item.location && <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase mb-3 animate-[fadeUp_0.6s_0.4s_forwards] opacity-0">{item.location}</p>}
                    <h3 className="font-serif text-[clamp(26px,3.5vw,44px)] font-semibold text-foreground leading-[1.1] mb-2 animate-[fadeUp_0.6s_0.5s_forwards] opacity-0">{item.title}</h3>
                    {item.subtitle && <p className="font-serif text-[15px] italic text-muted-foreground animate-[fadeUp_0.6s_0.6s_forwards] opacity-0">{item.subtitle}</p>}
                    {item.meta && <p className="font-sans text-xl font-bold text-accent mt-3 animate-[fadeUp_0.6s_0.7s_forwards] opacity-0">{item.meta}</p>}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </>
  );
}

/* ─── 4. Cinematic Ken Burns ─── */
function CinematicSection({ items, activeIndex }: VariantProps) {
  const prefersReduced = useReducedMotion();
  return (
    <>
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <div key={item.id} className="absolute inset-0" style={{
            opacity: isActive ? 1 : 0,
            transition: prefersReduced ? 'none' : 'opacity 1.2s ease',
            zIndex: isActive ? 2 : 1,
          }}>
            <div className="absolute" style={{
              inset: '-5%',
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: isActive && !prefersReduced ? 'kenburns 12s ease-in-out infinite alternate' : 'none',
            }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.3) 40%, hsl(var(--background) / 0.8) 100%)' }} />
            <Link to={item.link} className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8%]" style={{
              opacity: isActive ? 1 : 0,
              transform: `scale(${isActive ? 1 : 0.95})`,
              transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s',
            }}>
              {item.location && <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-4">{item.location}</p>}
              <h3 className="font-serif text-[clamp(32px,5vw,60px)] font-bold text-primary-foreground leading-[1.05] mb-2.5">{item.title}</h3>
              {item.subtitle && <p className="font-serif text-lg italic text-muted-foreground mb-5">{item.subtitle}</p>}
              <div className="w-[60px] h-px bg-accent mb-5" />
            </Link>
          </div>
        );
      })}
      <style>{`@keyframes kenburns { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(1.08) translate(-1%,-1%)} }`}</style>
    </>
  );
}

/* ─── 5. Vertical Curtain ─── */
function VerticalCurtainSection({ items, activeIndex, onSelect }: VariantProps) {
  const prefersReduced = useReducedMotion();
  return (
    <>
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        const dir = i > activeIndex ? 1 : -1;
        return (
          <div key={item.id} className="absolute inset-0" style={{
            zIndex: isActive ? 2 : 1,
            clipPath: isActive ? 'inset(0 0 0 0)' : `inset(${dir > 0 ? '100% 0 0 0' : '0 0 100% 0'})`,
            transition: prefersReduced ? 'none' : 'clip-path 1s cubic-bezier(0.77,0,0.175,1)',
          }}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-background/40" />
            <Link to={item.link} className="absolute bottom-[10%] left-[6%] z-[3] block" style={{
              opacity: isActive ? 1 : 0,
              transform: `translateY(${isActive ? 0 : 30}px)`,
              transition: prefersReduced ? 'none' : 'all 0.7s ease 0.5s',
            }}>
              {item.location && <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase mb-3">{item.location}</p>}
              <h3 className="font-serif text-[clamp(28px,4vw,48px)] font-semibold text-foreground leading-[1.1] mb-2">{item.title}</h3>
              {item.subtitle && <p className="font-serif text-base italic text-muted-foreground">{item.subtitle}</p>}
              {item.meta && <p className="font-sans text-xl font-bold text-accent mt-3">{item.meta}</p>}
            </Link>
          </div>
        );
      })}
      {/* Side dots */}
      <div className="absolute right-[20px] top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5">
        {items.map((_, i) => (
          <button key={i} onClick={() => onSelect(i)} className="border-none cursor-pointer rounded-sm transition-all" style={{
            width: 3,
            height: i === activeIndex ? 36 : 18,
            background: i === activeIndex ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.2)',
          }} />
        ))}
      </div>
    </>
  );
}

/* ─── 6. Card Deck ─── */
const COLOR_PALETTE = [
  { color: '#FF6B35', lightBg: '30 80% 96%' },
  { color: '#1B7B8B', lightBg: '190 40% 94%' },
  { color: '#2D9C6F', lightBg: '155 40% 94%' },
  { color: '#E67E22', lightBg: '30 90% 95%' },
  { color: '#8B5CF6', lightBg: '260 60% 96%' },
  { color: '#EC4899', lightBg: '330 60% 96%' },
];

function CardDeckSection({ items, activeIndex, onSelect }: VariantProps) {
  const prefersReduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const getColor = (i: number) => COLOR_PALETTE[i % COLOR_PALETTE.length];

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/40 to-background flex items-center px-8 md:px-14">
      {/* Left text */}
      <div className="flex-1 max-w-md relative">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          const palette = getColor(idx);
          return (
            <Link to={item.link} key={item.id} className="block" style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'translateX(0)' : 'translateX(-40px)',
              transition: prefersReduced ? 'none' : 'all 1s cubic-bezier(0.16,1,0.3,1)',
              pointerEvents: isActive ? 'auto' : 'none',
              position: isActive ? 'relative' : 'absolute',
            }}>
              {item.location && <p className="text-muted-foreground text-xs tracking-[3px] font-sans font-light uppercase mb-4">{item.location}</p>}
              <h3 className="font-serif text-[clamp(28px,5vw,52px)] font-normal text-foreground leading-[1.1] mb-4">{item.title}</h3>
              {item.subtitle && <p className="text-muted-foreground text-sm leading-relaxed max-w-[360px] font-sans font-light mb-4">{item.subtitle}</p>}
              {item.meta && <p className="font-sans text-lg font-semibold text-foreground">{item.meta}</p>}
              <div className="w-[50px] h-[2px] rounded-sm opacity-80 mt-4" style={{ background: palette.color }} />
            </Link>
          );
        })}
      </div>
      {/* Right cards */}
      <div className="hidden md:flex flex-1 items-center justify-end">
        <div className="relative" style={{ width: 320, height: 400 }}>
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            const palette = getColor(idx);
            return (
              <div key={item.id} onClick={() => onSelect(idx)} onMouseEnter={() => setHovered(idx)} onMouseLeave={() => setHovered(null)}
                className="absolute inset-0 rounded-xl cursor-pointer overflow-hidden"
                style={{
                  background: `hsl(${palette.lightBg})`,
                  border: `1px solid ${palette.color}30`,
                  transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                  transform: isActive
                    ? 'translateY(0) scale(1) rotateZ(0deg)'
                    : `translateY(${(idx - activeIndex) * 25}px) scale(${0.88 + idx * 0.03}) rotateZ(${(idx - activeIndex) * 2}deg)`,
                  zIndex: isActive ? 10 : 5 - Math.abs(idx - activeIndex),
                  opacity: isActive || hovered === idx ? 1 : 0.6,
                }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${palette.color}08, ${palette.color}04)` }} />
                <div className="absolute inset-0 flex flex-col justify-between p-6 z-[5]">
                  <div style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.6s ease' }}>
                    {item.location && <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: palette.color }}>
                      <MapPin size={10} />{item.location}
                    </span>}
                  </div>
                  <div style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: prefersReduced ? 'none' : 'all 0.8s ease-out 0.2s' }}>
                    <h4 className="font-serif text-2xl font-normal text-foreground mb-1">{item.title}</h4>
                    {item.extra && <p className="text-muted-foreground text-xs tracking-[1px] font-light uppercase">{item.extra}</p>}
                    {item.meta && (
                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${palette.color}30` }}>
                        <p className="text-foreground font-sans font-semibold text-base">{item.meta}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── 7. Bright Minimalist ─── */
function BrightMinimalistSection({ items, activeIndex, onSelect }: VariantProps) {
  const prefersReduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const getColor = (i: number) => COLOR_PALETTE[i % COLOR_PALETTE.length];

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-muted/60 overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />
      <div className="relative h-full flex items-center justify-between px-8 md:px-14 z-10">
        {/* Left text */}
        <div className="flex-1 max-w-md relative">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            const palette = getColor(idx);
            return (
              <Link to={item.link} key={item.id} className="block" style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(-40px)',
                transition: prefersReduced ? 'none' : 'all 1.2s cubic-bezier(0.16,1,0.3,1)',
                pointerEvents: isActive ? 'auto' : 'none',
                position: isActive ? 'relative' : 'absolute',
              }}>
                <div className="space-y-4">
                  {item.location && <p className="text-muted-foreground text-xs tracking-[3px] font-sans font-light uppercase">{item.location}</p>}
                  <h3 className="font-serif text-[clamp(28px,5vw,52px)] font-normal text-foreground leading-[1.1]">{item.title}</h3>
                  {item.subtitle && <p className="text-muted-foreground text-sm leading-relaxed max-w-[360px] font-sans font-light">{item.subtitle}</p>}
                  {item.meta && <p className="font-sans text-lg font-semibold text-foreground">{item.meta}</p>}
                  <div className="w-[50px] h-[2px] rounded-sm opacity-80" style={{ background: palette.color }} />
                  <span className="inline-flex items-center gap-2 text-foreground text-sm uppercase tracking-[2px] font-sans hover:opacity-70 transition-opacity">View Details →</span>
                </div>
              </Link>
            );
          })}
        </div>
        {/* Right color cards */}
        <div className="hidden md:flex flex-1 items-center justify-end">
          <div className="relative" style={{ width: 300, height: 380 }}>
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;
              const palette = getColor(idx);
              return (
                <div key={item.id} onClick={() => onSelect(idx)} onMouseEnter={() => setHovered(idx)} onMouseLeave={() => setHovered(null)}
                  className="absolute inset-0 rounded-xl cursor-pointer overflow-hidden"
                  style={{
                    background: `hsl(${palette.lightBg})`,
                    border: `1px solid ${palette.color}30`,
                    transition: prefersReduced ? 'none' : 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                    transform: isActive
                      ? 'translateY(0) scale(1) rotateZ(0deg)'
                      : `translateY(${(idx - activeIndex) * 25}px) scale(${0.88 + idx * 0.03}) rotateZ(${(idx - activeIndex) * 2}deg)`,
                    zIndex: isActive ? 10 : 5 - Math.abs(idx - activeIndex),
                    opacity: isActive || hovered === idx ? 1 : 0.6,
                  }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: palette.color }} />
                  <div className="absolute inset-0 flex flex-col justify-between p-6 z-[5]">
                    <div style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.6s ease' }}>
                      {item.location && <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: palette.color }}>
                        <MapPin size={10} />{item.location}
                      </span>}
                    </div>
                    <div style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: prefersReduced ? 'none' : 'all 0.8s ease-out 0.2s' }}>
                      <h4 className="font-serif text-2xl font-normal text-foreground mb-1">{item.title}</h4>
                      {item.meta && (
                        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${palette.color}30` }}>
                          <p className="text-foreground font-sans font-semibold text-base">{item.meta}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
