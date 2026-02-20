import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);

      const sectionElements = sections
        .map(section => ({
          id: section.id,
          element: document.getElementById(section.id),
        }))
        .filter(item => item.element !== null);

      const scrollPosition = window.scrollY + 150;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const { id, element } = sectionElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

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
