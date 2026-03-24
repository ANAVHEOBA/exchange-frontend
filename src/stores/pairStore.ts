/**
 * Pair Store
 * State management for paginated trading pairs
 */

import { createMemo, createSignal } from 'solid-js';
import { pairsApi } from '../api/endpoints/pairs';
import { CACHE_CONFIG } from '../config/cache';
import { pairCache } from '../services/cache/memoryCache';
import { logger } from '../utils/logger';
import type { Pair, PairsQuery, PairsResponse } from '../types/pair';

const DEFAULT_QUERY: PairsQuery = {
  page: 0,
  size: 20,
};

const buildCacheKey = (query: PairsQuery): string => {
  const serialized = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');

  return `${CACHE_CONFIG.prefix.pair}${serialized || 'default'}`;
};

const [query, setQuery] = createSignal<PairsQuery>({ ...DEFAULT_QUERY });
const [searchTerm, setSearchTerm] = createSignal('');
const [selectedPair, setSelectedPair] = createSignal<Pair | null>(null);
const [pairsResponse, setPairsResponse] = createSignal<PairsResponse | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<unknown>(null);
const [initialized, setInitialized] = createSignal(false);

let pairsRequest: Promise<PairsResponse> | null = null;

const loadPairs = async (
  currentQuery: PairsQuery = query(),
  forceRefresh: boolean = false,
): Promise<PairsResponse> => {
  const cacheKey = buildCacheKey(currentQuery);

  if (!forceRefresh) {
    if (pairsRequest) {
      return pairsRequest;
    }

    if (initialized() && buildCacheKey(query()) === cacheKey && pairsResponse()) {
      return pairsResponse()!;
    }
  }

  setLoading(true);
  setError(null);

  pairsRequest = (async () => {
    try {
      logger.debug('Fetching pairs...', currentQuery);

      if (!forceRefresh) {
        const cached = pairCache.get<PairsResponse>(cacheKey);
        if (cached) {
          logger.debug('Pairs loaded from cache');
          setPairsResponse(cached);
          return cached;
        }
      }

      const data = await pairsApi.getAll(currentQuery);
      pairCache.set(cacheKey, data, CACHE_CONFIG.ttl.pairs);
      setPairsResponse(data);
      return data;
    } catch (fetchError) {
      const fallback: PairsResponse = {
        pairs: [],
        pagination: {
          page: currentQuery.page ?? DEFAULT_QUERY.page,
          size: currentQuery.size ?? DEFAULT_QUERY.size,
          total_elements: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };

      setError(fetchError);
      logger.error('Failed to fetch pairs', fetchError);
      setPairsResponse(fallback);
      return fallback;
    } finally {
      setLoading(false);
      setInitialized(true);
      pairsRequest = null;
    }
  })();

  return pairsRequest;
};

const pairs = createMemo(() => pairsResponse()?.pairs ?? []);
const pagination = createMemo(() => pairsResponse()?.pagination ?? null);

const filteredPairs = createMemo(() => {
  const search = searchTerm().trim().toLowerCase();
  const all = pairs();

  if (!search) {
    return all;
  }

  return all.filter(pair => {
    return [
      pair.name,
      pair.base_currency,
      pair.quote_currency,
      pair.base_network,
      pair.quote_network,
      pair.status,
    ].some(value => value.toLowerCase().includes(search));
  });
});

const updateQuery = (partial: Partial<PairsQuery>) => {
  const nextQuery = { ...query(), ...partial };
  setQuery(nextQuery);
  void loadPairs(nextQuery);
};

const searchPairs = (term: string) => {
  setSearchTerm(term);
};

const setBaseCurrency = (base_currency?: string) => {
  updateQuery({ base_currency, page: 0 });
};

const setQuoteCurrency = (quote_currency?: string) => {
  updateQuery({ quote_currency, page: 0 });
};

const setStatusFilter = (status?: string) => {
  updateQuery({ status, page: 0 });
};

const setPage = (page: number) => {
  updateQuery({ page });
};

const setPageSize = (size: number) => {
  updateQuery({ size, page: 0 });
};

const nextPage = () => {
  const currentPagination = pagination();
  if (!currentPagination?.has_next) {
    return;
  }

  updateQuery({ page: currentPagination.page + 1 });
};

const prevPage = () => {
  const currentPagination = pagination();
  if (!currentPagination?.has_prev) {
    return;
  }

  updateQuery({ page: Math.max(0, currentPagination.page - 1) });
};

const selectPair = (pair: Pair) => {
  setSelectedPair(pair);
  logger.debug('Selected pair:', pair.name);
};

const clearSelection = () => {
  setSelectedPair(null);
};

const clearFilters = () => {
  setSearchTerm('');
  setSelectedPair(null);
  const nextQuery = { ...DEFAULT_QUERY };
  setQuery(nextQuery);
  void loadPairs(nextQuery);
};

const refreshPairs = () => {
  pairCache.delete(buildCacheKey(query()));
  void loadPairs(query(), true);
  logger.info('Pairs cache cleared and refetched');
};

export const pairStore = {
  query,
  pairsResponse,
  loading,
  error,
  pairs,
  filteredPairs,
  pagination,
  selectedPair,
  searchTerm,

  updateQuery,
  searchPairs,
  setBaseCurrency,
  setQuoteCurrency,
  setStatusFilter,
  setPage,
  setPageSize,
  nextPage,
  prevPage,
  selectPair,
  clearSelection,
  clearFilters,
  refreshPairs,
  loadPairs,
};
