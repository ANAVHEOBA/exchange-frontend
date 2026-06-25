import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type {
  CreateGiftCardOrderRequest,
  GiftCardCatalogQuery,
  GiftCardCatalogResponse,
  GiftCardOrderResponse,
} from '../../types/giftcard';

const CATALOG_ENDPOINT = API_CONFIG.endpoints.giftcardsCatalog;
const ORDER_ENDPOINT = API_CONFIG.endpoints.giftcardsOrder;
const ORDER_STATUS_ENDPOINT = API_CONFIG.endpoints.giftcardsOrderStatus;

export const giftcardsApi = {
  async getCatalog(
    query?: GiftCardCatalogQuery,
    signal?: AbortSignal,
  ): Promise<GiftCardCatalogResponse> {
    return apiClient.withRetry(() =>
      apiClient.get<GiftCardCatalogResponse>(CATALOG_ENDPOINT, query, { signal }),
    );
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
