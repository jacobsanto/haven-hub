import { useState, useEffect, KeyboardEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, ChevronDown, ChevronRight, Settings2, Sparkles } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  useCreateProperty,
  useUpdateProperty,
  useAdminProperties,
} from '@/hooks/useProperties';
import { useAmenities, useAmenitiesByCategory, Amenity as AmenityType } from '@/hooks/useAmenities';
import { DynamicIcon } from '@/components/admin/IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { PropertyStatus, PropertyType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

export default function AdminPropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { data: properties } = useAdminProperties();

  const isEditing = !!id;
  const existingProperty = properties?.find((p) => p.id === id);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
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
    // Timing/timezone fields
    timezone: 'Europe/Athens',
    check_in_time: '14:00',
    check_out_time: '11:00',
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingProperty) {
      setFormData({
        name: existingProperty.name,
        slug: existingProperty.slug,
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
      });
    }
  }, [existingProperty]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Upload Failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    if (type === 'hero') {
      setFormData((prev) => ({ ...prev, hero_image_url: publicUrl }));
    } else {
      setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, publicUrl] }));
    }

    setUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
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
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing && id) {
        await updateProperty.mutateAsync({ id, ...formData });
        toast({
          title: 'Property Updated',
          description: 'The property has been successfully updated.',
        });
      } else {
        await createProperty.mutateAsync(formData);
        toast({
          title: 'Property Created',
          description: 'The property has been successfully created.',
        });
      }
      navigate('/admin/properties');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/properties')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-medium">
                {isEditing ? 'Edit Property' : 'Add New Property'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing
                  ? 'Update the property details below'
                  : 'Fill in the details to create a new property listing'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="card-organic p-6 space-y-6">
              <h2 className="font-serif text-xl font-medium">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g., Villa Serena"
                    className="input-organic"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g., villa-serena"
                    className="input-organic"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe the property..."
                  className="input-organic min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="e.g., Florence"
                    className="input-organic"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, region: e.target.value }))
                    }
                    placeholder="e.g., Tuscany"
                    className="input-organic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, country: e.target.value }))
                    }
                    placeholder="e.g., Italy"
                    className="input-organic"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="card-organic p-6 space-y-6">
              <h2 className="font-serif text-xl font-medium">Property Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        property_type: value as PropertyType,
                      }))
                    }
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

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={1}
                    value={formData.bedrooms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bedrooms: parseInt(e.target.value) || 1,
                      }))
                    }
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
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bathrooms: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="input-organic"
                  />
                </div>

                <div className="space-y-2 flex items-center pt-8">
                  <Checkbox
                    id="instant_booking"
                    checked={formData.instant_booking}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        instant_booking: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="instant_booking" className="ml-2 cursor-pointer">
                    Instant Booking
                  </Label>
                </div>
              </div>
            </div>

            {/* Property Highlights */}
            <HighlightsEditor
              highlights={formData.highlights}
              onChange={(highlights) =>
                setFormData((prev) => ({ ...prev, highlights }))
              }
            />

            {/* Pricing & Capacity */}
            <div className="card-organic p-6 space-y-6">
              <h2 className="font-serif text-xl font-medium">Pricing & Capacity</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Price per Night ($) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min={0}
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        base_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="input-organic"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_guests">Maximum Guests *</Label>
                  <Input
                    id="max_guests"
                    type="number"
                    min={1}
                    value={formData.max_guests}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_guests: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="input-organic"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as PropertyStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="input-organic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Media & Virtual Tour */}
            <div className="card-organic p-6 space-y-6">
              <h2 className="font-serif text-xl font-medium">Media & Virtual Tour</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, video_url: e.target.value || null }))
                    }
                    placeholder="https://youtube.com/..."
                    className="input-organic"
                  />
                  <p className="text-xs text-muted-foreground">YouTube, Vimeo, or direct video URL</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="virtual_tour_url">Virtual Tour URL</Label>
                  <Input
                    id="virtual_tour_url"
                    value={formData.virtual_tour_url || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, virtual_tour_url: e.target.value || null }))
                    }
                    placeholder="https://my.matterport.com/..."
                    className="input-organic"
                  />
                  <p className="text-xs text-muted-foreground">Matterport, 360° tour, or similar</p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card-organic p-6 space-y-6">
              <h2 className="font-serif text-xl font-medium">Images</h2>

              {/* Hero Image */}
              <div className="space-y-2">
                <Label>Hero Image</Label>
                {formData.hero_image_url ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    <img
                      src={formData.hero_image_url}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, hero_image_url: '' }))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="block w-full aspect-video border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="h-8 w-8 mb-2" />
                      <span>Click to upload hero image</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'hero')}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Gallery */}
              <div className="space-y-2">
                <Label>Gallery Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.gallery.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground">
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'gallery')}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Amenities - Dynamic with Categories */}
            <AmenitiesSection
              selectedAmenities={formData.amenities}
              onToggle={toggleAmenity}
            />

            {/* Submit */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/properties')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProperty.isPending || updateProperty.isPending}
                className="rounded-full px-8"
              >
                {createProperty.isPending || updateProperty.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Property'
                  : 'Create Property'}
              </Button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

// Amenities section with categories
interface AmenitiesSectionProps {
  selectedAmenities: string[];
  onToggle: (slug: string) => void;
}

function AmenitiesSection({ selectedAmenities, onToggle }: AmenitiesSectionProps) {
  const { data: amenities, isLoading } = useAmenities();
  const amenitiesByCategory = useAmenitiesByCategory();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Get sorted categories
  const categories = Object.keys(amenitiesByCategory).sort();

  // Filter amenities by search
  const filteredByCategory = search
    ? Object.entries(amenitiesByCategory).reduce((acc, [category, items]) => {
        const filtered = items.filter(
          (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.slug.toLowerCase().includes(search.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, AmenityType[]>)
    : amenitiesByCategory;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Count selected per category
  const countSelected = (categoryAmenities: AmenityType[]) => {
    return categoryAmenities.filter((a) => selectedAmenities.includes(a.slug)).length;
  };

  if (isLoading) {
    return (
      <div className="card-organic p-6">
        <h2 className="font-serif text-xl font-medium mb-4">Amenities</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-organic p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-medium">Amenities</h2>
        <Link
          to="/admin/amenities"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Settings2 className="h-4 w-4" />
          Manage Amenities
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Search amenities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Selected count */}
      <p className="text-sm text-muted-foreground">
        {selectedAmenities.length} amenities selected
      </p>

      {/* Categories */}
      <div className="space-y-2">
        {Object.entries(filteredByCategory).map(([category, categoryAmenities]) => {
          const isExpanded = expandedCategories.has(category) || search.length > 0;
          const selectedCount = countSelected(categoryAmenities);

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{category}</span>
                    <span className="text-xs text-muted-foreground">
                      ({categoryAmenities.length} amenities)
                    </span>
                  </div>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {selectedCount} selected
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                  {categoryAmenities.map((amenity) => (
                    <Tooltip key={amenity.id}>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
                          <Checkbox
                            checked={selectedAmenities.includes(amenity.slug)}
                            onCheckedChange={() => onToggle(amenity.slug)}
                          />
                          <DynamicIcon
                            name={amenity.icon}
                            className="h-4 w-4 text-primary"
                          />
                          <span className="text-sm">{amenity.name}</span>
                        </label>
                      </TooltipTrigger>
                      {amenity.description && (
                        <TooltipContent side="top" className="max-w-xs bg-popover">
                          <p className="text-sm">{amenity.description}</p>
                        </TooltipContent>
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
        <p className="text-center text-muted-foreground py-4">
          No amenities found matching "{search}"
        </p>
      )}
    </div>
  );
}

// Highlights Editor Component
interface HighlightsEditorProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
}

const SUGGESTED_HIGHLIGHTS = [
  'Beachfront',
  'Ocean View',
  'Mountain View',
  'Private Pool',
  'Infinity Pool',
  'Chef\'s Kitchen',
  'Private Chef',
  'Spa',
  'Wine Cellar',
  'Home Theater',
  'Gym',
  'Tennis Court',
  'Golf Access',
  'Yacht Dock',
  'Helipad',
  'Butler Service',
  'Pet Friendly',
  'Family Friendly',
  'Secluded',
  'Historic Property',
  'Newly Renovated',
  'Award Winning',
  'Celebrity Owned',
  'Eco-Friendly',
];

function HighlightsEditor({ highlights, onChange }: HighlightsEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addHighlight = (highlight: string) => {
    const trimmed = highlight.trim();
    if (trimmed && !highlights.includes(trimmed)) {
      onChange([...highlights, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeHighlight = (index: number) => {
    onChange(highlights.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addHighlight(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && highlights.length > 0) {
      removeHighlight(highlights.length - 1);
    }
  };

  // Filter suggestions based on input and already selected
  const filteredSuggestions = SUGGESTED_HIGHLIGHTS.filter(
    (s) =>
      !highlights.includes(s) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="card-organic p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-xl font-medium">Property Highlights</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Add key selling points that make this property special (e.g., "Beachfront", "Private Pool", "Chef's Kitchen")
      </p>

      {/* Current highlights */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {highlights.map((highlight, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
          >
            {highlight}
            <button
              type="button"
              onClick={() => removeHighlight(index)}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Type a highlight and press Enter..."
          className="input-organic"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addHighlight(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick add suggestions */}
      {highlights.length < 3 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick add suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_HIGHLIGHTS.filter((s) => !highlights.includes(s))
              .slice(0, 6)
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addHighlight(suggestion)}
                  className="px-3 py-1 text-xs border border-dashed border-border rounded-full hover:border-primary hover:text-primary transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
