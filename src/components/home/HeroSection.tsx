import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useBrand } from '@/contexts/BrandContext';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { HeroSearchForm } from './HeroSearchForm';
import { WordReveal } from './hero/WordReveal';
import { OdometerCounter } from './hero/OdometerCounter';
import { GrainOverlay } from './hero/GrainOverlay';
import { CardDeck } from './hero/CardDeck';
import { AUTOPLAY_MS, heroKeyframes } from './hero/heroStyles';

export function HeroSection() {
  const { data: allProperties } = useFeaturedProperties();
  const { socialFacebook, socialYoutube, socialInstagram } = useBrand();
  const { showSearchBar } = useHeroSettings();
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobile();

  const properties = (allProperties || []).slice(0, 4);
  const count = properties.length || 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  const activeIndexRef = useRef(activeIndex);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollY = useRef(0);
  const textRef = useRef<HTMLDivElement>(null);

  activeIndexRef.current = activeIndex;

  // --- Navigate ---
  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx);
    setProgressKey(k => k + 1);
  }, []);

  const goNext = useCallback(() => goTo((activeIndexRef.current + 1) % count), [count, goTo]);
  const goPrev = useCallback(() => goTo((activeIndexRef.current - 1 + count) % count), [count, goTo]);

  // --- Autoplay ---
  useEffect(() => {
    if (properties.length < 2) return;
    const start = () => {
      stop();
      autoPlayRef.current = setInterval(() => {
        const next = (activeIndexRef.current + 1) % count;
        setActiveIndex(next);
        setProgressKey(k => k + 1);
      }, AUTOPLAY_MS);
    };
    const stop = () => {
      if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
    };
    start();
    const el = containerRef.current;
    el?.addEventListener('mouseenter', stop);
    el?.addEventListener('mouseleave', start);
    return () => { stop(); el?.removeEventListener('mouseenter', stop); el?.removeEventListener('mouseleave', start); };
  }, [properties.length, count]);

  // --- Parallax ---
  useEffect(() => {
    if (prefersReduced) return;
    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        scrollY.current = window.scrollY;
        if (textRef.current) textRef.current.style.transform = `translateY(${scrollY.current * 0.3}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [prefersReduced]);

  // --- Cursor spotlight ---
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  }, [prefersReduced]);

  if (!properties.length) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-[#1A1A1A]">
        <p className="text-white/60 text-lg">Loading properties…</p>
      </section>
    );
  }

  const active = properties[activeIndex];

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden select-none bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A]"
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => { touchStartX.current = e.targetTouches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        touchStartX.current = null;
        if (diff > 50) goNext();
        else if (diff < -50) goPrev();
      }}
    >
      {/* Mobile: faded property image bg */}
      {isMobile && active.hero_image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${active.hero_image_url})` }}
        />
      )}

      {/* Cursor-reactive spotlight */}
      {!prefersReduced && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: 'radial-gradient(ellipse 60% 50% at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.04) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Grain overlay */}
      {!prefersReduced && <GrainOverlay />}

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Split panel area */}
        <div className="flex-1 flex items-center">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:gap-12 lg:gap-20">
              {/* LEFT: Typography panel */}
              <div className="flex-1 max-w-xl" ref={textRef}>
                <AnimatePresence mode="wait">
                  <div key={activeIndex}>
                    {/* Index label */}
                    <p className="text-white/40 text-xs uppercase tracking-[3px] font-sans mb-4">
                      0{activeIndex + 1} — {(active.display_name || active.name).toUpperCase()}
                    </p>

                    {/* Property name */}
                    <h1
                      className="text-4xl md:text-5xl lg:text-7xl font-serif italic text-white leading-[1.1] tracking-tight"
                      style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                    >
                      <WordReveal
                        text={active.display_name || active.name}
                        reduced={!!prefersReduced}
                      />
                    </h1>

                    {/* Description */}
                    <p className="mt-5 text-white/60 text-base md:text-lg max-w-md leading-relaxed font-sans font-light">
                      <WordReveal
                        text={active.short_description || `Explore the beauty of ${active.city}, ${active.country} — luxury villas handpicked for unforgettable stays.`}
                        reduced={!!prefersReduced}
                      />
                    </p>

                    {/* Accent line */}
                    <div className="w-14 h-px bg-accent/70 mt-6" />

                    {/* CTA */}
                    <Link
                      to={`/properties/${active.slug}`}
                      className="inline-flex items-center gap-2 mt-6 text-white/80 text-sm uppercase tracking-[2px] font-sans hover:text-white transition-colors group"
                    >
                      Explore Stay
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </AnimatePresence>

                {/* Search form moved to bottom center */}

                {/* Mobile dots */}
                {isMobile && properties.length > 1 && (
                  <div className="flex items-center gap-3 mt-6">
                    {properties.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className="relative rounded-full overflow-hidden"
                        aria-label={`Go to property ${i + 1}`}
                      >
                        <span className={`block rounded-full transition-all ${i === activeIndex ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40'}`} />
                        {i === activeIndex && !prefersReduced && (
                          <span
                            key={progressKey}
                            className="absolute inset-0 rounded-full border border-white/60"
                            style={{ animation: `heroProgressRing ${AUTOPLAY_MS}ms linear forwards` }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Card deck (desktop only) */}
              {!isMobile && properties.length > 0 && (
                <div className="hidden md:flex flex-1 items-center justify-end">
                  <CardDeck
                    properties={properties}
                    activeIndex={activeIndex}
                    onSelect={goTo}
                    hoveredIndex={hoveredCard}
                    onHover={setHoveredCard}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search form — pinned center bottom */}
        {showSearchBar && (
          <div className="hidden md:block absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4">
            <HeroSearchForm />
          </div>
        )}

        {/* Footer bar */}
        <div className="container mx-auto px-4 md:px-8 pb-6 flex items-center justify-between text-white">
          {/* Social icons */}
          <div className="hidden md:flex items-center gap-4">
            {socialFacebook && (
              <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
              </a>
            )}
            {socialYoutube && (
              <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            )}
            {socialInstagram && (
              <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </a>
            )}
          </div>

          <p className="hidden md:block text-[10px] uppercase tracking-[0.3em] text-white/40 font-sans">
            Unique Locations
          </p>

          <div className="flex items-center gap-4 ml-auto md:ml-0">
            {/* Elongated dot indicators (desktop) */}
            {properties.length > 1 && !prefersReduced && (
              <div className="hidden md:flex items-center gap-1.5">
                {properties.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="relative overflow-hidden rounded-full"
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <span
                      className={`block h-1 rounded-full transition-all duration-300 ${
                        i === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/20'
                      }`}
                    />
                    {i === activeIndex && (
                      <span
                        key={progressKey}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'hsl(var(--accent))',
                          opacity: 0.5,
                          animation: `heroProgressFill ${AUTOPLAY_MS}ms linear forwards`,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <OdometerCounter value={activeIndex} total={count} reduced={!!prefersReduced} />

            <button onClick={goPrev} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Previous property">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Next property">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style>{heroKeyframes}</style>
    </section>
  );
}
