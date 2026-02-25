import { useState } from 'react';
import { Plus, Search, Pencil, MoreVertical, Library, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AmenityDialog } from '@/components/admin/AmenityDialog';
import { DynamicIcon } from '@/components/admin/IconPicker';
import {
  useAdminAmenities, useCreateAmenity, useUpdateAmenity, useToggleAmenityStatus,
  Amenity, AmenityInsert,
} from '@/hooks/useAmenities';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const PRIORITY_MAP: Record<string, string> = {
  Essentials: 'Core',
  Safety: 'Core',
  Wellness: 'Secondary',
  Views: 'Secondary',
  Outdoors: 'Secondary',
  Services: 'Secondary',
  Entertainment: 'Detail',
  Technology: 'Detail',
  Family: 'Detail',
  Accessibility: 'Core',
  Luxury: 'Detail',
};

function getPriority(category: string) {
  return PRIORITY_MAP[category] || 'Detail';
}

export default function AdminAmenities() {
  const { data: amenities, isLoading } = useAdminAmenities();
  const { data: properties } = useProperties();
  const createAmenity = useCreateAmenity();
  const updateAmenity = useUpdateAmenity();
  const toggleStatus = useToggleAmenityStatus();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);

  const categories = amenities ? [...new Set(amenities.map((a) => a.category))].sort() : [];

  const filteredAmenities = amenities?.filter((amenity) => {
    const matchesSearch = amenity.name.toLowerCase().includes(search.toLowerCase()) || amenity.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || amenity.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Count how many active properties use each amenity slug
  const activeProperties = properties?.filter((p: any) => p.status === 'active') || [];
  const totalActive = activeProperties.length;
  const getUsageCount = (slug: string) => {
    return activeProperties.filter((p: any) => p.amenities?.includes(slug)).length;
  };

  const handleSave = async (data: AmenityInsert) => {
    try {
      if (editingAmenity) {
        await updateAmenity.mutateAsync({ id: editingAmenity.id, ...data });
        toast({ title: 'Amenity Updated', description: `${data.name} updated.` });
      } else {
        await createAmenity.mutateAsync(data);
        toast({ title: 'Amenity Created', description: `${data.name} created.` });
      }
      setDialogOpen(false);
      setEditingAmenity(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Something went wrong.', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (amenity: Amenity) => {
    try {
      await toggleStatus.mutateAsync({ id: amenity.id, is_active: !amenity.is_active });
      toast({
        title: amenity.is_active ? 'Deactivated' : 'Activated',
        description: `${amenity.name} ${amenity.is_active ? 'deactivated' : 'activated'}.`,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium">Amenities</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {amenities?.length || 0} total · {amenities?.filter(a => a.is_active).length || 0} active · {categories.length} categories
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/amenities/icons">
                <Button variant="outline" size="sm" className="gap-2"><Library className="h-4 w-4" /> Icons</Button>
              </Link>
              <Button onClick={() => { setEditingAmenity(null); setDialogOpen(true); }} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Amenity
              </Button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              All ({amenities?.length || 0})
            </button>
            {categories.map((cat) => {
              const count = amenities?.filter(a => a.category === cat).length || 0;
              return (
                <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search amenities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>

          {/* Table */}
          <div className="card-organic overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : filteredAmenities && filteredAmenities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Used in</TableHead>
                    <TableHead className="w-[80px]">Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAmenities.map((amenity) => {
                    const priority = getPriority(amenity.category);
                    const usage = getUsageCount(amenity.slug);
                    const coveragePercent = totalActive > 0 ? Math.round((usage / totalActive) * 100) : 0;
                    const showWarning = priority === 'Core' && coveragePercent < 80 && amenity.is_active;

                    return (
                      <TableRow key={amenity.id}>
                        <TableCell>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                            <DynamicIcon name={amenity.icon} className="h-4 w-4" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-sm">{amenity.name}</p>
                              <p className="text-xs text-muted-foreground">{amenity.slug}</p>
                            </div>
                            {showWarning && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Core amenity only in {coveragePercent}% of active properties</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="text-xs">{amenity.category}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={priority === 'Core' ? 'default' : 'outline'} className="text-xs">
                            {priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center text-sm text-muted-foreground">
                          {usage}/{totalActive}
                        </TableCell>
                        <TableCell>
                          <Switch checked={amenity.is_active} onCheckedChange={() => handleToggleStatus(amenity)} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card">
                              <DropdownMenuItem onClick={() => { setEditingAmenity(amenity); setDialogOpen(true); }}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {search || categoryFilter !== 'all' ? 'No amenities match your filters.' : 'No amenities yet.'}
              </div>
            )}
          </div>
        </div>

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
