/**
 * Provider Store
 * State management for providers with local filtering and caching
 */

import { createMemo, createSignal } from 'solid-js';
import { providersApi } from '../api/endpoints/providers';
import { CACHE_CONFIG } from '../config/cache';
import { providerCache } from '../services/cache/memoryCache';
import { logger } from '../utils/logger';
import type { Provider } from '../types/provider';

const CACHE_KEY = `${CACHE_CONFIG.prefix.provider}all`;

const [providers, setProviders] = createSignal<Provider[]>([]);
const [searchTerm, setSearchTerm] = createSignal('');
const [ratingFilter, setRatingFilter] = createSignal<string | null>(null);
const [logPolicyFilter, setLogPolicyFilter] = createSignal<string | null>(null);
const [selectedProvider, setSelectedProvider] = createSignal<Provider | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<unknown>(null);
const [initialized, setInitialized] = createSignal(false);

let providersRequest: Promise<Provider[]> | null = null;

const loadProviders = async (forceRefresh: boolean = false): Promise<Provider[]> => {
  if (!forceRefresh) {
    if (providersRequest) {
      return providersRequest;
    }

    if (initialized()) {
      return providers();
    }
  }

  setLoading(true);
  setError(null);

  providersRequest = (async () => {
    try {
      logger.debug('Fetching providers...');

      if (!forceRefresh) {
        const cached = providerCache.get<Provider[]>(CACHE_KEY);
        if (cached) {
          logger.debug('Providers loaded from cache');
          setProviders(cached);
          return cached;
        }
      }

      const data = await providersApi.getAll();
      providerCache.set(CACHE_KEY, data, CACHE_CONFIG.ttl.providers);
      logger.debug(`Cached ${data.length} providers`);
      setProviders(data);
      return data;
    } catch (fetchError) {
      setError(fetchError);
      logger.error('Failed to fetch providers', fetchError);
      setProviders([]);
      return [];
    } finally {
      setLoading(false);
      setInitialized(true);
      providersRequest = null;
    }
  })();

  return providersRequest;
};

const filteredProviders = createMemo(() => {
  const all = providers() ?? [];
  const search = searchTerm().trim().toLowerCase();
  const rating = ratingFilter();
  const logPolicy = logPolicyFilter();

  return all.filter(provider => {
    if (rating && provider.rating !== rating) {
      return false;
    }

    if (logPolicy && provider.log_policy !== logPolicy) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      provider.name,
      provider.rating,
      provider.log_policy ?? '',
    ].some(value => value.toLowerCase().includes(search));
  });
});

const searchProviders = (term: string) => {
  setSearchTerm(term);
};

const filterProvidersByRating = (rating: string | null) => {
  setRatingFilter(rating);
};

const filterProvidersByLogPolicy = (logPolicy: string | null) => {
  setLogPolicyFilter(logPolicy);
};

const selectProvider = (provider: Provider) => {
  setSelectedProvider(provider);
  logger.debug('Selected provider:', provider.name);
};

const clearSelection = () => {
  setSelectedProvider(null);
};

const clearFilters = () => {
  setSearchTerm('');
  setRatingFilter(null);
  setLogPolicyFilter(null);
};

const refreshProviders = () => {
  providerCache.delete(CACHE_KEY);
  void loadProviders(true);
  logger.info('Providers cache cleared and refetched');
};

export const providerStore = {
  providers,
  loading,
  error,
  filteredProviders,
  selectedProvider,
  searchTerm,
  ratingFilter,
  logPolicyFilter,

  searchProviders,
  filterProvidersByRating,
  filterProvidersByLogPolicy,
  selectProvider,
  clearSelection,
  clearFilters,
  refreshProviders,
  loadProviders,
};
