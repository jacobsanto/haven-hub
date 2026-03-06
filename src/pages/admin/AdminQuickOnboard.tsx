import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Upload, X, Home, MapPin, DollarSign, Image, Search, Loader2, AlertTriangle } from 'lucide-react';
import { ImageUploadWithOptimizer } from '@/components/admin/ImageUploadWithOptimizer';
import { IMAGE_PRESETS } from '@/utils/image-optimizer';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useCreateProperty } from '@/hooks/useProperties';
import { useDestinations } from '@/hooks/useDestinations';
import { useGeocode, GeocodeResult } from '@/hooks/useGeocode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PropertyType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  { id: 1, label: 'Identity', icon: Home },
  { id: 2, label: 'Location & Type', icon: MapPin },
  { id: 3, label: 'Pricing & Capacity', icon: DollarSign },
  { id: 4, label: 'Photo', icon: Image },
];

export default function AdminQuickOnboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProperty = useCreateProperty();
  const { data: destinations } = useDestinations();
  const geocode = useGeocode();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    city: '',
    country: '',
    region: '',
    address: '',
    postal_code: '',
    latitude: null as number | null,
    longitude: null as number | null,
    destination_id: null as string | null,
    property_type: 'villa' as PropertyType,
    bedrooms: 1,
    bathrooms: 1,
    base_price: 0,
    max_guests: 2,
    hero_image_url: '',
  });

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (value: string) => {
    setForm((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
  };

  // Auto-match destination based on city/country
  const autoMatchDestination = (city: string, country: string) => {
    if (!destinations?.length) return null;
    const cityLower = city.toLowerCase();
    const countryLower = country.toLowerCase();

    // 1. Exact city name match
    const cityMatch = destinations.find(
      (d) => d.name.toLowerCase() === cityLower && d.status === 'active'
    );
    if (cityMatch) return cityMatch.id;

    // 2. City contained in destination name
    const partialMatch = destinations.find(
      (d) => d.name.toLowerCase().includes(cityLower) && d.status === 'active'
    );
    if (partialMatch) return partialMatch.id;

    // 3. Country match, prefer featured
    const countryMatches = destinations.filter(
      (d) => d.country.toLowerCase() === countryLower && d.status === 'active'
    );
    if (countryMatches.length) {
      const featured = countryMatches.find((d) => d.is_featured);
      return (featured || countryMatches[0]).id;
    }

    return null;
  };

  const handleGeocodeLookup = async () => {
    const results = await geocode.lookup(addressQuery);
    setShowResults(true);
    if (results.length === 1) {
      applyGeocodeResult(results[0]);
    }
  };

  const applyGeocodeResult = (result: GeocodeResult) => {
    const destId = autoMatchDestination(result.city, result.country);
    setForm((prev) => ({
      ...prev,
      city: result.city || prev.city,
      region: result.region || prev.region,
      country: result.country || prev.country,
      address: result.address || prev.address,
      postal_code: result.postal_code || prev.postal_code,
      latitude: result.latitude,
      longitude: result.longitude,
      destination_id: destId,
    }));
    setShowResults(false);
  };

  const matchedDestination = destinations?.find((d) => d.id === form.destination_id);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `hero/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    setForm((prev) => ({ ...prev, hero_image_url: publicUrl }));
    setUploading(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.name.trim().length > 0 && form.slug.trim().length > 0;
      case 2: return form.city.trim().length > 0 && form.country.trim().length > 0;
      case 3: return form.base_price > 0 && form.max_guests >= 1;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const property = await createProperty.mutateAsync({
        name: form.name,
        display_name: null,
        slug: form.slug,
        description: form.description || null,
        hero_image_url: form.hero_image_url || null,
        gallery: [],
        city: form.city,
        region: form.region || null,
        country: form.country,
        amenities: [],
        base_price: form.base_price,
        max_guests: form.max_guests,
        status: 'draft',
        destination_id: form.destination_id,
        video_url: null,
        virtual_tour_url: null,
        instant_booking: false,
        highlights: [],
        rooms: [],
        neighborhood_description: null,
        nearby_attractions: [],
        house_rules: [],
        cancellation_policy: null,
        pet_policy: null,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        property_type: form.property_type,
        timezone: 'Europe/Athens',
        check_in_time: '14:00',
        check_out_time: '11:00',
        address: form.address || null,
        latitude: form.latitude,
        longitude: form.longitude,
        postal_code: form.postal_code || null,
        short_description: null,
        area_sqm: null,
        is_featured: false,
        featured_sort_order: 0,
      });
      toast({
        title: 'Property Created as Draft',
        description: 'You can now complete all details via the full editor.',
      });
      navigate(`/admin/properties/${property.id}/edit`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create property.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/properties')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-medium">Quick Onboard</h1>
              <p className="text-muted-foreground">Add a property in under a minute. Fill details later.</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isDone
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isActive
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-sm hidden sm:inline ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="card-organic p-6 space-y-6">
            {step === 1 && (
              <>
                <h2 className="font-serif text-xl font-medium">Property Identity</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Villa Serena"
                      className="input-organic"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                      placeholder="villa-serena"
                      className="input-organic"
                    />
                    <p className="text-xs text-muted-foreground">Auto-generated from name</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Short Description</Label>
                    <Textarea
                      id="desc"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="A brief summary of the property..."
                      className="input-organic min-h-[80px]"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-serif text-xl font-medium">Location & Type</h2>
                <div className="space-y-4">
                  {/* Address Lookup */}
                  <div className="space-y-2">
                    <Label>Address or Place Lookup</Label>
                    <div className="flex gap-2">
                      <Input
                        value={addressQuery}
                        onChange={(e) => setAddressQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGeocodeLookup())}
                        placeholder="e.g., Oia, Santorini, Greece"
                        className="input-organic flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeocodeLookup}
                        disabled={geocode.loading || addressQuery.trim().length < 2}
                        className="gap-2"
                      >
                        {geocode.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Lookup
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type an address or city and click Lookup to auto-fill location fields
                    </p>
                  </div>

                  {/* Geocode results dropdown */}
                  {showResults && geocode.results.length > 1 && (
                    <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                      {geocode.results.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                          onClick={() => applyGeocodeResult(r)}
                        >
                          {r.display_name}
                        </button>
                      ))}
                    </div>
                  )}

                  {geocode.error && (
                    <p className="text-sm text-destructive">{geocode.error}</p>
                  )}

                  {/* Destination auto-match */}
                  {matchedDestination && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Linked to:</span>
                      <Badge variant="secondary">{matchedDestination.name}</Badge>
                    </div>
                  )}
                  {form.city && form.country && !matchedDestination && (
                    <p className="text-xs text-muted-foreground">No matching destination found — you can link one later.</p>
                  )}

                  {/* Editable location fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => {
                          const city = e.target.value;
                          const destId = autoMatchDestination(city, form.country);
                          setForm((p) => ({ ...p, city, destination_id: destId ?? p.destination_id }));
                        }}
                        placeholder="e.g., Florence"
                        className="input-organic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={form.country}
                        onChange={(e) => {
                          const country = e.target.value;
                          const destId = autoMatchDestination(form.city, country);
                          setForm((p) => ({ ...p, country, destination_id: destId ?? p.destination_id }));
                        }}
                        placeholder="e.g., Italy"
                        className="input-organic"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={form.region}
                        onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                        placeholder="e.g., Tuscany"
                        className="input-organic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={form.postal_code}
                        onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))}
                        placeholder="e.g., 84700"
                        className="input-organic"
                      />
                    </div>
                  </div>

                  {form.latitude != null && form.longitude != null && (
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select
                      value={form.property_type}
                      onValueChange={(v) => setForm((p) => ({ ...p, property_type: v as PropertyType }))}
                    >
                      <SelectTrigger className="input-organic">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="estate">Estate</SelectItem>
                        <SelectItem value="cottage">Cottage</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-serif text-xl font-medium">Pricing & Capacity</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Price per Night (€) *</Label>
                      <Input
                        id="base_price"
                        type="number"
                        min={0}
                        value={form.base_price || ''}
                        onChange={(e) => setForm((p) => ({ ...p, base_price: parseFloat(e.target.value) || 0 }))}
                        className="input-organic"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_guests">Max Guests *</Label>
                      <Input
                        id="max_guests"
                        type="number"
                        min={1}
                        value={form.max_guests}
                        onChange={(e) => setForm((p) => ({ ...p, max_guests: parseInt(e.target.value) || 1 }))}
                        className="input-organic"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min={1}
                        value={form.bedrooms}
                        onChange={(e) => setForm((p) => ({ ...p, bedrooms: parseInt(e.target.value) || 1 }))}
                        className="input-organic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min={1}
                        step={0.5}
                        value={form.bathrooms}
                        onChange={(e) => setForm((p) => ({ ...p, bathrooms: parseFloat(e.target.value) || 1 }))}
                        className="input-organic"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-serif text-xl font-medium">Hero Photo</h2>
                <p className="text-sm text-muted-foreground">Optional — you can add this later.</p>

                {/* Destination warning */}
                {!form.destination_id && form.city && form.country && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">No destination linked</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        This property won't appear under any destination page. You can link it later in the full editor, or go back and use the address lookup.
                      </p>
                    </div>
                  </div>
                )}

                <ImageUploadWithOptimizer
                  value={form.hero_image_url || undefined}
                  onUpload={(url) => setForm((p) => ({ ...p, hero_image_url: url }))}
                  onRemove={() => setForm((p) => ({ ...p, hero_image_url: '' }))}
                  preset={IMAGE_PRESETS.hero}
                  storagePath={`properties/${form.slug || 'onboard'}/hero`}
                  label="Click to upload hero image"
                />
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !canProceed()} className="gap-2">
                {submitting ? 'Creating...' : 'Create Draft Property'}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
