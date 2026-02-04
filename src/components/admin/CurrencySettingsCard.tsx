import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '@/types/currency';
import { Coins, CreditCard, LayoutDashboard, Globe } from 'lucide-react';

interface CurrencySettingsCardProps {
  value: SupportedCurrency;
  onChange: (currency: SupportedCurrency) => void;
}

export function CurrencySettingsCard({ value, onChange }: CurrencySettingsCardProps) {
  // Get currency info for preview
  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === value) || SUPPORTED_CURRENCIES[0];

  // Format sample prices for preview
  const formatSample = (amount: number): string => {
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: value,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Configure the base currency for all pricing across the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Selector */}
        <div className="space-y-3">
          <Label htmlFor="base_currency">Base Currency</Label>
          <Select value={value} onValueChange={(v) => onChange(v as SupportedCurrency)}>
            <SelectTrigger id="base_currency" className="w-full max-w-xs">
              <SelectValue placeholder="Select base currency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <span className="text-muted-foreground">– {currency.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Usage Info */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">This currency is used for:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              All property pricing in the database
            </li>
            <li className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment processing via Stripe
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Admin dashboard displays
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Guests can still view prices in other currencies, but payments will be charged in the base currency.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Format Preview</Label>
          <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-card">
            <div className="text-center">
              <span className="text-2xl font-semibold">{formatSample(1234)}</span>
              <p className="text-xs text-muted-foreground mt-1">Standard</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-semibold">{formatSample(500)}/night</span>
              <p className="text-xs text-muted-foreground mt-1">Rate</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-semibold">{formatSample(10500)}</span>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
