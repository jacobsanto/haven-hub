import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useBrandSettings, useUpdateBrandSettings, defaultBrandSettings } from '@/hooks/useBrandSettings';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FontSelector } from '@/components/admin/FontSelector';
import { CurrencySettingsCard } from '@/components/admin/CurrencySettingsCard';
import { useToast } from '@/hooks/use-toast';
import { Palette, Type, Building2, Save, RotateCcw, Coins } from 'lucide-react';
import { ImageUploadWithOptimizer } from '@/components/admin/ImageUploadWithOptimizer';
import { IMAGE_PRESETS } from '@/utils/image-optimizer';
import { SupportedCurrency } from '@/types/currency';

const HEADING_FONTS = [
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'Merriweather',
  'Crimson Text',
  'Libre Baskerville',
  'Georgia',
  'DM Serif Display',
  'Spectral',
  'Fraunces',
  'Abril Fatface',
  'Josefin Slab',
  'EB Garamond',
  'Sorts Mill Goudy',
  'Bitter',
  'Vollkorn',
  'Cardo',
  'Neuton',
  'Alegreya',
  'Gentium Book Plus',
  'Source Serif Pro',
  'PT Serif',
  'Noto Serif',
  'IBM Plex Serif',
  'Zilla Slab',
];

const BODY_FONTS = [
  'Lato',
  'Montserrat',
  'Inter',
  'Open Sans',
  'Source Sans Pro',
  'Nunito',
  'Roboto',
  'Work Sans',
  'Poppins',
  'Raleway',
  'Karla',
  'Cabin',
  'Rubik',
  'DM Sans',
  'Plus Jakarta Sans',
  'Outfit',
  'Mulish',
  'Quicksand',
  'Barlow',
  'Manrope',
  'Sora',
  'Space Grotesk',
  'Albert Sans',
  'Red Hat Display',
  'Figtree',
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
  base_currency: SupportedCurrency;
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useBrandSettings();
  const updateSettings = useUpdateBrandSettings();
  const { toast } = useToast();

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
    base_currency: defaultBrandSettings.base_currency,
  });

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
        base_currency: settings.base_currency,
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveLogo = () => {
    setFormState((prev) => ({ ...prev, logo_url: '' }));
  };

  const handleSave = async () => {
    if (!settings?.id) return;

    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        ...formState,
        logo_url: formState.logo_url || null,
      });
      toast({
        title: 'Settings Saved',
        description: 'Brand settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
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
      base_currency: defaultBrandSettings.base_currency,
    });
  };

  // Helper to convert HSL string to CSS color
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

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium">Brand Settings</h1>
              <p className="text-muted-foreground mt-1">
                Customize your brand identity, colors, and typography
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
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

          <Tabs defaultValue="identity" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="identity" className="gap-2">
                <Building2 className="h-4 w-4" />
                Identity
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-2">
                <Type className="h-4 w-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="currency" className="gap-2">
                <Coins className="h-4 w-4" />
                Currency
              </TabsTrigger>
            </TabsList>

            {/* Brand Identity Tab */}
            <TabsContent value="identity">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Identity</CardTitle>
                  <CardDescription>
                    Configure your brand name, logo, tagline, and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload Section */}
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
                      Recommended: PNG or SVG with transparent background. Auto-optimized before upload.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="brand_name">Brand Name</Label>
                      <Input
                        id="brand_name"
                        value={formState.brand_name}
                        onChange={(e) => handleInputChange('brand_name', e.target.value)}
                        placeholder="Arivia Villas"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used as fallback when no logo is set
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand_tagline">Tagline</Label>
                      <Input
                        id="brand_tagline"
                        value={formState.brand_tagline}
                        onChange={(e) => handleInputChange('brand_tagline', e.target.value)}
                        placeholder="Luxury Living, Redefined"
                      />
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formState.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        placeholder="hello@ariviavillas.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        value={formState.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        placeholder="+1 (234) 567-890"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_address">Contact Address</Label>
                    <Input
                      id="contact_address"
                      value={formState.contact_address}
                      onChange={(e) => handleInputChange('contact_address', e.target.value)}
                      placeholder="123 Luxury Lane, Paradise City"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>
                    Customize the colors used throughout your website. Use the color picker or enter HSL values manually.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Brand Colors */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Brand Colors</h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      {[
                        { key: 'primary_color', label: 'Primary', desc: 'Main brand color' },
                        { key: 'secondary_color', label: 'Secondary', desc: 'Supporting color' },
                        { key: 'accent_color', label: 'Accent', desc: 'Special highlights' },
                      ].map((color) => (
                        <div key={color.key} className="space-y-2">
                          <Label htmlFor={color.key}>{color.label}</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                              value={hslStringToHex(formState[color.key as keyof FormState])}
                              onChange={(e) => handleInputChange(color.key as keyof FormState, hexToHslString(e.target.value))}
                            />
                            <Input
                              id={color.key}
                              value={formState[color.key as keyof FormState]}
                              onChange={(e) => handleInputChange(color.key as keyof FormState, e.target.value)}
                              placeholder="245 51% 19%"
                              className="flex-1"
                            />
                            <div
                              className="w-8 h-8 rounded-md border border-border shadow-sm flex-shrink-0"
                              style={{ backgroundColor: hslToColor(formState[color.key as keyof FormState]) }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{color.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Colors */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">System Colors</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {[
                        { key: 'background_color', label: 'Background', desc: 'Page background' },
                        { key: 'foreground_color', label: 'Foreground', desc: 'Main text color' },
                        { key: 'muted_color', label: 'Muted', desc: 'Muted backgrounds' },
                        { key: 'card_color', label: 'Card', desc: 'Card surfaces' },
                        { key: 'border_color', label: 'Border', desc: 'Borders & dividers' },
                        { key: 'destructive_color', label: 'Destructive', desc: 'Error/danger states' },
                        { key: 'ring_color', label: 'Ring', desc: 'Focus rings' },
                      ].map((color) => (
                        <div key={color.key} className="space-y-2">
                          <Label htmlFor={color.key}>{color.label}</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                              value={hslStringToHex(formState[color.key as keyof FormState])}
                              onChange={(e) => handleInputChange(color.key as keyof FormState, hexToHslString(e.target.value))}
                            />
                            <Input
                              id={color.key}
                              value={formState[color.key as keyof FormState]}
                              onChange={(e) => handleInputChange(color.key as keyof FormState, e.target.value)}
                              placeholder="0 0% 100%"
                              className="flex-1"
                            />
                            <div
                              className="w-8 h-8 rounded-md border border-border shadow-sm flex-shrink-0"
                              style={{ backgroundColor: hslToColor(formState[color.key as keyof FormState]) }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{color.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="p-6 rounded-xl border" style={{ backgroundColor: hslToColor(formState.background_color) }}>
                    <h3 
                      className="text-xl font-serif mb-2" 
                      style={{ color: hslToColor(formState.foreground_color) }}
                    >
                      Color Preview
                    </h3>
                    <p 
                      className="text-sm mb-4" 
                      style={{ color: hslToColor(formState.foreground_color), opacity: 0.7 }}
                    >
                      This is how your color palette will look across the site.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: hslToColor(formState.primary_color) }}
                      >
                        Primary
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ 
                          backgroundColor: hslToColor(formState.secondary_color),
                          color: hslToColor(formState.foreground_color)
                        }}
                      >
                        Secondary
                      </button>
                      <span
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ backgroundColor: hslToColor(formState.accent_color) }}
                      >
                        Accent
                      </span>
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: hslToColor(formState.destructive_color) }}
                      >
                        Destructive
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div
                        className="px-4 py-3 rounded-lg text-sm"
                        style={{ 
                          backgroundColor: hslToColor(formState.muted_color),
                          color: hslToColor(formState.foreground_color)
                        }}
                      >
                        Muted bg
                      </div>
                      <div
                        className="px-4 py-3 rounded-lg text-sm"
                        style={{ 
                          backgroundColor: hslToColor(formState.card_color),
                          border: `1px solid ${hslToColor(formState.border_color)}`,
                          color: hslToColor(formState.foreground_color)
                        }}
                      >
                        Card surface
                      </div>
                      <div
                        className="px-4 py-3 rounded-lg text-sm"
                        style={{ 
                          backgroundColor: hslToColor(formState.background_color),
                          border: `2px solid ${hslToColor(formState.ring_color)}`,
                          color: hslToColor(formState.foreground_color)
                        }}
                      >
                        Focus ring
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>
                    Choose fonts for headings and body text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="heading_font">Heading Font</Label>
                      <FontSelector
                        value={formState.heading_font}
                        onValueChange={(value) => handleInputChange('heading_font', value)}
                        fonts={HEADING_FONTS}
                        placeholder="Select a heading font"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for titles and section headings
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body_font">Body Font</Label>
                      <FontSelector
                        value={formState.body_font}
                        onValueChange={(value) => handleInputChange('body_font', value)}
                        fonts={BODY_FONTS}
                        placeholder="Select a body font"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for paragraphs and general text
                      </p>
                    </div>
                  </div>

                  {/* Typography Preview */}
                  <div className="mt-8 p-6 rounded-xl border bg-card">
                    <h3 
                      className="text-3xl mb-2"
                      style={{ fontFamily: `"${formState.heading_font}", serif` }}
                    >
                      Heading Preview
                    </h3>
                    <h4 
                      className="text-xl mb-4"
                      style={{ fontFamily: `"${formState.heading_font}", serif` }}
                    >
                      Subheading Example
                    </h4>
                    <p 
                      className="text-base text-muted-foreground"
                      style={{ fontFamily: `"${formState.body_font}", sans-serif` }}
                    >
                      This is how your body text will appear throughout the website. 
                      The font you choose affects readability and the overall feel of your brand.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Currency Tab */}
            <TabsContent value="currency">
              <CurrencySettingsCard
                value={formState.base_currency}
                onChange={(currency) => handleInputChange('base_currency', currency)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
