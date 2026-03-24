/**
 * Validation API Endpoints
 * POST /swap/validate-address - Validate cryptocurrency address
 */

import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { ValidateAddressRequest, ValidateAddressResponse } from '../../types/validation';

const validateAddressRequest = async (
  request: ValidateAddressRequest
): Promise<ValidateAddressResponse> => {
  return apiClient.withRetry(() =>
    apiClient.post<ValidateAddressResponse>(API_CONFIG.endpoints.validateAddress, request)
  );
};

export const validationApi = {
  /**
   * Validate a cryptocurrency address
   * Checks if an address is valid for the given currency and network
   */
  validateAddress: validateAddressRequest,

  /**
   * Convenience helper for direct address validation calls
   */
  validateForCurrency(
    address: string,
    ticker: string,
    network: string
  ): Promise<ValidateAddressResponse> {
    return validateAddressRequest({ address, ticker, network });
  },
};

export const validateAddress = validationApi.validateAddress;
