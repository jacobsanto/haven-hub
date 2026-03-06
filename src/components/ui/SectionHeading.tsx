import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  label?: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ label, title, subtitle, className, align = 'center' }: SectionHeadingProps) {
  return (
    <div className={cn(
      'mb-12',
      align === 'center' && 'text-center',
      className
    )}>
      {label && (
        <p className="font-sans text-[11px] tracking-[0.25em] text-accent uppercase mb-3.5">
          {label}
        </p>
      )}
      <h2 className="font-serif text-[clamp(28px,3.5vw,44px)] font-semibold text-foreground leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="font-sans text-sm text-muted-foreground/60 mt-4 max-w-lg leading-relaxed mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
