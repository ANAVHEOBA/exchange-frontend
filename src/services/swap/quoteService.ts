/**
 * Quote Service
 * Handles rate and estimate fetching with shared caching
 */

import { estimateApi } from '../../api/endpoints/estimate';
import { ratesApi } from '../../api/endpoints/rates';
import { CACHE_CONFIG } from '../../config/cache';
import { estimateCache, rateCache } from '../cache/memoryCache';
import { logger } from '../../utils/logger';
import type { EstimateQuery, EstimateResponse } from '../../types/estimate';
import type { Rate, RatesQuery, RatesResponse } from '../../types/rate';

export interface QuoteResult {
  rates: RatesResponse;
  estimate: EstimateResponse | null;
  bestRate: Rate | null;
  fetchedAt: number;
}

const serializeParams = (
  params: Record<string, string | number | undefined>,
): string => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');
};

const buildRatesCacheKey = (query: RatesQuery): string => {
  return `${CACHE_CONFIG.prefix.rate}${serializeParams(query)}`;
};

const toEstimateQuery = (query: RatesQuery): EstimateQuery => ({
  from: query.from,
  to: query.to,
  amount: query.amount,
  network_from: query.network_from,
  network_to: query.network_to,
});

const buildEstimateCacheKey = (query: EstimateQuery): string => {
  return `${CACHE_CONFIG.prefix.rate}estimate:${serializeParams(query)}`;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown error';
};

const getRates = async (
  query: RatesQuery,
  forceRefresh: boolean = false,
  signal?: AbortSignal,
): Promise<RatesResponse> => {
  const cacheKey = buildRatesCacheKey(query);

  if (!forceRefresh) {
    const cached = rateCache.get<RatesResponse>(cacheKey);
    if (cached) {
      logger.debug('Rates loaded from cache', cacheKey);
      return cached;
    }
  }

  const response = await ratesApi.getAll(query, signal);
  rateCache.set(cacheKey, response, CACHE_CONFIG.ttl.rates);
  return response;
};

const getEstimate = async (
  query: EstimateQuery,
  forceRefresh: boolean = false,
  signal?: AbortSignal,
): Promise<EstimateResponse> => {
  const cacheKey = buildEstimateCacheKey(query);

  if (!forceRefresh) {
    const cached = estimateCache.get<EstimateResponse>(cacheKey);
    if (cached) {
      logger.debug('Estimate loaded from cache', cacheKey);
      return cached;
    }
  }

  const response = await estimateApi.get(query, signal);
  estimateCache.set(cacheKey, response, CACHE_CONFIG.ttl.estimate);
  return response;
};

const clearRates = (query?: RatesQuery): void => {
  if (!query) {
    rateCache.clear();
    return;
  }

  rateCache.delete(buildRatesCacheKey(query));
};

const clearEstimate = (query?: EstimateQuery | RatesQuery): void => {
  if (!query) {
    estimateCache.clear();
    return;
  }

  const estimateQuery = 'provider' in query || 'rate_type' in query
    ? toEstimateQuery(query)
    : query;

  estimateCache.delete(buildEstimateCacheKey(estimateQuery));
};

export const quoteService = {
  getRates,
  getEstimate,

  async getQuote(
    query: RatesQuery,
    forceRefresh: boolean = false,
    signals?: {
      rates?: AbortSignal;
      estimate?: AbortSignal;
    },
  ): Promise<QuoteResult> {
    const estimateQuery = toEstimateQuery(query);

    const [rates, estimate] = await Promise.all([
      getRates(query, forceRefresh, signals?.rates),
      getEstimate(estimateQuery, forceRefresh, signals?.estimate).catch(error => {
        logger.warn(`Estimate request failed: ${getErrorMessage(error)}`);
        return null;
      }),
    ]);

    return {
      rates,
      estimate,
      bestRate: rates.rates[0] ?? null,
      fetchedAt: Date.now(),
    };
  },

  clearRates,
  clearEstimate,

  clearQuoteCache(query?: RatesQuery): void {
    clearRates(query);
    clearEstimate(query);
  },
};
