/**
 * Providers API Endpoints
 * GET /api/providers - List all exchange providers
 */

import { apiClient } from '../client';
import type { Provider, ProviderQuery } from '../../types/provider';

export const providersApi = {
  /**
   * Get all providers
   * Corresponds to backend: GET /swap/providers
   * Trocador equivalent: GET /exchanges
   */
  async getAll(query?: ProviderQuery): Promise<Provider[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Provider[]>('/swap/providers', query)
    );
  },

  /**
   * Get providers by rating
   * Corresponds to backend: GET /swap/providers?rating=A
   */
  async getByRating(rating: string): Promise<Provider[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Provider[]>('/swap/providers', { rating })
    );
  },
};
