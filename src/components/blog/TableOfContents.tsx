import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocItem[];
  className?: string;
}

export function TableOfContents({ headings, className = '' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  if (headings.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`${className}`}
    >
      <div className="sticky top-24">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
          <List className="h-4 w-4" />
          <span>On this page</span>
        </div>
        <ul className="space-y-2 border-l border-border pl-4">
          {headings.map(({ id, text, level }) => (
            <li key={id}>
              <button
                onClick={() => handleClick(id)}
                className={`
                  block text-left text-sm transition-all duration-200
                  hover:text-primary
                  ${level === 3 ? 'pl-4' : ''}
                  ${
                    activeId === id
                      ? 'text-primary font-medium -ml-[17px] pl-4 border-l-2 border-primary'
                      : 'text-muted-foreground'
                  }
                `}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
}
