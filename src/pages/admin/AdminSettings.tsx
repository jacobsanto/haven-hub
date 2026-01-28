import { useState, useEffect, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Palette, Type, Building2, Save, RotateCcw, Upload, X, ImageIcon } from 'lucide-react';

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
  heading_font: string;
  body_font: string;
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useBrandSettings();
  const updateSettings = useUpdateBrandSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    heading_font: defaultBrandSettings.heading_font,
    body_font: defaultBrandSettings.body_font,
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
        heading_font: settings.heading_font,
        body_font: settings.body_font,
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, SVG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo image must be under 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `brand-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      // Update form state
      setFormState((prev) => ({ ...prev, logo_url: publicUrl }));

      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded. Click Save Changes to apply.',
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      heading_font: defaultBrandSettings.heading_font,
      body_font: defaultBrandSettings.body_font,
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
            <TabsList className="grid w-full max-w-md grid-cols-3">
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
                    <div className="flex items-start gap-6">
                      {/* Logo Preview */}
                      <div className="relative">
                        {formState.logo_url ? (
                          <div className="relative">
                            <img
                              src={formState.logo_url}
                              alt="Brand logo"
                              className="h-24 w-auto max-w-[200px] object-contain rounded-lg border bg-card p-2"
                            />
                            <button
                              onClick={handleRemoveLogo}
                              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                              title="Remove logo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Recommended: PNG or SVG with transparent background. Max 2MB.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          The logo will appear in the header, footer, and admin sidebar.
                        </p>
                      </div>
                    </div>
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
                    Customize the colors used throughout your website (HSL format: "hue saturation% lightness%")
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {[
                      { key: 'primary_color', label: 'Primary Color', desc: 'Main brand color (buttons, accents)' },
                      { key: 'secondary_color', label: 'Secondary Color', desc: 'Supporting color (backgrounds, highlights)' },
                      { key: 'accent_color', label: 'Accent Color', desc: 'Special highlights and decorations' },
                      { key: 'background_color', label: 'Background Color', desc: 'Main page background' },
                      { key: 'foreground_color', label: 'Foreground Color', desc: 'Main text color' },
                    ].map((color) => (
                      <div key={color.key} className="space-y-2">
                        <Label htmlFor={color.key}>{color.label}</Label>
                        <div className="flex gap-3">
                          <div
                            className="w-12 h-10 rounded-lg border shadow-sm flex-shrink-0"
                            style={{ backgroundColor: hslToColor(formState[color.key as keyof FormState]) }}
                          />
                          <Input
                            id={color.key}
                            value={formState[color.key as keyof FormState]}
                            onChange={(e) => handleInputChange(color.key as keyof FormState, e.target.value)}
                            placeholder="16 50% 48%"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{color.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Color Preview */}
                  <div className="mt-8 p-6 rounded-xl border" style={{ backgroundColor: hslToColor(formState.background_color) }}>
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
                    <div className="flex gap-3">
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: hslToColor(formState.primary_color) }}
                      >
                        Primary Button
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
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
