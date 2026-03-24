/**
 * useCurrencies Hook
 * Hook for accessing currency data and operations
 */

import { onMount } from 'solid-js';
import { currencyStore } from '../stores/currencyStore';
import type { Currency } from '../types/currency';

export function useCurrencies() {
  onMount(() => {
    void currencyStore.loadCurrencies();
  });

  return {
    // State
    currencies: currencyStore.currencies,
    filteredCurrencies: currencyStore.filteredCurrencies,
    selectedCurrency: currencyStore.selectedCurrency,
    searchTerm: currencyStore.searchTerm,
    
    // Computed
    loading: currencyStore.loading,
    error: currencyStore.error,
    
    // Actions
    search: currencyStore.searchCurrencies,
    select: currencyStore.selectCurrency,
    clearSelection: currencyStore.clearSelection,
    refresh: currencyStore.refreshCurrencies,
    
    // Helpers
    findByTicker: (ticker: string): Currency | undefined => {
      const currencies = currencyStore.currencies();
      return currencies?.find(c => c.ticker.toLowerCase() === ticker.toLowerCase());
    },
    
    findByNetwork: (ticker: string, network: string): Currency | undefined => {
      const currencies = currencyStore.currencies();
      return currencies?.find(
        c => c.ticker.toLowerCase() === ticker.toLowerCase() && 
             c.network.toLowerCase() === network.toLowerCase()
      );
    },
  };
}
