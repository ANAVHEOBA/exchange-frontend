import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import { CACHE_CONFIG } from '../../config/cache';
import { giftcardCache } from '../../services/cache/memoryCache';
import type {
  CreateGiftCardOrderRequest,
  GiftCardCatalogQuery,
  GiftCardCatalogResponse,
  GiftCardOrderResponse,
} from '../../types/giftcard';

const CATALOG_ENDPOINT = API_CONFIG.endpoints.giftcardsCatalog;
const ORDER_ENDPOINT = API_CONFIG.endpoints.giftcardsOrder;
const ORDER_STATUS_ENDPOINT = API_CONFIG.endpoints.giftcardsOrderStatus;

const buildCatalogCacheKey = (query?: GiftCardCatalogQuery): string => {
  const country = query?.country?.trim().toUpperCase() || 'GLOBAL';
  return `${CACHE_CONFIG.prefix.giftcard}catalog:${country}`;
};

export const giftcardsApi = {
  async getCatalog(
    query?: GiftCardCatalogQuery,
    signal?: AbortSignal,
  ): Promise<GiftCardCatalogResponse> {
    const cacheKey = buildCatalogCacheKey(query);
    const cached = giftcardCache.get<GiftCardCatalogResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await apiClient.withRetry(() =>
      apiClient.get<GiftCardCatalogResponse>(CATALOG_ENDPOINT, query, { signal }),
    );
    giftcardCache.set(cacheKey, response, CACHE_CONFIG.ttl.giftcards);
    return response;
  },

  preloadCatalog(query?: GiftCardCatalogQuery): Promise<GiftCardCatalogResponse> {
    return this.getCatalog(query);
  },

  async createOrder(request: CreateGiftCardOrderRequest): Promise<GiftCardOrderResponse> {
    return apiClient.post<GiftCardOrderResponse>(ORDER_ENDPOINT, request);
  },

  async getOrderStatus(orderRef: string): Promise<GiftCardOrderResponse> {
    return apiClient.withRetry(() =>
      apiClient.get<GiftCardOrderResponse>(`${ORDER_STATUS_ENDPOINT}/${encodeURIComponent(orderRef)}`),
    );
  },
};
