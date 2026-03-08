// PMS Integration Entry Point
// Supports multiple PMS providers. Use getPMSAdapter(providerId) to get the correct adapter.

import { PMSAdapter } from './types';
import { AdvanceCMAdapter } from './advancecm-adapter';

export * from './types';
export { AdvanceCMAdapter } from './advancecm-adapter';

/**
 * Factory function to get the appropriate PMS adapter for a given provider.
 * Currently only AdvanceCM has a real adapter.
 */
export function getPMSAdapter(providerId?: string): PMSAdapter {
  switch (providerId) {
    case 'advancecm':
      return new AdvanceCMAdapter();
    default:
      if (providerId) {
        console.warn(`No adapter implemented for provider "${providerId}", defaulting to AdvanceCM`);
      }
      return new AdvanceCMAdapter();
  }
}

// Default adapter (AdvanceCM)
export const pmsAdapter = new AdvanceCMAdapter();
