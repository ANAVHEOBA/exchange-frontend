import { createMemo } from 'solid-js';
import { useCurrencies } from '../../../hooks/useCurrencies';
import type { Currency } from '../../../types/currency';

export interface UseCurrencySelectorResult {
  currencies: () => Currency[];
  loading: () => boolean;
  error: () => unknown;
  refresh: ReturnType<typeof useCurrencies>['refresh'];
}

export function useCurrencySelector(): UseCurrencySelectorResult {
  const currencies = useCurrencies();

  return {
    currencies: createMemo(() => currencies.currencies() ?? []),
    loading: createMemo(() => Boolean(currencies.loading())),
    error: createMemo(() => currencies.error()),
    refresh: currencies.refresh,
  };
}
