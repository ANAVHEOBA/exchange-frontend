/**
 * Cache Configuration
 * TTL settings for different data types
 */

export const CACHE_CONFIG = {
  // TTL in seconds
  ttl: {
    rates: Number(import.meta.env.VITE_RATE_CACHE_TTL) || 30,
    estimate: 30, // 30 seconds (same as rates)
    currencies: Number(import.meta.env.VITE_CURRENCY_CACHE_TTL) || 300,
    providers: 300, // 5 minutes (providers rarely change)
    pairs: 300, // 5 minutes (pairs rarely change)
    balance: Number(import.meta.env.VITE_BALANCE_CACHE_TTL) || 15,
    chains: 3600, // 1 hour (rarely changes)
    swapStatus: 5, // 5 seconds (active swaps)
  },
  
  // Cache keys prefix
  prefix: {
    rate: 'rate:',
    currency: 'currency:',
    provider: 'provider:',
    pair: 'pair:',
    balance: 'balance:',
    chain: 'chain:',
    swap: 'swap:',
  },
  
  // Max cache size (number of entries)
  maxSize: {
    rates: 1000,
    estimate: 500, // Cache common estimates
    currencies: 1,
    providers: 1,
    pairs: 100, // Cache multiple pages
    balances: 100,
    chains: 1,
    swaps: 50,
  },
} as const;

export default CACHE_CONFIG;
