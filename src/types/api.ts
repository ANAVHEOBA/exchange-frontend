/**
 * Generic API Types
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CacheMetadata {
  cached: boolean;
  cachedAt?: number;
  expiresAt?: number;
}
