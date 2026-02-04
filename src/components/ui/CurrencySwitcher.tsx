import { Globe } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SupportedCurrency } from '@/types/currency';

interface CurrencySwitcherProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function CurrencySwitcher({ variant = 'icon', className }: CurrencySwitcherProps) {
  const { selectedCurrency, setSelectedCurrency, currencies, getCurrencyInfo } = useCurrency();
  const currentInfo = getCurrencyInfo(selectedCurrency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={variant === 'icon' ? 'icon' : 'sm'} 
          className={cn('gap-2', className)}
          aria-label="Select currency"
        >
          <Globe className="h-4 w-4" />
          {variant === 'full' && (
            <span className="text-sm font-medium">
              {currentInfo.symbol} {selectedCurrency}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => setSelectedCurrency(currency.code as SupportedCurrency)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              selectedCurrency === currency.code && 'bg-primary/10 text-primary'
            )}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 text-center font-medium">{currency.symbol}</span>
              <span>{currency.name}</span>
            </span>
            {selectedCurrency === currency.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
