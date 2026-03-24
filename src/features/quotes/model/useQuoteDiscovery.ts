import { createEffect, createMemo, on, type Accessor } from 'solid-js';
import { useRates } from '../../../hooks/useRates';
import type { EstimateResponse } from '../../../types/estimate';
import type { Rate, RatesQuery } from '../../../types/rate';

export interface UseQuoteDiscoveryOptions {
  query: Accessor<RatesQuery | null>;
  autoFetch?: boolean;
}

export interface QuoteDiscoveryController {
  query: Accessor<RatesQuery | null>;
  canFetch: Accessor<boolean>;
  loading: Accessor<boolean>;
  refreshing: Accessor<boolean>;
  error: Accessor<unknown>;
  rates: Accessor<Rate[]>;
  estimate: Accessor<EstimateResponse | null>;
  tradeId: Accessor<string | null>;
  bestRate: Accessor<Rate | null>;
  selectedRate: Accessor<Rate | null>;
  providerCount: Accessor<number>;
  selectRate: (rate: Rate) => void;
  refresh: () => void;
  clear: () => void;
}

export function useQuoteDiscovery(options: UseQuoteDiscoveryOptions): QuoteDiscoveryController {
  const rates = useRates();
  const autoFetch = options.autoFetch ?? true;

  createEffect(on(options.query, query => {
    if (!autoFetch) {
      return;
    }

    if (!query) {
      rates.clear();
      return;
    }

    rates.fetch(query);
  }));

  const canFetch = createMemo(() => Boolean(options.query()));
  const loading = createMemo(() => Boolean(rates.loading()));
  const refreshing = createMemo(() => Boolean(rates.refreshing()));
  const error = createMemo(() => rates.error());
  const bestRate = createMemo(() => rates.rates()[0] ?? null);
  const selectedRate = createMemo(() => rates.selectedRate() ?? bestRate());
  const providerCount = createMemo(() => rates.rates().length);

  return {
    query: options.query,
    canFetch,
    loading,
    refreshing,
    error,
    rates: rates.rates,
    estimate: rates.estimate,
    tradeId: rates.tradeId,
    bestRate,
    selectedRate,
    providerCount,
    selectRate: rates.select,
    refresh: rates.refresh,
    clear: rates.clear,
  };
}
