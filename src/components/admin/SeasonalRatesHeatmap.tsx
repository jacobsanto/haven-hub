import { useMemo, useState } from 'react';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval, 
  eachMonthOfInterval,
  getMonth,
  getDay,
  isSameMonth,
  addYears,
  subYears
} from 'date-fns';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { SeasonalRate, Property } from '@/types/database';
import { calculatePriceForDate } from '@/hooks/useSeasonalRates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SeasonalRatesHeatmapProps {
  property: Property;
  seasonalRates: SeasonalRate[];
  className?: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function SeasonalRatesHeatmap({ property, seasonalRates, className }: SeasonalRatesHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; price: number; rate?: SeasonalRate } | null>(null);

  // Calculate price range for color scaling
  const priceData = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    const prices = days.map(date => ({
      date,
      price: calculatePriceForDate(property.base_price, date, seasonalRates),
      rate: seasonalRates.find(r => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return dateStr >= r.start_date && dateStr <= r.end_date;
      })
    }));

    const allPrices = prices.map(p => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    return { days: prices, minPrice, maxPrice, priceRange };
  }, [property.base_price, seasonalRates, selectedYear]);

  // Generate calendar grid by month
  const calendarMonths = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map(month => {
      const monthDays = priceData.days.filter(d => isSameMonth(d.date, month));
      const firstDayOfWeek = getDay(monthDays[0]?.date || month);
      
      // Create grid with empty cells for alignment
      const grid: (typeof monthDays[0] | null)[] = [];
      for (let i = 0; i < firstDayOfWeek; i++) {
        grid.push(null);
      }
      grid.push(...monthDays);

      return { month, days: grid };
    });
  }, [priceData.days, selectedYear]);

  // Color scale based on price intensity
  const getPriceColor = (price: number) => {
    const { minPrice, priceRange } = priceData;
    const intensity = (price - minPrice) / priceRange;
    
    // Color gradient from green (low) to yellow (medium) to red (high)
    if (intensity < 0.33) {
      // Green to yellow
      const hue = 120 - (intensity * 3 * 60); // 120 (green) to 60 (yellow)
      return `hsl(${hue}, 70%, 45%)`;
    } else if (intensity < 0.66) {
      // Yellow to orange
      const hue = 60 - ((intensity - 0.33) * 3 * 30); // 60 (yellow) to 30 (orange)
      return `hsl(${hue}, 80%, 50%)`;
    } else {
      // Orange to red
      const hue = 30 - ((intensity - 0.66) * 3 * 30); // 30 (orange) to 0 (red)
      return `hsl(${hue}, 85%, 50%)`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Legend items
  const legendItems = useMemo(() => {
    const { minPrice, maxPrice } = priceData;
    const step = (maxPrice - minPrice) / 4;
    return [
      { price: minPrice, label: 'Low' },
      { price: minPrice + step, label: '' },
      { price: minPrice + step * 2, label: 'Mid' },
      { price: minPrice + step * 3, label: '' },
      { price: maxPrice, label: 'High' },
    ];
  }, [priceData]);

  return (
    <Card className={cn('card-organic', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              Price Heatmap
              <Badge variant="secondary">{property.name}</Badge>
            </CardTitle>
            <CardDescription>
              Visual overview of nightly rates throughout the year
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium w-16 text-center">{selectedYear}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(y => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Summary */}
        <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-xl">
          <div>
            <p className="text-xs text-muted-foreground">Base Rate</p>
            <p className="font-semibold">{formatCurrency(property.base_price)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Min Rate</p>
            <p className="font-semibold text-green-600">{formatCurrency(priceData.minPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max Rate</p>
            <p className="font-semibold text-red-600">{formatCurrency(priceData.maxPrice)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>{seasonalRates.length} seasonal rate{seasonalRates.length !== 1 ? 's' : ''} configured</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-xs text-muted-foreground">Lower rates</span>
          <div className="flex">
            {legendItems.map((item, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-8 h-4 first:rounded-l last:rounded-r"
                      style={{ backgroundColor: getPriceColor(item.price) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatCurrency(item.price)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Higher rates</span>
        </div>

        {/* Hovered Day Info */}
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-card border rounded-lg shadow-sm text-center"
          >
            <p className="text-sm text-muted-foreground">
              {format(hoveredDay.date, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(hoveredDay.price)}/night
            </p>
            {hoveredDay.rate && (
              <Badge variant="secondary" className="mt-1">
                {hoveredDay.rate.name}
                {hoveredDay.rate.price_multiplier !== 1 && (
                  <span className="ml-1">({hoveredDay.rate.price_multiplier}x)</span>
                )}
              </Badge>
            )}
          </motion.div>
        )}

        {/* Calendar Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {calendarMonths.map(({ month, days }) => (
            <div key={month.toISOString()} className="space-y-1">
              <h4 className="text-xs font-medium text-center text-muted-foreground">
                {MONTH_NAMES[getMonth(month)]}
              </h4>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px">
                {DAY_NAMES.map((day, i) => (
                  <div key={i} className="text-[9px] text-muted-foreground text-center">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px">
                {days.map((dayData, i) => (
                  <div key={i}>
                    {dayData ? (
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                'w-full aspect-square rounded-sm transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1',
                                'focus:outline-none focus:ring-2 focus:ring-primary'
                              )}
                              style={{ backgroundColor: getPriceColor(dayData.price) }}
                              onMouseEnter={() => setHoveredDay(dayData)}
                              onMouseLeave={() => setHoveredDay(null)}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{format(dayData.date, 'MMM d')}</p>
                            <p>{formatCurrency(dayData.price)}</p>
                            {dayData.rate && <p className="text-muted-foreground">{dayData.rate.name}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <div className="w-full aspect-square" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Seasonal Rates Legend */}
        {seasonalRates.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Configured Seasons</h4>
            <div className="flex flex-wrap gap-2">
              {seasonalRates.map((rate) => (
                <Badge key={rate.id} variant="outline" className="text-xs">
                  <span className="font-medium">{rate.name}</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {format(new Date(rate.start_date), 'MMM d')} - {format(new Date(rate.end_date), 'MMM d')}
                  </span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  {rate.nightly_rate ? (
                    <span className="text-primary">{formatCurrency(rate.nightly_rate)}</span>
                  ) : (
                    <span className={cn(
                      rate.price_multiplier > 1 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {rate.price_multiplier}x
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
