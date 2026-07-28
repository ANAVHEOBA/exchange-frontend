/**
 * Pair Limits API Endpoint
 * GET /swap/pair-limits - Min/max deposit for a pair, independent of amount
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { PairLimitsQuery, PairLimitsResponse } from '../../types/rate';

export const pairLimitsApi = {
  /**
   * Fetch a pair's min/max deposit bounds so a "Minimum: X" hint can be shown
   * before the user has typed an amount, matching Trocador's own site.
   */
  get(query: PairLimitsQuery, signal?: AbortSignal): Promise<PairLimitsResponse> {
    return apiClient.withRetry(() =>
      apiClient.get<PairLimitsResponse>(API_CONFIG.endpoints.pairLimits, query, { signal })
    );
  },
};

export const getPairLimits = pairLimitsApi.get;
