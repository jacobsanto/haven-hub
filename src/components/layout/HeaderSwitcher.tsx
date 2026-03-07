import { lazy, Suspense } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { Header } from './Header';

const HeaderFloatingGlass = lazy(() => import('./headers/HeaderFloatingGlass').then(m => ({ default: m.HeaderFloatingGlass })));
const HeaderSplitCenter = lazy(() => import('./headers/HeaderSplitCenter').then(m => ({ default: m.HeaderSplitCenter })));
const HeaderMegaMenu = lazy(() => import('./headers/HeaderMegaMenu').then(m => ({ default: m.HeaderMegaMenu })));
const HeaderTickerBar = lazy(() => import('./headers/HeaderTickerBar').then(m => ({ default: m.HeaderTickerBar })));
const HeaderCommandPalette = lazy(() => import('./headers/HeaderCommandPalette').then(m => ({ default: m.HeaderCommandPalette })));
const HeaderDockNav = lazy(() => import('./headers/HeaderDockNav').then(m => ({ default: m.HeaderDockNav })));
const HeaderFullOverlay = lazy(() => import('./headers/HeaderFullOverlay').then(m => ({ default: m.HeaderFullOverlay })));
const HeaderContextStrip = lazy(() => import('./headers/HeaderContextStrip').then(m => ({ default: m.HeaderContextStrip })));

const HEADER_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'floating-glass': HeaderFloatingGlass,
  'split-center': HeaderSplitCenter,
  'mega-menu': HeaderMegaMenu,
  'ticker-bar': HeaderTickerBar,
  'command-palette': HeaderCommandPalette,
  'dock-nav': HeaderDockNav,
  'full-overlay': HeaderFullOverlay,
  'contextual-strip': HeaderContextStrip,
};

export function HeaderSwitcher() {
  const { headerStyle } = useBrand();

  if (!headerStyle || headerStyle === 'default') {
    return <Header />;
  }

  const LazyHeader = HEADER_MAP[headerStyle];
  if (!LazyHeader) {
    return <Header />;
  }

  return (
    <Suspense fallback={<Header />}>
      <LazyHeader />
    </Suspense>
  );
}
