/**
 * Application Constants
 */

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Exchange',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Minimum swap amounts (will be fetched from backend)
  minSwapAmounts: {
    BTC: 0.00001,
    ETH: 0.001,
    // ... more will be loaded dynamically
  },
  
  // UI settings
  ui: {
    toastDuration: 5000, // milliseconds
    loadingDelay: 200, // show loading after 200ms
    animationDuration: 300,
  },
  
  // Pagination
  pagination: {
    currenciesPerPage: 50,
    transactionsPerPage: 20,
  },
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CURRENCY_FETCH_ERROR: 'Failed to load currencies. Please try again.',
} as const;

export default APP_CONFIG;
