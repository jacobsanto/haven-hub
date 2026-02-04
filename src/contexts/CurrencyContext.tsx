import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useBrand } from '@/contexts/BrandContext';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  ExchangeRates,
  FormattedPrice,
  CurrencyInfo,
} from '@/types/currency';

interface CurrencyContextValue {
  selectedCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  formatPrice: (baseAmount: number) => FormattedPrice;
  formatPriceSimple: (baseAmount: number) => string;
  currencies: CurrencyInfo[];
  getCurrencyInfo: (code: SupportedCurrency) => CurrencyInfo;
  baseCurrency: SupportedCurrency;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = 'preferred_currency';

// Detect initial currency from browser locale
function detectInitialCurrency(): SupportedCurrency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedCurrency;
    if (stored && SUPPORTED_CURRENCIES.some(c => c.code === stored)) {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  // Try to detect from browser locale
  const locale = navigator.language || 'en-US';
  
  if (locale.includes('US')) return 'USD';
  if (locale.includes('GB') || locale.includes('UK')) return 'GBP';
  if (locale.includes('CH')) return 'CHF';
  if (locale.includes('AU')) return 'AUD';
  if (locale.includes('CA')) return 'CAD';
  
  // Default to EUR
  return 'EUR';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { baseCurrency } = useBrand();
  const [selectedCurrency, setSelectedCurrencyState] = useState<SupportedCurrency>(detectInitialCurrency);
  const { data: exchangeRates, isLoading } = useExchangeRates();

  // Persist currency selection
  const setSelectedCurrency = useCallback((currency: SupportedCurrency) => {
    setSelectedCurrencyState(currency);
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // localStorage not available
    }
  }, []);

  const getCurrencyInfo = useCallback((code: SupportedCurrency): CurrencyInfo => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
  }, []);

  // Format price with conversion from base currency
  const formatPrice = useCallback((baseAmount: number): FormattedPrice => {
    const baseInfo = getCurrencyInfo(baseCurrency);
    const selectedInfo = getCurrencyInfo(selectedCurrency);
    
    // Format base currency amount
    const originalFormatted = new Intl.NumberFormat(baseInfo.locale, {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(baseAmount);

    // If selected currency equals base currency, no conversion needed
    if (selectedCurrency === baseCurrency) {
      return {
        display: originalFormatted,
        original: originalFormatted,
        isConverted: false,
        convertedAmount: baseAmount,
        originalAmount: baseAmount,
      };
    }

    // Convert to selected currency
    // Note: exchangeRates are relative to EUR. If base is not EUR, we need to adjust.
    // For simplicity, we assume rates are still EUR-based from the API.
    // A full implementation would fetch rates relative to baseCurrency.
    const rate = exchangeRates?.[selectedCurrency as keyof ExchangeRates] || 1;
    const baseToEurRate = baseCurrency === 'EUR' ? 1 : (1 / (exchangeRates?.[baseCurrency as keyof ExchangeRates] || 1));
    const convertedAmount = baseAmount * baseToEurRate * rate;
    
    const displayFormatted = new Intl.NumberFormat(selectedInfo.locale, {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount);

    return {
      display: `≈ ${displayFormatted}`,
      original: originalFormatted,
      isConverted: true,
      convertedAmount,
      originalAmount: baseAmount,
    };
  }, [selectedCurrency, baseCurrency, exchangeRates, getCurrencyInfo]);

  // Simple format that just returns the display string
  const formatPriceSimple = useCallback((baseAmount: number): string => {
    return formatPrice(baseAmount).display;
  }, [formatPrice]);

  const value = useMemo<CurrencyContextValue>(() => ({
    selectedCurrency,
    setSelectedCurrency,
    exchangeRates,
    isLoading,
    formatPrice,
    formatPriceSimple,
    currencies: SUPPORTED_CURRENCIES,
    getCurrencyInfo,
    baseCurrency,
  }), [selectedCurrency, setSelectedCurrency, exchangeRates, isLoading, formatPrice, formatPriceSimple, getCurrencyInfo, baseCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
