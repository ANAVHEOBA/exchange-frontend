import { Show, createEffect, createMemo, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { CurrencySelector } from '../../features/currencies';
import { QuoteDiscoveryPanel, useQuoteDiscovery } from '../../features/quotes';
import { RecipientAddressForm, useAddressValidation } from '../../features/swap-execution';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useSwap } from '../../hooks/useSwap';
import type { Currency } from '../../types/currency';
import type { RateType } from '../../types/rate';
import type { CreateSwapRequest, CreateSwapResponse, SwapStatusResponse } from '../../types/swap';
import { format } from '../../utils/format';
import './SwapModal.css';

type SwapMode = 'standard' | 'payment';
type SelectorTarget = 'from' | 'to' | null;
type CurrencyDisplay = Pick<Currency, 'name' | 'ticker' | 'network' | 'image'>;
type SwapModalLayout = 'card' | 'page';

export interface SwapModalProps {
  layout?: SwapModalLayout;
  initialFromTicker?: string;
  initialFromNetwork?: string;
  initialToTicker?: string;
  initialToNetwork?: string;
  initialAmount?: string;
  initialRateType?: RateType;
}

const DEFAULT_SEND_DISPLAY: CurrencyDisplay = {
  name: 'Bitcoin',
  ticker: 'BTC',
  network: 'Mainnet',
  image: '/country/icons/btc.svg',
};

const DEFAULT_RECEIVE_DISPLAY: CurrencyDisplay = {
  name: 'Monero',
  ticker: 'XMR',
  network: 'Mainnet',
  image: '/country/icons/xmr.svg',
};

const isSameCurrency = (left: Currency | null, right: Currency | null): boolean => {
  if (!left || !right) {
    return false;
  }

  return left.ticker === right.ticker && left.network === right.network;
};

const formatTimestamp = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getSwapDepositAmount = (swap: CreateSwapResponse | SwapStatusResponse): number => {
  return 'deposit_amount' in swap ? swap.deposit_amount : swap.amount;
};

const normalizeAmountInput = (value: string): string => {
  const normalized = value.replaceAll(',', '.').replace(/\s+/g, '');
  let result = '';
  let hasDecimal = false;

  for (const char of normalized) {
    if (char >= '0' && char <= '9') {
      result += char;
      continue;
    }

    if (char === '.' && !hasDecimal) {
      result += char;
      hasDecimal = true;
    }
  }

  return result;
};

const approximateUsd = (value?: number | null): string | null => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  return `~${format.usd(value)}`;
};

const formatSpread = (value?: number | null): string | null => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  return format.percent(value, 1, false);
};

const PRIVACY_TOOLTIPS: Record<string, string> = {
  A: 'Privacy-friendly.',
  B: 'Refunds most AML failures.',
  C: 'May still require KYC or source-of-funds review after provider checks.',
  D: 'Funds can be held until verification is completed.',
};

const getPrivacyTooltip = (label?: string | null): string | null => {
  if (!label) {
    return null;
  }

  return PRIVACY_TOOLTIPS[label.toUpperCase()] ?? 'Provider-specific verification may still apply.';
};

const matchesCurrency = (
  currency: Currency,
  ticker?: string,
  network?: string,
): boolean => {
  if (!ticker) {
    return false;
  }

  const tickerMatches = currency.ticker.toLowerCase() === ticker.toLowerCase();
  const networkMatches = network
    ? currency.network.toLowerCase() === network.toLowerCase()
    : true;

  return tickerMatches && networkMatches;
};

function SwapModal(props: SwapModalProps) {
  const { currencies } = useCurrencies();
  const swap = useSwap();
  const navigate = useNavigate();
  const layout = createMemo<SwapModalLayout>(() => props.layout ?? 'card');
  const isPageLayout = createMemo(() => layout() === 'page');

  const [mode, setMode] = createSignal<SwapMode>('standard');
  const [selectorTarget, setSelectorTarget] = createSignal<SelectorTarget>(null);
  const [selectedRateType, setSelectedRateType] = createSignal<RateType>(
    props.initialRateType ?? 'floating',
  );
  const [fromCurrency, setFromCurrency] = createSignal<Currency | null>(null);
  const [toCurrency, setToCurrency] = createSignal<Currency | null>(null);
  const [amount, setAmount] = createSignal(props.initialAmount ?? '0.1');
  const [recipientAddress, setRecipientAddress] = createSignal('');
  const [refundAddress, setRefundAddress] = createSignal('');
  const [detailsOpen, setDetailsOpen] = createSignal(false);
  const [createdSwapId, setCreatedSwapId] = createSignal<string | null>(null);
  const [createdExecutionKey, setCreatedExecutionKey] = createSignal<string | null>(null);

  createEffect(() => {
    const available = currencies();
    if (!available || available.length === 0) {
      return;
    }

    const currentFrom = fromCurrency();
    const preferredFrom = available.find(currency => {
      return matchesCurrency(currency, props.initialFromTicker, props.initialFromNetwork);
    });
    const fallbackFrom =
      preferredFrom ??
      available.find(currency => currency.ticker.toLowerCase() === 'btc') ??
      available[0];
    const nextFrom = currentFrom ?? fallbackFrom;

    if (!currentFrom) {
      setFromCurrency(nextFrom);
    }

    if (!toCurrency()) {
      const preferredTo = available.find(currency => {
        return matchesCurrency(currency, props.initialToTicker, props.initialToNetwork);
      });
      const fallbackTo =
        preferredTo ??
        available.find(currency => {
          return currency.ticker.toLowerCase() === 'xmr' && !isSameCurrency(currency, nextFrom);
        }) ??
        available.find(currency => {
          return currency.ticker.toLowerCase() === 'usdt' && !isSameCurrency(currency, nextFrom);
        }) ??
        available.find(currency => !isSameCurrency(currency, nextFrom)) ??
        nextFrom;

      setToCurrency(fallbackTo);
    }
  });

  const parsedAmount = createMemo(() => {
    const value = Number(amount());
    return Number.isFinite(value) && value > 0 ? value : null;
  });

  const quoteQuery = createMemo(() => {
    const from = fromCurrency();
    const to = toCurrency();
    const nextAmount = parsedAmount();

    if (!from || !to || !nextAmount || isSameCurrency(from, to)) {
      return null;
    }

    return {
      from: from.ticker,
      network_from: from.network,
      to: to.ticker,
      network_to: to.network,
      amount: nextAmount,
      rate_type: selectedRateType(),
    };
  });

  const quoteDiscovery = useQuoteDiscovery({ query: quoteQuery });
  const addressValidation = useAddressValidation({
    address: recipientAddress,
    currency: toCurrency,
  });

  const executionRequest = createMemo<CreateSwapRequest | null>(() => {
    const from = fromCurrency();
    const to = toCurrency();
    const nextAmount = parsedAmount();
    const selectedRate = quoteDiscovery.selectedRate();
    const tradeId = quoteDiscovery.tradeId();
    const address = recipientAddress().trim();
    const refund = refundAddress().trim();

    if (!from || !to || !nextAmount || !selectedRate || !tradeId || !address) {
      return null;
    }

    return {
      trade_id: tradeId,
      from: from.ticker,
      network_from: from.network,
      to: to.ticker,
      network_to: to.network,
      amount: nextAmount,
      provider: selectedRate.provider,
      recipient_address: address,
      refund_address: refund || undefined,
      rate_type: selectedRate.rate_type,
    };
  });

  const executionKey = createMemo(() => {
    const request = executionRequest();

    if (!request) {
      return null;
    }

    return [
      request.trade_id ?? '',
      request.from,
      request.network_from,
      request.to,
      request.network_to,
      request.amount,
      request.provider,
      request.recipient_address,
      request.refund_address ?? '',
      request.rate_type ?? '',
    ].join('|');
  });

  const createdSwap = createMemo(() => {
    const activeSwap = swap.activeSwap();

    if (!activeSwap || activeSwap.swap_id !== createdSwapId()) {
      return null;
    }

    if (createdExecutionKey() !== executionKey()) {
      return null;
    }

    return activeSwap;
  });

  const selectedRoute = createMemo(() => {
    return quoteDiscovery.selectedRate() ?? quoteDiscovery.bestRate();
  });

  const receiveAmount = createMemo(() => {
    if (selectedRoute()) {
      return selectedRoute()!.estimated_amount;
    }

    return quoteDiscovery.estimate()?.estimated_receive ?? null;
  });

  const sendAmountUsd = createMemo(() => {
    return selectedRoute()?.amount_from_usd ?? quoteDiscovery.estimate()?.amount_from_usd ?? null;
  });

  const receiveAmountUsd = createMemo(() => {
    return (
      selectedRoute()?.estimated_amount_usd ??
      quoteDiscovery.estimate()?.estimated_receive_usd ??
      null
    );
  });

  const helperText = createMemo(() => {
    if (!fromCurrency() || !toCurrency()) {
      return 'Select a source and destination currency.';
    }

    if (isSameCurrency(fromCurrency(), toCurrency())) {
      return 'Choose a different destination currency to fetch live quotes.';
    }

    if (!parsedAmount()) {
      return 'Enter an amount greater than zero.';
    }

    return `Choose a ${selectedRateType()} route to continue.`;
  });

  const showDetails = createMemo(() => {
    return isPageLayout() || detailsOpen();
  });

  createEffect(() => {
    if (createdExecutionKey() && createdExecutionKey() !== executionKey()) {
      setCreatedSwapId(null);
      setCreatedExecutionKey(null);
    }
  });

  const canContinue = createMemo(() => {
    return Boolean(
      quoteDiscovery.selectedRate() &&
        addressValidation.isValid() &&
        !quoteDiscovery.loading() &&
        !quoteDiscovery.refreshing(),
    );
  });

  const canOpenDetails = createMemo(() => {
    return Boolean(
      quoteDiscovery.selectedRate() &&
        !quoteDiscovery.loading() &&
        !quoteDiscovery.refreshing(),
    );
  });

  const executionMessage = createMemo(() => {
    if (createdSwap()) {
      return 'Swap created. Send the exact deposit amount to the address below before the route expires.';
    }

    if (!quoteDiscovery.selectedRate()) {
      return `Select a ${selectedRateType()} route before confirming the exchange.`;
    }

    if (!recipientAddress().trim()) {
      return 'Enter the destination address to continue.';
    }

    if (!addressValidation.isValid()) {
      return 'Validate the destination address before continuing.';
    }

    return 'Address is validated and the selected exchange is ready to confirm.';
  });

  const receiveValue = createMemo(() => {
    if (receiveAmount() !== null && toCurrency()) {
      return `${format.number(receiveAmount()!, 6)} ${toCurrency()!.ticker}`;
    }

    if (quoteDiscovery.loading() || quoteDiscovery.refreshing()) {
      return 'Checking route...';
    }

    return '';
  });

  const routeStatus = createMemo(() => {
    if (!quoteQuery()) {
      return 'Select a pair and enter an amount.';
    }

    if (quoteDiscovery.loading()) {
      return `Checking ${selectedRateType()} routes.`;
    }

    if (quoteDiscovery.refreshing() && quoteDiscovery.estimate()) {
      return `Preview ready via ${quoteDiscovery.estimate()!.best_provider}. Checking live ${selectedRateType()} providers...`;
    }

    if (!quoteDiscovery.selectedRate()) {
      if (quoteDiscovery.estimate()) {
        if (quoteDiscovery.error()) {
          return 'Estimate is ready, but the live provider check is delayed.';
        }

        return `Preview ready from ${quoteDiscovery.estimate()!.provider_count} providers. Waiting for live route details.`;
      }

      if (quoteDiscovery.error()) {
        return null;
      }

      return `No ${selectedRateType()} route available for the current pair.`;
    }

    return `${quoteDiscovery.providerCount()} ${selectedRateType()} routes, best via ${quoteDiscovery.selectedRate()!.provider_name}.`;
  });

  const primaryLabel = createMemo(() => {
    if (quoteDiscovery.loading()) {
      return 'Checking routes...';
    }

    if (quoteDiscovery.refreshing()) {
      return 'Refreshing routes...';
    }

    if (detailsOpen()) {
      return 'Route selection below';
    }

    return 'Choose Exchange';
  });

  const executionLabel = createMemo(() => {
    if (swap.creating()) {
      return 'Confirming Exchange...';
    }

    if (createdSwap()) {
      return 'Exchange Created';
    }

    return 'Confirm Exchange';
  });

  const modeDescription = createMemo(() => {
    if (mode() === 'payment') {
      return 'Payment targets an exact receive amount. This flow is not wired yet in the current backend.';
    }

    return 'Standard uses the amount you send and then lets you compare live exchange routes.';
  });

  const handleCurrencyPick = (currency: Currency) => {
    if (selectorTarget() === 'from') {
      setFromCurrency(currency);
    } else if (selectorTarget() === 'to') {
      setToCurrency(currency);
    }

    setSelectorTarget(null);
  };

  const handleSwapCurrencies = () => {
    const currentFrom = fromCurrency();
    const currentTo = toCurrency();

    if (!currentFrom || !currentTo) {
      return;
    }

    setFromCurrency(currentTo);
    setToCurrency(currentFrom);
  };

  const handleContinue = () => {
    if (!canOpenDetails()) {
      return;
    }

    const query = quoteQuery();

    if (!query) {
      return;
    }

    if (isPageLayout()) {
      setDetailsOpen(true);
      return;
    }

    const params = new URLSearchParams({
      from: query.from,
      network_from: query.network_from,
      to: query.to,
      network_to: query.network_to,
      amount: String(query.amount),
      rate_type: selectedRateType(),
    });

    navigate(`/exchange?${params.toString()}`);
  };

  const handleEditTransaction = () => {
    if (isPageLayout()) {
      navigate('/#swap');
      return;
    }

    setDetailsOpen(false);
  };

  const handleRateTypeChange = (rateType: RateType) => {
    if (selectedRateType() === rateType) {
      return;
    }

    setSelectedRateType(rateType);
  };

  const handleAmountInput = (event: Event) => {
    const nextValue = normalizeAmountInput((event.currentTarget as HTMLInputElement).value);
    setAmount(nextValue);
  };

  const handleCreateSwap = async () => {
    const request = executionRequest();

    if (!request || swap.creating() || createdSwap()) {
      return;
    }

    try {
      const response =
        mode() === 'payment' ? await swap.createPayment(request) : await swap.create(request);

      setCreatedSwapId(response.swap_id);
      setCreatedExecutionKey(executionKey());
    } catch {
      // The store already captures and exposes the API error.
    }
  };

  const coinImage = (currency: Currency | null) => {
    return currency?.image || '/favicon.ico';
  };

  const displayFromCurrency = createMemo<CurrencyDisplay>(() => {
    return fromCurrency() ?? DEFAULT_SEND_DISPLAY;
  });

  const displayToCurrency = createMemo<CurrencyDisplay>(() => {
    return toCurrency() ?? DEFAULT_RECEIVE_DISPLAY;
  });

  return (
    <div
      class="swap-widget"
      classList={{
        'swap-widget--details-open': showDetails(),
        'swap-widget--page': isPageLayout(),
      }}
    >
      <Show when={!isPageLayout()}>
        <div class="swap-card">
        <div class="swap-card__title">Start Exchange</div>

        <div class="swap-card__coins">
          <section class="swap-coin">
            <div class="swap-coin__label">You Send</div>
            <div class="swap-coin__row">
              <button
                class="swap-coin__picker"
                onClick={() => setSelectorTarget(current => (current === 'from' ? null : 'from'))}
                type="button"
              >
                <img
                  src={displayFromCurrency().image}
                  alt={displayFromCurrency().name}
                  class="swap-coin__icon"
                  onError={event => {
                    (event.currentTarget as HTMLImageElement).src = coinImage(fromCurrency());
                  }}
                />
                <div class="swap-coin__identity">
                  <span class="swap-coin__code">{displayFromCurrency().ticker}</span>
                  <span class="swap-coin__network">{displayFromCurrency().network}</span>
                </div>
                <span class="swap-coin__chevron">˅</span>
              </button>

              <div class="swap-coin__amount">
                <input
                  type="text"
                  inputMode="decimal"
                  autocomplete="off"
                  spellcheck={false}
                  placeholder="Type amount"
                  value={amount()}
                  onInput={handleAmountInput}
                />
                <span class="swap-coin__amount-code">{displayFromCurrency().ticker}</span>
              </div>
            </div>
            <div class="swap-coin__meta">
              <span>{displayFromCurrency().name}</span>
              <Show when={approximateUsd(sendAmountUsd())}>
                <span>{approximateUsd(sendAmountUsd())}</span>
              </Show>
            </div>
          </section>

          <button
            class="swap-coin__switch"
            onClick={handleSwapCurrencies}
            type="button"
            aria-label="Swap selected currencies"
          >
            ↕
          </button>

          <section class="swap-coin">
            <div class="swap-coin__label">You Get</div>
            <div class="swap-coin__row">
              <button
                class="swap-coin__picker"
                onClick={() => setSelectorTarget(current => (current === 'to' ? null : 'to'))}
                type="button"
              >
                <img
                  src={displayToCurrency().image}
                  alt={displayToCurrency().name}
                  class="swap-coin__icon"
                  onError={event => {
                    (event.currentTarget as HTMLImageElement).src = coinImage(toCurrency());
                  }}
                />
                <div class="swap-coin__identity">
                  <span class="swap-coin__code">{displayToCurrency().ticker}</span>
                  <span class="swap-coin__network">{displayToCurrency().network}</span>
                </div>
                <span class="swap-coin__chevron">˅</span>
              </button>

              <div class="swap-coin__amount swap-coin__amount--readonly">
                <input type="text" placeholder="Estimated receive" readOnly value={receiveValue()} />
              </div>
            </div>
            <div class="swap-coin__meta">
              <span>{displayToCurrency().name}</span>
              <Show when={approximateUsd(receiveAmountUsd())}>
                <span>{approximateUsd(receiveAmountUsd())}</span>
              </Show>
            </div>
          </section>
        </div>

        <div class="swap-card__footer">
          <div class="swap-mode-toggle" aria-label="Swap mode">
            <button
              class="swap-mode-toggle__button"
              classList={{ active: mode() === 'standard' }}
              onClick={() => setMode('standard')}
              type="button"
            >
              Standard
            </button>
            <button
              class="swap-mode-toggle__button swap-mode-toggle__button--disabled"
              classList={{ active: mode() === 'payment' }}
              disabled
              type="button"
            >
              Payment
            </button>
          </div>

          <div class="swap-mode-note">{modeDescription()}</div>

          <Show when={routeStatus()}>
            <div class="swap-card__route">
              <span class="swap-card__route-dot" />
              <span>{routeStatus()}</span>
            </div>
          </Show>
        </div>

          <button
            class="exchange-btn"
            disabled={!canOpenDetails() || detailsOpen()}
            onClick={handleContinue}
            type="button"
          >
            {primaryLabel()}
          </button>
        </div>
      </Show>

      <Show when={selectorTarget() && !isPageLayout()}>
        <div class="swap-selector-panel">
          <div class="swap-selector-header">
            <span>
              {selectorTarget() === 'from' ? 'Choose what you send' : 'Choose what you receive'}
            </span>
            <button
              class="swap-selector-close"
              onClick={() => setSelectorTarget(null)}
              type="button"
            >
              Close
            </button>
          </div>
          <CurrencySelector
            onSelect={handleCurrencyPick}
            selectedCurrency={selectorTarget() === 'from' ? fromCurrency() : toCurrency()}
          />
        </div>
      </Show>

      <Show when={showDetails()}>
        <div
          class="swap-widget__details"
          classList={{ 'swap-widget__details--page': isPageLayout() }}
        >
          <div class="swap-selection">
            <div class="swap-selection__form">
              <div class="swap-selection__panel">
                <div class="swap-selection__heading">Confirm Exchange</div>

                <div class="swap-selection__summary">
                  <div class="swap-selection__summary-label">You send:</div>
                  <div class="swap-selection__summary-card">
                    <div class="swap-selection__summary-values">
                      <Show when={approximateUsd(sendAmountUsd())}>
                        <div class="swap-selection__summary-usd">{approximateUsd(sendAmountUsd())}</div>
                      </Show>
                      <div class="swap-selection__summary-amount">{amount() || '0'}</div>
                    </div>

                    <div class="swap-selection__summary-currency">
                      <img
                        src={displayFromCurrency().image}
                        alt={displayFromCurrency().name}
                        class="swap-selection__summary-icon"
                        onError={event => {
                          (event.currentTarget as HTMLImageElement).src = coinImage(fromCurrency());
                        }}
                      />
                      <div>
                        <div class="swap-selection__summary-name">{displayFromCurrency().name}</div>
                        <div class="swap-selection__summary-network">{displayFromCurrency().network}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="swap-selection__summary">
                  <div class="swap-selection__summary-label">You get approximately:</div>
                  <div class="swap-selection__summary-card">
                    <div class="swap-selection__summary-values">
                      <Show when={approximateUsd(receiveAmountUsd())}>
                        <div class="swap-selection__summary-usd">{approximateUsd(receiveAmountUsd())}</div>
                      </Show>
                      <div class="swap-selection__summary-amount">
                        <Show when={receiveAmount() !== null} fallback="Checking route...">
                          {format.number(receiveAmount()!, 6)}
                        </Show>
                      </div>
                    </div>

                    <div class="swap-selection__summary-currency">
                      <img
                        src={displayToCurrency().image}
                        alt={displayToCurrency().name}
                        class="swap-selection__summary-icon"
                        onError={event => {
                          (event.currentTarget as HTMLImageElement).src = coinImage(toCurrency());
                        }}
                      />
                      <div>
                        <div class="swap-selection__summary-name">{displayToCurrency().name}</div>
                        <div class="swap-selection__summary-network">{displayToCurrency().network}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Show when={selectedRoute()}>
                  <div class="swap-selection__route-meta">
                    <span>{selectedRoute()!.provider_name}</span>
                    <span>{selectedRoute()!.rate_type}</span>
                    <Show when={formatSpread(selectedRoute()!.spread_percentage)}>
                      <span>{formatSpread(selectedRoute()!.spread_percentage)}</span>
                    </Show>
                    <Show when={selectedRoute()!.eta_minutes}>
                      <span>{`${selectedRoute()!.eta_minutes}min ETA`}</span>
                    </Show>
                    <Show when={selectedRoute()!.privacy_rating ?? selectedRoute()!.kyc_rating}>
                      <span
                        title={getPrivacyTooltip(selectedRoute()!.privacy_rating ?? selectedRoute()!.kyc_rating) ?? undefined}
                      >
                        {`Privacy ${selectedRoute()!.privacy_rating ?? selectedRoute()!.kyc_rating}`}
                      </span>
                    </Show>
                  </div>
                </Show>
              </div>

              <RecipientAddressForm
                currency={toCurrency()}
                refundCurrency={fromCurrency()}
                address={recipientAddress()}
                refundAddress={refundAddress()}
                onInput={value => setRecipientAddress(value)}
                onRefundInput={value => setRefundAddress(value)}
                validation={addressValidation}
              />

              <button
                class="exchange-btn exchange-btn--final"
                disabled={
                  !canContinue() ||
                  quoteDiscovery.loading() ||
                  swap.creating() ||
                  Boolean(createdSwap())
                }
                onClick={() => {
                  void handleCreateSwap();
                }}
                type="button"
              >
                {executionLabel()}
              </button>

              <button class="swap-selection__edit" onClick={handleEditTransaction} type="button">
                Edit Transaction
              </button>

              <Show when={swap.error() && !createdSwap()}>
                <div class="swap-execution-status swap-execution-status--error">{swap.error()}</div>
              </Show>
            </div>

            <div class="swap-selection__quotes">
              <QuoteDiscoveryPanel
                quote={quoteDiscovery}
                rateType={selectedRateType()}
                idleMessage={helperText()}
                onRateTypeChange={handleRateTypeChange}
              />
            </div>
          </div>

          <Show when={createdSwap()}>
            {currentSwap => (
              <div class="swap-created-card">
                <div class="swap-created-card__header">
                  <div>
                    <div class="swap-created-card__eyebrow">Deposit Instructions</div>
                    <div class="swap-created-card__headline">{currentSwap().provider}</div>
                  </div>
                  <div class="swap-created-card__status">{currentSwap().status}</div>
                </div>

                <div class="swap-created-card__grid">
                  <div class="swap-created-card__field">
                    <span>Send</span>
                    <strong>{format.currency(getSwapDepositAmount(currentSwap()), currentSwap().from)}</strong>
                  </div>
                  <div class="swap-created-card__field">
                    <span>Estimated Receive</span>
                    <strong>{format.currency(currentSwap().estimated_receive, currentSwap().to)}</strong>
                  </div>
                  <div class="swap-created-card__field">
                    <span>Swap ID</span>
                    <code>{currentSwap().swap_id}</code>
                  </div>
                  <div class="swap-created-card__field">
                    <span>Recipient</span>
                    <code>{currentSwap().recipient_address}</code>
                  </div>
                  <div class="swap-created-card__field swap-created-card__field--full">
                    <span>Deposit Address</span>
                    <code>{currentSwap().deposit_address}</code>
                  </div>
                  <Show when={currentSwap().deposit_extra_id}>
                    <div class="swap-created-card__field swap-created-card__field--full">
                      <span>Deposit Memo / Extra ID</span>
                      <code>{currentSwap().deposit_extra_id}</code>
                    </div>
                  </Show>
                  <Show when={formatTimestamp(currentSwap().expires_at)}>
                    <div class="swap-created-card__field">
                      <span>Expires</span>
                      <strong>{formatTimestamp(currentSwap().expires_at)}</strong>
                    </div>
                  </Show>
                  <Show when={formatTimestamp(currentSwap().created_at)}>
                    <div class="swap-created-card__field">
                      <span>Created</span>
                      <strong>{formatTimestamp(currentSwap().created_at)}</strong>
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </Show>

          <div class="check-link">
            <span>{executionMessage()}</span>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default SwapModal;
