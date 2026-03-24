/**
 * useProviders Hook
 * Hook for accessing provider data and operations
 */

import { onMount } from 'solid-js';
import { providerStore } from '../stores/providerStore';
import type { Provider } from '../types/provider';

export function useProviders() {
  onMount(() => {
    void providerStore.loadProviders();
  });

  return {
    providers: providerStore.providers,
    filteredProviders: providerStore.filteredProviders,
    selectedProvider: providerStore.selectedProvider,
    searchTerm: providerStore.searchTerm,
    ratingFilter: providerStore.ratingFilter,
    logPolicyFilter: providerStore.logPolicyFilter,

    loading: providerStore.loading,
    error: providerStore.error,

    search: providerStore.searchProviders,
    filterByRating: providerStore.filterProvidersByRating,
    filterByLogPolicy: providerStore.filterProvidersByLogPolicy,
    select: providerStore.selectProvider,
    clearSelection: providerStore.clearSelection,
    clearFilters: providerStore.clearFilters,
    refresh: providerStore.refreshProviders,

    findByName: (name: string): Provider | undefined => {
      const providers = providerStore.providers();
      return providers?.find(provider => {
        return provider.name.toLowerCase() === name.toLowerCase();
      });
    },

    findByRating: (rating: string): Provider[] => {
      const providers = providerStore.providers();
      return providers?.filter(provider => provider.rating === rating) ?? [];
    },
  };
}
