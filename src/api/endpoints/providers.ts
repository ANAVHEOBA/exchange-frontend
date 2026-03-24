/**
 * Providers API Endpoints
 * GET /swap/providers - List all exchange providers
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { Provider, ProviderQuery } from '../../types/provider';

const PROVIDERS_ENDPOINT = API_CONFIG.endpoints.providers;

export const providersApi = {
  /**
   * Get all providers
   * Corresponds to backend: GET /swap/providers
   * Trocador equivalent: GET /exchanges
   */
  async getAll(query?: ProviderQuery): Promise<Provider[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Provider[]>(PROVIDERS_ENDPOINT, query)
    );
  },

  /**
   * Get providers by rating
   * Corresponds to backend: GET /swap/providers?rating=A
   */
  async getByRating(rating: string): Promise<Provider[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Provider[]>(PROVIDERS_ENDPOINT, { rating })
    );
  },

  /**
   * Get providers by log policy rating
   * Corresponds to backend: GET /swap/providers?log_policy=A
   */
  async getByLogPolicy(log_policy: string): Promise<Provider[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Provider[]>(PROVIDERS_ENDPOINT, { log_policy })
    );
  },

  /**
   * Get providers by name
   * Corresponds to backend: GET /swap/providers?name=ChangeNOW
   */
  async getByName(name: string): Promise<Provider[]> {
    return apiClient.withRetry(() =>
      apiClient.get<Provider[]>(PROVIDERS_ENDPOINT, { name })
    );
  },
};
