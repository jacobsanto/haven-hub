import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { ExitIntentModal } from '@/components/booking/ExitIntentModal';
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

export function PageLayout({ children, hideFooter = false }: PageLayoutProps) {
  const { showExitIntent, dismiss } = useExitIntent({ delay: 3000, cookieExpiry: 7 });

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
      
      {/* Exit Intent Modal */}
      <ExitIntentModal isOpen={showExitIntent} onClose={dismiss} />
    </div>
  );
}
