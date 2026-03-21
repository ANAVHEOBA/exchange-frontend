/**
 * Estimate API Endpoint
 * GET /swap/estimate - Quick rate preview without creating swap
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { EstimateResponse, EstimateQuery } from '../../types/estimate';

/**
 * Get quick rate estimate for a currency pair
 * Faster than getRates, returns best rate only with cache metadata
 */
export async function getEstimate(query: EstimateQuery): Promise<EstimateResponse> {
  const params = new URLSearchParams();
  
  params.append('from', query.from);
  params.append('to', query.to);
  params.append('amount', query.amount.toString());
  params.append('network_from', query.network_from);
  params.append('network_to', query.network_to);
  
  const url = `${API_CONFIG.endpoints.estimate}?${params.toString()}`;
  return apiClient.get<EstimateResponse>(url);
}
