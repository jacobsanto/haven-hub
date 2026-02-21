import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Users, Bed, Bath, Zap, Calendar, Percent, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstantBookingBadge } from '@/components/properties/InstantBookingBadge';
import { PropertyBookingPopup } from '@/components/booking/PropertyBookingPopup';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import type { Property } from '@/types/database';
import 'leaflet/dist/leaflet.css';

// Custom pin SVG icon
function createPinIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="hsl(var(--primary))" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-map-pin',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
}

// Auto-fit bounds when properties change
function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = properties
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => [p.latitude!, p.longitude!] as L.LatLngTuple);

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [properties, map]);

  return null;
}

// Individual property popup card
function PropertyPopupCard({ property }: { property: Property }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const { formatPrice } = useCurrency();
  const { data: specialOffer } = useActiveSpecialOffer(property.id);
  const priceInfo = formatPrice(property.base_price);

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookingOpen(true);
  };

  return (
    <>
      <div className="w-[280px] font-sans">
        {/* Hero image */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
          <img
            src={property.hero_image_url || '/placeholder.svg'}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {property.instant_booking && <InstantBookingBadge size="sm" />}
            {specialOffer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                <Percent className="h-3 w-3" />
                {specialOffer.discount_percent}% off
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 bg-white dark:bg-card rounded-b-xl">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-serif text-sm font-semibold line-clamp-1 text-foreground">
              {property.name}
            </h4>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-bold text-foreground">{priceInfo.display}</span>
              <span className="text-[10px] text-muted-foreground">/night</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
            <MapPin className="h-3 w-3" />
            <span>{property.city}, {property.country}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{property.bathrooms}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{property.max_guests}</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              to={`/properties/${property.slug}`}
              className="flex-1 text-center text-xs font-medium py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
            >
              View Details
            </Link>
            <Button
              size="sm"
              onClick={handleBookNow}
              className="flex-1 gap-1 text-xs h-auto py-1.5"
            >
              {property.instant_booking ? (
                <><Zap className="h-3 w-3" />Instant Book</>
              ) : (
                <><Calendar className="h-3 w-3" />Book Now</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <PropertyBookingPopup
        property={property}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </>
  );
}

interface PropertyMapViewProps {
  properties: Property[];
  isLoading: boolean;
}

export function PropertyMapView({ properties, isLoading }: PropertyMapViewProps) {
  const pinIcon = useMemo(() => createPinIcon(), []);

  const mappableProperties = useMemo(
    () => properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties]
  );

  const missingCount = properties.length - mappableProperties.length;

  // Default center: Europe
  const defaultCenter: L.LatLngTuple = [42, 14];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden bg-muted animate-pulse" style={{ minHeight: 500 }}>
        <div className="flex items-center justify-center h-full min-h-[500px] text-muted-foreground">
          Loading map…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ minHeight: 500 }}
      >
        <style>{`
          .custom-map-pin { background: none !important; border: none !important; }
          .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 0.75rem !important; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2) !important; border: 1px solid rgba(30,60,120,0.08) !important; }
          .leaflet-popup-content { margin: 0 !important; min-width: 280px !important; }
          .leaflet-popup-tip { border-top-color: white !important; }
          .leaflet-popup-close-button { z-index: 10; color: #666 !important; font-size: 18px !important; top: 6px !important; right: 8px !important; }
        `}</style>
        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          className="w-full"
          style={{ height: 'max(500px, calc(100vh - 400px))' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds properties={properties} />
          {mappableProperties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude!, property.longitude!]}
              icon={pinIcon}
              eventHandlers={{
                mouseover: (e) => e.target.openPopup(),
              }}
            >
              <Popup>
                <PropertyPopupCard property={property} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {missingCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>{missingCount} {missingCount === 1 ? 'property' : 'properties'} not shown (missing location data)</span>
        </div>
      )}
    </div>
  );
}
