import { useState, useEffect, useRef } from 'react';
import { useHeroSettings, useHeroSettingsMutations } from '@/hooks/useHeroSettings';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useBrandSettings, useUpdateBrandSettings, defaultBrandSettings } from '@/hooks/useBrandSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FontSelector } from '@/components/admin/FontSelector';
import { CurrencySettingsCard } from '@/components/admin/CurrencySettingsCard';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Palette, Type, Building2, Save, RotateCcw, Coins, Download, Upload, Sun, Moon, Check, AlertTriangle, X, CreditCard, Settings2, ChevronDown, Clock, Image, LayoutGrid, GalleryHorizontal, List, Star, Layers, Split, Grid2x2, Film, ArrowUpDown, CreditCard as CardIcon, Sparkles } from 'lucide-react';
import { ImageUploadWithOptimizer } from '@/components/admin/ImageUploadWithOptimizer';
import { IMAGE_PRESETS } from '@/utils/image-optimizer';
import { SupportedCurrency } from '@/types/currency';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAllSectionDisplaySettings, useUpsertSectionDisplay } from '@/hooks/useSectionDisplay';
import type { SectionDisplaySettings } from '@/hooks/useSectionDisplay';
import { Switch } from '@/components/ui/switch';

const HEADING_FONTS = [
  'Playfair Display', 'Cormorant Garamond', 'Lora', 'Merriweather', 'Crimson Text',
  'Libre Baskerville', 'Georgia', 'DM Serif Display', 'Spectral', 'Fraunces',
  'Abril Fatface', 'Josefin Slab', 'EB Garamond', 'Sorts Mill Goudy', 'Bitter',
  'Vollkorn', 'Cardo', 'Neuton', 'Alegreya', 'Gentium Book Plus',
  'Source Serif Pro', 'PT Serif', 'Noto Serif', 'IBM Plex Serif', 'Zilla Slab',
];

const BODY_FONTS = [
  'Lato', 'Montserrat', 'Inter', 'Open Sans', 'Source Sans Pro',
  'Nunito', 'Roboto', 'Work Sans', 'Poppins', 'Raleway',
  'Karla', 'Cabin', 'Rubik', 'DM Sans', 'Plus Jakarta Sans',
  'Outfit', 'Mulish', 'Quicksand', 'Barlow', 'Manrope',
  'Sora', 'Space Grotesk', 'Albert Sans', 'Red Hat Display', 'Figtree',
];

// --- HSL <-> Hex conversion helpers ---
function hslStringToHex(hsl: string): string {
  try {
    const parts = hsl.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
    if (!parts) return '#888888';
    const h = parseFloat(parts[1]);
    const s = parseFloat(parts[2]) / 100;
    const l = parseFloat(parts[3]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return '#888888';
  }
}

function hexToHslString(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h *= 60;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return '0 0% 50%';
  }
}

function getRelativeLuminance(hslStr: string): number {
  try {
    const hex = hslStringToHex(hslStr);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  } catch {
    return 0;
  }
}

function getContrastRatio(hsl1: string, hsl2: string): number {
  const l1 = getRelativeLuminance(hsl1);
  const l2 = getRelativeLuminance(hsl2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const ratio = getContrastRatio(fg, bg);
  if (ratio >= 4.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded px-1.5 py-0.5">
        <Check className="h-3 w-3" /> {ratio.toFixed(1)}
      </span>
    );
  }
  if (ratio >= 3) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
        <AlertTriangle className="h-3 w-3" /> {ratio.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-700 bg-red-100 rounded px-1.5 py-0.5">
      <X className="h-3 w-3" /> {ratio.toFixed(1)}
    </span>
  );
}

function invertHslLightness(hsl: string, satReduction = 10): string {
  const parts = hsl.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
  if (!parts) return hsl;
  const h = parseFloat(parts[1]);
  const s = Math.max(0, parseFloat(parts[2]) - satReduction);
  const l = Math.max(5, Math.min(95, 100 - parseFloat(parts[3])));
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function generateDarkPalette(light: Record<string, string>): Record<string, string> {
  return {
    primary_color: invertHslLightness(light.primary_color || '245 51% 19%', 0),
    secondary_color: invertHslLightness(light.secondary_color || '243 29% 86%', 5),
    accent_color: invertHslLightness(light.accent_color || '32 48% 66%', 0),
    background_color: invertHslLightness(light.background_color || '0 0% 100%', 15),
    foreground_color: invertHslLightness(light.foreground_color || '244 42% 28%', 5),
    muted_color: invertHslLightness(light.muted_color || '243 29% 86%', 10),
    card_color: invertHslLightness(light.card_color || '0 0% 100%', 12),
    border_color: invertHslLightness(light.border_color || '243 29% 86%', 10),
    destructive_color: invertHslLightness(light.destructive_color || '0 55% 55%', 0),
    ring_color: invertHslLightness(light.ring_color || '32 48% 66%', 0),
  };
}

const COLOR_KEYS = [
  'primary_color', 'secondary_color', 'accent_color', 'background_color',
  'foreground_color', 'muted_color', 'card_color', 'border_color',
  'destructive_color', 'ring_color',
] as const;

interface FormState {
  brand_name: string;
  brand_tagline: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  muted_color: string;
  card_color: string;
  border_color: string;
  destructive_color: string;
  ring_color: string;
  heading_font: string;
  body_font: string;
  heading_weight: number;
  body_weight: number;
  heading_letter_spacing: string;
  base_currency: SupportedCurrency;
}

// Collapsible section wrapper with timestamp
function SettingsSection({ title, icon, description, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-xs">{description}</CardDescription>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const HERO_STYLES = [
  { id: 'card-deck', name: 'Card Deck', desc: 'Dark minimalist stacked cards' },
  { id: 'parallax-depth', name: 'Parallax Depth', desc: 'Full-bleed image with parallax scroll' },
  { id: 'split-reveal', name: 'Split Reveal', desc: '55/45 split with clip-path reveal' },
  { id: 'morph-tiles', name: 'Morph Tiles', desc: '4-column grid that morphs active tile' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Ken Burns zoom with centered text' },
  { id: 'vertical-curtain', name: 'Vertical Curtain', desc: 'Vertical clip-path wipe transition' },
  { id: 'bright-minimalist', name: 'Bright Minimalist', desc: 'Light split layout with color-tinted stacked cards' },
];

function HeroImageSection() {
  const { heroBackgroundImage, heroStyle } = useHeroSettings();
  const { updateSetting } = useHeroSettingsMutations();
  const { toast } = useToast();

  const handleUpload = (url: string) => {
    updateSetting.mutate({ key: 'hero_background_image', value: url }, {
      onSuccess: () => toast({ title: 'Hero image updated' }),
      onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });
  };

  const handleRemove = () => {
    updateSetting.mutate({ key: 'hero_background_image', value: '' }, {
      onSuccess: () => toast({ title: 'Hero image removed', description: 'The featured property image will be used instead.' }),
    });
  };

  const handleStyleChange = (styleId: string) => {
    updateSetting.mutate({ key: 'hero_style', value: styleId }, {
      onSuccess: () => toast({ title: 'Hero style updated', description: `Switched to "${HERO_STYLES.find(s => s.id === styleId)?.name}". Refresh the homepage to see the change.` }),
      onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });
  };

  return (
    <SettingsSection
      title="Homepage Hero"
      icon={<Image className="h-5 w-5 text-primary" />}
      description="Hero slider style and custom background image"
    >
      <div className="space-y-6">
        {/* Hero Style Selector */}
        <div>
          <Label className="mb-3 block">Hero Slider Style</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {HERO_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  heroStyle === style.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:bg-muted/30'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{style.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{style.desc}</p>
                {heroStyle === style.id && (
                  <Badge variant="default" className="mt-2 text-[10px]">Active</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Background Image */}
        <div>
          <Label className="mb-3 block">Custom Background Image</Label>
          <ImageUploadWithOptimizer
            value={heroBackgroundImage || undefined}
            onUpload={handleUpload}
            onRemove={handleRemove}
            preset={IMAGE_PRESETS.hero}
            storagePath="hero"
            label="Upload Hero Background"
            aspectClass="aspect-[21/9] max-w-full"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Upload a custom hero background image. If left empty, the featured property's image will be used. Recommended size: 1920×800px or wider.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}

const CARD_LAYOUT_OPTIONS = [
  { id: 'grid' as const, name: 'Grid', desc: 'Responsive column layout', icon: LayoutGrid },
  { id: 'carousel' as const, name: 'Carousel', desc: 'Horizontal slider with navigation', icon: GalleryHorizontal },
  { id: 'list' as const, name: 'List', desc: 'Vertical stacked cards', icon: List },
  { id: 'featured' as const, name: 'Featured', desc: 'Hero card + supporting grid', icon: Star },
];

const SHOWCASE_LAYOUT_OPTIONS = [
  { id: 'parallax-depth' as const, name: 'Parallax Depth', desc: 'Full-bleed parallax with scale transitions', icon: Layers },
  { id: 'split-reveal' as const, name: 'Split Reveal', desc: '55/45 split with clip-path reveal', icon: Split },
  { id: 'morph-tiles' as const, name: 'Morph Tiles', desc: '4-tile grid that expands active tile', icon: Grid2x2 },
  { id: 'cinematic' as const, name: 'Cinematic', desc: 'Centered text with Ken Burns zoom', icon: Film },
  { id: 'vertical-curtain' as const, name: 'Vertical Curtain', desc: 'Vertical clip-path with side nav dots', icon: ArrowUpDown },
  { id: 'card-deck' as const, name: 'Card Deck', desc: 'Stacked cards with ambient blur', icon: CardIcon },
  { id: 'bright-minimalist' as const, name: 'Bright Minimalist', desc: 'Light split layout with color-tinted cards', icon: Sparkles },
];

const HOMEPAGE_SECTIONS = [
  { key: 'destinations', label: 'Destinations Showcase', desc: 'Destination cards on homepage' },
  { key: 'discover-villas', label: 'Discover Villas', desc: 'Property cards carousel/grid' },
  { key: 'featured-vacations', label: 'Featured Vacations', desc: 'Featured property highlights' },
  { key: 'experiences', label: 'Live Experiences', desc: 'Experience cards section' },
];

function HomepageSectionsLayout() {
  const { data: allSettings, isLoading } = useAllSectionDisplaySettings();
  const upsert = useUpsertSectionDisplay();
  const { toast } = useToast();

  const getSettings = (sectionKey: string): Partial<SectionDisplaySettings> => {
    const found = allSettings?.find(s => s.page_slug === 'home' && s.section_key === sectionKey);
    return found || { layout_mode: 'grid', autoplay: false, items_per_view: 3, show_navigation: true, show_dots: false, columns: 3 };
  };

  const handleLayoutChange = (sectionKey: string, mode: string) => {
    upsert.mutate({ page_slug: 'home', section_key: sectionKey, layout_mode: mode as SectionDisplaySettings['layout_mode'] }, {
      onSuccess: () => toast({ title: 'Layout updated', description: `Refresh the homepage to see the change.` }),
      onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });
  };

  const handleOptionChange = (sectionKey: string, field: string, value: any) => {
    upsert.mutate({ page_slug: 'home', section_key: sectionKey, [field]: value }, {
      onSuccess: () => toast({ title: 'Setting updated' }),
    });
  };

  return (
    <SettingsSection
      title="Homepage Section Layouts"
      icon={<LayoutGrid className="h-5 w-5 text-primary" />}
      description="Choose display layout for each homepage content section"
    >
      <div className="space-y-6">
        {HOMEPAGE_SECTIONS.map((section) => {
          const current = getSettings(section.key);
          const activeMode = current.layout_mode || 'grid';

          return (
            <div key={section.key} className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.desc}</p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Card Layouts</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CARD_LAYOUT_OPTIONS.map((layout) => {
                    const Icon = layout.icon;
                    const isActive = activeMode === layout.id;
                    return (
                      <button
                        key={layout.id}
                        onClick={() => handleLayoutChange(section.key, layout.id)}
                        disabled={upsert.isPending}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-muted/30'
                        }`}
                      >
                        <Icon className={`h-4 w-4 mb-1.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-sm font-medium text-foreground">{layout.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{layout.desc}</p>
                        {isActive && <Badge variant="default" className="mt-2 text-[10px]">Active</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Showcase Styles</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SHOWCASE_LAYOUT_OPTIONS.map((layout) => {
                    const Icon = layout.icon;
                    const isActive = activeMode === layout.id;
                    return (
                      <button
                        key={layout.id}
                        onClick={() => handleLayoutChange(section.key, layout.id)}
                        disabled={upsert.isPending}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-muted/30'
                        }`}
                      >
                        <Icon className={`h-4 w-4 mb-1.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-sm font-medium text-foreground">{layout.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{layout.desc}</p>
                        {isActive && <Badge variant="default" className="mt-2 text-[10px]">Active</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carousel-specific options */}
              {activeMode === 'carousel' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between gap-2 col-span-1">
                    <Label className="text-xs">Autoplay</Label>
                    <Switch
                      checked={current.autoplay ?? false}
                      onCheckedChange={(v) => handleOptionChange(section.key, 'autoplay', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 col-span-1">
                    <Label className="text-xs">Show Dots</Label>
                    <Switch
                      checked={current.show_dots ?? false}
                      onCheckedChange={(v) => handleOptionChange(section.key, 'show_dots', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 col-span-1">
                    <Label className="text-xs">Navigation</Label>
                    <Switch
                      checked={current.show_navigation ?? true}
                      onCheckedChange={(v) => handleOptionChange(section.key, 'show_navigation', v)}
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <Label className="text-xs">Items per View</Label>
                    <select
                      value={current.items_per_view ?? 3}
                      onChange={(e) => handleOptionChange(section.key, 'items_per_view', Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SettingsSection>
  );
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useBrandSettings();
  const updateSettings = useUpdateBrandSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    brand_name: defaultBrandSettings.brand_name,
    brand_tagline: defaultBrandSettings.brand_tagline ?? '',
    logo_url: '',
    contact_email: defaultBrandSettings.contact_email ?? '',
    contact_phone: defaultBrandSettings.contact_phone ?? '',
    contact_address: defaultBrandSettings.contact_address ?? '',
    primary_color: defaultBrandSettings.primary_color,
    secondary_color: defaultBrandSettings.secondary_color,
    accent_color: defaultBrandSettings.accent_color,
    background_color: defaultBrandSettings.background_color,
    foreground_color: defaultBrandSettings.foreground_color,
    muted_color: defaultBrandSettings.muted_color ?? '243 29% 86%',
    card_color: defaultBrandSettings.card_color ?? '0 0% 100%',
    border_color: defaultBrandSettings.border_color ?? '243 29% 86%',
    destructive_color: defaultBrandSettings.destructive_color ?? '0 55% 55%',
    ring_color: defaultBrandSettings.ring_color ?? '32 48% 66%',
    heading_font: defaultBrandSettings.heading_font,
    body_font: defaultBrandSettings.body_font,
    heading_weight: defaultBrandSettings.heading_weight ?? 500,
    body_weight: defaultBrandSettings.body_weight ?? 400,
    heading_letter_spacing: defaultBrandSettings.heading_letter_spacing ?? 'normal',
    base_currency: defaultBrandSettings.base_currency,
  });

  const [editingMode, setEditingMode] = useState<'light' | 'dark'>('light');
  const [darkPalette, setDarkPalette] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (settings) {
      setFormState({
        brand_name: settings.brand_name,
        brand_tagline: settings.brand_tagline ?? '',
        logo_url: settings.logo_url ?? '',
        contact_email: settings.contact_email ?? '',
        contact_phone: settings.contact_phone ?? '',
        contact_address: settings.contact_address ?? '',
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        accent_color: settings.accent_color,
        background_color: settings.background_color,
        foreground_color: settings.foreground_color,
        muted_color: settings.muted_color ?? defaultBrandSettings.muted_color ?? '243 29% 86%',
        card_color: settings.card_color ?? defaultBrandSettings.card_color ?? '0 0% 100%',
        border_color: settings.border_color ?? defaultBrandSettings.border_color ?? '243 29% 86%',
        destructive_color: settings.destructive_color ?? defaultBrandSettings.destructive_color ?? '0 55% 55%',
        ring_color: settings.ring_color ?? defaultBrandSettings.ring_color ?? '32 48% 66%',
        heading_font: settings.heading_font,
        body_font: settings.body_font,
        heading_weight: settings.heading_weight ?? 500,
        body_weight: settings.body_weight ?? 400,
        heading_letter_spacing: settings.heading_letter_spacing ?? 'normal',
        base_currency: settings.base_currency,
      });
      setDarkPalette(settings.dark_palette ?? null);
    }
  }, [settings]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    if (editingMode === 'dark' && COLOR_KEYS.includes(field as any)) {
      setDarkPalette((prev) => ({ ...(prev || {}), [field]: value }));
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleRemoveLogo = () => {
    setFormState((prev) => ({ ...prev, logo_url: '' }));
  };

  const getColorValue = (key: string): string => {
    if (editingMode === 'dark' && darkPalette) {
      return darkPalette[key] ?? formState[key as keyof FormState] as string;
    }
    return formState[key as keyof FormState] as string;
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        ...formState,
        logo_url: formState.logo_url || null,
        dark_palette: darkPalette,
      } as any);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast({ title: 'Settings Saved', description: 'Brand settings have been updated successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings. Please try again.', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setFormState({
      brand_name: defaultBrandSettings.brand_name,
      brand_tagline: defaultBrandSettings.brand_tagline ?? '',
      logo_url: '',
      contact_email: defaultBrandSettings.contact_email ?? '',
      contact_phone: defaultBrandSettings.contact_phone ?? '',
      contact_address: defaultBrandSettings.contact_address ?? '',
      primary_color: defaultBrandSettings.primary_color,
      secondary_color: defaultBrandSettings.secondary_color,
      accent_color: defaultBrandSettings.accent_color,
      background_color: defaultBrandSettings.background_color,
      foreground_color: defaultBrandSettings.foreground_color,
      muted_color: defaultBrandSettings.muted_color ?? '243 29% 86%',
      card_color: defaultBrandSettings.card_color ?? '0 0% 100%',
      border_color: defaultBrandSettings.border_color ?? '243 29% 86%',
      destructive_color: defaultBrandSettings.destructive_color ?? '0 55% 55%',
      ring_color: defaultBrandSettings.ring_color ?? '32 48% 66%',
      heading_font: defaultBrandSettings.heading_font,
      body_font: defaultBrandSettings.body_font,
      heading_weight: defaultBrandSettings.heading_weight ?? 500,
      body_weight: defaultBrandSettings.body_weight ?? 400,
      heading_letter_spacing: defaultBrandSettings.heading_letter_spacing ?? 'normal',
      base_currency: defaultBrandSettings.base_currency,
    });
    setDarkPalette(null);
    setEditingMode('light');
  };

  const handleExportTheme = () => {
    const lightColors: Record<string, string> = {};
    for (const key of COLOR_KEYS) {
      lightColors[key] = formState[key as keyof FormState] as string;
    }
    const theme = {
      version: 1,
      name: formState.brand_name + ' Theme',
      light: lightColors,
      dark: darkPalette,
      fonts: { heading_font: formState.heading_font, body_font: formState.body_font },
    };
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formState.brand_name.replace(/\s+/g, '-').toLowerCase()}.havenhub-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Theme Exported', description: 'Theme file downloaded.' });
  };

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.version || !json.light) throw new Error('Invalid theme schema');
        for (const key of COLOR_KEYS) {
          if (typeof json.light[key] !== 'string') throw new Error(`Missing color: ${key}`);
        }
        setFormState((prev) => ({
          ...prev,
          ...json.light,
          heading_font: json.fonts?.heading_font ?? prev.heading_font,
          body_font: json.fonts?.body_font ?? prev.body_font,
        }));
        setDarkPalette(json.dark ?? null);
        setEditingMode('light');
        toast({ title: 'Theme Imported', description: 'Review the colors and click Save Changes to persist.' });
      } catch (err: any) {
        toast({ title: 'Import Failed', description: err.message || 'Invalid theme file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModeSwitch = (mode: 'light' | 'dark') => {
    if (mode === 'dark' && !darkPalette) {
      const lightColors: Record<string, string> = {};
      for (const key of COLOR_KEYS) {
        lightColors[key] = formState[key as keyof FormState] as string;
      }
      setDarkPalette(generateDarkPalette(lightColors));
    }
    setEditingMode(mode);
  };

  const handleRemoveDarkPalette = () => {
    setDarkPalette(null);
    setEditingMode('light');
    toast({ title: 'Dark palette removed', description: 'The site will use CSS defaults for dark mode.' });
  };

  const hslToColor = (hsl: string) => `hsl(${hsl})`;

  if (isLoading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  const brandColors = [
    { key: 'primary_color', label: 'Primary', desc: 'Main brand color', contrastAgainst: 'background_color' },
    { key: 'secondary_color', label: 'Secondary', desc: 'Supporting color', contrastAgainst: null },
    { key: 'accent_color', label: 'Accent', desc: 'Special highlights', contrastAgainst: null },
  ];

  const systemColors = [
    { key: 'background_color', label: 'Background', desc: 'Page background', contrastAgainst: null },
    { key: 'foreground_color', label: 'Foreground', desc: 'Main text color', contrastAgainst: 'background_color' },
    { key: 'muted_color', label: 'Muted', desc: 'Muted backgrounds', contrastAgainst: null },
    { key: 'card_color', label: 'Card', desc: 'Card surfaces', contrastAgainst: null },
    { key: 'border_color', label: 'Border', desc: 'Borders & dividers', contrastAgainst: null },
    { key: 'destructive_color', label: 'Destructive', desc: 'Error/danger states', contrastAgainst: 'background_color' },
    { key: 'ring_color', label: 'Ring', desc: 'Focus rings', contrastAgainst: null },
  ];

  const renderColorRow = (color: { key: string; label: string; desc: string; contrastAgainst: string | null }) => {
    const value = getColorValue(color.key);
    return (
      <div key={color.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={color.key}>{color.label}</Label>
          {color.contrastAgainst && (
            <ContrastBadge fg={value} bg={getColorValue(color.contrastAgainst)} />
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
            value={hslStringToHex(value)}
            onChange={(e) => handleInputChange(color.key as keyof FormState, hexToHslString(e.target.value))}
          />
          <Input
            id={color.key}
            value={value}
            onChange={(e) => handleInputChange(color.key as keyof FormState, e.target.value)}
            placeholder="245 51% 19%"
            className="flex-1"
          />
          <div
            className="w-8 h-8 rounded-md border border-border shadow-sm flex-shrink-0"
            style={{ backgroundColor: hslToColor(value) }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{color.desc}</p>
      </div>
    );
  };

  const lastUpdated = settings?.updated_at
    ? new Date(settings.updated_at).toLocaleString()
    : null;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium">System Settings</h1>
              <p className="text-muted-foreground mt-1">
                Configure your brand, payments, and system preferences
              </p>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last saved: {lastUpdated}
                </div>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {saveSuccess && (
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 gap-1">
                  <Check className="h-3 w-3" /> Saved
                </Badge>
              )}
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Section 1: Brand Identity */}
          <SettingsSection
            title="Brand Identity"
            icon={<Building2 className="h-5 w-5 text-primary" />}
            description="Logo, name, tagline, and contact information"
            defaultOpen={true}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Brand Logo</Label>
                <ImageUploadWithOptimizer
                  value={formState.logo_url || undefined}
                  onUpload={(url) => setFormState((prev) => ({ ...prev, logo_url: url }))}
                  onRemove={handleRemoveLogo}
                  preset={IMAGE_PRESETS.logo}
                  storagePath="logos"
                  label="Upload Logo"
                  aspectClass="aspect-[2/1] max-w-[300px]"
                  compact
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: PNG or SVG with transparent background.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input id="brand_name" value={formState.brand_name} onChange={(e) => handleInputChange('brand_name', e.target.value)} placeholder="Arivia Villas" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_tagline">Tagline</Label>
                  <Input id="brand_tagline" value={formState.brand_tagline} onChange={(e) => handleInputChange('brand_tagline', e.target.value)} placeholder="Luxury Living, Redefined" />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input id="contact_email" type="email" value={formState.contact_email} onChange={(e) => handleInputChange('contact_email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input id="contact_phone" value={formState.contact_phone} onChange={(e) => handleInputChange('contact_phone', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_address">Contact Address</Label>
                <Input id="contact_address" value={formState.contact_address} onChange={(e) => handleInputChange('contact_address', e.target.value)} />
              </div>
            </div>
          </SettingsSection>

          {/* Section: Homepage Hero Image */}
          <HeroImageSection />

          {/* Section: Homepage Section Layouts */}
          <HomepageSectionsLayout />

          {/* Section 2: Color Palette */}
          <SettingsSection
            title="Color Palette"
            icon={<Palette className="h-5 w-5 text-primary" />}
            description="Brand and system colors for light and dark modes"
          >
            <div className="space-y-6">
              {/* Mode toggle + Import/Export */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Editing:</span>
                  <div className="inline-flex rounded-lg border border-border p-0.5">
                    <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editingMode === 'light' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => handleModeSwitch('light')}>
                      <Sun className="h-3.5 w-3.5" /> Light
                    </button>
                    <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editingMode === 'dark' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => handleModeSwitch('dark')}>
                      <Moon className="h-3.5 w-3.5" /> Dark
                    </button>
                  </div>
                  {editingMode === 'dark' && darkPalette && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveDarkPalette} className="text-destructive text-xs gap-1">
                      <X className="h-3 w-3" /> Remove dark palette
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportTheme} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Import
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTheme} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </div>
              </div>

              {editingMode === 'dark' && (
                <p className="text-xs text-muted-foreground -mt-2">Editing the dark mode palette. These colors override the light palette when dark mode is active.</p>
              )}

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Brand Colors</h3>
                <div className="grid gap-6 md:grid-cols-3">{brandColors.map(renderColorRow)}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">System Colors</h3>
                <div className="grid gap-6 md:grid-cols-2">{systemColors.map(renderColorRow)}</div>
              </div>

              {/* Preview */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: hslToColor(getColorValue('background_color')) }}>
                <h3 className="text-xl font-serif mb-2" style={{ color: hslToColor(getColorValue('foreground_color')) }}>
                  Color Preview {editingMode === 'dark' && <Badge variant="secondary" className="ml-2 text-xs">Dark Mode</Badge>}
                </h3>
                <p className="text-sm mb-4" style={{ color: hslToColor(getColorValue('foreground_color')), opacity: 0.7 }}>
                  This is how your color palette will look across the site.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: hslToColor(getColorValue('primary_color')) }}>Primary</button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: hslToColor(getColorValue('secondary_color')), color: hslToColor(getColorValue('foreground_color')) }}>Secondary</button>
                  <span className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: hslToColor(getColorValue('accent_color')) }}>Accent</span>
                  <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: hslToColor(getColorValue('destructive_color')) }}>Destructive</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: hslToColor(getColorValue('muted_color')), color: hslToColor(getColorValue('foreground_color')) }}>Muted bg</div>
                  <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: hslToColor(getColorValue('card_color')), border: `1px solid ${hslToColor(getColorValue('border_color'))}`, color: hslToColor(getColorValue('foreground_color')) }}>Card surface</div>
                  <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: hslToColor(getColorValue('background_color')), border: `2px solid ${hslToColor(getColorValue('ring_color'))}`, color: hslToColor(getColorValue('foreground_color')) }}>Focus ring</div>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Section 3: Typography */}
          <SettingsSection
            title="Typography"
            icon={<Type className="h-5 w-5 text-primary" />}
            description="Font families, weights, and letter spacing"
          >
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="heading_font">Heading Font</Label>
                  <FontSelector value={formState.heading_font} onValueChange={(value) => handleInputChange('heading_font', value)} fonts={HEADING_FONTS} placeholder="Select a heading font" />
                  <p className="text-xs text-muted-foreground">Used for titles and section headings</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_font">Body Font</Label>
                  <FontSelector value={formState.body_font} onValueChange={(value) => handleInputChange('body_font', value)} fonts={BODY_FONTS} placeholder="Select a body font" />
                  <p className="text-xs text-muted-foreground">Used for paragraphs and general text</p>
                </div>
              </div>

              {/* Weight & Spacing Controls */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Heading Weight</Label>
                  <select
                    value={formState.heading_weight}
                    onChange={(e) => handleInputChange('heading_weight', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={400}>400 — Regular</option>
                    <option value={500}>500 — Medium</option>
                    <option value={600}>600 — Semi Bold</option>
                    <option value={700}>700 — Bold</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Weight for all headings (h1–h6)</p>
                </div>
                <div className="space-y-2">
                  <Label>Body Weight</Label>
                  <select
                    value={formState.body_weight}
                    onChange={(e) => handleInputChange('body_weight', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={300}>300 — Light</option>
                    <option value={400}>400 — Regular</option>
                    <option value={500}>500 — Medium</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Weight for body/paragraph text</p>
                </div>
                <div className="space-y-2">
                  <Label>Heading Letter Spacing</Label>
                  <select
                    value={formState.heading_letter_spacing}
                    onChange={(e) => handleInputChange('heading_letter_spacing', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="tight">Tight (-0.03em)</option>
                    <option value="normal">Normal (-0.02em)</option>
                    <option value="wide">Wide (0.02em)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Letter spacing for headings</p>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="text-3xl mb-2" style={{ fontFamily: `"${formState.heading_font}", serif`, fontWeight: formState.heading_weight }}>Heading Preview</h3>
                <h4 className="text-xl mb-4" style={{ fontFamily: `"${formState.heading_font}", serif`, fontWeight: formState.heading_weight }}>Subheading Example</h4>
                <p className="text-base text-muted-foreground" style={{ fontFamily: `"${formState.body_font}", sans-serif`, fontWeight: formState.body_weight }}>
                  This is how your body text will appear throughout the website.
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Section 4: Currency */}
          <SettingsSection
            title="Currency & Payments"
            icon={<Coins className="h-5 w-5 text-primary" />}
            description="Base currency and payment configuration"
          >
            <CurrencySettingsCard
              value={formState.base_currency}
              onChange={(currency) => handleInputChange('base_currency', currency)}
            />
          </SettingsSection>

          {/* Section 5: Booking Defaults (placeholder) */}
          <SettingsSection
            title="Booking Defaults"
            icon={<Settings2 className="h-5 w-5 text-primary" />}
            description="Default check-in/out times, cancellation policies, and guest limits"
          >
            <p className="text-sm text-muted-foreground py-4">
              Booking defaults are managed per-property. Visit <strong>Properties → Edit</strong> to configure check-in/out times, cancellation policies, and guest limits.
            </p>
          </SettingsSection>

          {/* Section 6: Integrations (placeholder) */}
          <SettingsSection
            title="Integrations"
            icon={<CreditCard className="h-5 w-5 text-primary" />}
            description="PMS connections, Stripe, and third-party services"
          >
            <p className="text-sm text-muted-foreground py-4">
              Manage PMS connections from <strong>PMS Health</strong>. Stripe configuration is handled via Lovable Cloud secrets.
            </p>
          </SettingsSection>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
