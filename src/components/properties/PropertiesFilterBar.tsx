import { useState } from 'react';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS, PropertyTypeValue } from '@/lib/constants';
import { PropertyType } from '@/types/database';

const PRICE_RANGES = [
  { label: 'Any Price', value: 'any' },
  { label: 'Under €400', value: '0-400' },
  { label: '€400 – €700', value: '400-700' },
  { label: '€700 – €1,000', value: '700-1000' },
  { label: '€1,000+', value: '1000-99999' },
];

const GUEST_OPTIONS = [2, 4, 6, 8, 10, 12];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low → High', value: 'price-asc' },
  { label: 'Price: High → Low', value: 'price-desc' },
];

interface PropertiesFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  destinations: string[];
  selectedDestination: string;
  onDestinationChange: (v: string) => void;
  priceRange: string;
  onPriceRangeChange: (v: string) => void;
  guestFilter: number;
  onGuestFilterChange: (v: number) => void;
  propertyType: PropertyType | undefined;
  onPropertyTypeChange: (v: PropertyType | undefined) => void;
  instantBooking: boolean;
  onInstantBookingChange: (v: boolean) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
  resultCount: number;
  onClearAll: () => void;
}

export function PropertiesFilterBar({
  search,
  onSearchChange,
  destinations,
  selectedDestination,
  onDestinationChange,
  priceRange,
  onPriceRangeChange,
  guestFilter,
  onGuestFilterChange,
  propertyType,
  onPropertyTypeChange,
  instantBooking,
  onInstantBookingChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount,
  onClearAll,
}: PropertiesFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="sticky top-[72px] z-50 bg-background/95 backdrop-blur-xl border-b border-border py-4 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 py-2 flex-[1_1_260px] max-w-[340px]">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              placeholder="Search villas, destinations..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none font-sans text-[13px] text-foreground w-full placeholder:text-muted-foreground"
            />
            {search && (
              <X
                size={14}
                className="text-muted-foreground cursor-pointer shrink-0"
                onClick={() => onSearchChange('')}
              />
            )}
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 flex-[1_1_auto] justify-center">
            <Select value={selectedDestination || 'all'} onValueChange={(v) => onDestinationChange(v === 'all' ? '' : v)}>
              <SelectTrigger className="min-w-[150px] bg-muted border-border">
                <SelectValue placeholder="All Destinations" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All Destinations</SelectItem>
                {destinations.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={onPriceRangeChange}>
              <SelectTrigger className="min-w-[130px] bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {PRICE_RANGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(guestFilter)} onValueChange={(v) => onGuestFilterChange(Number(v))}>
              <SelectTrigger className="min-w-[120px] bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="0">Any Guests</SelectItem>
                {GUEST_OPTIONS.map((g) => (
                  <SelectItem key={g} value={String(g)}>{g}+ guests</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded((x) => !x)}
              className={cn(
                'gap-1.5',
                expanded && 'border-accent text-accent'
              )}
            >
              <SlidersHorizontal size={14} /> More
            </Button>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="min-w-[160px] bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              {([
                { v: 'grid' as const, icon: Grid3X3 },
                { v: 'list' as const, icon: LayoutList },
              ]).map(({ v, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => onViewModeChange(v)}
                  className={cn(
                    'p-2.5 transition-all flex items-center',
                    viewMode === v
                      ? 'bg-accent/10 text-accent'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>

            <span className="font-sans text-xs text-muted-foreground whitespace-nowrap">
              {resultCount} villa{resultCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Expanded filters */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border flex gap-4 flex-wrap items-center">
            <span className="font-sans text-[11px] text-muted-foreground tracking-[0.1em] uppercase mr-2">Type:</span>
            {PROPERTY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onPropertyTypeChange(propertyType === t ? undefined : t as PropertyType)}
                className={cn(
                  'px-3.5 py-1.5 rounded-md text-xs font-sans cursor-pointer transition-all border',
                  propertyType === t
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {PROPERTY_TYPE_LABELS[t]}
              </button>
            ))}

            <div className="w-px h-6 bg-border mx-2" />

            <button
              onClick={() => onInstantBookingChange(!instantBooking)}
              className={cn(
                'px-3.5 py-1.5 rounded-md text-xs font-sans cursor-pointer transition-all border inline-flex items-center gap-1.5',
                instantBooking
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles size={12} /> Instant Book
            </button>

            <button
              onClick={onClearAll}
              className="ml-auto px-3.5 py-1.5 bg-transparent border border-destructive rounded-md text-[11px] font-sans text-destructive cursor-pointer tracking-[0.05em]"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
