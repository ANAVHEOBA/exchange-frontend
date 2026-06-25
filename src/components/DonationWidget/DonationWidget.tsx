import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { CurrencySelector } from '../../features/currencies';
import { QuoteDiscoveryPanel } from '../../features/quotes';
import type { QuoteDiscoveryController } from '../../features/quotes';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useSwap } from '../../hooks/useSwap';
import type { Currency } from '../../types/currency';
import type { Rate, RateType, RatesResponse } from '../../types/rate';
import type {
  CreateDonationSwapRequest,
  DonationRatesQuery,
  DonationTargetResponse,
} from '../../types/swap';
import { createDebouncedAccessor } from '../../utils/createDebouncedAccessor';
import { useLocale } from '../../i18n/locale';
import { format } from '../../utils/format';
import { swapApi } from '../../api/endpoints/swap';
import './DonationWidget.css';

const matchesCurrency = (currency: Currency, ticker: string, network: string): boolean => {
  return (
    currency.ticker.toLowerCase() === ticker.toLowerCase() &&
    currency.network.toLowerCase() === network.toLowerCase()
  );
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

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

const copyToClipboard = async (value: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === 'undefined') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

const pickDefaultSourceCurrency = (
  available: Currency[],
  target: DonationTargetResponse,
): Currency | null => {
  return (
    available.find(currency => {
      return currency.ticker.toLowerCase() === 'btc' && currency.network.toLowerCase() === 'mainnet';
    }) ??
    available.find(currency => !matchesCurrency(currency, target.to, target.network_to)) ??
    available[0] ??
    null
  );
};

export default function DonationWidget() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const swap = useSwap();
  const { currencies } = useCurrencies();

  const [target, setTarget] = createSignal<DonationTargetResponse | null>(null);
  const [targetLoading, setTargetLoading] = createSignal(true);
  const [targetError, setTargetError] = createSignal<string | null>(null);
  const [selectorOpen, setSelectorOpen] = createSignal(false);
  const [fromCurrency, setFromCurrency] = createSignal<Currency | null>(null);
  const [amount, setAmount] = createSignal('0.001');
  const [selectedRateType, setSelectedRateType] = createSignal<RateType>('floating');
  const [ratesResponse, setRatesResponse] = createSignal<RatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = createSignal(false);
  const [ratesRefreshing, setRatesRefreshing] = createSignal(false);
  const [ratesError, setRatesError] = createSignal<string | null>(null);
  const [selectedRate, setSelectedRate] = createSignal<Rate | null>(null);
  const [creating, setCreating] = createSignal(false);
  const [createError, setCreateError] = createSignal<string | null>(null);
  const [copiedAddress, setCopiedAddress] = createSignal(false);

  let ratesAbortController: AbortController | undefined;
  let activeRatesRequest = 0;
  let copiedTimer: number | undefined;

  const loadTarget = async () => {
    setTargetLoading(true);
    setTargetError(null);

    try {
      const response = await swapApi.getDonationTarget();
      setTarget(response);
    } catch (error) {
      setTargetError(getErrorMessage(error));
    } finally {
      setTargetLoading(false);
    }
  };

  onMount(() => {
    void loadTarget();
  });

  createEffect(() => {
    const donationTarget = target();
    const available = currencies();

    if (!donationTarget || available.length === 0 || fromCurrency()) {
      return;
    }

    setFromCurrency(pickDefaultSourceCurrency(available, donationTarget));
  });

  const parsedAmount = createMemo(() => {
    const value = Number(amount());
    return Number.isFinite(value) && value > 0 ? value : null;
  });

  const quoteQuery = createMemo<DonationRatesQuery | null>(() => {
    const source = fromCurrency();
    const value = parsedAmount();

    if (!source || !value || !target()) {
      return null;
    }

    return {
      from: source.ticker,
      network_from: source.network,
      amount: value,
      rate_type: selectedRateType(),
    };
  });

  const debouncedQuoteQuery = createDebouncedAccessor(quoteQuery, 350);

  const clearRates = () => {
    ratesAbortController?.abort();
    setRatesResponse(null);
    setRatesError(null);
    setRatesLoading(false);
    setRatesRefreshing(false);
    setSelectedRate(null);
  };

  const loadRates = async (query: DonationRatesQuery) => {
    ratesAbortController?.abort();
    ratesAbortController = new AbortController();
    const requestId = ++activeRatesRequest;

    setRatesError(null);
    setCreateError(null);

    if (ratesResponse()) {
      setRatesRefreshing(true);
    } else {
      setRatesLoading(true);
    }

    try {
      const response = await swapApi.getDonationRates(query, ratesAbortController.signal);

      if (requestId !== activeRatesRequest) {
        return;
      }

      setRatesResponse(response);
    } catch (error) {
      if (requestId !== activeRatesRequest) {
        return;
      }

      const message = getErrorMessage(error);
      if (message !== 'Request aborted') {
        setRatesError(message);
        setRatesResponse(null);
      }
    } finally {
      if (requestId === activeRatesRequest) {
        setRatesLoading(false);
        setRatesRefreshing(false);
      }
    }
  };

  createEffect(on(debouncedQuoteQuery, query => {
    if (!query) {
      clearRates();
      return;
    }

    void loadRates(query);
  }));

  createEffect(() => {
    const rates = ratesResponse()?.rates ?? [];
    const current = selectedRate();

    if (rates.length === 0) {
      setSelectedRate(null);
      return;
    }

    if (!current) {
      setSelectedRate(rates[0]);
      return;
    }

    const match = rates.find(rate => {
      return rate.provider === current.provider && rate.rate_type === current.rate_type;
    });

    if (!match) {
      setSelectedRate(rates[0]);
    } else if (match !== current) {
      setSelectedRate(match);
    }
  });

  onCleanup(() => {
    ratesAbortController?.abort();

    if (copiedTimer !== undefined) {
      clearTimeout(copiedTimer);
    }
  });

  const refreshRates = () => {
    const query = quoteQuery();

    if (!query) {
      return;
    }

    void loadRates(query);
  };

  const quoteController: QuoteDiscoveryController = {
    query: quoteQuery,
    canFetch: createMemo(() => Boolean(quoteQuery())),
    loading: ratesLoading,
    refreshing: ratesRefreshing,
    error: ratesError,
    rates: createMemo(() => ratesResponse()?.rates ?? []),
    estimate: () => null,
    tradeId: createMemo(() => ratesResponse()?.trade_id ?? null),
    bestRate: createMemo(() => (ratesResponse()?.rates ?? [])[0] ?? null),
    selectedRate,
    providerCount: createMemo(() => (ratesResponse()?.rates ?? []).length),
    selectRate: setSelectedRate,
    refresh: refreshRates,
    clear: clearRates,
  };

  const selectedSourceLabel = createMemo(() => {
    const source = fromCurrency();

    if (!source) {
      return t('donation.chooseAsset');
    }

    return `${source.name} (${source.ticker.toUpperCase()} • ${source.network})`;
  });

  const targetLabel = createMemo(() => {
    const donationTarget = target();

    if (!donationTarget) {
      return t('about.donationAddress');
    }

    return donationTarget.label ?? `${donationTarget.to.toUpperCase()} Donations`;
  });

  const selectedRouteDescription = createMemo(() => {
    const rate = selectedRate();
    const donationTarget = target();

    if (!rate || !donationTarget) {
      return null;
    }

    return `Approximately ${format.number(rate.estimated_amount, 6)} ${donationTarget.to.toUpperCase()} via ${rate.provider_name}.`;
  });

  const canCreate = createMemo(() => {
    return Boolean(
      target() &&
      fromCurrency() &&
      parsedAmount() &&
      selectedRate() &&
      ratesResponse()?.trade_id &&
      !creating(),
    );
  });

  const handleAmountInput = (value: string) => {
    setAmount(normalizeAmountInput(value));
  };

  const handleCopyAddress = async () => {
    const address = target()?.recipient_address;

    if (!address) {
      return;
    }

    try {
      const copied = await copyToClipboard(address);
      if (!copied) {
        return;
      }

      setCopiedAddress(true);

      if (copiedTimer !== undefined) {
        clearTimeout(copiedTimer);
      }

      copiedTimer = setTimeout(() => {
        setCopiedAddress(false);
      }, 1800);
    } catch {
      // Leave the address visible for manual copying.
    }
  };

  const handleCreateDonation = async () => {
    const source = fromCurrency();
    const value = parsedAmount();
    const rate = selectedRate();
    const tradeId = ratesResponse()?.trade_id;

    if (!source || !value || !rate || !tradeId) {
      return;
    }

    setCreating(true);
    setCreateError(null);

    const request: CreateDonationSwapRequest = {
      trade_id: tradeId,
      from: source.ticker,
      network_from: source.network,
      amount: value,
      provider: rate.provider,
      rate_type: rate.rate_type,
    };

    try {
      const response = await swap.createDonation(request);
      navigate(`/swap/${response.swap_id}`);
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section class="donation-widget" aria-label="Hosted donation flow">
      <div class="donation-widget__header">
        <div class="donation-widget__eyebrow">{t('donation.eyebrow')}</div>
        <h2 class="donation-widget__title">{t('donation.title')}</h2>
        <p class="donation-widget__copy">{t('donation.copy')}</p>
      </div>

      <Show when={targetLoading()}>
        <div class="donation-widget__state">{t('donation.loadingTarget')}</div>
      </Show>

      <Show when={targetError()}>
        <div class="donation-widget__state donation-widget__state--error">
          <span>{targetError()}</span>
          <button class="donation-widget__retry" onClick={() => void loadTarget()} type="button">
            {t('donation.retry')}
          </button>
        </div>
      </Show>

      <Show when={target()}>
        {donationTarget => (
          <>
            <div class="donation-widget__target-card">
              <div class="donation-widget__target-head">
                <div>
                  <div class="donation-widget__target-label">{targetLabel()}</div>
                  <div class="donation-widget__target-asset">
                    {donationTarget().to.toUpperCase()} • {donationTarget().network_to}
                  </div>
                </div>
                <button class="donation-widget__copy" onClick={handleCopyAddress} type="button">
                  {copiedAddress() ? t('donation.copied') : t('donation.copyAddress')}
                </button>
              </div>

              <code class="donation-widget__address">{donationTarget().recipient_address}</code>

              <Show when={donationTarget().recipient_extra_id}>
                <div class="donation-widget__memo">
                  {t('donation.extraId')}: <strong>{donationTarget().recipient_extra_id}</strong>
                </div>
              </Show>
            </div>

            <div class="donation-widget__controls">
              <div class="donation-widget__field-group">
                <label class="donation-widget__field-label">{t('donation.youSend')}</label>
                <button
                  class="donation-widget__currency-trigger"
                  onClick={() => setSelectorOpen(true)}
                  type="button"
                >
                  <Show when={fromCurrency()?.image}>
                    <img
                      class="donation-widget__currency-icon"
                      src={fromCurrency()!.image}
                      alt={fromCurrency()!.name}
                    />
                  </Show>
                  <span>{selectedSourceLabel()}</span>
                </button>
              </div>

              <div class="donation-widget__field-group donation-widget__field-group--amount">
                <label class="donation-widget__field-label" for="donation-amount">
                  {t('donation.amount')}
                </label>
                <div class="donation-widget__amount-shell">
                  <input
                    id="donation-amount"
                    class="donation-widget__amount-input"
                    inputMode="decimal"
                    placeholder="0.001"
                    type="text"
                    value={amount()}
                    onInput={event => handleAmountInput(event.currentTarget.value)}
                  />
                  <Show when={fromCurrency()}>
                    <span class="donation-widget__amount-ticker">
                      {fromCurrency()!.ticker.toUpperCase()}
                    </span>
                  </Show>
                </div>
              </div>
            </div>

            <QuoteDiscoveryPanel
              quote={quoteController}
              rateType={selectedRateType()}
              subtitle={t('donation.chooseProviderSubtitle')}
              idleMessage={t('donation.chooseProviderIdle')}
              title={t('donation.chooseProviderTitle')}
              onRateTypeChange={setSelectedRateType}
            />

            <Show when={selectedRouteDescription()}>
              <div class="donation-widget__route-card">
                <div class="donation-widget__route-label">{t('donation.selectedRoute')}</div>
                <div class="donation-widget__route-copy">{selectedRouteDescription()}</div>
              </div>
            </Show>

            <Show when={ratesError()}>
              <div class="donation-widget__inline-error">{ratesError()}</div>
            </Show>

            <Show when={createError()}>
              <div class="donation-widget__inline-error">{createError()}</div>
            </Show>

            <div class="donation-widget__footer">
              <p class="donation-widget__note">
                {t('donation.note')}
              </p>

              <button
                class="donation-widget__submit"
                disabled={!canCreate()}
                onClick={() => void handleCreateDonation()}
                type="button"
              >
                {creating() ? t('donation.generatingCheckout') : `${t('donation.generateCheckout')} ${targetLabel()}`}
              </button>
            </div>
          </>
        )}
      </Show>

      <Show when={selectorOpen()}>
        <div class="donation-widget__selector-overlay" role="presentation">
          <div class="donation-widget__selector-backdrop" onClick={() => setSelectorOpen(false)} />
          <div class="donation-widget__selector-panel" role="dialog" aria-modal="true">
            <div class="donation-widget__selector-head">
              <div>
                <div class="donation-widget__selector-kicker">{t('donation.chooseSendAsset')}</div>
                <div class="donation-widget__selector-title">{t('donation.supportedCurrencies')}</div>
              </div>
              <button
                class="donation-widget__selector-close"
                onClick={() => setSelectorOpen(false)}
                type="button"
              >
                {t('donation.close')}
              </button>
            </div>

            <CurrencySelector
              selectedCurrency={fromCurrency()}
              onSelect={currency => {
                setFromCurrency(currency);
                setSelectorOpen(false);
              }}
            />
          </div>
        </div>
      </Show>
    </section>
  );
}
