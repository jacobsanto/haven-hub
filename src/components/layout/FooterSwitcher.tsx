import { lazy, Suspense } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { Footer } from './Footer';

const FooterBento = lazy(() => import('./footers/FooterBento').then(m => ({ default: m.FooterBento })));
const FooterImmersive = lazy(() => import('./footers/FooterImmersive').then(m => ({ default: m.FooterImmersive })));
const FooterMinimal = lazy(() => import('./footers/FooterMinimal').then(m => ({ default: m.FooterMinimal })));
const FooterEditorial = lazy(() => import('./footers/FooterEditorial').then(m => ({ default: m.FooterEditorial })));
const FooterGlassmorphic = lazy(() => import('./footers/FooterGlassmorphic').then(m => ({ default: m.FooterGlassmorphic })));
const FooterBrutalist = lazy(() => import('./footers/FooterBrutalist').then(m => ({ default: m.FooterBrutalist })));
const FooterChatFirst = lazy(() => import('./footers/FooterChatFirst').then(m => ({ default: m.FooterChatFirst })));
const FooterKinetic = lazy(() => import('./footers/FooterKinetic').then(m => ({ default: m.FooterKinetic })));

const FOOTER_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'bento': FooterBento,
  'immersive': FooterImmersive,
  'minimal': FooterMinimal,
  'editorial': FooterEditorial,
  'glassmorphic': FooterGlassmorphic,
  'brutalist': FooterBrutalist,
  'chat-first': FooterChatFirst,
  'kinetic': FooterKinetic,
};

export function FooterSwitcher() {
  const { footerStyle } = useBrand();

  if (!footerStyle || footerStyle === 'default') {
    return <Footer />;
  }

  const LazyFooter = FOOTER_MAP[footerStyle];
  if (!LazyFooter) {
    return <Footer />;
  }

  return (
    <Suspense fallback={<Footer />}>
      <LazyFooter />
    </Suspense>
  );
}
