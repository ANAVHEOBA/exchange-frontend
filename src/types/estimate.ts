/**
 * Estimate Types
 * Based on backend /swap/estimate endpoint
 * Quick rate preview without creating a swap
 */

export interface EstimateQuery {
  from: string;                  // Source currency ticker (1-20 chars)
  to: string;                    // Destination currency ticker (1-20 chars)
  amount: number;                // Amount to swap (0-1000000)
  network_from: string;          // Source network (1-50 chars)
  network_to: string;            // Destination network (1-50 chars)
}

export interface EstimateResponse {
  // Request echo
  from: string;
  to: string;
  amount: number;
  network_from: string;
  network_to: string;
  
  // Best rate summary
  best_rate: number;             // Exchange rate
  estimated_receive: number;     // Expected amount to receive
  estimated_receive_min: number; // Minimum after slippage
  estimated_receive_max: number; // Maximum (best case)
  
  // Fee breakdown
  network_fee: number;           // Blockchain network fee
  provider_fee: number;          // Exchange provider fee
  platform_fee: number;          // Platform fee
  total_fee: number;             // Total of all fees
  
  // Slippage info
  slippage_percentage: number;   // Expected slippage %
  price_impact: number;          // Price impact %
  
  // Provider info
  best_provider: string;         // Best provider name
  provider_count: number;        // Number of providers checked
  
  // Metadata
  cached: boolean;               // Whether result is from cache
  cache_age_seconds: number;     // Age of cached data
  expires_in_seconds: number;    // Time until cache expires
  
  // Warning flags
  warnings: string[];            // Any warnings about the estimate
}
