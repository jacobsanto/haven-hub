import { cn } from '@/lib/utils';

interface FloatingBlobProps {
  className?: string;
  variant?: 'primary' | 'accent';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  animationVariant?: 1 | 2 | 3;
}

const positionClasses = {
  'top-left': 'top-10 left-10 md:top-20 md:left-10',
  'top-right': 'top-10 right-10 md:top-20 md:right-10',
  'bottom-left': 'bottom-10 left-10 md:bottom-20 md:left-10',
  'bottom-right': 'bottom-10 right-10 md:bottom-20 md:right-10',
};

const sizeClasses = {
  sm: 'w-32 h-32 md:w-48 md:h-48',
  md: 'w-48 h-48 md:w-64 md:h-64',
  lg: 'w-64 h-64 md:w-96 md:h-96',
};

const variantClasses = {
  primary: 'bg-primary/5',
  accent: 'bg-accent/10',
};

const animationClasses = {
  1: 'animate-float-1',
  2: 'animate-float-2',
  3: 'animate-float-3',
};

export const FloatingBlob = ({
  className,
  variant = 'primary',
  position,
  size = 'md',
  animationVariant = 1,
}: FloatingBlobProps) => {
  return (
    <div
      className={cn(
        'absolute organic-blob',
        positionClasses[position],
        sizeClasses[size],
        variantClasses[variant],
        animationClasses[animationVariant],
        className
      )}
    />
  );
};
