/**
 * API Client
 * Base HTTP client with retry logic, error handling, and performance metrics
 */

import { API_CONFIG } from '../config/api';
import type { ApiError } from '../types/api';

const ACCESS_TOKEN_STORAGE_KEY = 'exchange.access_token';
const TOKEN_TYPE_STORAGE_KEY = 'exchange.token_type';

export interface StoredAuthToken {
  accessToken: string;
  tokenType: string;
}

interface RequestOptions {
  signal?: AbortSignal;
}

export interface RequestMetrics {
  endpoint: string;
  method: string;
  duration: number;      // milliseconds
  status: number;
  timestamp: number;
  cached?: boolean;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;
  private metrics: RequestMetrics[] = [];
  private enableMetrics: boolean;
  private authToken: StoredAuthToken | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.headers = API_CONFIG.headers;
    this.enableMetrics = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
  }

  private logMetrics(metrics: RequestMetrics): void {
    if (!this.enableMetrics) return;

    this.metrics.push(metrics);
    
    // Keep only last 100 requests
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Log to console in development
    const color = metrics.duration < 100 ? '\x1b[32m' : metrics.duration < 500 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(
      `${color}[API]${reset} ${metrics.method} ${metrics.endpoint} - ${metrics.duration}ms (${metrics.status})`
    );
  }

  public getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  public getAverageResponseTime(endpoint?: string): number {
    const filtered = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / filtered.length);
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public setAuthToken(accessToken: string, tokenType: string = 'Bearer'): void {
    this.persistAuthToken({ accessToken, tokenType });
  }

  public getAuthToken(): StoredAuthToken | null {
    return this.readPersistedAuthToken();
  }

  public clearAuthToken(): void {
    this.persistAuthToken(null);
  }

  private readPersistedAuthToken(): StoredAuthToken | null {
    if (this.authToken) {
      return this.authToken;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const accessToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      if (!accessToken) {
        return null;
      }

      const tokenType = window.localStorage.getItem(TOKEN_TYPE_STORAGE_KEY) || 'Bearer';
      this.authToken = { accessToken, tokenType };
      return this.authToken;
    } catch {
      return null;
    }
  }

  private persistAuthToken(token: StoredAuthToken | null): void {
    this.authToken = token;

    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (!token) {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(TOKEN_TYPE_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token.accessToken);
      window.localStorage.setItem(TOKEN_TYPE_STORAGE_KEY, token.tokenType);
    } catch {
      // Ignore storage errors so API access still works in restricted environments.
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers = { ...this.headers };
    const authToken = this.readPersistedAuthToken();

    if (authToken?.accessToken) {
      headers.Authorization = `${authToken.tokenType} ${authToken.accessToken}`;
    }

    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    requestOptions?: RequestOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeout);
    const externalSignal = requestOptions?.signal;

    const abortFromExternalSignal = () => {
      controller.abort();
    };

    try {
      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort();
        } else {
          externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true });
        }
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortFromExternalSignal);
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortFromExternalSignal);
      }

      if (error instanceof Error && error.name === 'AbortError') {
        if (timedOut) {
          throw {
            message: 'Request timeout',
            code: 'TIMEOUT',
          } as ApiError;
        }

        throw {
          message: 'Request aborted',
          code: 'ABORTED',
        } as ApiError;
      }

      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.code = errorData.code;
      } catch {
        // Response is not JSON, use default error
      }

      throw error;
    }

    return response.json();
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      throw {
        message: error.message,
        code: 'NETWORK_ERROR',
      } as ApiError;
    }
    throw error;
  }

  async get<T>(endpoint: string, params?: Record<string, any>, requestOptions?: RequestOptions): Promise<T> {
    const startTime = performance.now();
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: this.buildHeaders(),
      }, requestOptions);

      const duration = Math.round(performance.now() - startTime);
      this.logMetrics({
        endpoint,
        method: 'GET',
        duration,
        status: response.status,
        timestamp: Date.now(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const status = (error && typeof error === 'object' && 'status' in error) 
        ? (error as ApiError).status || 0 
        : 0;
      
      this.logMetrics({
        endpoint,
        method: 'GET',
        duration,
        status,
        timestamp: Date.now(),
      });

      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, body?: any, requestOptions?: RequestOptions): Promise<T> {
    const startTime = performance.now();
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      }, requestOptions);

      const duration = Math.round(performance.now() - startTime);
      this.logMetrics({
        endpoint,
        method: 'POST',
        duration,
        status: response.status,
        timestamp: Date.now(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const status = (error && typeof error === 'object' && 'status' in error) 
        ? (error as ApiError).status || 0 
        : 0;
      
      this.logMetrics({
        endpoint,
        method: 'POST',
        duration,
        status,
        timestamp: Date.now(),
      });

      return this.handleError(error);
    }
  }

  async withRetry<T>(
    fn: () => Promise<T>,
    attempts: number = API_CONFIG.retryAttempts
  ): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (error && typeof error === 'object' && 'code' in error) {
          const code = (error as ApiError).code;
          if (code === 'ABORTED') {
            throw error;
          }
        }
        
        // Don't retry on client errors (4xx)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as ApiError).status;
          if (status && status >= 400 && status < 500) {
            throw error;
          }
        }

        // Wait before retrying (exponential backoff)
        if (i < attempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, i))
          );
        }
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
