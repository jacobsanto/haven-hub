import { useState, useEffect, KeyboardEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, ChevronDown, ChevronRight, Settings2, Sparkles, Search, Loader2, AlertTriangle, ExternalLink, DollarSign, BarChart3 } from 'lucide-react';
import { GalleryEditor } from '@/components/admin/GalleryEditor';
import { ImageUploadWithOptimizer } from '@/components/admin/ImageUploadWithOptimizer';
import { IMAGE_PRESETS } from '@/utils/image-optimizer';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  useCreateProperty, useUpdateProperty, useAdminProperties,
} from '@/hooks/useProperties';
import { useAmenities, useAmenitiesByCategory, Amenity as AmenityType } from '@/hooks/useAmenities';
import { useAdminRatePlans } from '@/hooks/useAdminRatePlans';
import { useSeasonalRates } from '@/hooks/useSeasonalRates';
import { DynamicIcon } from '@/components/admin/IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { PropertyStatus, PropertyType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useGeocode, GeocodeResult } from '@/hooks/useGeocode';
import { useDestinations } from '@/hooks/useDestinations';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

export default function AdminPropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { data: properties } = useAdminProperties();
  const { data: destinations } = useDestinations();
  const { data: ratePlans } = useAdminRatePlans();
  const { data: seasonalRates } = useSeasonalRates(id || '');
  const { format: formatCurrency } = useFormatCurrency();
  const geocode = useGeocode();
  const [addressQuery, setAddressQuery] = useState('');
  const [showGeoResults, setShowGeoResults] = useState(false);
  const [showDestinationWarning, setShowDestinationWarning] = useState(false);
  const [confirmNoDestination, setConfirmNoDestination] = useState(false);

  const isEditing = !!id;
  const existingProperty = properties?.find((p) => p.id === id);

  const [formData, setFormData] = useState({
    name: '',
    display_name: null as string | null,
    slug: '',
    short_description: null as string | null,
    description: '',
    hero_image_url: '',
    gallery: [] as string[],
    city: '',
    region: '',
    country: '',
    amenities: [] as string[],
    base_price: 0,
    max_guests: 1,
    status: 'draft' as PropertyStatus,
    destination_id: null as string | null,
    video_url: null as string | null,
    virtual_tour_url: null as string | null,
    instant_booking: false,
    highlights: [] as string[],
    rooms: [] as any[],
    neighborhood_description: null as string | null,
    nearby_attractions: [] as any[],
    house_rules: [] as string[],
    cancellation_policy: null as string | null,
    pet_policy: null as string | null,
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'villa' as PropertyType,
    timezone: 'Europe/Athens',
    check_in_time: '14:00',
    check_out_time: '11:00',
    address: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
    postal_code: null as string | null,
    area_sqm: null as number | null,
    is_featured: false,
    featured_sort_order: 0,
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingProperty) {
      setFormData({
        name: existingProperty.name,
        display_name: existingProperty.display_name || null,
        slug: existingProperty.slug,
        short_description: (existingProperty as any).short_description || null,
        description: existingProperty.description || '',
        hero_image_url: existingProperty.hero_image_url || '',
        gallery: existingProperty.gallery || [],
        city: existingProperty.city,
        region: existingProperty.region || '',
        country: existingProperty.country,
        amenities: existingProperty.amenities || [],
        base_price: existingProperty.base_price,
        max_guests: existingProperty.max_guests,
        status: existingProperty.status,
        destination_id: existingProperty.destination_id || null,
        video_url: existingProperty.video_url || null,
        virtual_tour_url: existingProperty.virtual_tour_url || null,
        instant_booking: existingProperty.instant_booking || false,
        highlights: existingProperty.highlights || [],
        rooms: existingProperty.rooms || [],
        neighborhood_description: existingProperty.neighborhood_description || null,
        nearby_attractions: existingProperty.nearby_attractions || [],
        house_rules: existingProperty.house_rules || [],
        cancellation_policy: existingProperty.cancellation_policy || null,
        pet_policy: existingProperty.pet_policy || null,
        bedrooms: existingProperty.bedrooms || 1,
        bathrooms: existingProperty.bathrooms || 1,
        property_type: existingProperty.property_type || 'villa',
        timezone: existingProperty.timezone || 'Europe/Athens',
        check_in_time: existingProperty.check_in_time || '14:00',
        check_out_time: existingProperty.check_out_time || '11:00',
        address: existingProperty.address || null,
        latitude: existingProperty.latitude ?? null,
        longitude: existingProperty.longitude ?? null,
        postal_code: existingProperty.postal_code || null,
        area_sqm: (existingProperty as any).area_sqm ?? null,
        is_featured: existingProperty.is_featured || false,
        featured_sort_order: existingProperty.featured_sort_order || 0,
      });
    }
  }, [existingProperty]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name, slug: isEditing ? prev.slug : generateSlug(name) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${type}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('property-images').upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(filePath);
    if (type === 'hero') {
      setFormData((prev) => ({ ...prev, hero_image_url: publicUrl }));
    } else {
      setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, publicUrl] }));
    }
    setUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const autoMatchDestination = (city: string, country: string) => {
    if (!destinations?.length) return null;
    const cityLower = city.toLowerCase();
    const countryLower = country.toLowerCase();
    const cityMatch = destinations.find((d) => d.name.toLowerCase() === cityLower && d.status === 'active');
    if (cityMatch) return cityMatch.id;
    const partialMatch = destinations.find((d) => d.name.toLowerCase().includes(cityLower) && d.status === 'active');
    if (partialMatch) return partialMatch.id;
    const countryMatches = destinations.filter((d) => d.country.toLowerCase() === countryLower && d.status === 'active');
    if (countryMatches.length) {
      const featured = countryMatches.find((d) => d.is_featured);
      return (featured || countryMatches[0]).id;
    }
    return null;
  };

  const applyGeoResult = (result: GeocodeResult) => {
    const destId = autoMatchDestination(result.city, result.country);
    setFormData((prev) => ({
      ...prev,
      city: result.city || prev.city,
      region: result.region || prev.region,
      country: result.country || prev.country,
      address: result.address || prev.address,
      postal_code: result.postal_code || prev.postal_code,
      latitude: result.latitude,
      longitude: result.longitude,
      destination_id: destId ?? prev.destination_id,
    }));
    setShowGeoResults(false);
  };

  const handleAddressLookup = async () => {
    const results = await geocode.lookup(addressQuery);
    setShowGeoResults(true);
    if (results.length === 1) applyGeoResult(results[0]);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.city || !formData.country) {
      toast({ title: 'Missing Required Fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (!formData.destination_id && !confirmNoDestination) {
      setShowDestinationWarning(true);
      return;
    }
    try {
      if (isEditing && id) {
        await updateProperty.mutateAsync({ id, ...formData });
        toast({ title: 'Property Updated', description: 'The property has been successfully updated.' });
      } else {
        await createProperty.mutateAsync(formData);
        toast({ title: 'Property Created', description: 'The property has been successfully created.' });
      }
      navigate('/admin/properties');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Something went wrong.', variant: 'destructive' });
    }
  };

  // Pricing helpers (read-only summaries)
  const propertyRatePlans = ratePlans?.filter(r => r.property_id === id && r.is_active) || [];
  const propertySeasonalRates = seasonalRates || [];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/properties')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-serif font-medium">
                  {isEditing ? 'Edit Property' : 'Add New Property'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isEditing ? 'Update the property details below' : 'Fill in the details to create a new property listing'}
                </p>
              </div>
            </div>
            {isEditing && existingProperty && (
              <Link to={`/properties/${existingProperty.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> View on Site
                </Button>
              </Link>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="identity" className="space-y-6">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                {isEditing && <TabsTrigger value="performance">Performance</TabsTrigger>}
              </TabsList>

              {/* ═══════ TAB 1: IDENTITY ═══════ */}
              <TabsContent value="identity" className="space-y-6">
                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name (Customer-Facing)</Label>
                      <Input id="display_name" value={formData.display_name || ''} onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value || null }))} placeholder="e.g., Sunset Villa with Caldera View" className="input-organic" />
                      <p className="text-xs text-muted-foreground">Shown on website, Stripe checkout, and confirmations</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Internal Name *</Label>
                      <Input id="name" value={formData.name} onChange={handleNameChange} placeholder="e.g., PROP-001-TUSCANY" className="input-organic" required />
                      <p className="text-xs text-muted-foreground">Used for admin, PMS sync, and internal reference</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug *</Label>
                      <Input id="slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="e.g., villa-serena" className="input-organic" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property_type">Property Type</Label>
                      <Select value={formData.property_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, property_type: value as PropertyType }))}>
                        <SelectTrigger className="input-organic"><SelectValue /></SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="short_description">Short Description</Label>
                    <Textarea id="short_description" value={formData.short_description || ''} onChange={(e) => setFormData((prev) => ({ ...prev, short_description: e.target.value || null }))} placeholder="A compelling 1-2 sentence intro" className="input-organic min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Detailed property description" className="input-organic min-h-[120px]" />
                  </div>
                </div>

                {/* Location */}
                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Location</h2>
                  <div className="space-y-2">
                    <Label>Address Lookup</Label>
                    <div className="flex gap-2">
                      <Input value={addressQuery} onChange={(e) => setAddressQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressLookup())} placeholder="Type address or place name" className="input-organic flex-1" />
                      <Button type="button" variant="outline" onClick={handleAddressLookup} disabled={geocode.loading || addressQuery.trim().length < 2} className="gap-2">
                        {geocode.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Lookup
                      </Button>
                    </div>
                    {showGeoResults && geocode.results.length > 1 && (
                      <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                        {geocode.results.map((r, i) => (
                          <button key={i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors" onClick={() => applyGeoResult(r)}>
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                    {geocode.error && <p className="text-sm text-destructive">{geocode.error}</p>}
                  </div>
                  {formData.destination_id && destinations && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Linked to:</span>
                      <Badge variant="secondary">{destinations.find((d) => d.id === formData.destination_id)?.name || 'Destination'}</Badge>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" value={formData.city} onChange={(e) => { const city = e.target.value; const destId = autoMatchDestination(city, formData.country); setFormData((prev) => ({ ...prev, city, destination_id: destId ?? prev.destination_id })); }} placeholder="e.g., Florence" className="input-organic" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input id="region" value={formData.region} onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))} placeholder="e.g., Tuscany" className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" value={formData.country} onChange={(e) => { const country = e.target.value; const destId = autoMatchDestination(formData.city, country); setFormData((prev) => ({ ...prev, country, destination_id: destId ?? prev.destination_id })); }} placeholder="e.g., Italy" className="input-organic" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address</Label>
                      <Input id="address" value={formData.address || ''} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value || null }))} placeholder="Street address" className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input id="postal_code" value={formData.postal_code || ''} onChange={(e) => setFormData((prev) => ({ ...prev, postal_code: e.target.value || null }))} placeholder="e.g., 84700" className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label>Coordinates</Label>
                      <p className="text-sm text-muted-foreground pt-2">
                        {formData.latitude != null && formData.longitude != null ? `${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}` : 'Not set — use address lookup'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Capacity & Status */}
                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Capacity & Status</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="max_guests">Max Guests *</Label>
                      <Input id="max_guests" type="number" min={1} value={formData.max_guests} onChange={(e) => setFormData((prev) => ({ ...prev, max_guests: parseInt(e.target.value) || 1 }))} className="input-organic" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input id="bedrooms" type="number" min={1} value={formData.bedrooms} onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))} className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input id="bathrooms" type="number" min={1} step={0.5} value={formData.bathrooms} onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: parseFloat(e.target.value) || 1 }))} className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area_sqm">Size (m²)</Label>
                      <Input id="area_sqm" type="number" min={0} value={formData.area_sqm ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, area_sqm: e.target.value ? parseInt(e.target.value) : null }))} placeholder="e.g., 250" className="input-organic" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as PropertyStatus }))}>
                        <SelectTrigger className="input-organic"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Override</Label>
                      <Select value={formData.destination_id || ''} onValueChange={(v) => setFormData((prev) => ({ ...prev, destination_id: v || null }))}>
                        <SelectTrigger className="input-organic"><SelectValue placeholder="Auto-matched or select" /></SelectTrigger>
                        <SelectContent className="bg-card">
                          {destinations?.filter((d) => d.status === 'active').map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ═══════ TAB 2: PRICING (Read-only summary) ═══════ */}
              <TabsContent value="pricing" className="space-y-6">
                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Base Rate</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Price/Night *</Label>
                      <Input id="base_price" type="number" min={0} value={formData.base_price} onChange={(e) => setFormData((prev) => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))} className="input-organic" required />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Checkbox id="instant_booking" checked={formData.instant_booking} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, instant_booking: !!checked }))} />
                      <Label htmlFor="instant_booking" className="cursor-pointer">Enable Instant Booking</Label>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <>
                    {/* Active Rate Plans summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Active Rate Plans</CardTitle>
                        <CardDescription>
                          {propertyRatePlans.length} active rate plan{propertyRatePlans.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {propertyRatePlans.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No active rate plans for this property.</p>
                        ) : (
                          <div className="space-y-2">
                            {propertyRatePlans.slice(0, 5).map(rp => (
                              <div key={rp.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                                <span className="font-medium">{rp.name}</span>
                                <span className="text-muted-foreground">{formatCurrency(rp.base_rate)}/night · {rp.rate_type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Seasonal Rates summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Seasonal Overrides</CardTitle>
                        <CardDescription>
                          {propertySeasonalRates.length} seasonal rate{propertySeasonalRates.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {propertySeasonalRates.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No seasonal rates configured.</p>
                        ) : (
                          <div className="space-y-2">
                            {propertySeasonalRates.slice(0, 5).map(sr => (
                              <div key={sr.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                                <span className="font-medium">{sr.name}</span>
                                <span className="text-muted-foreground">
                                  {sr.nightly_rate ? formatCurrency(sr.nightly_rate) : `×${sr.price_multiplier}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex justify-center">
                      <Link to="/admin/pricing">
                        <Button variant="outline" className="gap-2">
                          <DollarSign className="h-4 w-4" />
                          Open Pricing Control Center
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ═══════ TAB 3: MEDIA ═══════ */}
              <TabsContent value="media" className="space-y-6">
                <div className="card-organic p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-medium">Hero Image</h2>
                    {formData.hero_image_url && (
                      <Badge variant="secondary">Hero Set</Badge>
                    )}
                  </div>
                  <ImageUploadWithOptimizer
                    value={formData.hero_image_url || undefined}
                    onUpload={(url) => setFormData((prev) => ({ ...prev, hero_image_url: url }))}
                    onRemove={() => setFormData((prev) => ({ ...prev, hero_image_url: '' }))}
                    preset={IMAGE_PRESETS.hero}
                    storagePath={`properties/${formData.slug || id || 'new'}/hero`}
                    label="Click to upload hero image"
                  />
                </div>

                <div className="card-organic p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-medium">Gallery</h2>
                    <Badge variant="secondary">{formData.gallery.length} images</Badge>
                  </div>
                  <GalleryEditor
                    gallery={formData.gallery}
                    onReorder={(newGallery) => setFormData((prev) => ({ ...prev, gallery: newGallery }))}
                    onRemove={removeGalleryImage}
                    onSetAsHero={(url) => setFormData((prev) => ({ ...prev, hero_image_url: url }))}
                  />
                  <div className="aspect-square max-w-[200px]">
                    <ImageUploadWithOptimizer
                      onUpload={(url) => setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, url] }))}
                      preset={IMAGE_PRESETS.gallery}
                      storagePath={`properties/${formData.slug || id || 'new'}/gallery`}
                      label="Add Image"
                      aspectClass="aspect-square"
                      compact
                    />
                  </div>
                </div>

                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Video & Virtual Tour</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="video_url">Video URL</Label>
                      <Input id="video_url" value={formData.video_url || ''} onChange={(e) => setFormData((prev) => ({ ...prev, video_url: e.target.value || null }))} placeholder="https://youtube.com/..." className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virtual_tour_url">Virtual Tour URL</Label>
                      <Input id="virtual_tour_url" value={formData.virtual_tour_url || ''} onChange={(e) => setFormData((prev) => ({ ...prev, virtual_tour_url: e.target.value || null }))} placeholder="https://my.matterport.com/..." className="input-organic" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ═══════ TAB 4: AMENITIES ═══════ */}
              <TabsContent value="amenities" className="space-y-6">
                <HighlightsEditor highlights={formData.highlights} onChange={(highlights) => setFormData((prev) => ({ ...prev, highlights }))} />
                <AmenitiesSection selectedAmenities={formData.amenities} onToggle={toggleAmenity} />
              </TabsContent>

              {/* ═══════ TAB 5: POLICIES ═══════ */}
              <TabsContent value="policies" className="space-y-6">
                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Cancellation & Rules</h2>
                  <div className="space-y-2">
                    <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
                    <Select value={formData.cancellation_policy || ''} onValueChange={(v) => setFormData((prev) => ({ ...prev, cancellation_policy: v || null }))}>
                      <SelectTrigger className="input-organic"><SelectValue placeholder="Select policy" /></SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="flexible">Flexible</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="strict">Strict</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pet_policy">Pet Policy</Label>
                    <Input id="pet_policy" value={formData.pet_policy || ''} onChange={(e) => setFormData((prev) => ({ ...prev, pet_policy: e.target.value || null }))} placeholder="e.g., Small dogs allowed with deposit" className="input-organic" />
                  </div>
                </div>

                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Check-in / Check-out</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="check_in_time">Check-in Time</Label>
                      <Input id="check_in_time" type="time" value={formData.check_in_time} onChange={(e) => setFormData((prev) => ({ ...prev, check_in_time: e.target.value }))} className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_out_time">Check-out Time</Label>
                      <Input id="check_out_time" type="time" value={formData.check_out_time} onChange={(e) => setFormData((prev) => ({ ...prev, check_out_time: e.target.value }))} className="input-organic" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" value={formData.timezone} onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))} placeholder="e.g., Europe/Athens" className="input-organic" />
                    </div>
                  </div>
                </div>

                <div className="card-organic p-6 space-y-6">
                  <h2 className="font-serif text-lg font-medium">Neighborhood</h2>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood_description">Neighborhood Description</Label>
                    <Textarea id="neighborhood_description" value={formData.neighborhood_description || ''} onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood_description: e.target.value || null }))} placeholder="Describe the area, vibe, and what makes the location special" className="input-organic min-h-[100px]" />
                  </div>
                </div>

                <HouseRulesEditor rules={formData.house_rules} onChange={(house_rules) => setFormData((prev) => ({ ...prev, house_rules }))} />
              </TabsContent>

              {/* ═══════ TAB 6: PERFORMANCE (Read-only, edit mode only) ═══════ */}
              {isEditing && (
                <TabsContent value="performance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Property Performance
                      </CardTitle>
                      <CardDescription>
                        Key metrics for this property. For detailed analytics, visit the Analytics page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Performance data is available in the Analytics dashboard. This tab provides a quick overview.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Occupancy (30d)</p>
                          <p className="text-lg font-semibold">—</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Revenue (30d)</p>
                          <p className="text-lg font-semibold">—</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Add-on %</p>
                          <p className="text-lg font-semibold">—</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Cancellation %</p>
                          <p className="text-lg font-semibold">—</p>
                        </div>
                      </div>
                      <div className="flex justify-center pt-2">
                        <Link to="/admin/analytics">
                          <Button variant="outline" size="sm" className="gap-2">
                            <BarChart3 className="h-4 w-4" /> View Full Analytics
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* Destination warning */}
            {showDestinationWarning && !formData.destination_id && (
              <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">No destination linked</p>
                  <p className="text-xs text-destructive/80 mt-1">This property won't appear on any destination page.</p>
                  <div className="flex gap-2 mt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setConfirmNoDestination(true); setShowDestinationWarning(false); const form = document.querySelector('form'); form?.requestSubmit(); }}>
                      Save Without Destination
                    </Button>
                    <Button type="button" size="sm" onClick={() => setShowDestinationWarning(false)}>Go Back & Fix</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/properties')}>Cancel</Button>
              <Button type="submit" disabled={createProperty.isPending || updateProperty.isPending} className="rounded-full px-8">
                {createProperty.isPending || updateProperty.isPending ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
              </Button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

// ── Amenities Section ──
interface AmenitiesSectionProps {
  selectedAmenities: string[];
  onToggle: (slug: string) => void;
}

function AmenitiesSection({ selectedAmenities, onToggle }: AmenitiesSectionProps) {
  const { data: amenities, isLoading } = useAmenities();
  const amenitiesByCategory = useAmenitiesByCategory();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filteredByCategory = search
    ? Object.entries(amenitiesByCategory).reduce((acc, [category, items]) => {
        const filtered = items.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.slug.toLowerCase().includes(search.toLowerCase()));
        if (filtered.length > 0) acc[category] = filtered;
        return acc;
      }, {} as Record<string, AmenityType[]>)
    : amenitiesByCategory;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const countSelected = (categoryAmenities: AmenityType[]) =>
    categoryAmenities.filter((a) => selectedAmenities.includes(a.slug)).length;

  // Core amenities check
  const coreCategories = ['essentials', 'bathroom', 'kitchen'];
  const missingCoreCategories = coreCategories.filter(cat => {
    const items = amenitiesByCategory[cat];
    if (!items) return false;
    return countSelected(items) === 0;
  });

  if (isLoading) {
    return (
      <div className="card-organic p-6">
        <h2 className="font-serif text-lg font-medium mb-4">Amenities</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="card-organic p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-medium">Amenities</h2>
        <Link to="/admin/amenities" className="text-sm text-primary hover:underline flex items-center gap-1">
          <Settings2 className="h-4 w-4" /> Manage Amenities
        </Link>
      </div>

      {missingCoreCategories.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">
            Missing core amenities in: {missingCoreCategories.join(', ')}
          </p>
        </div>
      )}

      <Input placeholder="Search amenities..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <p className="text-sm text-muted-foreground">{selectedAmenities.length} amenities selected</p>
      <div className="space-y-2">
        {Object.entries(filteredByCategory).map(([category, categoryAmenities]) => {
          const isExpanded = expandedCategories.has(category) || search.length > 0;
          const selectedCount = countSelected(categoryAmenities);
          return (
            <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <button type="button" className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{category}</span>
                    <span className="text-xs text-muted-foreground">({categoryAmenities.length})</span>
                  </div>
                  {selectedCount > 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{selectedCount} selected</span>}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                  {categoryAmenities.map((amenity) => (
                    <Tooltip key={amenity.id}>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
                          <Checkbox checked={selectedAmenities.includes(amenity.slug)} onCheckedChange={() => onToggle(amenity.slug)} />
                          <DynamicIcon name={amenity.icon} className="h-4 w-4 text-primary" />
                          <span className="text-sm">{amenity.name}</span>
                        </label>
                      </TooltipTrigger>
                      {amenity.description && (
                        <TooltipContent side="top" className="max-w-xs bg-popover"><p className="text-sm">{amenity.description}</p></TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      {Object.keys(filteredByCategory).length === 0 && (
        <p className="text-center text-muted-foreground py-4">No amenities found matching "{search}"</p>
      )}
    </div>
  );
}

// ── Highlights Editor ──
const SUGGESTED_HIGHLIGHTS = [
  'Beachfront', 'Ocean View', 'Mountain View', 'Private Pool', 'Infinity Pool',
  'Chef\'s Kitchen', 'Private Chef', 'Spa', 'Wine Cellar', 'Home Theater',
  'Gym', 'Tennis Court', 'Golf Access', 'Yacht Dock', 'Helipad',
  'Butler Service', 'Pet Friendly', 'Family Friendly', 'Secluded',
  'Historic Property', 'Newly Renovated', 'Award Winning', 'Celebrity Owned', 'Eco-Friendly',
];

function HighlightsEditor({ highlights, onChange }: { highlights: string[]; onChange: (h: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addHighlight = (highlight: string) => {
    const trimmed = highlight.trim();
    if (trimmed && !highlights.includes(trimmed)) onChange([...highlights, trimmed]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeHighlight = (index: number) => onChange(highlights.filter((_, i) => i !== index));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); if (inputValue.trim()) addHighlight(inputValue); }
    else if (e.key === 'Backspace' && !inputValue && highlights.length > 0) removeHighlight(highlights.length - 1);
  };

  const filteredSuggestions = SUGGESTED_HIGHLIGHTS.filter((s) => !highlights.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className="card-organic p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-lg font-medium">Property Highlights</h2>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {highlights.map((highlight, index) => (
          <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {highlight}
            <button type="button" onClick={() => removeHighlight(index)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input value={inputValue} onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Type a highlight and press Enter..." className="input-organic" />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 8).map((s) => (
              <button key={s} type="button" onClick={() => addHighlight(s)} className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm">{s}</button>
            ))}
          </div>
        )}
      </div>
      {highlights.length < 3 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_HIGHLIGHTS.filter((s) => !highlights.includes(s)).slice(0, 6).map((s) => (
              <button key={s} type="button" onClick={() => addHighlight(s)} className="px-3 py-1 text-xs border border-dashed border-border rounded-full hover:border-primary hover:text-primary transition-colors">+ {s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── House Rules Editor ──
function HouseRulesEditor({ rules, onChange }: { rules: string[]; onChange: (r: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  const addRule = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !rules.includes(trimmed)) {
      onChange([...rules, trimmed]);
      setInputValue('');
    }
  };

  return (
    <div className="card-organic p-6 space-y-4">
      <h2 className="font-serif text-lg font-medium">House Rules</h2>
      {rules.length > 0 && (
        <ul className="space-y-2">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">{rule}</span>
              <button type="button" onClick={() => onChange(rules.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())} placeholder="Add a house rule..." className="input-organic" />
        <Button type="button" variant="outline" onClick={addRule} disabled={!inputValue.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
