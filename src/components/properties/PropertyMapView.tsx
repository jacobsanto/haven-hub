import { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Property } from '@/types/database';
import 'leaflet/dist/leaflet.css';

// SVG icons for popup stats
const bedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
const bathSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/></svg>`;
const usersSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const zapSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`;
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`;

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

function buildPopupHtml(property: Property, priceDisplay: string): string {
  const img = property.hero_image_url || '/placeholder.svg';
  const name = property.name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const city = property.city?.replace(/'/g, '&#39;') ?? '';
  const country = property.country?.replace(/'/g, '&#39;') ?? '';

  const instantBadge = property.instant_booking
    ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:hsl(45 93% 47% / 0.15);color:hsl(45 93% 30%);border-radius:9999px;font-size:11px;font-weight:500;">${zapSvg} Instant</span>`
    : '';

  const bookIcon = property.instant_booking ? zapSvg : calendarSvg;
  const bookLabel = property.instant_booking ? 'Instant Book' : 'Book Now';

  return `
    <div style="width:280px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:12px 12px 0 0;">
        <img src="${img}" alt="${name}" style="width:100%;height:100%;object-fit:cover;" />
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.4),transparent)"></div>
        ${instantBadge ? `<div style="position:absolute;top:8px;left:8px;">${instantBadge}</div>` : ''}
      </div>
      <div style="padding:12px;background:white;border-radius:0 0 12px 12px;">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:4px;">
          <h4 style="margin:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</h4>
          <div style="text-align:right;flex-shrink:0;">
            <span style="font-size:14px;font-weight:700;">${priceDisplay}</span>
            <span style="font-size:10px;color:#888;">/night</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;color:#888;font-size:12px;margin-bottom:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${city}${country ? ', ' + country : ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:#888;margin-bottom:12px;">
          <span style="display:flex;align-items:center;gap:4px;">${bedSvg}${property.bedrooms}</span>
          <span style="display:flex;align-items:center;gap:4px;">${bathSvg}${property.bathrooms}</span>
          <span style="display:flex;align-items:center;gap:4px;">${usersSvg}${property.max_guests}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <a href="/properties/${property.slug}" style="flex:1;text-align:center;font-size:12px;font-weight:500;padding:6px 0;border-radius:8px;border:1px solid #e5e7eb;color:inherit;text-decoration:none;">View Details</a>
          <a href="/properties/${property.slug}#book" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:500;padding:6px 0;border-radius:8px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));text-decoration:none;">${bookIcon}${bookLabel}</a>
        </div>
      </div>
    </div>
  `;
}

const MAP_STYLES = `
  .custom-map-pin { background: none !important; border: none !important; }
  .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 0.75rem !important; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2) !important; border: 1px solid rgba(30,60,120,0.08) !important; }
  .leaflet-popup-content { margin: 0 !important; min-width: 280px !important; }
  .leaflet-popup-tip { border-top-color: white !important; }
  .leaflet-popup-close-button { z-index: 10; color: #666 !important; font-size: 18px !important; top: 6px !important; right: 8px !important; }
`;

interface PropertyMapViewProps {
  properties: Property[];
  isLoading: boolean;
}

export function PropertyMapView({ properties, isLoading }: PropertyMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { formatPrice } = useCurrency();
  const pinIcon = useMemo(() => createPinIcon(), []);

  const mappableProperties = useMemo(
    () => properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties]
  );

  const missingCount = properties.length - mappableProperties.length;

  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    // Destroy previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [42, 14],
      zoom: 5,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers
    const coords: L.LatLngTuple[] = [];
    mappableProperties.forEach((property) => {
      const pos: L.LatLngTuple = [property.latitude!, property.longitude!];
      coords.push(pos);

      const priceInfo = formatPrice(property.base_price);
      const popupHtml = buildPopupHtml(property, priceInfo.display);

      const marker = L.marker(pos, { icon: pinIcon }).addTo(map);
      marker.bindPopup(popupHtml, { maxWidth: 300, minWidth: 280 });
      marker.on('mouseover', () => marker.openPopup());
    });

    // Fit bounds
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mappableProperties, isLoading, pinIcon, formatPrice]);

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
      <style>{MAP_STYLES}</style>
      <div
        ref={mapRef}
        className="rounded-2xl border border-border overflow-hidden"
        style={{ minHeight: 500, height: 'max(500px, calc(100vh - 400px))' }}
      />
      {missingCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>{missingCount} {missingCount === 1 ? 'property' : 'properties'} not shown (missing location data)</span>
        </div>
      )}
    </div>
  );
}
