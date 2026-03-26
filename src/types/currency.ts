/**
 * Currency Types
 * Based on Trocador API /coins endpoint
 */

export interface Currency {
  name: string;           // Name of the coin (e.g., "Bitcoin")
  ticker: string;         // Ticker symbol (e.g., "BTC")
  network: string;        // Network name (e.g., "Mainnet")
  memo: boolean;          // Whether coin uses memo/ExtraID
  extra_id_name?: string; // Human label for memo-like fields (e.g., "Memo", "Destination Tag")
  image: string;          // Icon URL
  minimum: number;        // Minimum tradeable amount
  maximum: number;        // Maximum tradeable amount
}

export interface CurrencyListResponse {
  currencies: Currency[];
  total: number;
  cached: boolean;
}

export interface CurrencyQuery {
  ticker?: string;
  name?: string;
  search?: string;
  page?: number;
  limit?: number;
}
