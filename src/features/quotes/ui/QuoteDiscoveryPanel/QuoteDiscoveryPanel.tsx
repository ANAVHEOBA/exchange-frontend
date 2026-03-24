import { For, Match, Show, Switch, createMemo } from 'solid-js';
import { format } from '../../../../utils/format';
import type { Rate, RateType } from '../../../../types/rate';
import type { QuoteDiscoveryController } from '../../model';
import './QuoteDiscoveryPanel.css';

export interface QuoteDiscoveryPanelProps {
  quote: QuoteDiscoveryController;
  rateType: RateType;
  idleMessage?: string;
  onRateTypeChange?: (rateType: RateType) => void;
}

const PRIVACY_TOOLTIPS: Record<string, string> = {
  A: 'Privacy-friendly.',
  B: 'Refunds most AML failures.',
  C: 'May still require KYC or source-of-funds review after provider checks.',
  D: 'Funds can be held until verification is completed.',
};

const buildPrivacyLabel = (rate: Rate): string => {
  return rate.privacy_rating ?? rate.kyc_rating ?? (rate.kyc_required ? 'KYC' : 'A');
};

const buildPrivacyTooltip = (label: string): string => {
  return PRIVACY_TOOLTIPS[label.toUpperCase()] ?? 'Provider-specific verification may still apply.';
};

const formatEta = (etaMinutes?: number): string => {
  return etaMinutes ? `${etaMinutes}min` : '—';
};

const formatSpread = (spread?: number): string => {
  if (spread === undefined || spread === null) {
    return '—';
  }

  return format.percent(spread, 1, false);
};

export default function QuoteDiscoveryPanel(props: QuoteDiscoveryPanelProps) {
  const currentRate = createMemo(() => props.quote.selectedRate() ?? props.quote.bestRate());
  const currentEstimate = createMemo(() => props.quote.estimate());
  const providerCount = createMemo(() => props.quote.rates().length);

  const isSelected = (rate: Rate) => {
    const selected = props.quote.selectedRate();

    return Boolean(
      selected &&
      selected.provider === rate.provider &&
      selected.rate_type === rate.rate_type
    );
  };

  const tabLabel = (rateType: RateType) => {
    return rateType === 'floating' ? 'Floating Rate' : 'Fixed Rate';
  };

  const emptyMessage = createMemo(() => {
    return props.rateType === 'fixed'
      ? 'No fixed-rate providers returned a route for this pair yet.'
      : 'No floating-rate providers returned a route for this pair yet.';
  });

  return (
    <section class="quote-discovery">
      <div class="quote-discovery__header">
        <div class="quote-discovery__title">Choose your Exchange and Rate</div>
        <div class="quote-discovery__guarantee">
          All transactions are covered by the Trocador Guarantee
        </div>
      </div>

      <div class="quote-discovery__tabs" role="tablist" aria-label="Rate type">
        <button
          type="button"
          class="quote-discovery__tab"
          classList={{ 'quote-discovery__tab--active': props.rateType === 'floating' }}
          onClick={() => props.onRateTypeChange?.('floating')}
        >
          {tabLabel('floating')}
        </button>
        <button
          type="button"
          class="quote-discovery__tab"
          classList={{ 'quote-discovery__tab--active': props.rateType === 'fixed' }}
          onClick={() => props.onRateTypeChange?.('fixed')}
        >
          {tabLabel('fixed')}
        </button>
      </div>

      <Switch>
        <Match when={!props.quote.canFetch()}>
          <div class="quote-discovery__state">
            {props.idleMessage ?? 'Select currencies and enter an amount to compare routes.'}
          </div>
        </Match>

        <Match when={props.quote.loading() && !currentEstimate()}>
          <div class="quote-discovery__state">Loading provider routes...</div>
        </Match>

        <Match when={providerCount() > 0}>
          <div class="quote-discovery__summary">
            <div class="quote-discovery__summary-main">
              <div class="quote-discovery__summary-provider">
                {currentRate()?.provider_name ?? 'No provider selected'}
              </div>
              <div class="quote-discovery__summary-amount">
                <Show
                  when={currentRate()}
                  fallback="Waiting for live route"
                >
                  {`~${format.number(currentRate()!.estimated_amount, 6)}`}
                </Show>
              </div>
            </div>

            <div class="quote-discovery__summary-meta">
              <span>{providerCount()} routes</span>
              <Show when={props.quote.tradeId()}>
                <span>Trade ID {props.quote.tradeId()}</span>
              </Show>
              <Show when={currentRate()?.amount_to_usd}>
                <span>{`~${format.usd(currentRate()!.amount_to_usd!)}`}</span>
              </Show>
              <Show when={props.quote.refreshing()}>
                <span>Refreshing</span>
              </Show>
            </div>
          </div>

          <div class="quote-discovery__table">
            <div class="quote-discovery__table-head">
              <span>Exchange</span>
              <span>Rate</span>
              <span>Spread</span>
              <span>ETA</span>
              <span>Privacy</span>
            </div>

            <div class="quote-discovery__rows">
              <For each={props.quote.rates()}>
                {rate => (
                  <button
                    type="button"
                    class="quote-discovery__row"
                    classList={{ 'quote-discovery__row--selected': isSelected(rate) }}
                    onClick={() => props.quote.selectRate(rate)}
                  >
                    <span class="quote-discovery__exchange-name">{rate.provider_name}</span>
                    <span class="quote-discovery__value">{`~${format.number(rate.estimated_amount, 6)}`}</span>
                    <span class="quote-discovery__value">{formatSpread(rate.spread_percentage)}</span>
                    <span class="quote-discovery__value">{formatEta(rate.eta_minutes)}</span>
                    <span class="quote-discovery__privacy">
                      <span
                        class={`quote-discovery__privacy-badge quote-discovery__privacy-badge--${buildPrivacyLabel(rate).toLowerCase()}`}
                        title={buildPrivacyTooltip(buildPrivacyLabel(rate))}
                        aria-label={buildPrivacyTooltip(buildPrivacyLabel(rate))}
                      >
                        {buildPrivacyLabel(rate)}
                      </span>
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Match>

        <Match when={currentEstimate()}>
          <div class="quote-discovery__state quote-discovery__state--preview">
            <strong>{currentEstimate()!.best_provider}</strong>
            <span>{`~${format.number(currentEstimate()!.estimated_receive, 6)} estimated receive`}</span>
            <span>{`${currentEstimate()!.provider_count} providers checked`}</span>
            <Show when={props.quote.refreshing()}>
              <span>Loading live provider routes...</span>
            </Show>
          </div>
        </Match>

        <Match when={props.quote.error()}>
          <div class="quote-discovery__state quote-discovery__state--error">
            {String(props.quote.error() ?? 'Failed to load live quotes.')}
          </div>
        </Match>

        <Match when={providerCount() === 0}>
          <div class="quote-discovery__state">
            {emptyMessage()}
          </div>
        </Match>
      </Switch>
    </section>
  );
}
