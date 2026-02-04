import { SupportedCurrency, SUPPORTED_CURRENCIES } from '@/types/currency';

/**
 * Centralized currency formatting utilities for Haven Hub.
 * 
 * BASE CURRENCY: Configurable via Admin Settings > Currency
 * - All prices in database are stored in the base currency
 * - All Stripe payments are processed in the base currency
 * - Admin dashboard displays the base currency
 * - Frontend guests can view converted prices via CurrencyContext
 */

/**
 * Format a price in EUR for admin display.
 * @deprecated Use useFormatCurrency() hook for dynamic base currency support
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
 * @deprecated Use useFormatCurrency().formatCompact() for dynamic base currency
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
 * Format a price in a specific currency (for non-React contexts)
 */
export function formatCurrency(
  amount: number, 
  currency: SupportedCurrency,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

/**
 * Format a number as compact currency for any currency
 */
export function formatCurrencyCompact(amount: number, currency: SupportedCurrency): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
  if (amount >= 1000000) {
    return `${currencyInfo.symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currencyInfo.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}

/**
 * Format percentage values consistently
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}
