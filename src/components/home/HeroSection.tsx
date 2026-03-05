import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { BezierDefinition } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useBrand } from '@/contexts/BrandContext';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { HeroSearchForm } from './HeroSearchForm';

const TRANSITION_MS = 700;
const AUTOPLAY_MS = 6000;
const EASE_PREMIUM: BezierDefinition = [0.22, 1, 0.36, 1];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.05 },
  },
  exit: {
    transition: { staggerChildren: 0.08, staggerDirection: -1 },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: TRANSITION_MS / 1000, ease: EASE_PREMIUM } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: EASE_PREMIUM } },
};

export function HeroSection() {
  const { data: allProperties } = useFeaturedProperties();
  const { socialFacebook, socialYoutube, socialInstagram } = useBrand();
  const { showSearchBar } = useHeroSettings();
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobile();

  const properties = (allProperties || []).slice(0, 4);
  const count = properties.length || 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(0); // resets progress bar animation

  // Refs for stable autoplay
  const activeIndexRef = useRef(activeIndex);
  const isTransitioningRef = useRef(isTransitioning);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollY = useRef(0);
  const textRef = useRef<HTMLDivElement>(null);

  activeIndexRef.current = activeIndex;
  isTransitioningRef.current = isTransitioning;

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (isTransitioningRef.current || properties.length < 2) return;
    const current = activeIndexRef.current;
    const next = dir === 'next'
      ? (current + 1) % count
      : (current - 1 + count) % count;
    setDisplayIndex(current);
    setActiveIndex(next);
    setIsTransitioning(true);
    setProgressKey(k => k + 1); // reset progress bar
  }, [count, properties.length]);

  const goNext = useCallback(() => navigate('next'), [navigate]);
  const goPrev = useCallback(() => navigate('prev'), [navigate]);

  const handleTransitionEnd = useCallback(() => {
    setDisplayIndex(activeIndexRef.current);
    setIsTransitioning(false);
  }, []);

  // Reduced motion: instantly complete
  useEffect(() => {
    if (isTransitioning && prefersReduced) {
      setDisplayIndex(activeIndex);
      setIsTransitioning(false);
    }
  }, [isTransitioning, prefersReduced, activeIndex]);

  // Stable autoplay
  useEffect(() => {
    if (properties.length < 2) return;

    const startAutoplay = () => {
      stopAutoplay();
      autoPlayRef.current = setInterval(() => {
        if (!isTransitioningRef.current) {
          const current = activeIndexRef.current;
          const next = (current + 1) % count;
          setDisplayIndex(current);
          setActiveIndex(next);
          setIsTransitioning(true);
          setProgressKey(k => k + 1);
        }
      }, AUTOPLAY_MS);
    };

    const stopAutoplay = () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };

    startAutoplay();

    const el = containerRef.current;
    el?.addEventListener('mouseenter', stopAutoplay);
    el?.addEventListener('mouseleave', startAutoplay);

    return () => {
      stopAutoplay();
      el?.removeEventListener('mouseenter', stopAutoplay);
      el?.removeEventListener('mouseleave', startAutoplay);
    };
  }, [properties.length, count]);

  // Parallax on scroll
  useEffect(() => {
    if (prefersReduced) return;
    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        scrollY.current = window.scrollY;
        if (textRef.current) {
          textRef.current.style.transform = `translateY(${scrollY.current * 0.3}px)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [prefersReduced]);

  if (!properties.length) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-primary">
        <p className="text-primary-foreground text-lg">Loading properties…</p>
      </section>
    );
  }

  const active = properties[activeIndex];
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
      {/* Background: 2-layer system with Ken Burns + Clip-Path Reveal */}

      {/* Base layer — always visible, Ken Burns zoom */}
      <div
        key={`base-${displayIndex}`}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${properties[displayIndex]?.hero_image_url})`,
          zIndex: 0,
          animation: prefersReduced ? 'none' : `heroKenBurns ${AUTOPLAY_MS}ms ease-out forwards`,
        }}
      />

      {/* Incoming layer — clip-path reveal with Ken Burns */}
      {isTransitioning && (
        <div
          key={`transition-${activeIndex}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${active.hero_image_url})`,
            zIndex: 1,
            animation: prefersReduced
              ? 'none'
              : `heroClipReveal ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards, heroKenBurns ${AUTOPLAY_MS}ms ease-out forwards`,
          }}
          onAnimationEnd={(e) => {
            // Only fire on clip-path reveal completing, not Ken Burns
            if (e.animationName === 'heroClipReveal') {
              handleTransitionEnd();
            }
          }}
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/30" style={{ zIndex: 3 }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" style={{ zIndex: 4 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" style={{ zIndex: 4 }} />

      {/* Content with parallax */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex-1 flex items-center">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-3xl" ref={textRef}>
              {/* Staggered text entrance */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  variants={prefersReduced ? undefined : staggerContainer}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.h1
                    variants={prefersReduced ? undefined : staggerChild}
                    className="text-4xl md:text-5xl lg:text-7xl font-serif italic text-white leading-[1.1] tracking-tight"
                    style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                  >
                    Discover Your Perfect{' '}
                    <span className="text-accent">Getaway</span>{' '}
                    with Ease
                  </motion.h1>
                  <motion.p
                    variants={prefersReduced ? undefined : staggerChild}
                    className="mt-5 text-white/80 text-base md:text-lg max-w-xl leading-relaxed"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
                  >
                    {active.short_description || `Explore the beauty of ${active.city}, ${active.country} — luxury villas handpicked for unforgettable stays.`}
                  </motion.p>
                </motion.div>
              </AnimatePresence>

              {/* Mobile progress dots */}
              {properties.length > 1 && (
                <div className="flex md:hidden items-center gap-3 mt-6">
                  {properties.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (isTransitioning) return;
                        setDisplayIndex(activeIndex);
                        setActiveIndex(i);
                        setIsTransitioning(true);
                        setProgressKey(k => k + 1);
                      }}
                      className="relative rounded-full overflow-hidden"
                      aria-label={`Go to property ${i + 1}`}
                    >
                      <span className={`block rounded-full transition-all ${i === activeIndex ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40'}`} />
                      {i === activeIndex && !prefersReduced && (
                        <span
                          key={progressKey}
                          className="absolute inset-0 rounded-full border border-white/60"
                          style={{
                            animation: `heroProgressRing ${AUTOPLAY_MS}ms linear forwards`,
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Search form - desktop */}
              <div className="hidden md:block mt-10">
                <HeroSearchForm />
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="container mx-auto px-4 md:px-8 pb-6 flex items-center justify-between text-white">
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

          <p className="hidden md:block text-[10px] uppercase tracking-[0.3em] text-white/60 font-sans">
            Unique Locations
          </p>

          {/* Desktop progress + nav */}
          <div className="flex items-center gap-4 ml-auto md:ml-0">
            {/* Progress bar */}
            {properties.length > 1 && !prefersReduced && (
              <div className="hidden md:flex items-center gap-1.5">
                {properties.map((_, i) => (
                  <div key={i} className="w-8 h-0.5 rounded-full bg-white/20 overflow-hidden">
                    {i === activeIndex && (
                      <div
                        key={progressKey}
                        className="h-full bg-white rounded-full"
                        style={{
                          animation: `heroProgressFill ${AUTOPLAY_MS}ms linear forwards`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <span className="text-sm font-sans tracking-wider text-white/70">
              {padIndex(activeIndex)} / {padIndex(count - 1)}
            </span>
            <button onClick={goPrev} disabled={isTransitioning} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40" aria-label="Previous property">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext} disabled={isTransitioning} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40" aria-label="Next property">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroKenBurns {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
        @keyframes heroClipReveal {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes heroProgressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes heroProgressRing {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(2); }
        }
      `}</style>
    </section>
  );
}
