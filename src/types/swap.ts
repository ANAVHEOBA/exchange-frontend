/**
 * Swap Types
 * Based on backend /swap/create endpoint and Trocador new_trade API
 */

import type { RateType } from './rate';

export type SwapStatus = 
  | 'waiting'      // Waiting for deposit
  | 'confirming'   // Deposit detected, confirming
  | 'exchanging'   // Exchange in progress
  | 'sending'      // Sending to recipient
  | 'completed'    // Swap completed
  | 'failed'       // Swap failed
  | 'refunded'     // Funds refunded
  | 'expired';     // Swap expired

export interface CreateSwapRequest {
  trade_id?: string;           // ID from new_rate/rates endpoint (optional)
  from: string;                // Source currency ticker (mandatory)
  network_from: string;        // Source network (mandatory)
  to: string;                  // Destination currency ticker (mandatory)
  network_to: string;          // Destination network (mandatory)
  amount: number;              // Amount to swap (mandatory)
  provider: string;            // Exchange provider (mandatory)
  recipient_address: string;   // Address to receive coins (mandatory)
  recipient_extra_id?: string; // Memo/ExtraID for recipient (optional, '0' for none)
  refund_address?: string;     // Refund address if problem occurs (optional)
  refund_extra_id?: string;    // Memo/ExtraID for refund (optional, '0' for none)
  rate_type?: RateType;        // 'fixed' or 'floating' (default: floating)
  sandbox?: boolean;           // Test mode (default: false)
  payment?: boolean;           // True for payment, False for standard swap (default: false)
  min_kycrating?: string;      // Minimum KYC rating: A, B, C, or D (optional)
}

export interface CreateSwapResponse {
  swap_id: string;             // Internal swap ID
  provider: string;            // Exchange provider name
  from: string;                // Source currency ticker
  from_name: string;           // Source currency full name
  to: string;                  // Destination currency ticker
  to_name: string;             // Destination currency full name
  network_from: string;        // Source network
  network_to: string;          // Destination network
  deposit_address: string;     // Address to send coins to
  deposit_extra_id?: string;   // Memo/ExtraID for deposit (if required)
  deposit_amount: number;      // Amount to deposit
  recipient_address: string;   // Address that will receive coins
  estimated_receive: number;   // Estimated amount to receive
  rate: number;                // Exchange rate
  status: SwapStatus;          // Current swap status
  rate_type: RateType;         // Rate type used
  is_sandbox: boolean;         // Whether this is a test swap
  is_payment: boolean;         // Whether this is a payment swap
  expires_at: string;          // ISO 8601 expiration time
  created_at: string;          // ISO 8601 creation time
}

export interface SwapStatusResponse {
  swap_id: string;             // Internal swap ID
  provider: string;            // Exchange provider
  provider_swap_id?: string;   // Provider's swap ID
  status: SwapStatus;          // Current status
  from: string;                // Source currency
  to: string;                  // Destination currency
  amount: number;              // Swap amount
  deposit_address: string;     // Deposit address
  deposit_extra_id?: string;   // Deposit memo/ExtraID
  recipient_address: string;   // Recipient address
  recipient_extra_id?: string; // Recipient memo/ExtraID
  rate: number;                // Exchange rate
  estimated_receive: number;   // Estimated receive amount
  actual_receive?: number;     // Actual received amount (when completed)
  network_fee?: number;        // Network fee
  total_fee?: number;          // Total fees
  rate_type: RateType;         // Rate type (fixed/floating)
  is_sandbox: boolean;         // Whether this is a test swap
  tx_hash_in?: string;         // Incoming transaction hash
  tx_hash_out?: string;        // Outgoing transaction hash
  created_at: string;          // ISO 8601 creation time
  updated_at: string;          // ISO 8601 last update time
  expires_at?: string;         // ISO 8601 expiration time
}

// History types
export interface HistoryQuery {
  cursor?: string;             // Keyset pagination cursor
  limit?: number;              // Items per page (default: 20)
  status?: string;             // Filter by status
  from_currency?: string;      // Filter by source currency
  to_currency?: string;        // Filter by destination currency
  provider?: string;           // Filter by provider
  date_from?: string;          // Filter from date (ISO 8601)
  date_to?: string;            // Filter to date (ISO 8601)
  sort_by?: string;            // Sort field
  sort_order?: string;         // Sort order: 'asc' or 'desc'
}

export interface SwapSummary {
  id: string;                  // Swap ID
  status: SwapStatus;          // Current status
  from_currency: string;       // Source currency
  from_network: string;        // Source network
  to_currency: string;         // Destination currency
  to_network: string;          // Destination network
  amount: number;              // Swap amount
  estimated_receive: number;   // Estimated receive amount
  actual_receive?: number;     // Actual received (if completed)
  rate: number;                // Exchange rate
  platform_fee: number;        // Platform fee
  total_fee: number;           // Total fees
  deposit_address: string;     // Deposit address
  recipient_address: string;   // Recipient address
  provider: string;            // Provider name
  rate_type: RateType;         // Rate type
  is_sandbox: boolean;         // Test swap flag
  created_at: string;          // ISO 8601 creation time
  completed_at?: string;       // ISO 8601 completion time (if completed)
}

export interface PaginationInfo {
  limit: number;               // Items per page
  has_more: boolean;           // Whether there are more items
  next_cursor?: string;        // Cursor for next page
}

export interface FiltersApplied {
  status?: string;
  from_currency?: string;
  to_currency?: string;
  provider?: string;
  date_from?: string;
  date_to?: string;
}

export interface HistoryResponse {
  swaps: SwapSummary[];        // List of swap summaries
  pagination: PaginationInfo;  // Pagination info
  filters_applied: FiltersApplied; // Applied filters
}
