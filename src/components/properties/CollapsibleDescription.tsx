import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { splitParagraphs } from '@/utils/text-helpers';
import { cn } from '@/lib/utils';

interface CollapsibleDescriptionProps {
  shortDescription?: string | null;
  fullDescription?: string | null;
  /** Number of paragraphs to show before collapsing */
  visibleCount?: number;
  /** Minimum total paragraphs to trigger collapsible */
  collapseThreshold?: number;
  /** Show drop-cap on first paragraph */
  dropCap?: boolean;
  /** Style variant */
  variant?: 'overview' | 'neighborhood';
  className?: string;
}

export function CollapsibleDescription({
  shortDescription,
  fullDescription,
  visibleCount = 2,
  collapseThreshold = 3,
  dropCap = false,
  variant = 'overview',
  className,
}: CollapsibleDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const paragraphs = fullDescription ? splitParagraphs(fullDescription) : [];
  const shouldCollapse = paragraphs.length > collapseThreshold;
  const visibleParagraphs = shouldCollapse ? paragraphs.slice(0, visibleCount) : paragraphs;
  const hiddenParagraphs = shouldCollapse ? paragraphs.slice(visibleCount) : [];

  const isNeighborhood = variant === 'neighborhood';

  return (
    <div className={cn(
      isNeighborhood && 'border-l-2 border-primary/20 pl-5',
      className,
    )}>
      {/* Short description / lead paragraph */}
      {shortDescription && (
        <p className={cn(
          'text-lg leading-relaxed font-serif text-foreground/90 mb-4',
          dropCap && 'first-letter:text-5xl first-letter:font-serif first-letter:font-medium first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-none',
        )}>
          {shortDescription}
        </p>
      )}

      {/* Full description paragraphs */}
      {visibleParagraphs.map((p, i) => (
        <p key={i} className="text-muted-foreground leading-relaxed mb-3">
          {p}
        </p>
      ))}

      {/* Collapsible overflow */}
      {shouldCollapse && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-3">
            {hiddenParagraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {isOpen
                ? 'Read less'
                : isNeighborhood
                  ? 'Read more about this area'
                  : 'Read more'}
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180',
              )} />
            </button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}
