import { cn } from '@/lib/utils';

interface FloatingBlobProps {
  className?: string;
  variant?: 'primary' | 'accent' | 'cloud';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animationVariant?: 1 | 2 | 3 | 4;
}

const positionClasses: Record<string, string> = {
  'top-left': 'top-10 left-10 md:top-20 md:left-10',
  'top-right': 'top-10 right-10 md:top-20 md:right-10',
  'bottom-left': 'bottom-10 left-10 md:bottom-20 md:left-10',
  'bottom-right': 'bottom-10 right-10 md:bottom-20 md:right-10',
  'center-left': 'top-1/3 left-0 md:left-5',
  'center-right': 'top-1/4 right-0 md:right-5',
};

const sizeClasses: Record<string, string> = {
  sm: 'w-32 h-32 md:w-48 md:h-48',
  md: 'w-48 h-48 md:w-64 md:h-64',
  lg: 'w-64 h-64 md:w-96 md:h-96',
  xl: 'w-80 h-80 md:w-[30rem] md:h-[30rem]',
};

const variantClasses: Record<string, string> = {
  primary: 'bg-primary/8 organic-blob',
  accent: 'bg-accent/12 organic-blob',
  cloud: 'bg-white/40 cloud-blob',
};

const animationClasses: Record<number, string> = {
  1: 'animate-float-1',
  2: 'animate-float-2',
  3: 'animate-float-3',
  4: 'animate-float-4',
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
        'absolute pointer-events-none',
        positionClasses[position],
        sizeClasses[size],
        variantClasses[variant],
        animationClasses[animationVariant],
        className
      )}
    />
  );
};
