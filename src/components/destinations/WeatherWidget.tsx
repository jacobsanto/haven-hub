import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDestinationWeather, type WeatherData } from '@/hooks/useDestinationWeather';

interface WeatherWidgetProps {
  latitude?: number | null;
  longitude?: number | null;
  climateText?: string | null;
}

const iconMap: Record<WeatherData['icon'], React.ElementType> = {
  sunny: Sun,
  'partly-cloudy': Cloud,
  cloudy: Cloud,
  foggy: CloudFog,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};

const animationMap: Record<WeatherData['icon'], string> = {
  sunny: 'animate-weather-sun',
  'partly-cloudy': 'animate-weather-cloud',
  cloudy: 'animate-weather-cloud',
  foggy: 'animate-weather-cloud',
  rainy: 'animate-weather-rain',
  snowy: 'animate-weather-rain',
  stormy: 'animate-weather-rain',
};

export function WeatherWidget({ latitude, longitude, climateText }: WeatherWidgetProps) {
  const { data, isLoading, isError } = useDestinationWeather(latitude, longitude);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  // Fallback: no coords or error — show static climate
  if (!hasCoords || isError) {
    if (!climateText) return null;
    return (
      <div className="card-organic p-6">
        <div className="flex items-center gap-3 mb-3">
          <Sun className="h-5 w-5 text-primary" />
          <h4 className="font-medium">Climate</h4>
        </div>
        <p className="text-sm text-muted-foreground">{climateText}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-organic p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!data) return null;

  const Icon = iconMap[data.icon] || Cloud;
  const anim = animationMap[data.icon] || '';

  return (
    <div className="card-organic p-6">
      <div className="flex items-center gap-3 mb-3">
        <Sun className="h-5 w-5 text-primary" />
        <h4 className="font-medium">Current Weather</h4>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <Icon className={`h-10 w-10 text-primary ${anim}`} />
        <span className="text-3xl font-serif font-medium">{Math.round(data.temperature)}°C</span>
      </div>

      <p className="text-sm text-muted-foreground">{data.label}</p>
      {data.windspeed > 0 && (
        <p className="text-xs text-muted-foreground/70 mt-1">Wind: {data.windspeed} km/h</p>
      )}

      {climateText && (
        <p className="text-xs text-muted-foreground/60 mt-3 pt-3 border-t border-border">
          {climateText}
        </p>
      )}
    </div>
  );
}
