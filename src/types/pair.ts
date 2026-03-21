/**
 * Pair Types
 * Based on backend /swap/pairs endpoint
 */

export interface Pair {
  name: string;              // e.g., "BTC/USDT"
  base_currency: string;     // Base currency ticker
  quote_currency: string;    // Quote currency ticker
  base_network: string;      // Base currency network
  quote_network: string;     // Quote currency network
  status: string;            // "active", "disabled", etc.
  min_amount?: number;       // Minimum swap amount (optional)
  max_amount?: number;       // Maximum swap amount (optional)
  last_updated: string;      // ISO 8601 datetime
}

export interface PairsPaginationInfo {
  page: number;              // Current page (0-indexed)
  size: number;              // Items per page
  total_elements: number;    // Total number of pairs
  total_pages: number;       // Total number of pages
  has_next: boolean;         // Whether there's a next page
  has_prev: boolean;         // Whether there's a previous page
}

export interface PairsResponse {
  pairs: Pair[];
  pagination: PairsPaginationInfo;
}

export interface PairsQuery {
  // Filtering
  base_currency?: string;    // Filter by base currency
  quote_currency?: string;   // Filter by quote currency
  base_network?: string;     // Filter by base network
  quote_network?: string;    // Filter by quote network
  status?: string;           // Filter by status: "active", "disabled", "all"
  
  // Pagination
  page?: number;             // Page number (default: 0)
  size?: number;             // Items per page (default: 20)
  
  // Sorting
  order_by?: string;         // e.g., "volume_24h desc", "name asc"
  
  // Advanced filtering
  filter?: string;           // Advanced filter expression
}
