import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  ExchangeRates,
  FormattedPrice,
  CurrencyInfo,
} from '@/types/currency';

interface CurrencyContextValue {
  selectedCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  formatPrice: (eurAmount: number) => FormattedPrice;
  formatPriceSimple: (eurAmount: number) => string;
  currencies: CurrencyInfo[];
  getCurrencyInfo: (code: SupportedCurrency) => CurrencyInfo;
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

  // Format price with conversion
  const formatPrice = useCallback((eurAmount: number): FormattedPrice => {
    const eurInfo = getCurrencyInfo('EUR');
    const selectedInfo = getCurrencyInfo(selectedCurrency);
    
    // Format EUR amount
    const originalFormatted = new Intl.NumberFormat(eurInfo.locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(eurAmount);

    // If EUR is selected, no conversion needed
    if (selectedCurrency === 'EUR') {
      return {
        display: originalFormatted,
        original: originalFormatted,
        isConverted: false,
        convertedAmount: eurAmount,
        originalAmount: eurAmount,
      };
    }

    // Convert to selected currency
    const rate = exchangeRates?.[selectedCurrency] || 1;
    const convertedAmount = eurAmount * rate;
    
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
      originalAmount: eurAmount,
    };
  }, [selectedCurrency, exchangeRates, getCurrencyInfo]);

  // Simple format that just returns the display string
  const formatPriceSimple = useCallback((eurAmount: number): string => {
    return formatPrice(eurAmount).display;
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
  }), [selectedCurrency, setSelectedCurrency, exchangeRates, isLoading, formatPrice, formatPriceSimple, getCurrencyInfo]);

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
