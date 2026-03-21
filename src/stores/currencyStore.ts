/**
 * Currency Store
 * State management for currencies with caching
 */

import { createSignal, createResource } from 'solid-js';
import { currenciesApi } from '../api/endpoints/currencies';
import { currencyCache } from '../services/cache/memoryCache';
import { CACHE_CONFIG } from '../config/cache';
import { logger } from '../utils/logger';
import type { Currency } from '../types/currency';

// Cache key
const CACHE_KEY = CACHE_CONFIG.prefix.currency + 'all';

// Signals for state management
const [searchTerm, setSearchTerm] = createSignal<string>('');
const [selectedCurrency, setSelectedCurrency] = createSignal<Currency | null>(null);

// Resource for fetching currencies with caching
const [currencies] = createResource(async () => {
  logger.debug('Fetching currencies...');
  
  // Check cache first
  const cached = currencyCache.get<Currency[]>(CACHE_KEY);
  if (cached) {
    logger.debug('Currencies loaded from cache');
    return cached;
  }

  // Fetch from API
  const data = await currenciesApi.getAll();
  
  // Cache the result
  currencyCache.set(CACHE_KEY, data, CACHE_CONFIG.ttl.currencies);
  logger.debug(`Cached ${data.length} currencies`);
  
  return data;
});

// Computed: filtered currencies based on search
const filteredCurrencies = () => {
  const all = currencies();
  const search = searchTerm().toLowerCase().trim();
  
  if (!all || !search) return all || [];
  
  return all.filter(currency => 
    currency.name.toLowerCase().includes(search) ||
    currency.ticker.toLowerCase().includes(search) ||
    currency.network.toLowerCase().includes(search)
  );
};

// Actions
const searchCurrencies = (term: string) => {
  setSearchTerm(term);
};

const selectCurrency = (currency: Currency) => {
  setSelectedCurrency(currency);
  logger.debug('Selected currency:', currency.ticker);
};

const clearSelection = () => {
  setSelectedCurrency(null);
};

const refreshCurrencies = () => {
  currencyCache.delete(CACHE_KEY);
  currencies.refetch();
  logger.info('Currencies cache cleared and refetched');
};

// Export store
export const currencyStore = {
  // State
  currencies,
  filteredCurrencies,
  selectedCurrency,
  searchTerm,
  
  // Actions
  searchCurrencies,
  selectCurrency,
  clearSelection,
  refreshCurrencies,
};
