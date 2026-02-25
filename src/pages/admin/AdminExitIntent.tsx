import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, BarChart3, Users, Gift, Bell, Loader2 } from 'lucide-react';
import { useExitIntentSettings, useUpdateExitIntentSettings, useExitIntentAnalytics } from '@/hooks/useExitIntentSettings';
import { format } from 'date-fns';

export default function AdminExitIntent() {
  const { data: settings, isLoading } = useExitIntentSettings();
  const { data: analytics, isLoading: analyticsLoading } = useExitIntentAnalytics();
  const updateSettings = useUpdateExitIntentSettings();

  const [localSettings, setLocalSettings] = useState<typeof settings | null>(null);

  // Use local state for form, fallback to fetched settings
  const formSettings = localSettings || settings;

  const handleSave = () => {
    if (!formSettings) return;
    updateSettings.mutate(formSettings);
  };

  const updateField = <K extends keyof NonNullable<typeof settings>>(
    field: K,
    value: NonNullable<typeof settings>[K]
  ) => {
    if (!formSettings) return;
    setLocalSettings({ ...formSettings, [field]: value });
  };

  // Sync local state when settings load
  if (settings && !localSettings) {
    setLocalSettings(settings);
  }

  return (
    <AdminGuard>
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Exit Intent Modal</h1>
          <p className="text-muted-foreground mt-1">
            Configure the exit intent popup that captures leaving visitors
          </p>
        </div>

        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ) : formSettings ? (
              <>
                {/* Enable/Disable Toggle */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">Enable Exit Intent Modal</h3>
                        <p className="text-sm text-muted-foreground">
                          Show a popup when visitors are about to leave
                        </p>
                      </div>
                      <Switch
                        checked={formSettings.is_enabled}
                        onCheckedChange={(checked) => updateField('is_enabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Timing & Behavior */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timing & Behavior</CardTitle>
                    <CardDescription>Control when and how often the modal appears</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delay">Delay before trigger (seconds)</Label>
                        <Input
                          id="delay"
                          type="number"
                          min={0}
                          value={formSettings.delay_seconds}
                          onChange={(e) => updateField('delay_seconds', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Wait this long after page load before enabling detection
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cooldown">Cooldown period (days)</Label>
                        <Input
                          id="cooldown"
                          type="number"
                          min={1}
                          value={formSettings.cooldown_days}
                          onChange={(e) => updateField('cooldown_days', parseInt(e.target.value) || 7)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Don't show again for this many days after dismissal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Offers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Offers</CardTitle>
                    <CardDescription>Configure which offers to display</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id="discount"
                        checked={formSettings.discount_offer_enabled}
                        onCheckedChange={(checked) => updateField('discount_offer_enabled', !!checked)}
                      />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="discount" className="flex items-center gap-2 cursor-pointer">
                          <Gift className="h-4 w-4 text-primary" />
                          Discount offer
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className="w-24"
                            value={formSettings.discount_percent}
                            onChange={(e) => updateField('discount_percent', parseInt(e.target.value) || 10)}
                            disabled={!formSettings.discount_offer_enabled}
                          />
                          <span className="text-sm text-muted-foreground">% off first booking</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Checkbox
                        id="pricedrop"
                        checked={formSettings.price_drop_offer_enabled}
                        onCheckedChange={(checked) => updateField('price_drop_offer_enabled', !!checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="pricedrop" className="flex items-center gap-2 cursor-pointer">
                          <Bell className="h-4 w-4 text-primary" />
                          Price drop alerts
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Notify users when prices drop on properties they've viewed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content</CardTitle>
                    <CardDescription>Customize the modal text</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={formSettings.headline}
                        onChange={(e) => updateField('headline', e.target.value)}
                        placeholder="Don't miss out on your dream getaway"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subheadline">Subheadline</Label>
                      <Input
                        id="subheadline"
                        value={formSettings.subheadline}
                        onChange={(e) => updateField('subheadline', e.target.value)}
                        placeholder="Choose an exclusive offer just for you"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={updateSettings.isPending}>
                    {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Settings
                  </Button>
                </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            {analyticsLoading ? (
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : analytics ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Leads</p>
                          <p className="text-3xl font-semibold">{analytics.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Gift className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Discount Signups</p>
                          <p className="text-3xl font-semibold">
                            {analytics.discountCount}
                            {analytics.total > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({Math.round((analytics.discountCount / analytics.total) * 100)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Bell className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price Drop Signups</p>
                          <p className="text-3xl font-semibold">
                            {analytics.priceDropCount}
                            {analytics.total > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({Math.round((analytics.priceDropCount / analytics.total) * 100)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Signups */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Sign-ups</CardTitle>
                    <CardDescription>Latest visitors who signed up via exit intent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.recentSignups.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No sign-ups yet from the exit intent modal
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Offer Type</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.recentSignups.map((signup) => (
                            <TableRow key={signup.id}>
                              <TableCell className="font-medium">{signup.email}</TableCell>
                              <TableCell>
                                {signup.source === 'exit_intent_discount' ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Gift className="h-3 w-3" />
                                    Discount
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1">
                                    <Bell className="h-3 w-3" />
                                    Price Drop
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(signup.subscribed_at), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
    </AdminGuard>
  );
}
