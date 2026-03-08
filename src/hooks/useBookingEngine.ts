import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Addon, SelectedAddon, PriceBreakdown, Fee, CouponPromo } from '@/types/booking-engine';

// Fetch active addons
export function useAddons(propertyId?: string) {
  return useQuery({
    queryKey: ['addons', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('addons_catalog')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        propertyId: item.property_id,
        name: item.name,
        description: item.description,
        category: item.category as Addon['category'],
        price: Number(item.price),
        priceType: item.price_type as Addon['priceType'],
        maxQuantity: item.max_quantity,
        requiresLeadTimeHours: item.requires_lead_time_hours,
        imageUrl: item.image_url,
        isActive: item.is_active,
        sortOrder: item.sort_order,
      })) as Addon[];
    },
  });
}

// Fetch fees and taxes
export function useFeesTaxes(propertyId?: string) {
  return useQuery({
    queryKey: ['fees-taxes', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('fees_taxes')
        .select('*')
        .eq('is_active', true);

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        propertyId: item.property_id,
        name: item.name,
        feeType: item.fee_type as Fee['feeType'],
        amount: Number(item.amount),
        isTax: item.is_tax,
        isMandatory: item.is_mandatory,
        appliesTo: item.applies_to as Fee['appliesTo'],
      })) as Fee[];
    },
  });
}

// Validate and fetch coupon
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ 
      code, 
      propertyId, 
      nights, 
      bookingValue 
    }: { 
      code: string; 
      propertyId: string; 
      nights: number; 
      bookingValue: number;
    }) => {
      const { data, error } = await supabase
        .rpc('validate_coupon', {
          _code: code.toUpperCase(),
          _property_id: propertyId,
          _nights: nights,
          _booking_value: bookingValue,
        });

      if (error) {
        throw new Error('Failed to validate coupon');
      }

      const result = data as Record<string, unknown>;

      if (!result.valid) {
        throw new Error(result.error as string);
      }

      return {
        id: result.id,
        code: result.code,
        name: result.name,
        description: result.description,
        discountType: result.discount_type as CouponPromo['discountType'],
        discountValue: Number(result.discount_value),
        minNights: result.min_nights as number | null,
        minBookingValue: result.min_booking_value ? Number(result.min_booking_value) : undefined,
        maxUses: result.max_uses as number | null,
        usesCount: result.uses_count as number,
        validFrom: result.valid_from as string,
        validUntil: result.valid_until as string,
        applicableProperties: result.applicable_properties as string[] | null,
        stackable: result.stackable as boolean,
        isActive: result.is_active as boolean,
      } as CouponPromo;
    },
  });
}

// Calculate addon price based on type
export function calculateAddonPrice(
  addon: Addon,
  quantity: number,
  nights: number,
  guests: number
): number {
  switch (addon.priceType) {
    case 'fixed':
      return addon.price * quantity;
    case 'per_person':
      return addon.price * guests * quantity;
    case 'per_night':
      return addon.price * nights * quantity;
    case 'per_person_per_night':
      return addon.price * guests * nights * quantity;
    default:
      return addon.price * quantity;
  }
}

// Calculate fee/tax amount
export function calculateFeeAmount(
  fee: Fee,
  baseAmount: number,
  nights: number,
  guests: number
): number {
  switch (fee.feeType) {
    case 'fixed':
      return fee.amount;
    case 'percentage':
      return (baseAmount * fee.amount) / 100;
    case 'per_night':
      return fee.amount * nights;
    case 'per_guest':
      return fee.amount * guests;
    case 'per_guest_per_night':
      return fee.amount * guests * nights;
    default:
      return fee.amount;
  }
}

// Calculate complete price breakdown
export function calculatePriceBreakdown(
  nightlyRate: number,
  nights: number,
  guests: number,
  selectedAddons: SelectedAddon[],
  fees: Fee[],
  coupon?: CouponPromo,
  depositPercentage?: number
): PriceBreakdown {
  const accommodationTotal = nightlyRate * nights;
  const lineItems: PriceBreakdown['lineItems'] = [];

  // Add accommodation
  lineItems.push({
    label: `${nights} night${nights > 1 ? 's' : ''} × €${nightlyRate}`,
    amount: accommodationTotal,
    type: 'accommodation',
  });

  // Calculate addons
  let addonsTotal = 0;
  selectedAddons.forEach(selected => {
    addonsTotal += selected.calculatedPrice;
    lineItems.push({
      label: `${selected.addon.name}${selected.quantity > 1 ? ` × ${selected.quantity}` : ''}`,
      amount: selected.calculatedPrice,
      type: 'addon',
    });
  });

  // Calculate fees (non-tax)
  let feesTotal = 0;
  const applicableFees = fees.filter(f => !f.isTax && f.isMandatory);
  applicableFees.forEach(fee => {
    const baseForFee = fee.appliesTo === 'addons' ? addonsTotal : accommodationTotal;
    const feeAmount = calculateFeeAmount(fee, baseForFee, nights, guests);
    feesTotal += feeAmount;
    lineItems.push({
      label: fee.name,
      amount: feeAmount,
      type: 'fee',
    });
  });

  const subtotal = accommodationTotal + addonsTotal + feesTotal;

  // Calculate discount
  let discountAmount = 0;
  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    if (discountAmount > 0) {
      lineItems.push({
        label: `Discount (${coupon.code})`,
        amount: -discountAmount,
        type: 'discount',
        details: coupon.discountType === 'percentage' 
          ? `${coupon.discountValue}% off` 
          : `€${coupon.discountValue} off`,
      });
    }
  }

  const afterDiscount = subtotal - discountAmount;

  // Calculate taxes
  let taxesTotal = 0;
  const applicableTaxes = fees.filter(f => f.isTax && f.isMandatory);
  applicableTaxes.forEach(tax => {
    const taxAmount = calculateFeeAmount(tax, afterDiscount, nights, guests);
    taxesTotal += taxAmount;
    lineItems.push({
      label: tax.name,
      amount: taxAmount,
      type: 'tax',
    });
  });

  const total = afterDiscount + taxesTotal;

  // Calculate deposit if applicable
  let depositAmount: number | undefined;
  let balanceAmount: number | undefined;
  if (depositPercentage && depositPercentage < 100) {
    depositAmount = Math.ceil(total * (depositPercentage / 100));
    balanceAmount = total - depositAmount;
  }

  return {
    baseRate: nightlyRate,
    nights,
    accommodationTotal,
    addonsTotal,
    feesTotal,
    taxesTotal,
    discountAmount,
    discountCode: coupon?.code,
    subtotal,
    total,
    depositAmount,
    balanceAmount,
    currency: 'EUR',
    lineItems,
  };
}
