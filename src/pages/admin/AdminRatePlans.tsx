import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Copy, Calendar, Users, Tag, Crown, Sun, Snowflake, TrendingUp } from 'lucide-react';
import { format, parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminRatePlans, useCreateRatePlan, useUpdateRatePlan, useDeleteRatePlan, useDuplicateRatePlan, RatePlan, RatePlanFormData } from '@/hooks/useAdminRatePlans';
import { useSeasonalRates, useCreateSeasonalRate, useUpdateSeasonalRate, useDeleteSeasonalRate } from '@/hooks/useSeasonalRates';
import { useAdminProperties } from '@/hooks/useProperties';
import { SeasonalRateFormDialog } from '@/components/admin/SeasonalRateFormDialog';
import { SeasonalRate } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const RATE_TYPES = [
  { value: 'standard', label: 'Standard', description: 'Default pricing for all guests' },
  { value: 'member', label: 'Member Rate', description: 'Exclusive pricing for loyalty members' },
  { value: 'promotional', label: 'Promotional', description: 'Limited-time special offers' },
  { value: 'early_bird', label: 'Early Bird', description: 'Discount for advance bookings' },
  { value: 'last_minute', label: 'Last Minute', description: 'Short-notice deals' },
  { value: 'long_stay', label: 'Long Stay', description: 'Extended booking discounts' },
];

const MEMBER_TIERS = [
  { value: '', label: 'No Requirement' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
];

export default function AdminRatePlans() {
  const { data: ratePlans, isLoading } = useAdminRatePlans();
  const { data: properties } = useAdminProperties();
  const createRatePlan = useCreateRatePlan();
  const updateRatePlan = useUpdateRatePlan();
  const deleteRatePlan = useDeleteRatePlan();
  const duplicateRatePlan = useDuplicateRatePlan();
  const { toast } = useToast();

  // Rate Plan Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RatePlan | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Seasonal Rate State
  const [selectedPropertyForSeasons, setSelectedPropertyForSeasons] = useState<string>('');
  const [seasonalDialogOpen, setSeasonalDialogOpen] = useState(false);
  const [editingSeasonalRate, setEditingSeasonalRate] = useState<SeasonalRate | null>(null);

  // Seasonal rate hooks - only fetch when a property is selected
  const { data: seasonalRates } = useSeasonalRates(selectedPropertyForSeasons);
  const createSeasonalRate = useCreateSeasonalRate();
  const updateSeasonalRate = useUpdateSeasonalRate();
  const deleteSeasonalRate = useDeleteSeasonalRate();

  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  const [formData, setFormData] = useState<RatePlanFormData>({
    property_id: '',
    name: '',
    description: null,
    rate_type: 'standard',
    base_rate: 0,
    min_stay: 1,
    max_stay: null,
    valid_from: format(today, 'yyyy-MM-dd'),
    valid_until: format(nextYear, 'yyyy-MM-dd'),
    member_tier_required: null,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      property_id: '',
      name: '',
      description: null,
      rate_type: 'standard',
      base_rate: 0,
      min_stay: 1,
      max_stay: null,
      valid_from: format(today, 'yyyy-MM-dd'),
      valid_until: format(nextYear, 'yyyy-MM-dd'),
      member_tier_required: null,
      is_active: true,
    });
    setEditingPlan(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (plan: RatePlan) => {
    setEditingPlan(plan);
    setFormData({
      property_id: plan.property_id,
      name: plan.name,
      description: plan.description,
      rate_type: plan.rate_type,
      base_rate: plan.base_rate,
      min_stay: plan.min_stay,
      max_stay: plan.max_stay,
      valid_from: plan.valid_from,
      valid_until: plan.valid_until,
      member_tier_required: plan.member_tier_required,
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }

    try {
      if (editingPlan) {
        await updateRatePlan.mutateAsync({ id: editingPlan.id, ...formData });
        toast({ title: 'Rate plan updated successfully' });
      } else {
        await createRatePlan.mutateAsync(formData);
        toast({ title: 'Rate plan created successfully' });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to save rate plan',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRatePlan.mutateAsync(id);
      toast({ title: 'Rate plan deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete rate plan', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateRatePlan.mutateAsync(id);
      toast({ title: 'Rate plan duplicated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate rate plan', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (plan: RatePlan) => {
    try {
      await updateRatePlan.mutateAsync({ id: plan.id, is_active: !plan.is_active });
      toast({ title: `Rate plan ${plan.is_active ? 'deactivated' : 'activated'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update rate plan', variant: 'destructive' });
    }
  };

  // Seasonal Rate Handlers
  const openSeasonalCreateDialog = () => {
    if (!selectedPropertyForSeasons) {
      toast({ title: 'Please select a property first', variant: 'destructive' });
      return;
    }
    setEditingSeasonalRate(null);
    setSeasonalDialogOpen(true);
  };

  const openSeasonalEditDialog = (rate: SeasonalRate) => {
    setEditingSeasonalRate(rate);
    setSeasonalDialogOpen(true);
  };

  const handleSeasonalSubmit = async (data: Omit<SeasonalRate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingSeasonalRate) {
        await updateSeasonalRate.mutateAsync({ id: editingSeasonalRate.id, ...data });
        toast({ title: 'Seasonal rate updated successfully' });
      } else {
        await createSeasonalRate.mutateAsync(data);
        toast({ title: 'Seasonal rate created successfully' });
      }
      setSeasonalDialogOpen(false);
      setEditingSeasonalRate(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to save seasonal rate',
        variant: 'destructive' 
      });
    }
  };

  const handleSeasonalDelete = async (id: string) => {
    try {
      await deleteSeasonalRate.mutateAsync({ id, propertyId: selectedPropertyForSeasons });
      toast({ title: 'Seasonal rate deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete seasonal rate', variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRateTypeBadge = (rateType: string) => {
    const type = RATE_TYPES.find(t => t.value === rateType);
    const colors: Record<string, string> = {
      standard: 'bg-secondary text-secondary-foreground',
      member: 'bg-primary/10 text-primary',
      promotional: 'bg-accent/20 text-accent-foreground',
      early_bird: 'bg-green-100 text-green-700',
      last_minute: 'bg-orange-100 text-orange-700',
      long_stay: 'bg-blue-100 text-blue-700',
    };
    return (
      <Badge className={colors[rateType] || 'bg-secondary'}>
        {type?.label || rateType}
      </Badge>
    );
  };

  const getSeasonStatus = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const now = new Date();

    if (isWithinInterval(now, { start, end })) {
      return { label: 'Active', className: 'bg-green-100 text-green-700' };
    }
    if (isBefore(now, start)) {
      return { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' };
    }
    return { label: 'Expired', className: 'bg-muted text-muted-foreground' };
  };

  // Filter rate plans
  const filteredPlans = ratePlans?.filter(plan => {
    if (filterProperty !== 'all' && plan.property_id !== filterProperty) return false;
    if (filterType !== 'all' && plan.rate_type !== filterType) return false;
    return true;
  }) || [];

  // Group by property
  const plansByProperty = filteredPlans.reduce((acc, plan) => {
    const propertyName = plan.property?.name || 'Unknown Property';
    if (!acc[propertyName]) acc[propertyName] = [];
    acc[propertyName].push(plan);
    return acc;
  }, {} as Record<string, RatePlan[]>);

  // Stats
  const activePlans = ratePlans?.filter(p => p.is_active).length || 0;
  const memberPlans = ratePlans?.filter(p => p.rate_type === 'member').length || 0;
  const promoPlans = ratePlans?.filter(p => p.rate_type === 'promotional').length || 0;

  // Seasonal rates stats
  const selectedProperty = properties?.find(p => p.id === selectedPropertyForSeasons);
  const activeSeasons = seasonalRates?.filter(r => {
    const status = getSeasonStatus(r.start_date, r.end_date);
    return status.label === 'Active';
  }).length || 0;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-medium">Rate Management</h1>
            <p className="text-muted-foreground">
              Configure pricing tiers, seasonal adjustments, and promotional offers
            </p>
          </div>

          <Tabs defaultValue="rate-plans" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="rate-plans" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Rate Plans
              </TabsTrigger>
              <TabsTrigger value="seasonal-rates" className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Seasonal Rates
              </TabsTrigger>
            </TabsList>

            {/* Rate Plans Tab */}
            <TabsContent value="rate-plans" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Select value={filterProperty} onValueChange={setFilterProperty}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by property" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All Types</SelectItem>
                      {RATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate Plan
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="card-organic">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Tag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Plans</p>
                          <p className="text-2xl font-semibold">{ratePlans?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="card-organic">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-100">
                          <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Active</p>
                          <p className="text-2xl font-semibold">{activePlans}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="card-organic">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Crown className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Member Rates</p>
                          <p className="text-2xl font-semibold">{memberPlans}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="card-organic">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-accent/20">
                          <TrendingUp className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Promotions</p>
                          <p className="text-2xl font-semibold">{promoPlans}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Rate Plans by Property */}
              {Object.entries(plansByProperty).length > 0 ? (
                Object.entries(plansByProperty).map(([propertyName, plans]) => (
                  <Card key={propertyName} className="card-organic">
                    <CardHeader>
                      <CardTitle className="font-serif">{propertyName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Base Rate</TableHead>
                            <TableHead>Stay Length</TableHead>
                            <TableHead>Valid Period</TableHead>
                            <TableHead>Member Tier</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{plan.name}</p>
                                  {plan.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {plan.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getRateTypeBadge(plan.rate_type)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(plan.base_rate)}/night</TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {plan.min_stay}
                                  {plan.max_stay ? ` - ${plan.max_stay}` : '+'} nights
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {format(parseISO(plan.valid_from), 'MMM d, yyyy')} - {format(parseISO(plan.valid_until), 'MMM d, yyyy')}
                                </span>
                              </TableCell>
                              <TableCell>
                                {plan.member_tier_required ? (
                                  <Badge variant="outline" className="capitalize">
                                    <Crown className="h-3 w-3 mr-1" />
                                    {plan.member_tier_required}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={plan.is_active}
                                  onCheckedChange={() => handleToggleActive(plan)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDuplicate(plan.id)}
                                    title="Duplicate"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(plan)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Rate Plan?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete "{plan.name}". This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(plan.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="card-organic">
                  <CardContent className="py-12">
                    <p className="text-muted-foreground text-center">
                      No rate plans found. Create your first rate plan to get started.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Seasonal Rates Tab */}
            <TabsContent value="seasonal-rates" className="space-y-6">
              <div className="flex items-center justify-between">
                <Select value={selectedPropertyForSeasons} onValueChange={setSelectedPropertyForSeasons}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a property to manage seasons" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={openSeasonalCreateDialog} disabled={!selectedPropertyForSeasons}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Seasonal Rate
                </Button>
              </div>

              {selectedPropertyForSeasons ? (
                <>
                  {/* Seasonal Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="card-organic">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-100">
                              <Sun className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Seasons</p>
                              <p className="text-2xl font-semibold">{seasonalRates?.length || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Card className="card-organic">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100">
                              <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Active Now</p>
                              <p className="text-2xl font-semibold">{activeSeasons}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Card className="card-organic">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                              <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Base Price</p>
                              <p className="text-2xl font-semibold">{formatCurrency(selectedProperty?.base_price || 0)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Seasonal Rates Table */}
                  <Card className="card-organic">
                    <CardHeader>
                      <CardTitle className="font-serif">{selectedProperty?.name} - Seasonal Pricing</CardTitle>
                      <CardDescription>
                        Configure automatic rate adjustments based on high/low season periods
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {seasonalRates && seasonalRates.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Season</TableHead>
                              <TableHead>Date Range</TableHead>
                              <TableHead>Multiplier</TableHead>
                              <TableHead>Effective Rate</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {seasonalRates.map((rate) => {
                              const status = getSeasonStatus(rate.start_date, rate.end_date);
                              const effectiveRate = rate.nightly_rate || (selectedProperty?.base_price || 0) * rate.price_multiplier;
                              const isIncrease = rate.price_multiplier > 1;
                              const isDecrease = rate.price_multiplier < 1;

                              return (
                                <TableRow key={rate.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {isIncrease ? (
                                        <Sun className="h-4 w-4 text-orange-500" />
                                      ) : isDecrease ? (
                                        <Snowflake className="h-4 w-4 text-blue-500" />
                                      ) : (
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="font-medium">{rate.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {format(parseISO(rate.start_date), 'MMM d, yyyy')} - {format(parseISO(rate.end_date), 'MMM d, yyyy')}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {rate.nightly_rate ? (
                                      <Badge variant="outline">Fixed Rate</Badge>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono">{rate.price_multiplier}×</span>
                                        <Badge 
                                          className={cn(
                                            isIncrease && 'bg-orange-100 text-orange-700',
                                            isDecrease && 'bg-blue-100 text-blue-700',
                                            !isIncrease && !isDecrease && 'bg-secondary text-secondary-foreground'
                                          )}
                                        >
                                          {isIncrease ? '+' : ''}{((rate.price_multiplier - 1) * 100).toFixed(0)}%
                                        </Badge>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono font-medium">
                                    {formatCurrency(effectiveRate)}/night
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={status.className}>{status.label}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openSeasonalEditDialog(rate)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Seasonal Rate?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will permanently delete "{rate.name}". This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleSeasonalDelete(rate.id)}>
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-12 text-center">
                          <Sun className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No seasonal rates configured for this property.
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add seasonal rates to automatically adjust pricing for high/low seasons.
                          </p>
                          <Button onClick={openSeasonalCreateDialog} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Season
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="card-organic">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Sun className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Select a property to manage its seasonal rates.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Seasonal rates allow you to automatically adjust pricing based on high/low season periods.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Create/Edit Rate Plan Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingPlan ? 'Edit Rate Plan' : 'Create Rate Plan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(v) => setFormData({ ...formData, property_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer 2026 Standard"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rate Type</Label>
                  <Select
                    value={formData.rate_type}
                    onValueChange={(v) => setFormData({ ...formData, rate_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {RATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {RATE_TYPES.find(t => t.value === formData.rate_type)?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                  placeholder="Optional description for this rate plan..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_rate">Base Rate (€/night) *</Label>
                  <Input
                    id="base_rate"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.base_rate}
                    onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stay">Min Stay (nights)</Label>
                  <Input
                    id="min_stay"
                    type="number"
                    min="1"
                    value={formData.min_stay}
                    onChange={(e) => setFormData({ ...formData, min_stay: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_stay">Max Stay (nights)</Label>
                  <Input
                    id="max_stay"
                    type="number"
                    min="1"
                    value={formData.max_stay || ''}
                    onChange={(e) => setFormData({ ...formData, max_stay: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.valid_from && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.valid_from ? format(parseISO(formData.valid_from), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.valid_from ? parseISO(formData.valid_from) : undefined}
                        onSelect={(date) => date && setFormData({ ...formData, valid_from: format(date, 'yyyy-MM-dd') })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Valid Until *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.valid_until && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.valid_until ? format(parseISO(formData.valid_until), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.valid_until ? parseISO(formData.valid_until) : undefined}
                        onSelect={(date) => date && setFormData({ ...formData, valid_until: format(date, 'yyyy-MM-dd') })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Member Tier Required</Label>
                <Select
                  value={formData.member_tier_required || ''}
                  onValueChange={(v) => setFormData({ ...formData, member_tier_required: v || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No requirement" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {MEMBER_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty for rates available to all guests
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Available for booking
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRatePlan.isPending || updateRatePlan.isPending}>
                  {editingPlan ? 'Save Changes' : 'Create Rate Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Seasonal Rate Dialog */}
        <SeasonalRateFormDialog
          open={seasonalDialogOpen}
          onOpenChange={setSeasonalDialogOpen}
          editingRate={editingSeasonalRate}
          propertyId={selectedPropertyForSeasons}
          propertyBasePrice={selectedProperty?.base_price || 0}
          onSubmit={handleSeasonalSubmit}
          isSubmitting={createSeasonalRate.isPending || updateSeasonalRate.isPending}
        />
      </AdminLayout>
    </AdminGuard>
  );
}
