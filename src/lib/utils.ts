import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get semantic Tailwind classes for status badges
 * Supports dark mode and uses consistent design tokens
 */
export function getStatusColors(status: string): string {
  const statusMap: Record<string, string> = {
    // Success states
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    
    // Warning states
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    new: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    
    // Error states
    error: 'bg-destructive/10 text-destructive',
    failed: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-destructive/10 text-destructive',
    
    // Info states
    running: 'bg-primary/10 text-primary',
    processing: 'bg-primary/10 text-primary',
    
    // Neutral states
    default: 'bg-muted text-muted-foreground',
    archived: 'bg-muted text-muted-foreground',
    idle: 'bg-muted text-muted-foreground',
  };
  return statusMap[status.toLowerCase()] || statusMap.default;
}
