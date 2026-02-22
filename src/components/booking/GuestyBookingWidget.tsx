import { useEffect, useRef, useState } from 'react';
import { useGuestySettings } from '@/hooks/useGuestySettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import './guesty-overrides.css';

interface GuestyBookingWidgetProps {
  propertyId?: string;
  variant?: 'inline' | 'compact';
  className?: string;
}

export function GuestyBookingWidget({ propertyId, variant = 'compact', className }: GuestyBookingWidgetProps) {
  const { data: globalSettings, isLoading: settingsLoading } = useGuestySettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // Fetch per-property override if propertyId is provided
  const { data: propertyOverride } = useQuery({
    queryKey: ['property-guesty-override', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const { data, error } = await (supabase as any)
        .from('properties')
        .select('guesty_widget_id')
        .eq('id', propertyId)
        .single();
      if (error) throw error;
      return data?.guesty_widget_id as string | null;
    },
    enabled: !!propertyId,
  });

  const widgetId = propertyOverride || globalSettings?.widget_id;
  const siteUrl = globalSettings?.site_url;
  const accentColor = globalSettings?.accent_color;
  const enabled = globalSettings?.enabled ?? false;

  useEffect(() => {
    if (!widgetId || !siteUrl || !enabled) return;

    const containerId = `search-widget_${widgetId}`;

    // Set the container ID
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    // Guesty widget loader IIFE
    const loadWidget = () => {
      try {
        const cssUrl = `https://s3.amazonaws.com/guesty-assets/search-bar/search-bar-production.css`;
        const jsUrl = `https://s3.amazonaws.com/guesty-assets/search-bar/search-bar-production.js`;

        const config: Record<string, string> = { siteUrl };
        if (accentColor) config.color = accentColor;

        // Inject CSS
        const existingCss = document.getElementById(`guesty-css-${widgetId}`);
        if (!existingCss) {
          const link = document.createElement('link');
          link.id = `guesty-css-${widgetId}`;
          link.rel = 'stylesheet';
          link.href = cssUrl;
          document.head.appendChild(link);
        }

        // Inject Script
        const existingScript = document.getElementById(`guesty-js-${widgetId}`);
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = `guesty-js-${widgetId}`;
          script.src = jsUrl;
          script.async = true;
          script.onload = () => {
            setScriptLoaded(true);
            // Initialize the widget if the global function exists
            const win = window as any;
            if (win.GuestySearchBarWidget) {
              win.GuestySearchBarWidget(containerId, config);
            }
          };
          script.onerror = () => setScriptError(true);
          document.body.appendChild(script);
        } else {
          // Script already loaded, try to reinitialize
          const win = window as any;
          if (win.GuestySearchBarWidget) {
            win.GuestySearchBarWidget(containerId, config);
          }
          setScriptLoaded(true);
        }
      } catch {
        setScriptError(true);
      }
    };

    loadWidget();

    // Cleanup on unmount
    return () => {
      const cssEl = document.getElementById(`guesty-css-${widgetId}`);
      const jsEl = document.getElementById(`guesty-js-${widgetId}`);
      cssEl?.remove();
      jsEl?.remove();
    };
  }, [widgetId, siteUrl, accentColor, enabled]);

  if (settingsLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!globalSettings || !enabled) {
    return null; // Not configured — fall back to native widget
  }

  if (scriptError) {
    return (
      <div className={cn(
        'rounded-xl border border-border/50 bg-card p-6 text-center space-y-2',
        className
      )}>
        <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          Booking widget temporarily unavailable. Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden',
      variant === 'compact' && 'max-w-md',
      className
    )}>
      <div
        ref={containerRef}
        className="min-h-[200px] relative"
      >
        {!scriptLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
