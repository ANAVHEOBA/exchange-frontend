/**
 * Swap Store
 * State management for active swaps and authenticated history
 */

import { createMemo, createSignal } from 'solid-js';
import { swapService } from '../services/swap/swapService';
import { logger } from '../utils/logger';
import type {
  CreateSwapRequest,
  CreateSwapResponse,
  FiltersApplied,
  HistoryQuery,
  PaginationInfo,
  SwapStatusResponse,
  SwapSummary,
} from '../types/swap';

const DEFAULT_HISTORY_QUERY: HistoryQuery = {
  limit: 20,
};

type ActiveSwap = CreateSwapResponse | SwapStatusResponse | null;

const [activeSwap, setActiveSwap] = createSignal<ActiveSwap>(null);
const [history, setHistory] = createSignal<SwapSummary[]>([]);
const [historyPagination, setHistoryPagination] = createSignal<PaginationInfo | null>(null);
const [historyFiltersApplied, setHistoryFiltersApplied] = createSignal<FiltersApplied | null>(null);
const [historyQuery, setHistoryQuery] = createSignal<HistoryQuery>({ ...DEFAULT_HISTORY_QUERY });
const [creating, setCreating] = createSignal(false);
const [loadingStatus, setLoadingStatus] = createSignal(false);
const [historyLoading, setHistoryLoading] = createSignal(false);
const [polling, setPolling] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

let stopPollingHandler: (() => void) | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown error';
};

const setStoreError = (error: unknown) => {
  const message = getErrorMessage(error);
  setError(message);
  logger.error(message, error);
};

const clearError = () => {
  setError(null);
};

const mergeHistory = (current: SwapSummary[], incoming: SwapSummary[]): SwapSummary[] => {
  const seen = new Set(current.map(item => item.id));
  const merged = [...current];

  incoming.forEach(item => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  });

  return merged;
};

const runCreateSwap = async (
  request: CreateSwapRequest,
  mode: 'standard' | 'sandbox' | 'payment',
): Promise<CreateSwapResponse> => {
  clearError();
  setCreating(true);

  try {
    const response = mode === 'sandbox'
      ? await swapService.createSandboxSwap(request)
      : mode === 'payment'
        ? await swapService.createPaymentSwap(request)
        : await swapService.createSwap(request);

    setActiveSwap(response);
    return response;
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setCreating(false);
  }
};

const loadSwapStatus = async (swapId: string): Promise<SwapStatusResponse> => {
  clearError();
  setLoadingStatus(true);

  try {
    const response = await swapService.getSwapStatus(swapId);
    setActiveSwap(response);
    return response;
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setLoadingStatus(false);
  }
};

const loadHistory = async (
  query: HistoryQuery = historyQuery(),
  append: boolean = false,
  forceRefresh: boolean = false,
) => {
  clearError();
  setHistoryLoading(true);
  setHistoryQuery({ ...query });

  try {
    const response = await swapService.getSwapHistory(query, forceRefresh);
    setHistory(current => append ? mergeHistory(current, response.swaps) : response.swaps);
    setHistoryPagination(response.pagination);
    setHistoryFiltersApplied(response.filters_applied);
    return response;
  } catch (error) {
    setStoreError(error);
    throw error;
  } finally {
    setHistoryLoading(false);
  }
};

const refreshHistory = async () => {
  const query = historyQuery();
  swapService.clearHistoryCache(query);
  return loadHistory(query, false, true);
};

const loadMoreHistory = async () => {
  const pagination = historyPagination();
  if (!pagination?.next_cursor) {
    return null;
  }

  const nextQuery = {
    ...historyQuery(),
    cursor: pagination.next_cursor,
  };

  return loadHistory(nextQuery, true);
};

const updateHistoryQuery = (partial: Partial<HistoryQuery>) => {
  const nextQuery: HistoryQuery = {
    ...historyQuery(),
    ...partial,
  };

  if (!('cursor' in partial)) {
    delete nextQuery.cursor;
  }

  setHistoryQuery(nextQuery);
  return nextQuery;
};

const startPolling = async (
  swapId: string,
  intervalMs?: number,
): Promise<void> => {
  stopPolling();
  setPolling(true);

  try {
    stopPollingHandler = await swapService.trackSwapStatus(swapId, status => {
      setActiveSwap(status);

      if (['completed', 'failed', 'refunded', 'expired'].includes(status.status)) {
        stopPolling();
      }
    }, intervalMs);
  } catch (error) {
    setPolling(false);
    setStoreError(error);
    throw error;
  }
};

const stopPolling = () => {
  if (stopPollingHandler) {
    stopPollingHandler();
    stopPollingHandler = null;
  }

  setPolling(false);
};

const clearActiveSwap = () => {
  stopPolling();
  setActiveSwap(null);
};

const clearHistory = () => {
  setHistory([]);
  setHistoryPagination(null);
  setHistoryFiltersApplied(null);
  setHistoryQuery({ ...DEFAULT_HISTORY_QUERY });
};

const currentSwapId = createMemo(() => activeSwap()?.swap_id ?? null);
const currentStatus = createMemo(() => activeSwap()?.status ?? null);

export const swapStore = {
  activeSwap,
  currentSwapId,
  currentStatus,
  history,
  historyPagination,
  historyFiltersApplied,
  historyQuery,
  creating,
  loadingStatus,
  historyLoading,
  polling,
  error,

  createSwap: (request: CreateSwapRequest) => runCreateSwap(request, 'standard'),
  createSandboxSwap: (request: CreateSwapRequest) => runCreateSwap(request, 'sandbox'),
  createPaymentSwap: (request: CreateSwapRequest) => runCreateSwap(request, 'payment'),
  loadSwapStatus,
  loadHistory,
  refreshHistory,
  loadMoreHistory,
  updateHistoryQuery,
  startPolling,
  stopPolling,
  clearActiveSwap,
  clearHistory,
  clearError,
};
