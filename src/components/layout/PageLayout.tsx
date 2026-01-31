import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { ExitIntentModal } from '@/components/booking/ExitIntentModal';
import { FloatingBookButton } from '@/components/booking/FloatingBookButton';
import { PromotionalPopup } from '@/components/promotions/PromotionalPopup';
import { PromotionProvider, usePromotion } from '@/contexts/PromotionContext';
import { useExitIntent } from '@/hooks/useExitIntent';

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
  
  // Exit intent with settings from database
  const { showExitIntent, dismiss: dismissExitIntent, settings: exitIntentSettings, isEnabled: exitIntentEnabled } = useExitIntent();

  // Check if we should show exit intent OR promotional popup for exit trigger
  const shouldShowExitPromo = activePromotion && 
    (activePromotion.trigger_type === 'exit' || activePromotion.trigger_type === 'both') &&
    !hasBeenDismissed;

  // Handle exit intent - prefer promotional campaign if configured for exit
  const handleExitIntent = () => {
    if (shouldShowExitPromo) {
      triggerPromotion();
    }
  };

  // Use exit intent but redirect to promo if applicable
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
        className="flex-1 pt-16"
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
