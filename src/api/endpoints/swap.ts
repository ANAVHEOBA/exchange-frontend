/**
 * Swap API Endpoints
 * POST /swap/create - Create a new swap
 * GET /swap/:id - Get swap status
 * GET /swap/history - Get swap history with pagination
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { 
  CreateSwapRequest, 
  CreateSwapResponse, 
  SwapStatusResponse,
  HistoryQuery,
  HistoryResponse 
} from '../../types/swap';

const createSwapRequest = async (
  request: CreateSwapRequest
): Promise<CreateSwapResponse> => {
  return apiClient.post<CreateSwapResponse>(API_CONFIG.endpoints.swapCreate, request);
};

const getSwapStatusRequest = async (
  swapId: string
): Promise<SwapStatusResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<SwapStatusResponse>(`${API_CONFIG.endpoints.swapStatus}/${swapId}`)
  );
};

const getSwapHistoryRequest = async (
  query?: HistoryQuery
): Promise<HistoryResponse> => {
  return apiClient.withRetry(() =>
    apiClient.get<HistoryResponse>(API_CONFIG.endpoints.swapHistory, query)
  );
};

export const swapApi = {
  /**
   * Create a new swap transaction
   * This initiates a swap with the selected provider
   */
  create: createSwapRequest,

  /**
   * Create a swap in sandbox mode
   */
  createSandbox(request: CreateSwapRequest): Promise<CreateSwapResponse> {
    return createSwapRequest({ ...request, sandbox: true });
  },

  /**
   * Create a payment-mode swap
   */
  createPayment(request: CreateSwapRequest): Promise<CreateSwapResponse> {
    return createSwapRequest({ ...request, payment: true });
  },

  /**
   * Get swap status by ID
   * Returns current status and details of an existing swap
   */
  getStatus: getSwapStatusRequest,

  /**
   * Get swap history with keyset pagination
   * Returns list of user's swaps with filtering and sorting
   */
  getHistory: getSwapHistoryRequest,

  /**
   * Filter swap history by status
   */
  getHistoryByStatus(
    status: string,
    query: Omit<HistoryQuery, 'status'> = {}
  ): Promise<HistoryResponse> {
    return getSwapHistoryRequest({ ...query, status });
  },

  /**
   * Filter swap history by provider
   */
  getHistoryByProvider(
    provider: string,
    query: Omit<HistoryQuery, 'provider'> = {}
  ): Promise<HistoryResponse> {
    return getSwapHistoryRequest({ ...query, provider });
  },
};

export const createSwap = swapApi.create;
export const getSwapStatus = swapApi.getStatus;
export const getSwapHistory = swapApi.getHistory;
