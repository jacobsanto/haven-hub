import { Variants, Transition, useReducedMotion } from 'framer-motion';
import type { BezierDefinition } from 'framer-motion';

// --- Easing Curves ---
export const easePremium: BezierDefinition = [0.22, 1, 0.36, 1];
export const easeOutExpo: BezierDefinition = [0.16, 1, 0.3, 1];

// --- Shared Transitions ---
export const transitionPremium: Transition = {
  duration: 0.6,
  ease: easePremium,
};

export const transitionFast: Transition = {
  duration: 0.35,
  ease: easePremium,
};

// --- Stagger Container/Child ---
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easePremium },
  },
};

// --- Viewport Reveal ---
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easePremium },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: easePremium },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easePremium },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easePremium },
  },
};

// --- Hero Stagger ---
export const heroStagger = {
  container: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  } as Variants,
  child: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: easePremium },
    },
  } as Variants,
};

// --- Section Heading ---
export const sectionHeading: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easePremium },
  },
};

// --- Reduced Motion Utility ---
export { useReducedMotion };

/**
 * Returns either the motion variant or a static variant depending on reduced motion preference.
 */
export function getReducedMotionVariants(variants: Variants, prefersReduced: boolean | null): Variants {
  if (prefersReduced) {
    return {
      hidden: {},
      visible: {},
    };
  }
  return variants;
}

// Common viewport settings for whileInView
export const viewportOnce = { once: true, margin: '-60px' as string };
