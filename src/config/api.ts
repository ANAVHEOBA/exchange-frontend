/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  // Base URLs
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  
  // Timeouts
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Endpoints
  endpoints: {
    currencies: '/swap/currencies',
    providers: '/swap/providers',
    pairs: '/swap/pairs',
    rates: '/swap/rates',
    estimate: '/swap/estimate',
    swapCreate: '/swap/create',
    swapStatus: '/swap',
    swapHistory: '/swap/history',
  },
  
  // Request settings
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

export default API_CONFIG;
