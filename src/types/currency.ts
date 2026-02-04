export type SupportedCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'AUD' | 'CAD';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
];

export const BASE_CURRENCY: SupportedCurrency = 'EUR';

export interface ExchangeRates {
  USD: number;
  GBP: number;
  CHF: number;
  AUD: number;
  CAD: number;
}

export interface FormattedPrice {
  display: string;        // The converted price (e.g., "≈ $540")
  original: string;       // The original EUR price (e.g., "€500")
  isConverted: boolean;   // True if display !== EUR
  convertedAmount: number;
  originalAmount: number;
}
