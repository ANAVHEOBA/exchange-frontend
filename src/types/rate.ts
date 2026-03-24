/**
 * Rate Types
 * Based on backend /swap/rates endpoint and Trocador new_rate API
 */

export type RateType = 'fixed' | 'floating';

export interface Rate {
  provider: string;                 // Provider ID
  provider_name: string;            // Provider display name
  rate: number;                     // Effective exchange rate
  amount_to: number;                // Raw provider quote before deductions
  estimated_amount: number;         // Estimated amount to receive
  min_amount: number;               // Minimum swap amount
  max_amount: number;               // Maximum swap amount
  network_fee: number;              // Network/blockchain fee
  provider_fee: number;             // Provider fee
  platform_fee: number;             // Platform fee
  total_fee: number;                // Total fees combined
  spread_percentage?: number;       // Relative spread vs best route
  rate_type: RateType;              // 'fixed' or 'floating'
  fixed: boolean;                   // Trocador-style fixed flag
  kyc_required: boolean;            // Whether KYC is required
  kyc_rating?: string;              // KYC rating: A, B, C, or D
  privacy_rating?: string;          // Privacy-friendly alias of kyc_rating
  logpolicy?: string;               // Provider logging policy
  insurance?: number;               // Insurance coverage percentage
  provider_logo?: string;           // Provider logo URL
  rate_id?: string;                 // Provider rate identifier
  amount_from_usd?: number;         // Send amount in USD
  amount_to_usd?: number;           // Raw quoted receive amount in USD
  estimated_amount_usd?: number;    // Estimated receive amount in USD
  unadjusted_amount_to?: number;    // Raw amount before our adjustments
  usd_total_cost_percentage?: number; // Total route cost in USD percentage terms
  eta_minutes?: number;             // Estimated time in minutes
}

export interface RatesResponse {
  trade_id: string;                 // Trocador trade ID for this quote
  from: string;                     // Source currency ticker
  network_from: string;             // Source currency network
  to: string;                       // Destination currency ticker
  network_to: string;               // Destination currency network
  amount: number;                   // Amount to swap
  amount_to?: number;               // Best raw quoted receive amount
  best_provider?: string;           // Best provider from this result set
  best_rate_type?: RateType;        // Best route type
  status?: string;                  // Upstream quote status
  payment?: boolean;                // Payment-mode flag
  markup?: boolean;                 // Whether markup was applied
  best_only?: boolean;              // Whether upstream limited results to best
  min_deposit?: number;             // Global minimum deposit for the pair
  max_deposit?: number;             // Global maximum deposit for the pair
  kyc_list?: string[];              // Upstream KYC list
  logpolicy_list?: string[];        // Upstream log policy list
  rates: Rate[];                    // List of rates from different providers
}

export interface RatesQuery {
  from: string;                     // Source currency ticker
  network_from: string;             // Source currency network
  to: string;                       // Destination currency ticker
  network_to: string;               // Destination currency network
  amount: number;                   // Amount to swap
  rate_type?: RateType;             // Preferred rate type
  provider?: string;                // Filter by specific provider
  min_kycrating?: string;           // Minimum KYC/privacy rating filter
}
