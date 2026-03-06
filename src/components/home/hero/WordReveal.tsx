import { motion } from 'framer-motion';
import type { BezierDefinition } from 'framer-motion';

const EASE: BezierDefinition = [0.22, 1, 0.36, 1];

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: EASE },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

interface WordRevealProps {
  text: string;
  className?: string;
  accentWord?: string;
  reduced?: boolean;
}

export function WordReveal({ text, className, accentWord, reduced }: WordRevealProps) {
  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(' ');

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0 0.3em' }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordVariants}
          className={i === 0 ? 'text-primary-foreground' : 'text-accent'}
          style={{ display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
