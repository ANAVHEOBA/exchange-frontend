import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { Show, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import Header from '../../components/Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useSwap } from '../../hooks/useSwap';
import type { CreateSwapResponse, SwapStatus, SwapStatusResponse } from '../../types/swap';
import { format } from '../../utils/format';
import './status.css';

type SwapPageData = Partial<CreateSwapResponse & SwapStatusResponse>;

const STATUS_LABELS: Record<SwapStatus, string> = {
  waiting: 'Waiting for Funds',
  confirming: 'Confirming Deposit',
  exchanging: 'Exchanging',
  sending: 'Sending Payout',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
  expired: 'Expired',
};

const STATUS_MESSAGES: Record<SwapStatus, string> = {
  waiting: 'Send the exact deposit amount to the address below before the quote expires.',
  confirming: 'Your deposit was detected and is waiting for enough network confirmations.',
  exchanging: 'The provider is executing the conversion now.',
  sending: 'The payout transaction is being sent to your destination address.',
  completed: 'The swap has completed successfully.',
  failed: 'The swap failed. Review the details and contact support if needed.',
  refunded: 'The provider marked this swap as refunded.',
  expired: 'This swap expired before a valid deposit was confirmed.',
};

const isCreateSwapResponse = (
  swap: CreateSwapResponse | SwapStatusResponse | null,
): swap is CreateSwapResponse => {
  return Boolean(swap && 'deposit_amount' in swap);
};

const formatTimestamp = (value?: string): string => {
  if (!value) {
    return '—';
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

const formatCountdown = (value: string | undefined, now: number): string => {
  if (!value) {
    return '—';
  }

  const expiresAt = new Date(value).getTime();
  if (!Number.isFinite(expiresAt)) {
    return '—';
  }

  const diffMs = expiresAt - now;
  if (diffMs <= 0) {
    return 'Expired';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const formatStatus = (status?: SwapStatus): string => {
  if (!status) {
    return 'Checking status';
  }

  return STATUS_LABELS[status];
};

const formatStatusMessage = (status?: SwapStatus): string => {
  if (!status) {
    return 'Loading the latest transaction details.';
  }

  return STATUS_MESSAGES[status];
};

const getStatusTone = (status?: SwapStatus): 'neutral' | 'warning' | 'success' | 'danger' => {
  if (!status) {
    return 'neutral';
  }

  if (status === 'completed') {
    return 'success';
  }

  if (status === 'failed' || status === 'expired' || status === 'refunded') {
    return 'danger';
  }

  if (status === 'waiting' || status === 'confirming') {
    return 'warning';
  }

  return 'neutral';
};

export default function SwapStatusPage() {
  const params = useParams();
  const swap = useSwap();
  const { currencies } = useCurrencies();
  const [seedSwap, setSeedSwap] = createSignal<CreateSwapResponse | null>(null);
  const [now, setNow] = createSignal(Date.now());
  const [refreshing, setRefreshing] = createSignal(false);
  const [copiedField, setCopiedField] = createSignal<string | null>(null);

  let copiedFieldTimer: number | undefined;

  const swapId = createMemo(() => params.id?.trim() ?? '');

  const activeSwap = createMemo(() => {
    const current = swap.activeSwap();
    const id = swapId();

    if (!current || current.swap_id !== id) {
      return null;
    }

    return current;
  });

  createEffect(() => {
    const current = activeSwap();

    if (!isCreateSwapResponse(current)) {
      return;
    }

    setSeedSwap(existing => {
      if (existing?.swap_id === current.swap_id) {
        return existing;
      }

      return current;
    });
  });

  createEffect(on(swapId, id => {
    setSeedSwap(existing => (existing?.swap_id === id ? existing : null));
    swap.stopPolling();
    swap.clearError();

    if (!id) {
      return;
    }

    void swap.startPolling(id).catch(() => {
      // Store state already captures the error for rendering.
    });
  }));

  onMount(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    onCleanup(() => {
      window.clearInterval(timer);
      swap.stopPolling();
    });
  });

  const pageData = createMemo<SwapPageData | null>(() => {
    const initial = seedSwap();
    const current = activeSwap();

    if (!initial && !current) {
      return null;
    }

    return {
      ...(initial ?? {}),
      ...(current ?? {}),
    };
  });

  const resolveCurrency = (ticker?: string, network?: string) => {
    if (!ticker) {
      return null;
    }

    const normalizedTicker = ticker.toLowerCase();
    const normalizedNetwork = network?.toLowerCase();

    return (
      currencies().find(currency => {
        const tickerMatches = currency.ticker.toLowerCase() === normalizedTicker;
        const networkMatches = normalizedNetwork
          ? currency.network.toLowerCase() === normalizedNetwork
          : true;

        return tickerMatches && networkMatches;
      }) ??
      currencies().find(currency => currency.ticker.toLowerCase() === normalizedTicker) ??
      null
    );
  };

  const sendCurrency = createMemo(() => {
    const data = pageData();
    return resolveCurrency(data?.from, data?.network_from);
  });

  const receiveCurrency = createMemo(() => {
    const data = pageData();
    return resolveCurrency(data?.to, data?.network_to);
  });

  const sendAmount = createMemo(() => {
    const data = pageData();
    return data?.deposit_amount ?? data?.amount ?? null;
  });

  const receiveAmount = createMemo(() => {
    return pageData()?.actual_receive ?? pageData()?.estimated_receive ?? null;
  });

  const statusTone = createMemo(() => getStatusTone(pageData()?.status));

  onCleanup(() => {
    if (copiedFieldTimer !== undefined) {
      window.clearTimeout(copiedFieldTimer);
    }
  });

  const writeToClipboard = async (value: string): Promise<boolean> => {
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

  const copyFieldValue = async (field: string, value?: string) => {
    if (!value) {
      return;
    }

    try {
      const copied = await writeToClipboard(value);

      if (!copied) {
        return;
      }

      setCopiedField(field);

      if (copiedFieldTimer !== undefined) {
        window.clearTimeout(copiedFieldTimer);
      }

      copiedFieldTimer = window.setTimeout(() => {
        setCopiedField(current => (current === field ? null : current));
      }, 1800);
    } catch {
      // Ignore clipboard failures. The field remains visible for manual copying.
    }
  };

  const refreshStatus = async () => {
    const id = swapId();

    if (!id) {
      return;
    }

    setRefreshing(true);

    try {
      swap.stopPolling();
      await swap.startPolling(id);
    } catch {
      // Store state already captures the error for rendering.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main class="swap-status-page">
      <Title>Swap Status | ASSETAR</Title>
      <Header />

      <section class="swap-status-page__shell">
        <div class="swap-status-page__intro">
          <div class="swap-status-page__eyebrow">Checkout</div>
          <h1 class="swap-status-page__title">Track your live transaction from deposit to payout.</h1>
          <p class="swap-status-page__copy">
            This page keeps the deposit instructions visible while the backend refreshes the
            latest provider status in the background.
          </p>
        </div>

        <Show when={pageData()} fallback={
          <div class="swap-status-card swap-status-card--empty">
            <div class="swap-status-card__section-title">Transaction lookup</div>
            <p class="swap-status-card__message">
              {swap.error() ?? (swapId() ? 'Loading transaction details...' : 'No swap id provided.')}
            </p>
            <Show when={swapId()}>
              <button
                class="swap-status-card__refresh"
                disabled={refreshing()}
                onClick={() => {
                  void refreshStatus();
                }}
                type="button"
              >
                {refreshing() ? 'Refreshing...' : 'Retry Status Check'}
              </button>
            </Show>
          </div>
        }>
          {detail => (
            <div class="swap-status-page__layout">
              <section class="swap-status-card swap-status-card--primary">
                <div class="swap-status-card__provider-block">
                  <div>
                    <div class="swap-status-card__eyebrow">Chosen Provider</div>
                    <div class="swap-status-card__provider">{detail().provider ?? 'Pending provider'}</div>
                  </div>
                  <div
                    class={`swap-status-card__status swap-status-card__status--${statusTone()}`}
                  >
                    {formatStatus(detail().status)}
                  </div>
                </div>

                <p class="swap-status-card__message">{formatStatusMessage(detail().status)}</p>

                <div class="swap-status-card__amount-grid">
                  <div class="swap-status-card__amount-box">
                    <span class="swap-status-card__amount-label">You’ll send</span>
                    <strong>
                      {sendAmount() !== null
                        ? format.currency(sendAmount()!, detail().from ?? '')
                        : '—'}
                    </strong>
                    <span>
                      {detail().from_name ?? sendCurrency()?.name ?? detail().from ?? 'Unknown asset'}
                    </span>
                    <Show when={detail().network_from ?? sendCurrency()?.network}>
                      <span>{detail().network_from ?? sendCurrency()?.network}</span>
                    </Show>
                  </div>

                  <div class="swap-status-card__amount-box">
                    <span class="swap-status-card__amount-label">
                      {detail().actual_receive ? 'You received' : 'You’ll receive'}
                    </span>
                    <strong>
                      {receiveAmount() !== null
                        ? format.currency(receiveAmount()!, detail().to ?? '')
                        : '—'}
                    </strong>
                    <span>{detail().to_name ?? receiveCurrency()?.name ?? detail().to ?? 'Unknown asset'}</span>
                    <Show when={detail().network_to ?? receiveCurrency()?.network}>
                      <span>{detail().network_to ?? receiveCurrency()?.network}</span>
                    </Show>
                  </div>
                </div>

                <div class="swap-status-card__field-stack">
                  <div class="swap-status-card__field">
                    <div class="swap-status-card__field-head">
                      <span class="swap-status-card__field-label">Send funds to this deposit address</span>
                      <button
                        class="swap-status-card__copy"
                        disabled={!detail().deposit_address}
                        onClick={() => {
                          void copyFieldValue('deposit-address', detail().deposit_address);
                        }}
                        type="button"
                      >
                        {copiedField() === 'deposit-address' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <code>{detail().deposit_address ?? 'Unavailable'}</code>
                  </div>

                  <Show when={detail().deposit_extra_id}>
                    <div class="swap-status-card__field">
                      <span class="swap-status-card__field-label">Deposit memo / extra id</span>
                      <code>{detail().deposit_extra_id}</code>
                    </div>
                  </Show>

                  <div class="swap-status-card__field">
                    <div class="swap-status-card__field-head">
                      <span class="swap-status-card__field-label">Recipient address</span>
                      <button
                        class="swap-status-card__copy"
                        disabled={!detail().recipient_address}
                        onClick={() => {
                          void copyFieldValue('recipient-address', detail().recipient_address);
                        }}
                        type="button"
                      >
                        {copiedField() === 'recipient-address' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <code>{detail().recipient_address ?? 'Unavailable'}</code>
                  </div>

                  <Show when={detail().recipient_extra_id}>
                    <div class="swap-status-card__field">
                      <span class="swap-status-card__field-label">Recipient memo / extra id</span>
                      <code>{detail().recipient_extra_id}</code>
                    </div>
                  </Show>
                </div>

                <div class="swap-status-card__warning">
                  Do not send funds from mixers, gambling sources, or wallets likely to trigger AML
                  review. Send the exact amount shown above.
                </div>

                <div class="swap-status-card__actions">
                  <button
                    class="swap-status-card__refresh"
                    disabled={refreshing()}
                    onClick={() => {
                      void refreshStatus();
                    }}
                    type="button"
                  >
                    {refreshing() ? 'Refreshing...' : 'Refresh Transaction Status'}
                  </button>

                  <Show when={swap.polling()}>
                    <span class="swap-status-card__polling">Live polling active</span>
                  </Show>
                </div>
              </section>

              <div class="swap-status-page__sidebar">
                <section class="swap-status-card">
                  <div class="swap-status-card__section-title">Timing</div>
                  <div class="swap-status-card__table">
                    <div class="swap-status-card__table-row">
                      <span>Created</span>
                      <strong>{formatTimestamp(detail().created_at)}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Current time</span>
                      <strong>{formatTimestamp(new Date(now()).toISOString())}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Last update</span>
                      <strong>{formatTimestamp(detail().updated_at ?? detail().created_at)}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Expires</span>
                      <strong>{formatTimestamp(detail().expires_at)}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Time remaining</span>
                      <strong>{formatCountdown(detail().expires_at, now())}</strong>
                    </div>
                  </div>
                </section>

                <section class="swap-status-card">
                  <div class="swap-status-card__section-title">Transaction Details</div>
                  <div class="swap-status-card__table">
                    <div class="swap-status-card__table-row">
                      <span>Assetar ID</span>
                      <strong>{detail().swap_id ?? '—'}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Exchange</span>
                      <strong>{detail().provider ?? '—'}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Rate Type</span>
                      <strong>{detail().rate_type ?? '—'}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Status</span>
                      <strong>{formatStatus(detail().status)}</strong>
                    </div>
                    <div class="swap-status-card__table-row">
                      <span>Rate</span>
                      <strong>{detail().rate ? format.number(detail().rate, 6) : '—'}</strong>
                    </div>
                    <Show when={detail().provider_swap_id}>
                      <div class="swap-status-card__table-row">
                        <span>Provider ID</span>
                        <strong>{detail().provider_swap_id}</strong>
                      </div>
                    </Show>
                    <Show when={detail().tx_hash_in}>
                      <div class="swap-status-card__table-row swap-status-card__table-row--full">
                        <span>Deposit tx</span>
                        <code>{detail().tx_hash_in}</code>
                      </div>
                    </Show>
                    <Show when={detail().tx_hash_out}>
                      <div class="swap-status-card__table-row swap-status-card__table-row--full">
                        <span>Payout tx</span>
                        <code>{detail().tx_hash_out}</code>
                      </div>
                    </Show>
                  </div>
                </section>

                <section class="swap-status-card">
                  <div class="swap-status-card__section-title">Need Help?</div>
                  <p class="swap-status-card__message">
                    If the status stalls or the swap fails, keep this transaction id and contact the
                    selected exchange or Assetar support with the full swap details shown here.
                  </p>
                  <Show when={swap.error()}>
                    <div class="swap-status-card__error">{swap.error()}</div>
                  </Show>
                </section>
              </div>
            </div>
          )}
        </Show>
      </section>

      <SiteFooter />
    </main>
  );
}
