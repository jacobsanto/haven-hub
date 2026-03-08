import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
}

interface PropertyStickyNavProps {
  sections: Section[];
  propertyName: string;
}

export function PropertyStickyNav({ sections, propertyName }: PropertyStickyNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Cache section offsets to avoid forced reflows on every scroll
  const cachedOffsets = useRef<{ id: string; top: number }[]>([]);
  const rafId = useRef<number>(0);

  const recacheOffsets = useCallback(() => {
    cachedOffsets.current = sections
      .map(s => {
        const el = document.getElementById(s.id);
        return el ? { id: s.id, top: el.offsetTop } : null;
      })
      .filter(Boolean) as { id: string; top: number }[];
  }, [sections]);

  useEffect(() => {
    // Cache offsets once on mount and on resize (geometry changes)
    recacheOffsets();
    window.addEventListener('resize', recacheOffsets, { passive: true });

    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const sy = window.scrollY;
        setIsVisible(sy > 400);

        const scrollPosition = sy + 150;
        const offsets = cachedOffsets.current;
        for (let i = offsets.length - 1; i >= 0; i--) {
          if (offsets[i].top <= scrollPosition) {
            setActiveSection(offsets[i].id);
            break;
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', recacheOffsets);
      cancelAnimationFrame(rafId.current);
    };
  }, [sections, recacheOffsets]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center h-14 md:h-16 gap-4 overflow-x-auto scrollbar-hide">
              <span className="hidden lg:block font-serif font-medium text-foreground truncate max-w-[200px] flex-shrink-0">
                {propertyName}
              </span>
              
              <div className="hidden lg:block w-px h-6 bg-border flex-shrink-0" />
              
              <nav className="flex items-center gap-1 md:gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      'px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2',
                      activeSection === section.id
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
