import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAdminCoupons } from '@/hooks/useAdminPromotions';
import { useCreateCampaign, useUpdateCampaign, CampaignFormData } from '@/hooks/usePromotionalCampaigns';
import type { PromotionalCampaign } from '@/hooks/useActivePromotion';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  discount_method: z.enum(['coupon', 'automatic']),
  coupon_id: z.string().optional(),
  auto_discount_percent: z.number().min(1).max(100).optional(),
  starts_at: z.string().min(1, 'Start date is required'),
  ends_at: z.string().min(1, 'End date is required'),
  trigger_type: z.enum(['entry', 'exit', 'both', 'timed']),
  trigger_delay_seconds: z.number().min(0).optional(),
  show_on_mobile: z.boolean(),
  priority: z.number().min(0).optional(),
  max_impressions: z.number().min(1).optional().nullable(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface PromotionalCampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: PromotionalCampaign | null;
}

export function PromotionalCampaignFormDialog({
  open,
  onOpenChange,
  campaign,
}: PromotionalCampaignFormDialogProps) {
  const [activeTab, setActiveTab] = useState('content');
  const { data: coupons } = useAdminCoupons();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const isEditing = !!campaign;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      cta_text: 'Claim Offer',
      cta_link: '',
      discount_method: 'coupon',
      coupon_id: '',
      auto_discount_percent: 10,
      starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      trigger_type: 'entry',
      trigger_delay_seconds: 0,
      show_on_mobile: true,
      priority: 0,
      max_impressions: null,
      is_active: true,
    },
  });

  // Load campaign data when editing
  useEffect(() => {
    if (campaign) {
      form.reset({
        title: campaign.title,
        subtitle: campaign.subtitle || '',
        description: campaign.description || '',
        image_url: campaign.image_url || '',
        cta_text: campaign.cta_text || 'Claim Offer',
        cta_link: campaign.cta_link || '',
        discount_method: campaign.discount_method,
        coupon_id: campaign.coupon_id || '',
        auto_discount_percent: campaign.auto_discount_percent || 10,
        starts_at: format(new Date(campaign.starts_at), "yyyy-MM-dd'T'HH:mm"),
        ends_at: format(new Date(campaign.ends_at), "yyyy-MM-dd'T'HH:mm"),
        trigger_type: campaign.trigger_type,
        trigger_delay_seconds: campaign.trigger_delay_seconds || 0,
        show_on_mobile: campaign.show_on_mobile,
        priority: campaign.priority,
        max_impressions: campaign.max_impressions,
        is_active: campaign.is_active,
      });
    } else {
      form.reset();
    }
  }, [campaign, form]);

  const discountMethod = form.watch('discount_method');
  const triggerType = form.watch('trigger_type');

  const onSubmit = async (values: FormValues) => {
    const formData: CampaignFormData = {
      title: values.title,
      subtitle: values.subtitle,
      description: values.description,
      image_url: values.image_url || undefined,
      cta_text: values.cta_text,
      cta_link: values.cta_link,
      discount_method: values.discount_method,
      coupon_id: values.discount_method === 'coupon' ? values.coupon_id : undefined,
      auto_discount_percent: values.discount_method === 'automatic' ? values.auto_discount_percent : undefined,
      starts_at: new Date(values.starts_at).toISOString(),
      ends_at: new Date(values.ends_at).toISOString(),
      trigger_type: values.trigger_type,
      trigger_delay_seconds: values.trigger_delay_seconds,
      show_on_mobile: values.show_on_mobile,
      priority: values.priority,
      max_impressions: values.max_impressions || undefined,
      is_active: values.is_active,
    };

    try {
      if (isEditing && campaign) {
        await updateCampaign.mutateAsync({ id: campaign.id, ...formData });
      } else {
        await createCampaign.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Campaign' : 'Create Promotional Campaign'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="discount">Discount</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Escape Sale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input placeholder="Limited time offer" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storytelling Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Because summer memories shouldn't wait. Book now and save on your dream villa..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The compelling "why" behind your offer
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Image</FormLabel>
                      <FormControl>
                        <ImageFieldWithAI
                          value={field.value || undefined}
                          onUpload={(url) => form.setValue('image_url', url)}
                          onRemove={() => form.setValue('image_url', '')}
                          storagePath="campaigns"
                          label="Upload Banner Image"
                          generatePrompt={[
                            `Promotional banner for "${form.watch('title') || 'luxury travel promotion'}".`,
                            form.watch('description') ? `Campaign story: ${form.watch('description')}.` : '',
                            form.watch('subtitle') ? `Tagline: ${form.watch('subtitle')}.` : '',
                            'Wide format, aspirational luxury travel imagery, marketing quality.',
                          ].filter(Boolean).join(' ')}
                          generateContext={{
                            name: form.watch('title') || undefined,
                            description: form.watch('description') || undefined,
                          }}
                          promptLabel="Generate banner image"
                        />
                      </FormControl>
                      <FormDescription>
                        Visual artwork for the pop-up
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cta_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Claim Offer" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cta_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="/properties" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Discount Tab */}
              <TabsContent value="discount" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="discount_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="coupon">Coupon Code</SelectItem>
                          <SelectItem value="automatic">Automatic Discount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {discountMethod === 'coupon'
                          ? 'User enters code at checkout'
                          : 'Prices automatically reduced site-wide'}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {discountMethod === 'coupon' && (
                  <FormField
                    control={form.control}
                    name="coupon_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Coupon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a coupon..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {coupons?.filter(c => c.is_active).map((coupon) => (
                              <SelectItem key={coupon.id} value={coupon.id}>
                                {coupon.code} - {coupon.discount_type === 'percentage' 
                                  ? `${coupon.discount_value}%` 
                                  : `€${coupon.discount_value}`} off
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link to an existing coupon from your promotions
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                {discountMethod === 'automatic' && (
                  <FormField
                    control={form.control}
                    name="auto_discount_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentage off all eligible bookings
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="starts_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starts At *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ends_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ends At *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="trigger_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Trigger</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">On Page Entry</SelectItem>
                          <SelectItem value="exit">Exit Intent</SelectItem>
                          <SelectItem value="both">Entry & Exit</SelectItem>
                          <SelectItem value="timed">After Delay</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {(triggerType === 'entry' || triggerType === 'timed' || triggerType === 'both') && (
                  <FormField
                    control={form.control}
                    name="trigger_delay_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delay (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Wait before showing the pop-up
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Higher = shown first if overlapping
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_impressions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Impressions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Unlimited"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="show_on_mobile"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Show on Mobile</FormLabel>
                          <FormDescription>
                            Display the pop-up on mobile devices
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Enable this campaign
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
                {isEditing ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
