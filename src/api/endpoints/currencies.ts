/**
 * Currencies API Endpoints
 * GET /swap/currencies - List all supported currencies
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { Currency, CurrencyQuery } from '../../types/currency';

const CURRENCIES_ENDPOINT = API_CONFIG.endpoints.currencies;

export const currenciesApi = {
  /**
   * Get all currencies
   * Corresponds to backend: GET /swap/currencies
   * Trocador equivalent: GET /coins
   */
  async getAll(query?: CurrencyQuery): Promise<Currency[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Currency[]>(CURRENCIES_ENDPOINT, query)
    );
  },

  /**
   * Get single currency by ticker
   * Corresponds to backend: GET /swap/currencies?ticker=BTC
   * Trocador equivalent: GET /coin?ticker=btc
   */
  async getByTicker(ticker: string, network?: string): Promise<Currency[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Currency[]>(CURRENCIES_ENDPOINT, { ticker, network })
    );
  },

  /**
   * Search currencies
   * Corresponds to backend: GET /swap/currencies?search=bitcoin
   */
  async search(searchTerm: string): Promise<Currency[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Currency[]>(CURRENCIES_ENDPOINT, { search: searchTerm })
    );
  },
};
