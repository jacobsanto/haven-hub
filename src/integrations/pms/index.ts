// PMS Integration Entry Point
// Currently uses MockPMSAdapter, will switch to TokeetAdvanceCMAdapter when credentials are configured

import { PMSAdapter } from './types';
import { MockPMSAdapter } from './mock-adapter';

export * from './types';

// Factory function to get the appropriate PMS adapter
// In production, this would check for Tokeet credentials and return the real adapter
export function getPMSAdapter(): PMSAdapter {
  // TODO: Check for Tokeet credentials in environment
  // const tokeetApiKey = process.env.TOKEET_API_KEY;
  // if (tokeetApiKey) {
  //   return new TokeetAdvanceCMAdapter(tokeetApiKey);
  // }
  
  // Fall back to mock adapter for development
  return new MockPMSAdapter();
}

// Export a default adapter instance
export const pmsAdapter = getPMSAdapter();
