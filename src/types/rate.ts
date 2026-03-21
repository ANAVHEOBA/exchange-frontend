/**
 * Rate Types
 * Based on backend /swap/rates endpoint and Trocador new_rate API
 */

export type RateType = 'fixed' | 'floating';

export interface Rate {
  provider: string;              // Provider ID
  provider_name: string;         // Provider display name
  rate: number;                  // Exchange rate
  estimated_amount: number;      // Estimated amount to receive
  min_amount: number;            // Minimum swap amount
  max_amount: number;            // Maximum swap amount
  network_fee: number;           // Network/blockchain fee
  provider_fee: number;          // Provider's fee
  platform_fee: number;          // Platform fee
  total_fee: number;             // Total fees combined
  rate_type: RateType;           // 'fixed' or 'floating'
  kyc_required: boolean;         // Whether KYC is required
  kyc_rating?: string;           // KYC rating: A, B, C, or D (optional)
  eta_minutes?: number;          // Estimated time in minutes (optional)
}

export interface RatesResponse {
  trade_id: string;              // Trocador trade ID for this quote
  from: string;                  // Source currency ticker
  network_from: string;          // Source currency network
  to: string;                    // Destination currency ticker
  network_to: string;            // Destination currency network
  amount: number;                // Amount to swap
  rates: Rate[];                 // List of rates from different providers
}

export interface RatesQuery {
  from: string;                  // Source currency ticker (mandatory)
  network_from: string;          // Source currency network (mandatory)
  to: string;                    // Destination currency ticker (mandatory)
  network_to: string;            // Destination currency network (mandatory)
  amount: number;                // Amount to swap (mandatory)
  rate_type?: RateType;          // Preferred rate type (optional)
  provider?: string;             // Filter by specific provider (optional)
}
