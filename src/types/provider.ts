/**
 * Provider Types
 * Based on backend /swap/providers endpoint
 */

export interface Provider {
  name: string;           // Provider name (e.g., "WizardSwap")
  rating: string;         // KYC rating: A, B, C, or D
  log_policy?: string;    // Log policy rating: A, B, or C (optional)
  insurance: number;      // Insurance percentage (e.g., 0.03 = 3%)
  markup_enabled: boolean;// Whether markup is enabled
  eta: number;            // Estimated time in minutes
}

export interface ProviderQuery {
  rating?: string;        // Filter by KYC rating (A, B, C, D)
  log_policy?: string;    // Filter by log policy rating (A, B, C)
  name?: string;          // Filter by name
}
