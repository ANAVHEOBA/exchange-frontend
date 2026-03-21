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

/**
 * Create a new swap transaction
 * This initiates a swap with the selected provider
 */
export async function createSwap(request: CreateSwapRequest): Promise<CreateSwapResponse> {
  const url = API_CONFIG.endpoints.swapCreate;
  return apiClient.post<CreateSwapResponse>(url, request);
}

/**
 * Get swap status by ID
 * Returns current status and details of an existing swap
 */
export async function getSwapStatus(swapId: string): Promise<SwapStatusResponse> {
  const url = `${API_CONFIG.endpoints.swapStatus}/${swapId}`;
  return apiClient.get<SwapStatusResponse>(url);
}

/**
 * Get swap history with keyset pagination
 * Returns list of user's swaps with filtering and sorting
 */
export async function getSwapHistory(query?: HistoryQuery): Promise<HistoryResponse> {
  const params = new URLSearchParams();
  
  if (query) {
    if (query.cursor) params.append('cursor', query.cursor);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.status) params.append('status', query.status);
    if (query.from_currency) params.append('from_currency', query.from_currency);
    if (query.to_currency) params.append('to_currency', query.to_currency);
    if (query.provider) params.append('provider', query.provider);
    if (query.date_from) params.append('date_from', query.date_from);
    if (query.date_to) params.append('date_to', query.date_to);
    if (query.sort_by) params.append('sort_by', query.sort_by);
    if (query.sort_order) params.append('sort_order', query.sort_order);
  }
  
  const url = `${API_CONFIG.endpoints.swapHistory}${params.toString() ? `?${params.toString()}` : ''}`;
  return apiClient.get<HistoryResponse>(url);
}
