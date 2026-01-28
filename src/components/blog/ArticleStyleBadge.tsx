import { Map, Sparkles, Lightbulb } from 'lucide-react';
import { getArticleStyle, ArticleStyle } from '@/types/article-styles';
import { cn } from '@/lib/utils';

interface ArticleStyleBadgeProps {
  categorySlug?: string;
  variant?: 'default' | 'compact' | 'overlay';
  className?: string;
}

const styleConfig: Record<ArticleStyle, {
  icon: typeof Map;
  label: string;
  bgClass: string;
  textClass: string;
}> = {
  'destination-guide': {
    icon: Map,
    label: 'Guide',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
  },
  'lifestyle': {
    icon: Sparkles,
    label: 'Lifestyle',
    bgClass: 'bg-secondary/20',
    textClass: 'text-secondary-foreground',
  },
  'travel-tips': {
    icon: Lightbulb,
    label: 'Tips',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
};

export function ArticleStyleBadge({ 
  categorySlug, 
  variant = 'default',
  className 
}: ArticleStyleBadgeProps) {
  const style = getArticleStyle(categorySlug);
  const config = styleConfig[style];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium",
          config.textClass,
          className
        )}
        title={`${config.label} layout`}
      >
        <Icon className="h-3 w-3" />
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          "bg-background/80 backdrop-blur-sm",
          config.textClass,
          className
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
