import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useBrandSettings, BrandSettings, defaultBrandSettings } from '@/hooks/useBrandSettings';
import { SupportedCurrency } from '@/types/currency';

interface BrandContextValue {
  settings: BrandSettings | null;
  isLoading: boolean;
  brandName: string;
  brandTagline: string;
  logoUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  baseCurrency: SupportedCurrency;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

function loadGoogleFont(fontName: string) {
  const fontId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Don't reload if already loaded
  if (document.getElementById(fontId)) return;
  
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function applyTheme(settings: BrandSettings) {
  const root = document.documentElement;
  
  // Apply colors
  root.style.setProperty('--primary', settings.primary_color);
  root.style.setProperty('--secondary', settings.secondary_color);
  root.style.setProperty('--accent', settings.accent_color);
  root.style.setProperty('--background', settings.background_color);
  root.style.setProperty('--foreground', settings.foreground_color);
  
  // Apply fonts
  if (settings.heading_font) {
    loadGoogleFont(settings.heading_font);
    root.style.setProperty('--font-serif', `"${settings.heading_font}", serif`);
  }
  
  if (settings.body_font) {
    loadGoogleFont(settings.body_font);
    root.style.setProperty('--font-sans', `"${settings.body_font}", sans-serif`);
  }
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useBrandSettings();

  useEffect(() => {
    if (settings) {
      applyTheme(settings);
    }
  }, [settings]);

  const value: BrandContextValue = {
    settings: settings ?? null,
    isLoading,
    brandName: settings?.brand_name ?? defaultBrandSettings.brand_name,
    brandTagline: settings?.brand_tagline ?? defaultBrandSettings.brand_tagline ?? '',
    logoUrl: settings?.logo_url ?? null,
    contactEmail: settings?.contact_email ?? defaultBrandSettings.contact_email ?? '',
    contactPhone: settings?.contact_phone ?? defaultBrandSettings.contact_phone ?? '',
    contactAddress: settings?.contact_address ?? defaultBrandSettings.contact_address ?? '',
    baseCurrency: settings?.base_currency ?? defaultBrandSettings.base_currency,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    // Fail-safe: avoid blank-screen crashes if a component renders outside BrandProvider
    // (can happen during refactors/HMR). We still surface the problem loudly.
    // eslint-disable-next-line no-console
    console.error('useBrand must be used within a BrandProvider');

    return {
      settings: null,
      isLoading: true,
      brandName: defaultBrandSettings.brand_name,
      brandTagline: defaultBrandSettings.brand_tagline ?? '',
      logoUrl: defaultBrandSettings.logo_url ?? null,
      contactEmail: defaultBrandSettings.contact_email ?? '',
      contactPhone: defaultBrandSettings.contact_phone ?? '',
      contactAddress: defaultBrandSettings.contact_address ?? '',
      baseCurrency: defaultBrandSettings.base_currency,
    };
  }
  return context;
}
