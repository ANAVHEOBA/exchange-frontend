/**
 * Estimate API Endpoint
 * GET /swap/estimate - Quick rate preview without creating swap
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { EstimateResponse, EstimateQuery } from '../../types/estimate';

const getEstimateRequest = async (
  query: EstimateQuery,
  signal?: AbortSignal,
): Promise<EstimateResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<EstimateResponse>(API_CONFIG.endpoints.estimate, query, { signal })
  );
};

export const estimateApi = {
  /**
   * Get quick rate estimate for a currency pair
   * Faster than getRates, returns best rate only with cache metadata
   */
  get(query: EstimateQuery, signal?: AbortSignal): Promise<EstimateResponse> {
    return getEstimateRequest(query, signal);
  },

  /**
   * Convenience helper for direct pair lookups
   */
  getByPair(
    from: string,
    to: string,
    amount: number,
    network_from: string,
    network_to: string,
    signal?: AbortSignal,
  ): Promise<EstimateResponse> {
    return getEstimateRequest({ from, to, amount, network_from, network_to }, signal);
  },
};

export const getEstimate = estimateApi.get;
