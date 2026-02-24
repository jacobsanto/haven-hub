import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { ExitIntentModal } from '@/components/booking/ExitIntentModal';
import { FloatingBookButton } from '@/components/booking/FloatingBookButton';
import { PromotionalPopup } from '@/components/promotions/PromotionalPopup';
import { PromotionProvider, usePromotion } from '@/contexts/PromotionContext';
import { useExitIntent } from '@/hooks/useExitIntent';
import { usePageTracking } from '@/hooks/usePageTracking';
interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function PageLayoutContent({ children, hideFooter = false }: PageLayoutProps) {
  const { activePromotion, triggerPromotion, hasBeenDismissed } = usePromotion();
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  
  // Track page views for analytics
  usePageTracking();
  
  // Exit intent with settings from database
  const { showExitIntent, dismiss: dismissExitIntent, settings: exitIntentSettings, isEnabled: exitIntentEnabled } = useExitIntent();
  const shouldShowExitPromo = activePromotion && 
    (activePromotion.trigger_type === 'exit' || activePromotion.trigger_type === 'both') &&
    !hasBeenDismissed;

  const handleExitIntent = () => {
    if (shouldShowExitPromo) {
      triggerPromotion();
    }
  };

  if (showExitIntent && shouldShowExitPromo) {
    handleExitIntent();
    dismissExitIntent();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <motion.main
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={isHomepage ? "flex-1" : "flex-1 pt-[72px]"}
      >
        {children}
      </motion.main>
      {!hideFooter && <Footer />}
      
      {/* Exit Intent Modal - only show if no promotional campaign for exit and exit intent is enabled */}
      {exitIntentEnabled && !shouldShowExitPromo && (
        <ExitIntentModal isOpen={showExitIntent} onClose={dismissExitIntent} settings={exitIntentSettings} />
      )}
      
      {/* Promotional Campaign Popup */}
      <PromotionalPopup />
      
      {/* Floating Book Button */}
      <FloatingBookButton />
    </div>
  );
}

export function PageLayout(props: PageLayoutProps) {
  return (
    <PromotionProvider>
      <PageLayoutContent {...props} />
    </PromotionProvider>
  );
}
