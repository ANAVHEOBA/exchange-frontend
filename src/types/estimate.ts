/**
 * Estimate Types
 * Based on backend /swap/estimate endpoint
 * Quick rate preview without creating a swap
 */

import type { RateType } from './rate';

export interface EstimateQuery {
  from: string;                    // Source currency ticker
  to: string;                      // Destination currency ticker
  amount: number;                  // Amount to swap
  network_from: string;            // Source network
  network_to: string;              // Destination network
}

export interface EstimateResponse {
  // Request echo
  from: string;
  to: string;
  amount: number;
  network_from: string;
  network_to: string;

  // Best rate summary
  best_rate: number;
  estimated_receive: number;
  estimated_receive_min: number;
  estimated_receive_max: number;

  // Fee breakdown
  network_fee: number;
  provider_fee: number;
  platform_fee: number;
  total_fee: number;

  // Slippage info
  slippage_percentage: number;
  price_impact: number;

  // Provider info
  best_provider: string;
  provider_count: number;
  trade_id?: string;
  rate_type?: RateType;
  fixed?: boolean;
  kyc_required?: boolean;
  kyc_rating?: string;
  privacy_rating?: string;
  logpolicy?: string;
  insurance?: number;
  provider_logo?: string;
  rate_id?: string;
  spread_percentage?: number;
  amount_from_usd?: number;
  amount_to?: number;
  amount_to_usd?: number;
  estimated_receive_usd?: number;
  unadjusted_amount_to?: number;
  usd_total_cost_percentage?: number;

  // Metadata
  cached: boolean;
  cache_age_seconds: number;
  expires_in_seconds: number;

  // Warning flags
  warnings: string[];
}
