
# Pre-fill Booking Widget from Search Results

## Problem
When a user searches with dates and guests on the Properties page and clicks "View Details" on a result, the property detail page opens but the booking widget starts empty -- the user has to re-enter dates and guests they already selected.

## Solution
Pass the search dates and guest count through URL parameters when navigating to the property detail, then pre-fill the BookingWidget and MobileBookingCTA with those values.

## Changes

### 1. `src/components/properties/SearchResultCard.tsx`
- Update the `Link` to include `checkIn`, `checkOut`, and `guests` as query parameters in the URL
- Read these from the parent's URL search params and forward them
- Change props to accept `checkIn`, `checkOut`, and `guests` strings

### 2. `src/pages/Properties.tsx`
- Pass `checkIn`, `checkOut`, and `guests` to each `SearchResultCard` so it can build the correct link

### 3. `src/components/booking/BookingWidget.tsx`
- Add optional `initialCheckIn`, `initialCheckOut`, and `initialGuests` props
- Initialize the `checkIn`, `checkOut`, and `guests` state from these props instead of `undefined`/`1`

### 4. `src/components/booking/MobileBookingCTA.tsx`
- Add the same optional `initialCheckIn`, `initialCheckOut`, and `initialGuests` props
- Initialize local state from these props

### 5. `src/pages/PropertyDetail.tsx`
- Read `checkIn`, `checkOut`, `guests` from `useSearchParams`
- Parse dates and pass them as `initialCheckIn`, `initialCheckOut`, `initialGuests` to both `BookingWidget` and `MobileBookingCTA`

## Technical Details

### SearchResultCard link change
```text
// Before:
<Link to={`/properties/${property.slug}`}>

// After:
<Link to={`/properties/${property.slug}?checkIn=...&checkOut=...&guests=...`}>
```
Only appends params when they exist.

### BookingWidget new props
```text
interface BookingWidgetProps {
  property: Property;
  specialOffer?: SpecialOffer | null;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
  initialGuests?: number;
}
```
State initialization:
```text
const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
const [guests, setGuests] = useState(initialGuests || 1);
```

### PropertyDetail reads URL params
```text
const [searchParams] = useSearchParams();
const initialCheckIn = searchParams.get('checkIn') ? parseISO(searchParams.get('checkIn')!) : undefined;
const initialCheckOut = searchParams.get('checkOut') ? parseISO(searchParams.get('checkOut')!) : undefined;
const initialGuests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined;
```

These are passed down to BookingWidget and MobileBookingCTA.

## Data Flow

```text
Search Results Page (dates in URL)
  --> SearchResultCard builds link with ?checkIn=&checkOut=&guests=
    --> PropertyDetail reads URL params
      --> BookingWidget pre-fills dates/guests
      --> MobileBookingCTA pre-fills dates/guests
        --> Price breakdown shows immediately
        --> "Book & Pay Now" button is ready
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/properties/SearchResultCard.tsx` | Forward date/guest params in link URL |
| `src/pages/Properties.tsx` | Pass checkIn/checkOut/guests to SearchResultCard |
| `src/components/booking/BookingWidget.tsx` | Accept and use initial date/guest props |
| `src/components/booking/MobileBookingCTA.tsx` | Accept and use initial date/guest props |
| `src/pages/PropertyDetail.tsx` | Read URL params and pass to booking widgets |
