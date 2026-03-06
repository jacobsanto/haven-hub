import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CategoryTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface CategoryFilterTabsProps {
  categories: CategoryTab[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  className?: string;
}

export function CategoryFilterTabs({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: CategoryFilterTabsProps) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-hide py-1', className)}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-xs font-semibold tracking-[0.08em] uppercase whitespace-nowrap transition-all duration-300 border',
              isActive
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {cat.label}
            {cat.count !== undefined && (
              <span className={cn(
                'text-[10px] font-normal',
                isActive ? 'text-accent/70' : 'text-muted-foreground/50'
              )}>
                {cat.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
