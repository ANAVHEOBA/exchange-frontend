/**
 * usePairs Hook
 * Hook for accessing trading pair data and operations
 */

import { onMount } from 'solid-js';
import { pairStore } from '../stores/pairStore';
import type { Pair } from '../types/pair';

export function usePairs() {
  onMount(() => {
    void pairStore.loadPairs();
  });

  return {
    query: pairStore.query,
    pairsResponse: pairStore.pairsResponse,
    pairs: pairStore.pairs,
    filteredPairs: pairStore.filteredPairs,
    pagination: pairStore.pagination,
    selectedPair: pairStore.selectedPair,
    searchTerm: pairStore.searchTerm,

    loading: pairStore.loading,
    error: pairStore.error,

    updateQuery: pairStore.updateQuery,
    search: pairStore.searchPairs,
    setBaseCurrency: pairStore.setBaseCurrency,
    setQuoteCurrency: pairStore.setQuoteCurrency,
    setStatusFilter: pairStore.setStatusFilter,
    setPage: pairStore.setPage,
    setPageSize: pairStore.setPageSize,
    nextPage: pairStore.nextPage,
    prevPage: pairStore.prevPage,
    select: pairStore.selectPair,
    clearSelection: pairStore.clearSelection,
    clearFilters: pairStore.clearFilters,
    refresh: pairStore.refreshPairs,

    findByName: (name: string): Pair | undefined => {
      return pairStore.pairs().find(pair => pair.name.toLowerCase() === name.toLowerCase());
    },
  };
}
