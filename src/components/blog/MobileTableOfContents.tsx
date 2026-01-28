import { useState } from 'react';
import { List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface MobileTableOfContentsProps {
  headings: TocItem[];
}

export function MobileTableOfContents({ headings }: MobileTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
      setIsOpen(false);
    }
  };

  if (headings.length === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-24 right-4 z-40"
        >
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            aria-label="Open table of contents"
          >
            <List className="h-5 w-5" />
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg font-serif">
            <List className="h-5 w-5" />
            On This Page
          </SheetTitle>
        </SheetHeader>
        <nav className="py-6 overflow-y-auto max-h-[calc(70vh-100px)]">
          <ul className="space-y-1">
            {headings.map(({ id, text, level }) => (
              <li key={id}>
                <button
                  onClick={() => handleClick(id)}
                  className={`
                    w-full text-left py-3 px-4 rounded-lg transition-colors
                    text-foreground hover:bg-muted active:bg-muted/80
                    ${level === 3 ? 'pl-8 text-sm' : 'text-base font-medium'}
                  `}
                >
                  {text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
