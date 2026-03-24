/**
 * Swap Service
 * Handles swap orchestration, status caching, and history caching
 */

import { swapApi } from '../../api/endpoints/swap';
import { CACHE_CONFIG } from '../../config/cache';
import { swapCache } from '../cache/memoryCache';
import { logger } from '../../utils/logger';
import type {
  CreateSwapRequest,
  CreateSwapResponse,
  HistoryQuery,
  HistoryResponse,
  SwapStatusResponse,
} from '../../types/swap';

const HISTORY_CACHE_TTL_SECONDS = CACHE_CONFIG.ttl.estimate;

const buildHistoryCacheKey = (query: HistoryQuery = {}): string => {
  const serialized = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');

  return `${CACHE_CONFIG.prefix.swap}history:${serialized || 'default'}`;
};

const buildStatusCacheKey = (swapId: string): string => {
  return `${CACHE_CONFIG.prefix.swap}status:${swapId}`;
};

const getSwapStatus = async (
  swapId: string,
  forceRefresh: boolean = false,
): Promise<SwapStatusResponse> => {
  const cacheKey = buildStatusCacheKey(swapId);

  if (!forceRefresh) {
    const cached = swapCache.get<SwapStatusResponse>(cacheKey);
    if (cached) {
      logger.debug('Swap status loaded from cache', swapId);
      return cached;
    }
  }

  const response = await swapApi.getStatus(swapId);
  swapCache.set(cacheKey, response, CACHE_CONFIG.ttl.swapStatus);
  return response;
};

const getSwapHistory = async (
  query: HistoryQuery = {},
  forceRefresh: boolean = false,
): Promise<HistoryResponse> => {
  const cacheKey = buildHistoryCacheKey(query);

  if (!forceRefresh) {
    const cached = swapCache.get<HistoryResponse>(cacheKey);
    if (cached) {
      logger.debug('Swap history loaded from cache', cacheKey);
      return cached;
    }
  }

  const response = await swapApi.getHistory(query);
  swapCache.set(cacheKey, response, HISTORY_CACHE_TTL_SECONDS);
  return response;
};

export const swapService = {
  createSwap(request: CreateSwapRequest): Promise<CreateSwapResponse> {
    return swapApi.create(request);
  },

  createSandboxSwap(request: CreateSwapRequest): Promise<CreateSwapResponse> {
    return swapApi.createSandbox(request);
  },

  createPaymentSwap(request: CreateSwapRequest): Promise<CreateSwapResponse> {
    return swapApi.createPayment(request);
  },

  getSwapStatus,
  getSwapHistory,

  async trackSwapStatus(
    swapId: string,
    onUpdate: (status: SwapStatusResponse) => void,
    intervalMs: number = CACHE_CONFIG.ttl.swapStatus * 1000,
  ): Promise<() => void> {
    const tick = async () => {
      const status = await getSwapStatus(swapId, true);
      onUpdate(status);
      return status;
    };

    await tick();

    const timer = setInterval(() => {
      void tick().catch(error => {
        logger.error('Swap polling failed', error);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  },

  clearStatusCache(swapId?: string): void {
    if (!swapId) {
      swapCache.clear();
      return;
    }

    swapCache.delete(buildStatusCacheKey(swapId));
  },

  clearHistoryCache(query?: HistoryQuery): void {
    if (!query) {
      swapCache.clear();
      return;
    }

    swapCache.delete(buildHistoryCacheKey(query));
  },
};
