/**
 * API Client
 * Base HTTP client with retry logic, error handling, and performance metrics
 */

import { API_CONFIG } from '../config/api';
import type { ApiError } from '../types/api';

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

  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
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
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT',
        } as ApiError;
      }
      throw {
        message: error.message,
        code: 'NETWORK_ERROR',
      } as ApiError;
    }
    throw error;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
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
        headers: this.headers,
      });

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

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const startTime = performance.now();
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
      });

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
