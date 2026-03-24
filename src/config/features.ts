/**
 * Feature Flags Configuration
 * Enable/disable features based on environment
 */

export const FEATURES = {
  // WebSocket support
  websocket: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
  
  // Offline mode (IndexedDB caching)
  offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  
  // Debug logging
  debugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  
  // Rate limiting on frontend
  rateLimiting: true,
  maxRequestsPerMinute: Number(import.meta.env.VITE_MAX_REQUESTS_PER_MINUTE) || 60,
  
  // Debounce settings (milliseconds)
  debounce: {
    input: Number(import.meta.env.VITE_INPUT_DEBOUNCE) || 300,
    rateFetch: Number(import.meta.env.VITE_RATE_FETCH_DEBOUNCE) || 150,
  },
} as const;

export default FEATURES;
