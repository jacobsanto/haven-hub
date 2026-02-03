// PMS Integration Entry Point
// Uses AdvanceCMAdapter when credentials are configured, falls back to MockPMSAdapter

import { PMSAdapter } from './types';
import { MockPMSAdapter } from './mock-adapter';
import { AdvanceCMAdapter } from './advancecm-adapter';

export * from './types';
export { AdvanceCMAdapter } from './advancecm-adapter';

// Factory function to get the appropriate PMS adapter
// Returns AdvanceCMAdapter when Tokeet credentials are available
export function getPMSAdapter(useReal: boolean = false): PMSAdapter {
  if (useReal) {
    return new AdvanceCMAdapter();
  }
  // Fall back to mock adapter for development/testing
  return new MockPMSAdapter();
}

// Export the real AdvanceCM adapter for production use
export const pmsAdapter = new AdvanceCMAdapter();
