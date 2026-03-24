/**
 * Rate Store
 * State management for quotes, estimates, and selected providers
 */

import { createMemo, createSignal } from 'solid-js';
import FEATURES from '../config/features';
import { quoteService, type QuoteResult } from '../services/swap/quoteService';
import { logger } from '../utils/logger';
import type { EstimateQuery, EstimateResponse } from '../types/estimate';
import type { Rate, RatesQuery, RatesResponse } from '../types/rate';

const buildQueryKey = (query: RatesQuery): string => {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');
};

const toEstimateQuery = (query: RatesQuery): EstimateQuery => ({
  from: query.from,
  to: query.to,
  amount: query.amount,
  network_from: query.network_from,
  network_to: query.network_to,
});

const matchesRequestedRateType = (
  rate: Rate,
  requestedRateType?: RatesQuery['rate_type'],
): boolean => {
  if (!requestedRateType) {
    return true;
  }

  if (rate.rate_type) {
    return rate.rate_type === requestedRateType;
  }

  return requestedRateType === 'fixed' ? rate.fixed : !rate.fixed;
};

const buildEstimateKey = (query: EstimateQuery): string => {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');
};

const isAbortError = (error: unknown): boolean => {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    String((error as { code?: string }).code) === 'ABORTED',
  );
};

const [currentQuery, setCurrentQuery] = createSignal<RatesQuery | null>(null);
const [selectedProvider, setSelectedProvider] = createSignal<string | null>(null);
const [ratesResponse, setRatesResponse] = createSignal<RatesResponse | null>(null);
const [estimateResponse, setEstimateResponse] = createSignal<EstimateResponse | null>(null);
const [ratesFetchedAt, setRatesFetchedAt] = createSignal<number | null>(null);
const [loadingRates, setLoadingRates] = createSignal(false);
const [loadingEstimate, setLoadingEstimate] = createSignal(false);
const [ratesDebouncing, setRatesDebouncing] = createSignal(false);
const [error, setError] = createSignal<unknown>(null);
const [resolvedRatesQueryKey, setResolvedRatesQueryKey] = createSignal<string | null>(null);
const [resolvedEstimateQueryKey, setResolvedEstimateQueryKey] = createSignal<string | null>(null);

let activeRatesRequest: Promise<RatesResponse | null> | null = null;
let activeRatesRequestKey: string | null = null;
let activeRatesRequestId = 0;
let activeEstimateRequest: Promise<EstimateResponse | null> | null = null;
let activeEstimateRequestKey: string | null = null;
let activeEstimateRequestId = 0;
let activeRatesController: AbortController | null = null;
let activeEstimateController: AbortController | null = null;
let ratesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let scheduledRatesQueryKey: string | null = null;

const currentQueryKey = createMemo(() => {
  const query = currentQuery();
  return query ? buildQueryKey(query) : null;
});

const currentEstimateKey = createMemo(() => {
  const query = currentQuery();
  return query ? buildEstimateKey(toEstimateQuery(query)) : null;
});

const hasFreshRates = createMemo(() => {
  return Boolean(currentQueryKey() && resolvedRatesQueryKey() === currentQueryKey());
});

const hasFreshEstimate = createMemo(() => {
  return Boolean(currentEstimateKey() && resolvedEstimateQueryKey() === currentEstimateKey());
});

const currentRatesResponse = createMemo(() => {
  return hasFreshRates() ? ratesResponse() : null;
});

const currentEstimate = createMemo(() => {
  return hasFreshEstimate() ? estimateResponse() : null;
});

const filteredRates = createMemo(() => {
  const response = currentRatesResponse();
  const requestedRateType = currentQuery()?.rate_type;

  if (!response) {
    return [];
  }

  return response.rates.filter(rate => matchesRequestedRateType(rate, requestedRateType));
});

const quote = createMemo<QuoteResult | null>(() => {
  const rates = currentRatesResponse();
  const matchingRates = filteredRates();

  if (!rates) {
    return null;
  }

  return {
    rates: {
      ...rates,
      rates: matchingRates,
    },
    estimate: currentEstimate(),
    bestRate: matchingRates[0] ?? null,
    fetchedAt: ratesFetchedAt() ?? Date.now(),
  };
});

const loading = createMemo(() => {
  if (!currentQuery()) {
    return false;
  }

  return Boolean(
    !currentRatesResponse() &&
    !currentEstimate() &&
    (loadingEstimate() || loadingRates() || ratesDebouncing())
  );
});

const refreshing = createMemo(() => {
  if (!currentQuery()) {
    return false;
  }

  if (loading()) {
    return false;
  }

  return Boolean(
    currentEstimate() &&
    (!currentRatesResponse() || loadingRates() || ratesDebouncing())
  );
});

const clearRatesDebounce = () => {
  if (ratesDebounceTimer) {
    clearTimeout(ratesDebounceTimer);
    ratesDebounceTimer = null;
  }

  scheduledRatesQueryKey = null;
  setRatesDebouncing(false);
};

const abortActiveRatesRequest = () => {
  if (activeRatesController) {
    activeRatesController.abort();
    activeRatesController = null;
  }

  activeRatesRequest = null;
  activeRatesRequestKey = null;
  setLoadingRates(false);
};

const cancelRatesWork = () => {
  clearRatesDebounce();
  abortActiveRatesRequest();
};

const cancelEstimateWork = () => {
  if (activeEstimateController) {
    activeEstimateController.abort();
    activeEstimateController = null;
  }

  activeEstimateRequest = null;
  activeEstimateRequestKey = null;
  setLoadingEstimate(false);
};

const loadEstimate = async (
  query: RatesQuery,
  forceRefresh: boolean = false,
): Promise<EstimateResponse | null> => {
  const estimateQuery = toEstimateQuery(query);
  const estimateKey = buildEstimateKey(estimateQuery);

  if (!forceRefresh && currentEstimate() && currentEstimateKey() === estimateKey) {
    return currentEstimate();
  }

  if (activeEstimateRequest && activeEstimateRequestKey === estimateKey) {
    return activeEstimateRequest;
  }

  cancelEstimateWork();

  const controller = new AbortController();
  const requestId = ++activeEstimateRequestId;

  activeEstimateController = controller;
  activeEstimateRequestKey = estimateKey;
  setLoadingEstimate(true);

  const request = (async () => {
    try {
      const response = await quoteService.getEstimate(estimateQuery, forceRefresh, controller.signal);

      if (requestId === activeEstimateRequestId) {
        setEstimateResponse(response);
        setResolvedEstimateQueryKey(estimateKey);
      }

      return response;
    } catch (estimateError) {
      if (!isAbortError(estimateError)) {
        logger.warn('Estimate request failed', estimateError);
      }

      return null;
    } finally {
      if (requestId === activeEstimateRequestId) {
        setLoadingEstimate(false);
      }

      if (activeEstimateRequest === request) {
        activeEstimateRequest = null;
        activeEstimateRequestKey = null;
      }

      if (activeEstimateController === controller) {
        activeEstimateController = null;
      }
    }
  })();

  activeEstimateRequest = request;
  return request;
};

const loadRates = async (
  query: RatesQuery,
  forceRefresh: boolean = false,
): Promise<RatesResponse | null> => {
  const queryKey = buildQueryKey(query);

  if (!forceRefresh && currentRatesResponse() && currentQueryKey() === queryKey) {
    return currentRatesResponse();
  }

  if (activeRatesRequest && activeRatesRequestKey === queryKey) {
    return activeRatesRequest;
  }

  if (activeRatesController) {
    activeRatesController.abort();
  }

  const controller = new AbortController();
  const requestId = ++activeRatesRequestId;

  activeRatesController = controller;
  activeRatesRequestKey = queryKey;
  setLoadingRates(true);
  setError(null);

  const request = (async () => {
    try {
      logger.debug('Fetching live rates...', query);
      const response = await quoteService.getRates(query, forceRefresh, controller.signal);

      if (requestId === activeRatesRequestId) {
        setRatesResponse(response);
        setResolvedRatesQueryKey(queryKey);
        setRatesFetchedAt(Date.now());
        setError(null);
      }

      return response;
    } catch (ratesError) {
      if (requestId === activeRatesRequestId && !isAbortError(ratesError)) {
        setError(ratesError);
        logger.error('Failed to fetch live rates', ratesError);
      }

      return null;
    } finally {
      if (requestId === activeRatesRequestId) {
        setLoadingRates(false);
      }

      if (activeRatesRequest === request) {
        activeRatesRequest = null;
        activeRatesRequestKey = null;
      }

      if (activeRatesController === controller) {
        activeRatesController = null;
      }
    }
  })();

  activeRatesRequest = request;
  return request;
};

const scheduleRatesLoad = (
  query: RatesQuery,
  forceRefresh: boolean = false,
  skipDebounce: boolean = false,
) => {
  const queryKey = buildQueryKey(query);
  const hasFreshRatesForQuery = Boolean(
    !forceRefresh &&
    currentRatesResponse() &&
    currentQueryKey() === queryKey,
  );

  if (hasFreshRatesForQuery) {
    clearRatesDebounce();

    if (activeRatesRequestKey && activeRatesRequestKey !== queryKey) {
      abortActiveRatesRequest();
    }

    return;
  }

  if (!forceRefresh && activeRatesRequest && activeRatesRequestKey === queryKey) {
    clearRatesDebounce();
    return;
  }

  if (!forceRefresh && ratesDebounceTimer && scheduledRatesQueryKey === queryKey) {
    return;
  }

  cancelRatesWork();

  const debounceMs = skipDebounce ? 0 : FEATURES.debounce.rateFetch;

  if (debounceMs <= 0) {
    void loadRates(query, forceRefresh);
    return;
  }

  scheduledRatesQueryKey = queryKey;
  setRatesDebouncing(true);
  ratesDebounceTimer = setTimeout(() => {
    ratesDebounceTimer = null;
    scheduledRatesQueryKey = null;
    setRatesDebouncing(false);
    void loadRates(query, forceRefresh);
  }, debounceMs);
};

const runFetch = (
  query: RatesQuery,
  forceRefresh: boolean = false,
  skipDebounce: boolean = false,
) => {
  setSelectedProvider(query.provider ?? null);
  setCurrentQuery({ ...query });
  setError(null);

  void loadEstimate(query, forceRefresh);
  scheduleRatesLoad(query, forceRefresh, skipDebounce);
};

const rates = createMemo(() => filteredRates());
const estimate = createMemo(() => currentEstimate());
const tradeId = createMemo(() => currentRatesResponse()?.trade_id ?? null);

const selectedRate = createMemo(() => {
  const provider = selectedProvider();
  const availableRates = rates();

  if (!provider) {
    return availableRates[0] ?? null;
  }

  return availableRates.find(rate => {
    return rate.provider === provider || rate.provider_name === provider;
  }) ?? availableRates[0] ?? null;
});

const fetchRates = (query: RatesQuery) => {
  runFetch(query);
};

const updateQuery = (partial: Partial<RatesQuery>) => {
  const existingQuery = currentQuery();
  if (!existingQuery) {
    return;
  }

  const nextQuery = { ...existingQuery, ...partial };
  runFetch(nextQuery);
};

const selectRate = (rate: Rate) => {
  setSelectedProvider(rate.provider);
};

const selectProvider = (provider: string | null) => {
  setSelectedProvider(provider);
};

const clearSelection = () => {
  setSelectedProvider(null);
};

const refreshRates = () => {
  const query = currentQuery();
  if (!query) {
    return;
  }

  quoteService.clearQuoteCache(query);
  runFetch(query, true, true);
};

const clearRates = () => {
  cancelEstimateWork();
  cancelRatesWork();
  activeEstimateRequestId += 1;
  activeRatesRequestId += 1;
  setCurrentQuery(null);
  setSelectedProvider(null);
  setRatesResponse(null);
  setEstimateResponse(null);
  setRatesFetchedAt(null);
  setError(null);
  setResolvedRatesQueryKey(null);
  setResolvedEstimateQueryKey(null);
};

export const rateStore = {
  currentQuery,
  quote,
  loading,
  refreshing,
  error,
  rates,
  estimate,
  tradeId,
  selectedProvider,
  selectedRate,

  fetchRates,
  updateQuery,
  selectRate,
  selectProvider,
  clearSelection,
  refreshRates,
  clearRates,
  loadQuote: (query?: RatesQuery | null, forceRefresh: boolean = false) => {
    if (!query) {
      return Promise.resolve(quote());
    }

    runFetch(query, forceRefresh, true);
    return Promise.resolve(quote());
  },
};
