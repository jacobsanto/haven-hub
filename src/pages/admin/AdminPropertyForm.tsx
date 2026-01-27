import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  useCreateProperty,
  useUpdateProperty,
  useAdminProperties,
} from '@/hooks/useProperties';
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
import { useToast } from '@/hooks/use-toast';
import { AMENITIES, AMENITY_LABELS, Amenity } from '@/lib/constants';
import { PropertyStatus } from '@/types/database';
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

            {/* Amenities */}
            <div className="card-organic p-6 space-y-6">
              <h2 className="font-serif text-xl font-medium">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <span className="text-sm">
                      {AMENITY_LABELS[amenity as Amenity]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

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
