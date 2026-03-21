/**
 * Address Validation Types
 * POST /swap/validate-address - Validate cryptocurrency address
 */

export interface ValidateAddressRequest {
  address: string;    // Address to validate
  ticker: string;     // Currency ticker (e.g., 'btc', 'eth')
  network: string;    // Network name (e.g., 'Mainnet', 'TRC20')
}

export interface ValidateAddressResponse {
  valid: boolean;     // Whether the address is valid
  ticker: string;     // Currency ticker
  network: string;    // Network name
  address: string;    // The validated address
}
