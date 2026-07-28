import { createEffect, createSignal, on, type Accessor } from 'solid-js';
import { getPairLimits } from '../../../api/endpoints/pairLimits';
import type { PairLimitsQuery, PairLimitsResponse } from '../../../types/rate';

export interface UsePairLimitsOptions {
  query: Accessor<PairLimitsQuery | null>;
}

export interface PairLimitsController {
  minDeposit: Accessor<number | null>;
  maxDeposit: Accessor<number | null>;
}

/**
 * Fetches a pair's min/max deposit bounds independent of any typed amount, so
 * a "Minimum: X" hint can show the moment a pair is picked - matching
 * Trocador's own site, which shows this before the user has entered anything.
 */
export function usePairLimits(options: UsePairLimitsOptions): PairLimitsController {
  const [limits, setLimits] = createSignal<PairLimitsResponse | null>(null);
  let activeController: AbortController | null = null;

  createEffect(on(options.query, query => {
    activeController?.abort();
    activeController = null;

    if (!query) {
      setLimits(null);
      return;
    }

    const controller = new AbortController();
    activeController = controller;

    getPairLimits(query, controller.signal)
      .then(response => {
        if (!controller.signal.aborted) {
          setLimits(response);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLimits(null);
        }
      });
  }));

  return {
    minDeposit: () => limits()?.min_deposit ?? null,
    maxDeposit: () => limits()?.max_deposit ?? null,
  };
}
