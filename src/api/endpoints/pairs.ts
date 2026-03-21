/**
 * Pairs API Endpoint
 * GET /swap/pairs - Get available trading pairs with pagination
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { PairsResponse, PairsQuery } from '../../types/pair';

/**
 * Fetch available trading pairs with optional filtering and pagination
 */
export async function getPairs(query?: PairsQuery): Promise<PairsResponse> {
  const params = new URLSearchParams();
  
  if (query) {
    if (query.base_currency) params.append('base_currency', query.base_currency);
    if (query.quote_currency) params.append('quote_currency', query.quote_currency);
    if (query.base_network) params.append('base_network', query.base_network);
    if (query.quote_network) params.append('quote_network', query.quote_network);
    if (query.status) params.append('status', query.status);
    if (query.page !== undefined) params.append('page', query.page.toString());
    if (query.size !== undefined) params.append('size', query.size.toString());
    if (query.order_by) params.append('order_by', query.order_by);
    if (query.filter) params.append('filter', query.filter);
  }
  
  const url = `${API_CONFIG.endpoints.pairs}${params.toString() ? `?${params.toString()}` : ''}`;
  return apiClient.get<PairsResponse>(url);
}
