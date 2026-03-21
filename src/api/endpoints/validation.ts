/**
 * Validation API Endpoints
 * POST /swap/validate-address - Validate cryptocurrency address
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { ValidateAddressRequest, ValidateAddressResponse } from '../../types/validation';

/**
 * Validate a cryptocurrency address
 * Checks if an address is valid for the given currency and network
 */
export async function validateAddress(request: ValidateAddressRequest): Promise<ValidateAddressResponse> {
  const url = API_CONFIG.endpoints.validateAddress;
  return apiClient.post<ValidateAddressResponse>(url, request);
}
