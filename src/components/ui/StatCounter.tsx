import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Stat {
  value: string | number;
  label: string;
  suffix?: string;
}

interface StatCounterProps {
  stats: Stat[];
  className?: string;
  columns?: number;
}

export function StatCounter({ stats, className, columns }: StatCounterProps) {
  const gridCols = columns || stats.length;
  
  return (
    <section className={cn('py-14', className)}>
      <div
        className="max-w-[1100px] mx-auto grid gap-4 px-[5%]"
        style={{ gridTemplateColumns: `repeat(${Math.min(gridCols, 6)}, 1fr)` }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center py-6"
          >
            <p className="font-serif text-4xl font-bold text-accent leading-none">
              {stat.value}
              {stat.suffix && (
                <span className="text-lg font-normal text-accent/70">{stat.suffix}</span>
              )}
            </p>
            <p className="font-sans text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mt-2">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
