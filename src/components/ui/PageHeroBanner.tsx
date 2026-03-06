import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  value: string | number;
  label: string;
  suffix?: string;
}

interface PageHeroBannerProps {
  label?: string;
  labelIcon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: string;
  stats?: StatItem[];
  backgroundImage?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeroBanner({
  label,
  labelIcon: LabelIcon,
  title,
  subtitle,
  stats,
  backgroundImage,
  children,
  className,
}: PageHeroBannerProps) {
  return (
    <section className={cn('relative pt-28 pb-16 overflow-hidden', className)}>
      {/* Ambient blurred background */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.3] blur-[80px] brightness-[0.15] saturate-[0.4]"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </>
      )}

      <div className="relative z-10 max-w-[1200px] mx-auto px-[5%] text-center">
        {label && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-4 flex items-center justify-center gap-1.5"
          >
            {LabelIcon && <LabelIcon className="h-3.5 w-3.5" />}
            {label}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-[clamp(36px,5vw,60px)] font-bold text-foreground leading-[1.05] mb-3"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-[15px] text-muted-foreground/60 max-w-[540px] mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-7 flex justify-center gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-[28px] font-bold text-accent">
                  {stat.value}
                  {stat.suffix && <span className="text-lg font-normal text-accent/70">{stat.suffix}</span>}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground/60 tracking-[0.1em] uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {children}
      </div>
    </section>
  );
}
