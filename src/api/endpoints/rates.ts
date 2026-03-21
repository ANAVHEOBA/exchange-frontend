/**
 * Rates API Endpoint
 * GET /swap/rates - Get exchange rates from multiple providers
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { RatesResponse, RatesQuery } from '../../types/rate';

/**
 * Fetch exchange rates for a currency pair
 * Returns rates from multiple providers sorted by best rate
 */
export async function getRates(query: RatesQuery): Promise<RatesResponse> {
  const params = new URLSearchParams();
  
  params.append('from', query.from);
  params.append('network_from', query.network_from);
  params.append('to', query.to);
  params.append('network_to', query.network_to);
  params.append('amount', query.amount.toString());
  
  if (query.rate_type) {
    params.append('rate_type', query.rate_type);
  }
  
  if (query.provider) {
    params.append('provider', query.provider);
  }
  
  const url = `${API_CONFIG.endpoints.rates}?${params.toString()}`;
  return apiClient.get<RatesResponse>(url);
}
