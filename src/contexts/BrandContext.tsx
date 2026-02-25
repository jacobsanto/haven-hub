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
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
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

// --- Auto-foreground helpers ---

function parseHsl(hslStr: string): [number, number, number] {
  const parts = hslStr.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return [0, 0, 50];
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
}

function hslToLuminance(h: number, s: number, l: number): number {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(f(0)) + 0.7152 * toLinear(f(8)) + 0.0722 * toLinear(f(4));
}

function autoForeground(baseHsl: string, darkFg = '244 42% 28%'): string {
  const [h, s, l] = parseHsl(baseHsl);
  const luminance = hslToLuminance(h, s, l);
  return luminance > 0.4 ? darkFg : '0 0% 100%';
}

// Map dark_palette keys like "primary_color" → CSS var name "primary"
const COLOR_KEY_TO_CSS: Record<string, string> = {
  primary_color: 'primary',
  secondary_color: 'secondary',
  accent_color: 'accent',
  background_color: 'background',
  foreground_color: 'foreground',
  muted_color: 'muted',
  card_color: 'card',
  border_color: 'border',
  destructive_color: 'destructive',
  ring_color: 'ring',
};

const FOREGROUND_TOKENS = ['primary', 'secondary', 'accent', 'muted', 'card', 'destructive'] as const;

function applyDarkPalette(palette: Record<string, string> | null) {
  let styleEl = document.getElementById('brand-dark-overrides');
  if (!palette) {
    if (styleEl) styleEl.remove();
    return;
  }
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'brand-dark-overrides';
    document.head.appendChild(styleEl);
  }

  // Build base vars + auto-compute foreground companions
  const vars: string[] = [];
  const resolved: Record<string, string> = {};

  for (const [key, val] of Object.entries(palette)) {
    const cssName = COLOR_KEY_TO_CSS[key] || key.replace(/_color$/, '').replace(/_/g, '-');
    vars.push(`--${cssName}: ${val};`);
    resolved[cssName] = val;
  }

  // Determine dark-mode foreground base for auto-contrast
  const darkFg = resolved['foreground'] || '0 0% 100%';

  for (const token of FOREGROUND_TOKENS) {
    if (resolved[token]) {
      vars.push(`--${token}-foreground: ${autoForeground(resolved[token], darkFg)};`);
    }
  }

  // Sync popover
  if (resolved['card'] || resolved['background']) {
    const popoverBg = resolved['card'] || resolved['background'];
    vars.push(`--popover: ${popoverBg};`);
    vars.push(`--popover-foreground: ${autoForeground(popoverBg, darkFg)};`);
  }

  // Sync sidebar
  if (resolved['background']) vars.push(`--sidebar-background: ${resolved['background']};`);
  if (resolved['foreground']) vars.push(`--sidebar-foreground: ${resolved['foreground']};`);
  if (resolved['primary']) {
    vars.push(`--sidebar-primary: ${resolved['primary']};`);
    vars.push(`--sidebar-primary-foreground: ${autoForeground(resolved['primary'], darkFg)};`);
  }
  if (resolved['accent']) {
    vars.push(`--sidebar-accent: ${resolved['accent']};`);
    vars.push(`--sidebar-accent-foreground: ${autoForeground(resolved['accent'], darkFg)};`);
  }
  if (resolved['border']) {
    vars.push(`--sidebar-border: ${resolved['border']};`);
    vars.push(`--input: ${resolved['border']};`);
  }
  if (resolved['ring']) vars.push(`--sidebar-ring: ${resolved['ring']};`);

  styleEl.textContent = `.dark {\n  ${vars.join('\n  ')}\n}`;
}

function deriveAccentHover(accentHsl: string): string {
  const [h, s, l] = parseHsl(accentHsl);
  return `${Math.round(h)} ${Math.round(Math.min(100, s + 15))}% ${Math.round(Math.max(0, l - 5))}%`;
}

function deriveSectionAlt(bgHsl: string): string {
  const [h, s, l] = parseHsl(bgHsl);
  // Slightly warmer tint of the background
  const newH = h === 0 && s === 0 ? 36 : h; // Pure white → warm tint
  return `${Math.round(newH)} ${Math.round(Math.min(100, Math.max(s, 33)))}% ${Math.round(Math.min(99, l - 1.5))}%`;
}

function applyTheme(settings: BrandSettings) {
  const root = document.documentElement;
  const fg = settings.foreground_color;

  // Base color tokens
  root.style.setProperty('--primary', settings.primary_color);
  root.style.setProperty('--secondary', settings.secondary_color);
  root.style.setProperty('--accent', settings.accent_color);
  root.style.setProperty('--background', settings.background_color);
  root.style.setProperty('--foreground', fg);

  if (settings.muted_color) root.style.setProperty('--muted', settings.muted_color);
  if (settings.card_color) root.style.setProperty('--card', settings.card_color);
  if (settings.border_color) {
    root.style.setProperty('--border', settings.border_color);
    root.style.setProperty('--input', settings.border_color);
  }
  if (settings.destructive_color) root.style.setProperty('--destructive', settings.destructive_color);
  if (settings.ring_color) root.style.setProperty('--ring', settings.ring_color);

  // Derived tokens — auto-computed from accent and background
  root.style.setProperty('--accent-hover', deriveAccentHover(settings.accent_color));
  root.style.setProperty('--section-alt', deriveSectionAlt(settings.background_color));

  // Auto-computed foreground companions
  root.style.setProperty('--primary-foreground', autoForeground(settings.primary_color, fg));
  root.style.setProperty('--secondary-foreground', autoForeground(settings.secondary_color, fg));
  root.style.setProperty('--accent-foreground', autoForeground(settings.accent_color, fg));
  if (settings.muted_color) root.style.setProperty('--muted-foreground', autoForeground(settings.muted_color, fg));
  if (settings.card_color) root.style.setProperty('--card-foreground', autoForeground(settings.card_color, fg));
  if (settings.destructive_color) root.style.setProperty('--destructive-foreground', autoForeground(settings.destructive_color, fg));

  // Popover sync (follows card or background)
  const popoverBg = settings.card_color || settings.background_color;
  root.style.setProperty('--popover', popoverBg);
  root.style.setProperty('--popover-foreground', autoForeground(popoverBg, fg));

  // Sidebar sync
  root.style.setProperty('--sidebar-background', settings.background_color);
  root.style.setProperty('--sidebar-foreground', fg);
  root.style.setProperty('--sidebar-primary', settings.primary_color);
  root.style.setProperty('--sidebar-primary-foreground', autoForeground(settings.primary_color, fg));
  root.style.setProperty('--sidebar-accent', settings.accent_color);
  root.style.setProperty('--sidebar-accent-foreground', autoForeground(settings.accent_color, fg));
  if (settings.border_color) root.style.setProperty('--sidebar-border', settings.border_color);
  if (settings.ring_color) root.style.setProperty('--sidebar-ring', settings.ring_color);

  // Dark palette overrides
  applyDarkPalette(settings.dark_palette);

  // Fonts
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
    socialInstagram: settings?.social_instagram ?? null,
    socialFacebook: settings?.social_facebook ?? null,
    socialTwitter: settings?.social_twitter ?? null,
    socialYoutube: settings?.social_youtube ?? null,
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
      socialInstagram: null,
      socialFacebook: null,
      socialTwitter: null,
      socialYoutube: null,
    };
  }
  return context;
}
