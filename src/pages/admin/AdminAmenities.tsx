import { useState } from 'react';
import { Plus, Search, Pencil, MoreVertical, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AmenityDialog } from '@/components/admin/AmenityDialog';
import { DynamicIcon } from '@/components/admin/IconPicker';
import {
  useAdminAmenities,
  useCreateAmenity,
  useUpdateAmenity,
  useToggleAmenityStatus,
  Amenity,
  AmenityInsert,
} from '@/hooks/useAmenities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Category chips replace dropdown select
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function AdminAmenities() {
  const { data: amenities, isLoading } = useAdminAmenities();
  const createAmenity = useCreateAmenity();
  const updateAmenity = useUpdateAmenity();
  const toggleStatus = useToggleAmenityStatus();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);

  // Get unique categories
  const categories = amenities
    ? [...new Set(amenities.map((a) => a.category))].sort()
    : [];

  // Filter amenities
  const filteredAmenities = amenities?.filter((amenity) => {
    const matchesSearch =
      amenity.name.toLowerCase().includes(search.toLowerCase()) ||
      amenity.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || amenity.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async (data: AmenityInsert) => {
    try {
      if (editingAmenity) {
        await updateAmenity.mutateAsync({ id: editingAmenity.id, ...data });
        toast({
          title: 'Amenity Updated',
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        await createAmenity.mutateAsync(data);
        toast({
          title: 'Amenity Created',
          description: `${data.name} has been created successfully.`,
        });
      }
      setDialogOpen(false);
      setEditingAmenity(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (amenity: Amenity) => {
    try {
      await toggleStatus.mutateAsync({
        id: amenity.id,
        is_active: !amenity.is_active,
      });
      toast({
        title: amenity.is_active ? 'Amenity Deactivated' : 'Amenity Activated',
        description: `${amenity.name} has been ${amenity.is_active ? 'deactivated' : 'activated'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (amenity: Amenity) => {
    setEditingAmenity(amenity);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAmenity(null);
    setDialogOpen(true);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">Amenities</h1>
              <p className="text-muted-foreground">
                Manage property amenities and features
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/amenities/icons">
                <Button variant="outline" className="rounded-full gap-2">
                  <Library className="h-4 w-4" />
                  Icon Library
                </Button>
              </Link>
              <Button onClick={openCreateDialog} className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                Add Amenity
              </Button>
            </div>
          </div>

          {/* Category Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All ({amenities?.length || 0})
            </button>
            {categories.map((category) => {
              const count = amenities?.filter((a) => a.category === category).length || 0;
              const isEssentials = category === 'Essentials';
              const isActive = categoryFilter === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isEssentials
                        ? 'bg-accent text-accent-foreground ring-1 ring-primary/30 hover:bg-accent/80'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {isEssentials ? '⭐ ' : ''}{category} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="card-organic p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search amenities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="card-organic">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading amenities...
              </div>
            ) : filteredAmenities && filteredAmenities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAmenities.map((amenity) => (
                    <TableRow key={amenity.id}>
                      <TableCell>
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                          <DynamicIcon name={amenity.icon} className="h-5 w-5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{amenity.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {amenity.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{amenity.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {amenity.description || '—'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={amenity.is_active}
                          onCheckedChange={() => handleToggleStatus(amenity)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem onClick={() => openEditDialog(amenity)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {search || categoryFilter !== 'all'
                  ? 'No amenities match your filters.'
                  : 'No amenities yet. Add your first one!'}
              </div>
            )}
          </div>

          {/* Stats */}
          {amenities && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card-organic p-4 text-center">
                <p className="text-2xl font-semibold">{amenities.length}</p>
                <p className="text-sm text-muted-foreground">Total Amenities</p>
              </div>
              <div className="card-organic p-4 text-center">
                <p className="text-2xl font-semibold">
                  {amenities.filter((a) => a.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="card-organic p-4 text-center">
                <p className="text-2xl font-semibold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
              <div className="card-organic p-4 text-center">
                <p className="text-2xl font-semibold">
                  {amenities.filter((a) => !a.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          )}
        </div>

        {/* Dialog */}
        <AmenityDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          amenity={editingAmenity}
          onSave={handleSave}
          isSaving={createAmenity.isPending || updateAmenity.isPending}
        />
      </AdminLayout>
    </AdminGuard>
  );
}
