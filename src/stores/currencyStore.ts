/**
 * Currency Store
 * State management for currencies with caching
 */

import { createSignal } from 'solid-js';
import { currenciesApi } from '../api/endpoints/currencies';
import { currencyCache } from '../services/cache/memoryCache';
import { CACHE_CONFIG } from '../config/cache';
import { logger } from '../utils/logger';
import type { Currency } from '../types/currency';

// Cache key
const CACHE_KEY = CACHE_CONFIG.prefix.currency + 'all';

// Signals for state management
const [currencies, setCurrencies] = createSignal<Currency[]>([]);
const [searchTerm, setSearchTerm] = createSignal<string>('');
const [selectedCurrency, setSelectedCurrency] = createSignal<Currency | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<unknown>(null);
const [initialized, setInitialized] = createSignal(false);

let currenciesRequest: Promise<Currency[]> | null = null;

const loadCurrencies = async (forceRefresh: boolean = false): Promise<Currency[]> => {
  if (!forceRefresh) {
    if (currenciesRequest) {
      return currenciesRequest;
    }

    if (initialized()) {
      return currencies();
    }
  }

  setLoading(true);
  setError(null);

  currenciesRequest = (async () => {
    try {
      logger.debug('Fetching currencies...');

      if (!forceRefresh) {
        const cached = currencyCache.get<Currency[]>(CACHE_KEY);
        if (cached) {
          logger.debug('Currencies loaded from cache');
          setCurrencies(cached);
          return cached;
        }
      }

      const data = await currenciesApi.getAll();
      currencyCache.set(CACHE_KEY, data, CACHE_CONFIG.ttl.currencies);
      logger.debug(`Cached ${data.length} currencies`);
      setCurrencies(data);
      return data;
    } catch (fetchError) {
      setError(fetchError);
      logger.error('Failed to fetch currencies', fetchError);
      setCurrencies([]);
      return [];
    } finally {
      setLoading(false);
      setInitialized(true);
      currenciesRequest = null;
    }
  })();

  return currenciesRequest;
};

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
  void loadCurrencies(true);
  logger.info('Currencies cache cleared and refetched');
};

// Export store
export const currencyStore = {
  // State
  currencies,
  loading,
  error,
  filteredCurrencies,
  selectedCurrency,
  searchTerm,
  
  // Actions
  searchCurrencies,
  selectCurrency,
  clearSelection,
  refreshCurrencies,
  loadCurrencies,
};
