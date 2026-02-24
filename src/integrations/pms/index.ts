// PMS Integration Entry Point
// Supports multiple PMS providers. Use getPMSAdapter(providerId) to get the correct adapter.

import { PMSAdapter } from './types';
import { MockPMSAdapter } from './mock-adapter';
import { AdvanceCMAdapter } from './advancecm-adapter';

export * from './types';
export { AdvanceCMAdapter } from './advancecm-adapter';

/**
 * Factory function to get the appropriate PMS adapter for a given provider.
 * Currently only AdvanceCM has a real adapter; others fall back to mock.
 */
export function getPMSAdapter(providerId?: string): PMSAdapter {
  switch (providerId) {
    case 'advancecm':
      return new AdvanceCMAdapter();
    // Future: case 'guesty': return new GuestyAdapter();
    // Future: case 'hostaway': return new HostawayAdapter();
    default:
      if (providerId) {
        console.warn(`No adapter implemented for provider "${providerId}", using mock`);
      }
      return new MockPMSAdapter();
  }
}

// Default adapter for backward compatibility (AdvanceCM)
export const pmsAdapter = new AdvanceCMAdapter();
