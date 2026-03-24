/**
 * useRates Hook
 * Hook for accessing quote, rates, and estimate data
 */

import { rateStore } from '../stores/rateStore';
import type { Rate, RatesQuery } from '../types/rate';

export function useRates() {
  return {
    query: rateStore.currentQuery,
    quote: rateStore.quote,
    rates: rateStore.rates,
    estimate: rateStore.estimate,
    tradeId: rateStore.tradeId,
    selectedProvider: rateStore.selectedProvider,
    selectedRate: rateStore.selectedRate,

    loading: rateStore.loading,
    refreshing: rateStore.refreshing,
    error: rateStore.error,

    fetch: (query: RatesQuery) => rateStore.fetchRates(query),
    updateQuery: rateStore.updateQuery,
    select: (rate: Rate) => rateStore.selectRate(rate),
    selectProvider: rateStore.selectProvider,
    clearSelection: rateStore.clearSelection,
    refresh: rateStore.refreshRates,
    clear: rateStore.clearRates,

    findRateByProvider: (provider: string): Rate | undefined => {
      return rateStore.rates().find(rate => {
        return rate.provider === provider || rate.provider_name === provider;
      });
    },
  };
}
