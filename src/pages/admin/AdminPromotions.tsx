import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Tag, Percent, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function AdminPromotions() {
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponPromo | null>(null);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [deleteType, setDeleteType] = useState<'coupon' | 'offer' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: coupons, isLoading: couponsLoading } = useAdminCoupons();
  const { data: offers, isLoading: offersLoading } = useAdminSpecialOffers();

  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const updateOffer = useUpdateSpecialOffer();
  const deleteOffer = useDeleteSpecialOffer();

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

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isUpcoming = (startDate: string) => new Date(startDate) > new Date();

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-medium">Promotions</h1>
            <p className="text-muted-foreground">
              Manage coupons and special offers to drive bookings
            </p>
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
              <div className="flex justify-end">
                <Button onClick={() => setCouponDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coupon
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Coupons ({coupons?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {couponsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : coupons && coupons.length > 0 ? (
                    <div className="space-y-3">
                      {coupons.map((coupon, index) => (
                        <motion.div
                          key={coupon.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                        >
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <Percent className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold">{coupon.code}</code>
                              {isExpired(coupon.valid_until) && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                              {isUpcoming(coupon.valid_from) && (
                                <Badge variant="secondary">Upcoming</Badge>
                              )}
                              {coupon.stackable && <Badge variant="outline">Stackable</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{coupon.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Valid: {format(new Date(coupon.valid_from), 'MMM d')} -{' '}
                              {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">
                              {coupon.discount_type === 'percentage'
                                ? `${coupon.discount_value}%`
                                : `€${coupon.discount_value}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {coupon.uses_count}
                              {coupon.max_uses ? `/${coupon.max_uses}` : ''} uses
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
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
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No coupons yet. Create your first coupon to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Special Offers Tab */}
            <TabsContent value="offers" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setOfferDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offer
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Special Offers ({offers?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {offersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : offers && offers.length > 0 ? (
                    <div className="space-y-3">
                      {offers.map((offer, index) => (
                        <motion.div
                          key={offer.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                        >
                          <div className="p-3 bg-accent/50 rounded-lg">
                            <Gift className="h-5 w-5 text-accent-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
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
                            <p className="text-xs text-muted-foreground">
                              Valid: {format(new Date(offer.valid_from), 'MMM d')} -{' '}
                              {format(new Date(offer.valid_until), 'MMM d, yyyy')}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              {offer.discount_percent}% OFF
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
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
                      No special offers yet. Create your first offer to get started.
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
