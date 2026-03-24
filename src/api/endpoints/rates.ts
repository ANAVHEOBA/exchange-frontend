/**
 * Rates API Endpoint
 * GET /swap/rates - Get exchange rates from multiple providers
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { RatesResponse, RatesQuery } from '../../types/rate';

const getRatesRequest = async (
  query: RatesQuery,
  signal?: AbortSignal,
): Promise<RatesResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<RatesResponse>(API_CONFIG.endpoints.rates, query, { signal })
  );
};

export const ratesApi = {
  /**
   * Fetch exchange rates for a currency pair
   * Returns rates from multiple providers sorted by best rate
   */
  getAll(query: RatesQuery, signal?: AbortSignal): Promise<RatesResponse> {
    return getRatesRequest(query, signal);
  },

  /**
   * Fetch rates for a single provider
   */
  getByProvider(
    provider: string,
    query: Omit<RatesQuery, 'provider'>,
    signal?: AbortSignal,
  ): Promise<RatesResponse> {
    return getRatesRequest({ ...query, provider }, signal);
  },

  /**
   * Fetch rates for a single rate type
   */
  getByRateType(
    rate_type: NonNullable<RatesQuery['rate_type']>,
    query: Omit<RatesQuery, 'rate_type'>,
    signal?: AbortSignal,
  ): Promise<RatesResponse> {
    return getRatesRequest({ ...query, rate_type }, signal);
  },
};

export const getRates = ratesApi.getAll;
