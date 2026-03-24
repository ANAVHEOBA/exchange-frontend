/**
 * useSwap Hook
 * Hook for accessing swap creation, tracking, and history state
 */

import { swapStore } from '../stores/swapStore';
import type { CreateSwapRequest, HistoryQuery } from '../types/swap';

export function useSwap() {
  return {
    activeSwap: swapStore.activeSwap,
    currentSwapId: swapStore.currentSwapId,
    currentStatus: swapStore.currentStatus,
    history: swapStore.history,
    historyPagination: swapStore.historyPagination,
    historyFiltersApplied: swapStore.historyFiltersApplied,
    historyQuery: swapStore.historyQuery,

    creating: swapStore.creating,
    loadingStatus: swapStore.loadingStatus,
    historyLoading: swapStore.historyLoading,
    polling: swapStore.polling,
    error: swapStore.error,

    create: (request: CreateSwapRequest) => swapStore.createSwap(request),
    createSandbox: (request: CreateSwapRequest) => swapStore.createSandboxSwap(request),
    createPayment: (request: CreateSwapRequest) => swapStore.createPaymentSwap(request),
    loadStatus: (swapId: string) => swapStore.loadSwapStatus(swapId),
    loadHistory: (query?: HistoryQuery) => swapStore.loadHistory(query),
    refreshHistory: swapStore.refreshHistory,
    loadMoreHistory: swapStore.loadMoreHistory,
    updateHistoryQuery: swapStore.updateHistoryQuery,
    startPolling: swapStore.startPolling,
    stopPolling: swapStore.stopPolling,
    clearActiveSwap: swapStore.clearActiveSwap,
    clearHistory: swapStore.clearHistory,
    clearError: swapStore.clearError,
  };
}
