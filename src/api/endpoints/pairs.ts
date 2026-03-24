/**
 * Pairs API Endpoint
 * GET /swap/pairs - Get available trading pairs with pagination
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { PairsResponse, PairsQuery } from '../../types/pair';

const getPairsRequest = async (query?: PairsQuery): Promise<PairsResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<PairsResponse>(API_CONFIG.endpoints.pairs, query)
  );
};

export const pairsApi = {
  /**
   * Fetch available trading pairs with optional filtering and pagination
   */
  getAll: getPairsRequest,

  /**
   * Filter pairs by base currency
   */
  getByBaseCurrency(
    base_currency: string,
    query: Omit<PairsQuery, 'base_currency'> = {}
  ): Promise<PairsResponse> {
    return getPairsRequest({ ...query, base_currency });
  },

  /**
   * Filter pairs by quote currency
   */
  getByQuoteCurrency(
    quote_currency: string,
    query: Omit<PairsQuery, 'quote_currency'> = {}
  ): Promise<PairsResponse> {
    return getPairsRequest({ ...query, quote_currency });
  },

  /**
   * Filter pairs by status
   */
  getByStatus(
    status: string,
    query: Omit<PairsQuery, 'status'> = {}
  ): Promise<PairsResponse> {
    return getPairsRequest({ ...query, status });
  },
};

export const getPairs = pairsApi.getAll;
