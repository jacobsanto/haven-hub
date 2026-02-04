/**
 * Centralized currency formatting utilities for Haven Hub.
 * 
 * BASE CURRENCY: EUR (Euro)
 * - All prices in database are stored in EUR
 * - All Stripe payments are processed in EUR
 * - Admin dashboard always displays EUR
 * - Frontend guests can view converted prices via CurrencyContext
 */

/**
 * Format a price in EUR for admin display.
 * Admin always sees EUR - no conversion needed.
 */
export function formatEuro(amount: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

/**
 * Format a number as compact currency (e.g., €1.2K, €2.5M)
 * Useful for dashboard stats where space is limited
 */
export function formatEuroCompact(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(1)}K`;
  }
  return formatEuro(amount);
}

/**
 * Format percentage values consistently
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}
