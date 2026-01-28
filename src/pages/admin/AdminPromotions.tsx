import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Tag, Percent, Gift, Filter, TrendingUp, Users, Calendar, Building2, Layers, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminCoupons,
  useAdminSpecialOffers,
  useUpdateCoupon,
  useDeleteCoupon,
  useUpdateSpecialOffer,
  useDeleteSpecialOffer,
  CouponPromo,
  SpecialOffer,
} from '@/hooks/useAdminPromotions';
import { useProperties } from '@/hooks/useProperties';
import { CouponFormDialog } from '@/components/admin/CouponFormDialog';
import { SpecialOfferFormDialog } from '@/components/admin/SpecialOfferFormDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AdminPromotions() {
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponPromo | null>(null);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [deleteType, setDeleteType] = useState<'coupon' | 'offer' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [couponFilter, setCouponFilter] = useState<'all' | 'active' | 'expired' | 'upcoming'>('all');
  const [offerFilter, setOfferFilter] = useState<'all' | 'active' | 'expired' | 'upcoming'>('all');

  const { data: coupons, isLoading: couponsLoading } = useAdminCoupons();
  const { data: offers, isLoading: offersLoading } = useAdminSpecialOffers();
  const { data: properties } = useProperties();

  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const updateOffer = useUpdateSpecialOffer();
  const deleteOffer = useDeleteSpecialOffer();

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isUpcoming = (startDate: string) => new Date(startDate) > new Date();
  const isActive = (startDate: string, endDate: string, active: boolean) => 
    active && !isExpired(endDate) && !isUpcoming(startDate);

  // Stats calculations
  const couponStats = useMemo(() => {
    if (!coupons) return { total: 0, active: 0, totalUses: 0, totalSavings: 0 };
    
    const active = coupons.filter(c => isActive(c.valid_from, c.valid_until, c.is_active)).length;
    const totalUses = coupons.reduce((sum, c) => sum + c.uses_count, 0);
    const totalSavings = coupons.reduce((sum, c) => {
      // Rough estimate based on uses
      if (c.discount_type === 'fixed') {
        return sum + (c.uses_count * c.discount_value);
      }
      return sum; // Can't calculate percentage savings without booking data
    }, 0);
    
    return { total: coupons.length, active, totalUses, totalSavings };
  }, [coupons]);

  const offerStats = useMemo(() => {
    if (!offers) return { total: 0, active: 0, byProperty: 0 };
    
    const active = offers.filter(o => isActive(o.valid_from, o.valid_until, o.is_active)).length;
    const uniqueProperties = new Set(offers.map(o => o.property_id)).size;
    
    return { total: offers.length, active, byProperty: uniqueProperties };
  }, [offers]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    if (!coupons) return [];
    return coupons.filter(coupon => {
      if (couponFilter === 'all') return true;
      if (couponFilter === 'active') return isActive(coupon.valid_from, coupon.valid_until, coupon.is_active);
      if (couponFilter === 'expired') return isExpired(coupon.valid_until);
      if (couponFilter === 'upcoming') return isUpcoming(coupon.valid_from);
      return true;
    });
  }, [coupons, couponFilter]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    return offers.filter(offer => {
      if (offerFilter === 'all') return true;
      if (offerFilter === 'active') return isActive(offer.valid_from, offer.valid_until, offer.is_active);
      if (offerFilter === 'expired') return isExpired(offer.valid_until);
      if (offerFilter === 'upcoming') return isUpcoming(offer.valid_from);
      return true;
    });
  }, [offers, offerFilter]);

  const handleToggleCoupon = async (coupon: CouponPromo) => {
    try {
      await updateCoupon.mutateAsync({ id: coupon.id, is_active: !coupon.is_active });
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update coupon');
    }
  };

  const handleToggleOffer = async (offer: SpecialOffer) => {
    try {
      await updateOffer.mutateAsync({ id: offer.id, is_active: !offer.is_active });
      toast.success(`Offer ${offer.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update offer');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    try {
      if (deleteType === 'coupon') {
        await deleteCoupon.mutateAsync(deleteId);
      } else {
        await deleteOffer.mutateAsync(deleteId);
      }
      toast.success(`${deleteType === 'coupon' ? 'Coupon' : 'Offer'} deleted`);
      setDeleteId(null);
      setDeleteType(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getPropertyNames = (propertyIds: string[] | null) => {
    if (!propertyIds || propertyIds.length === 0 || !properties) return 'All Properties';
    const names = propertyIds
      .map(id => properties.find(p => p.id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return 'All Properties';
    if (names.length === 1) return names[0];
    return `${names.length} Properties`;
  };

  const getUsagePercentage = (coupon: CouponPromo) => {
    if (!coupon.max_uses) return null;
    return Math.min((coupon.uses_count / coupon.max_uses) * 100, 100);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-medium">Promotions</h1>
            <p className="text-muted-foreground">
              Manage coupons and special offers with advanced stacking rules, usage limits, and property restrictions
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{couponStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Coupons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{couponStats.active}</p>
                      <p className="text-xs text-muted-foreground">Active Coupons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/50 rounded-lg">
                      <Users className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{couponStats.totalUses}</p>
                      <p className="text-xs text-muted-foreground">Total Redemptions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/50 rounded-lg">
                      <Gift className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{offerStats.active}</p>
                      <p className="text-xs text-muted-foreground">Active Offers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Tabs defaultValue="coupons">
            <TabsList>
              <TabsTrigger value="coupons" className="gap-2">
                <Tag className="h-4 w-4" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-2">
                <Gift className="h-4 w-4" />
                Special Offers
              </TabsTrigger>
            </TabsList>

            {/* Coupons Tab */}
            <TabsContent value="coupons" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={couponFilter} onValueChange={(v) => setCouponFilter(v as typeof couponFilter)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setCouponDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coupon
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
                  <CardDescription>
                    Create discount codes with stacking rules, usage limits, and property restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {couponsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredCoupons.length > 0 ? (
                    <div className="space-y-3">
                      {filteredCoupons.map((coupon, index) => {
                        const usagePercentage = getUsagePercentage(coupon);
                        const isLimitReached = usagePercentage !== null && usagePercentage >= 100;
                        
                        return (
                          <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="p-4 bg-muted/50 rounded-xl space-y-3"
                          >
                            {/* Main Row */}
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                                <Percent className="h-5 w-5 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Header */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="font-mono font-bold text-lg">{coupon.code}</code>
                                  {isExpired(coupon.valid_until) && (
                                    <Badge variant="destructive">Expired</Badge>
                                  )}
                                  {isUpcoming(coupon.valid_from) && (
                                    <Badge variant="secondary">Upcoming</Badge>
                                  )}
                                  {isLimitReached && (
                                    <Badge variant="outline" className="border-destructive text-destructive">
                                      Limit Reached
                                    </Badge>
                                  )}
                                  {coupon.stackable && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge variant="outline" className="gap-1">
                                            <Layers className="h-3 w-3" />
                                            Stackable
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Can be combined with other coupons
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>

                                {/* Name & Description */}
                                <p className="text-sm font-medium">{coupon.name}</p>
                                {coupon.description && (
                                  <p className="text-xs text-muted-foreground">{coupon.description}</p>
                                )}

                                {/* Restrictions */}
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(coupon.valid_from), 'MMM d')} - {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                                  </span>
                                  
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {getPropertyNames(coupon.applicable_properties)}
                                  </span>

                                  {coupon.min_nights && (
                                    <span>Min {coupon.min_nights} nights</span>
                                  )}
                                  
                                  {coupon.min_booking_value && (
                                    <span>Min €{coupon.min_booking_value}</span>
                                  )}
                                </div>

                                {/* Usage Progress */}
                                {usagePercentage !== null && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">Usage</span>
                                      <span className={isLimitReached ? 'text-destructive font-medium' : ''}>
                                        {coupon.uses_count}/{coupon.max_uses}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={usagePercentage} 
                                      className="h-1.5"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Discount Value */}
                              <div className="text-right shrink-0">
                                <p className="text-xl font-bold text-primary">
                                  {coupon.discount_type === 'percentage'
                                    ? `${coupon.discount_value}%`
                                    : coupon.discount_type === 'free_addon'
                                    ? 'Free Add-on'
                                    : `€${coupon.discount_value}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {coupon.discount_type === 'percentage' ? 'off' : 
                                   coupon.discount_type === 'fixed' ? 'discount' : ''}
                                </p>
                                {!coupon.max_uses && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {coupon.uses_count} uses
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                <Switch
                                  checked={coupon.is_active}
                                  onCheckedChange={() => handleToggleCoupon(coupon)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingCoupon(coupon);
                                    setCouponDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDeleteType('coupon');
                                    setDeleteId(coupon.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {couponFilter !== 'all' 
                        ? `No ${couponFilter} coupons found.`
                        : 'No coupons yet. Create your first coupon to get started.'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Special Offers Tab */}
            <TabsContent value="offers" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={offerFilter} onValueChange={(v) => setOfferFilter(v as typeof offerFilter)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setOfferDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offer
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Special Offers ({filteredOffers.length})</CardTitle>
                  <CardDescription>
                    Property-specific discounts displayed on property pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredOffers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredOffers.map((offer, index) => (
                        <motion.div
                          key={offer.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                        >
                          <div className="p-3 bg-accent/50 rounded-lg">
                            <Gift className="h-5 w-5 text-accent-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{offer.title}</h3>
                              {isExpired(offer.valid_until) && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                              {isUpcoming(offer.valid_from) && (
                                <Badge variant="secondary">Upcoming</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {offer.property?.name || 'Unknown Property'}
                            </p>
                            {offer.description && (
                              <p className="text-xs text-muted-foreground mt-1">{offer.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(offer.valid_from), 'MMM d')} - {format(new Date(offer.valid_until), 'MMM d, yyyy')}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-primary">
                              {offer.discount_percent}% OFF
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={offer.is_active}
                              onCheckedChange={() => handleToggleOffer(offer)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingOffer(offer);
                                setOfferDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteType('offer');
                                setDeleteId(offer.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {offerFilter !== 'all'
                        ? `No ${offerFilter} offers found.`
                        : 'No special offers yet. Create your first offer to get started.'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <CouponFormDialog
          open={couponDialogOpen}
          onOpenChange={(open) => {
            setCouponDialogOpen(open);
            if (!open) setEditingCoupon(null);
          }}
          coupon={editingCoupon}
        />

        <SpecialOfferFormDialog
          open={offerDialogOpen}
          onOpenChange={(open) => {
            setOfferDialogOpen(open);
            if (!open) setEditingOffer(null);
          }}
          offer={editingOffer}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {deleteType === 'coupon' ? 'Coupon' : 'Offer'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
