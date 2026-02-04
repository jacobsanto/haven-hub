import { useCallback } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '@/types/currency';

interface FormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Hook for formatting currency using the dynamic base currency from brand settings.
 * Use this in React components for admin dashboard displays.
 */
export function useFormatCurrency() {
  const { baseCurrency } = useBrand();

  const getCurrencyInfo = useCallback(
    (code: SupportedCurrency = baseCurrency) => {
      return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
    },
    [baseCurrency]
  );

  /**
   * Format an amount in the base currency
   */
  const format = useCallback(
    (amount: number, options?: FormatOptions): string => {
      const currencyInfo = getCurrencyInfo(baseCurrency);
      return new Intl.NumberFormat(currencyInfo.locale, {
        style: 'currency',
        currency: baseCurrency,
        minimumFractionDigits: options?.minimumFractionDigits ?? 0,
        maximumFractionDigits: options?.maximumFractionDigits ?? 0,
      }).format(amount);
    },
    [baseCurrency, getCurrencyInfo]
  );

  /**
   * Format as compact currency (e.g., €1.2K, $2.5M)
   */
  const formatCompact = useCallback(
    (amount: number): string => {
      const currencyInfo = getCurrencyInfo(baseCurrency);
      if (amount >= 1000000) {
        return `${currencyInfo.symbol}${(amount / 1000000).toFixed(1)}M`;
      }
      if (amount >= 1000) {
        return `${currencyInfo.symbol}${(amount / 1000).toFixed(1)}K`;
      }
      return format(amount);
    },
    [baseCurrency, format, getCurrencyInfo]
  );

  return {
    format,
    formatCompact,
    baseCurrency,
    currencyInfo: getCurrencyInfo(baseCurrency),
  };
}
