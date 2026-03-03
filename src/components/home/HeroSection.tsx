import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useBrand } from '@/contexts/BrandContext';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { useIsMobile } from '@/hooks/use-mobile';

function splitName(name: string): [string, string] {
  const words = name.split(/\s+/);
  if (words.length <= 1) return [name, ''];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

export function HeroSection() {
  const { data: allProperties } = useFeaturedProperties();
  const { socialFacebook, socialYoutube, socialInstagram } = useBrand();
  const { showSearchBar } = useHeroSettings();
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobile();

  // Take exactly 4 properties for the loop
  const properties = (allProperties || []).slice(0, 4);

  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const count = properties.length || 1;

  const goNext = useCallback(() => {
    if (isTransitioning || properties.length < 2) return;
    setDirection('next');
    setIsTransitioning(true);
    setPrevIndex(activeIndex);
    setActiveIndex((prev) => (prev + 1) % count);
  }, [activeIndex, count, isTransitioning, properties.length]);

  const goPrev = useCallback(() => {
    if (isTransitioning || properties.length < 2) return;
    setDirection('prev');
    setIsTransitioning(true);
    setPrevIndex(activeIndex);
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [activeIndex, count, isTransitioning, properties.length]);

  // End transition after cross-fade duration
  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => {
      setPrevIndex(null);
      setIsTransitioning(false);
    }, prefersReduced ? 50 : 800);
    return () => clearTimeout(t);
  }, [prevIndex, prefersReduced]);

  // Auto-play: 6s interval, pause on hover
  useEffect(() => {
    if (properties.length < 2) return;
    const start = () => {
      autoPlayRef.current = setInterval(goNext, 6000);
    };
    start();
    const el = containerRef.current;
    const pause = () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    el?.addEventListener('mouseenter', pause);
    el?.addEventListener('mouseleave', start);
    return () => {
      pause();
      el?.removeEventListener('mouseenter', pause);
      el?.removeEventListener('mouseleave', start);
    };
  }, [goNext, properties.length]);

  if (!properties.length) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-primary">
        <p className="text-primary-foreground text-lg">Loading properties…</p>
      </section>
    );
  }

  const active = properties[activeIndex];
  const [line1, line2] = splitName(active.display_name || active.name);

  // Build the 3 inactive cards in cyclic order
  const cards: typeof properties = [];
  for (let i = 1; i <= 3 && i < count; i++) {
    cards.push(properties[(activeIndex + i) % count]);
  }

  const padIndex = (n: number) => String(n + 1).padStart(2, '0');

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden select-none"
      onTouchStart={(e) => { touchStartX.current = e.targetTouches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        touchStartX.current = null;
        if (diff > 50) goNext();
        else if (diff < -50) goPrev();
      }}
    >
      {/* ── Background layers (cross-fade) ── */}
      {prevIndex !== null && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${properties[prevIndex].hero_image_url})`,
            zIndex: 0,
          }}
        />
      )}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[800ms] ease-in-out"
        style={{
          backgroundImage: `url(${active.hero_image_url})`,
          opacity: prevIndex !== null && !prefersReduced ? 0 : 1,
          zIndex: 1,
        }}
        onTransitionEnd={() => {
          if (prevIndex !== null) {
            setPrevIndex(null);
            setIsTransitioning(false);
          }
        }}
      />
      {prevIndex !== null && !prefersReduced && (
        <div
          className="absolute inset-0 bg-cover bg-center animate-[heroFadeIn_0.8s_ease-in-out_forwards]"
          style={{
            backgroundImage: `url(${active.hero_image_url})`,
            zIndex: 2,
          }}
        />
      )}

      {/* Subtle dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/25" style={{ zIndex: 3 }} />
      {/* Gradient overlays for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 md:from-black/60 via-black/25 to-transparent" style={{ zIndex: 4 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 md:from-black/50 via-transparent to-transparent" style={{ zIndex: 4 }} />

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Main area */}
        <div className="flex-1 flex items-end md:items-center pb-4 md:pb-0">
          <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 w-full">
            {/* Left: Active property info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? {} : { opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg"
              >
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white uppercase tracking-wider leading-tight"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                >
                  {line1}
                  {line2 && (
                    <>
                      <br />
                      {line2}
                    </>
                  )}
                </h1>
                <p
                  className="mt-4 text-white/90 text-sm md:text-base max-w-md leading-relaxed line-clamp-2"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
                >
                  {active.short_description || `Discover the beauty of ${active.city}, ${active.country}`}
                </p>
                <Link
                  to={`/properties/${active.slug}`}
                  className="mt-6 inline-block px-8 py-3 rounded-full text-white font-semibold text-sm uppercase tracking-wider bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition-all shadow-[0_4px_20px_rgba(220,50,20,0.4)] hover:shadow-[0_6px_28px_rgba(220,50,20,0.55)]"
                >
                  Explore
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Right: Portrait card slider with clipping window */}
            {cards.length > 0 && (
              <div className="overflow-hidden rounded-xl w-full md:w-auto" style={{ maxWidth: isMobile ? '100%' : '600px' }}>
                <div className="flex gap-2 md:gap-4 justify-center md:justify-start">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {cards.map((prop, i) => (
                      <motion.div
                        key={prop.id}
                        layout
                        initial={prefersReduced ? {} : { opacity: 0, x: direction === 'next' ? 80 : -80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReduced ? {} : { opacity: 0, x: direction === 'next' ? -80 : 80 }}
                        transition={{ duration: 0.5, delay: i * 0.06 }}
                        className="relative w-[100px] h-[130px] md:w-[175px] md:h-[300px] lg:w-[190px] lg:h-[340px] rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                        onClick={() => {
                          if (isTransitioning) return;
                          setDirection('next');
                          setIsTransitioning(true);
                          setPrevIndex(activeIndex);
                          setActiveIndex((activeIndex + i + 1) % count);
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${prop.hero_image_url})` }}
                        />
                        {/* Dark gradient overlay at bottom for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p
                            className="text-white font-serif font-semibold text-sm leading-snug"
                            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                          >
                            {prop.display_name || prop.name}
                          </p>
                          <span className="flex items-center gap-1 text-white/90 text-xs mt-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {prop.city}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer bar ── */}
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

          {/* Center label */}
          <p className="hidden md:block text-[10px] uppercase tracking-[0.3em] text-white/60 font-sans">
            Unique Locations
          </p>

          {/* Pagination + nav arrows */}
          <div className="flex items-center gap-4 ml-auto md:ml-0">
            <span className="text-sm font-sans tracking-wider text-white/70">
              {padIndex(activeIndex)} / {padIndex(count - 1)}
            </span>
            <button
              onClick={goPrev}
              disabled={isTransitioning}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label="Previous property"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              disabled={isTransitioning}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label="Next property"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
