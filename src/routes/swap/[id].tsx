import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import QRCode from 'qrcode';
import { Show, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import Header from '../../components/Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useLocale } from '../../i18n/locale';
import { useSwap } from '../../hooks/useSwap';
import type { CreateSwapResponse, SwapStatus, SwapStatusResponse } from '../../types/swap';
import { format } from '../../utils/format';
import './status.css';

type SwapPageData = Partial<CreateSwapResponse & SwapStatusResponse>;
type QrMode = 'address' | 'payment';

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
  waiting: 'No deposit confirmation yet. Send the exact amount below before the checkout expires.',
  confirming: 'Deposit detected. The provider is waiting for the required network confirmations.',
  exchanging: 'Deposit confirmed. The provider is converting your funds now.',
  sending: 'The provider is sending the payout to your destination wallet.',
  completed: 'The payout was completed successfully.',
  failed: 'The trade failed. Keep both transaction IDs and contact support.',
  refunded: 'The provider marked this trade as refunded.',
  expired: 'The checkout expired before a valid deposit was confirmed.',
};

const PROVIDER_LOGOS: Record<string, string> = {
  alfacash: '/partners/Alfacash_square.png',
  bitcoinvn: '/partners/BitcoinVN_square.webp',
  changee: '/partners/Changee_square.jpg',
  changehero: '/partners/Changehero_square.png',
  changenow: '/partners/Changenow_square.png',
  coincraddle: '/partners/CoinCraddle_square.jpg',
  easybit: '/partners/EasyBit_square.jpg',
  etz: '/partners/ETZ_square.jpg',
  exolix: '/partners/Exolix_square.jpg',
  explace: '/partners/Explace_square.jpg',
  exwell: '/partners/ExWell_square.webp',
  fixedfloat: '/partners/FixedFloat_square.svg',
  godex: '/partners/Godex_square.png',
  goexme: '/partners/Goexme_square.webp',
  letsexchange: '/partners/LetsExchange_square.png',
  mtpelerin: '/partners/MtPelerin_square.png',
  pegasusswap: '/partners/Pegasusswap_square.jpg',
  quickex: '/partners/Quickex_square.webp',
  simpleswap: '/partners/Simpleswap_square.png',
  stealthex: '/partners/StealthEX_square.png',
  swapgate: '/partners/Swapgate_square.png',
  swaptrade: '/partners/Swaptrade_square.webp',
  swapter: '/partners/Swapter_square.png',
  swapuz: '/partners/Swapuz_square.png',
  wizardswap: '/partners/WizardSwap_square.jpg',
  xchange: '/partners/XChange_square.png',
  xgram: '/partners/XGram_square.jpg',
};

const PROVIDER_SUPPORT: Record<string, string> = {
  changehero: 'https://changehero.io/contact',
  changenow: 'https://support.changenow.io/hc/en-us',
  easybit: 'https://easybit.com/en/contact',
  exolix: 'https://exolix.com/contact',
  fixedfloat: 'https://ff.io/support',
  letsexchange: 'https://letsexchange.io/contact',
  simpleswap: 'https://simpleswap.io/contact-us',
  stealthex: 'https://stealthex.io/contacts',
};

const normalizeProvider = (provider?: string): string =>
  provider?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';

const providerLogo = (provider?: string): string | undefined =>
  PROVIDER_LOGOS[normalizeProvider(provider)];

const providerSupport = (provider?: string): string | undefined =>
  PROVIDER_SUPPORT[normalizeProvider(provider)];

const mergeDefinedFields = (base: SwapPageData, next: SwapPageData): SwapPageData => {
  const merged: SwapPageData = { ...base };

  Object.entries(next).forEach(([key, value]) => {
    if (value !== undefined) {
      merged[key as keyof SwapPageData] = value as never;
    }
  });

  return merged;
};

const isCreateSwapResponse = (
  swap: CreateSwapResponse | SwapStatusResponse | null,
): swap is CreateSwapResponse => Boolean(swap && 'deposit_amount' in swap);

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
    return 'Not supplied';
  }

  const expiresAt = new Date(value).getTime();
  if (!Number.isFinite(expiresAt)) {
    return 'Not supplied';
  }

  const diff = Math.max(0, expiresAt - now);
  if (diff === 0) {
    return 'Expired';
  }

  const seconds = Math.floor(diff / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  return hours > 0 ? `${hours}h ${minutes}m ${remainder}s` : `${minutes}m ${remainder}s`;
};

const getStatusTone = (status?: SwapStatus): 'neutral' | 'warning' | 'success' | 'danger' => {
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

const isTerminalStatus = (status?: SwapStatus): boolean =>
  Boolean(status && ['completed', 'failed', 'refunded', 'expired'].includes(status));

const nativePaymentUri = (
  ticker: string | undefined,
  network: string | undefined,
  address: string | undefined,
  amount: number | null,
): string | null => {
  if (!ticker || !address || amount === null) {
    return null;
  }

  const normalizedTicker = ticker.toLowerCase();
  const normalizedNetwork = network?.toLowerCase() ?? '';
  const isNativeNetwork = !normalizedNetwork || normalizedNetwork === 'mainnet';

  if (!isNativeNetwork) {
    return null;
  }

  const encodedAmount = encodeURIComponent(String(amount));
  const cleanAddress = address.replace(/^bitcoincash:/i, '');
  const schemes: Record<string, string> = {
    btc: 'bitcoin',
    bch: 'bitcoincash',
    dash: 'dash',
    doge: 'dogecoin',
    ltc: 'litecoin',
    zec: 'zcash',
  };

  if (normalizedTicker === 'xmr') {
    return `monero:${address}?tx_amount=${encodedAmount}`;
  }

  if (normalizedTicker === 'sol') {
    return `solana:${address}?amount=${encodedAmount}`;
  }

  const scheme = schemes[normalizedTicker];
  return scheme ? `${scheme}:${cleanAddress}?amount=${encodedAmount}` : null;
};

const fallbackCurrencyIcon = (ticker?: string): string | undefined => {
  const normalized = ticker?.toLowerCase();
  return normalized && ['btc', 'xmr', 'usd'].includes(normalized)
    ? `/country/icons/${normalized}.svg`
    : undefined;
};

export default function SwapStatusPage() {
  const { t } = useLocale();
  const params = useParams();
  const swap = useSwap();
  const { currencies } = useCurrencies();
  const [seedSwap, setSeedSwap] = createSignal<CreateSwapResponse | null>(null);
  const [now, setNow] = createSignal(Date.now());
  const [refreshing, setRefreshing] = createSignal(false);
  const [copiedField, setCopiedField] = createSignal<string | null>(null);
  const [qrOpen, setQrOpen] = createSignal(false);
  const [qrMode, setQrMode] = createSignal<QrMode>('address');
  const [qrDataUrl, setQrDataUrl] = createSignal('');
  const [qrLoading, setQrLoading] = createSignal(false);
  const [qrError, setQrError] = createSignal<string | null>(null);

  let copiedFieldTimer: number | undefined;
  let qrRequest = 0;

  const swapId = createMemo(() => params.id?.trim() ?? '');
  const activeSwap = createMemo(() => {
    const current = swap.activeSwap();
    return current?.swap_id === swapId() ? current : null;
  });

  createEffect(() => {
    const current = activeSwap();
    if (isCreateSwapResponse(current)) {
      setSeedSwap(existing => existing?.swap_id === current.swap_id ? existing : current);
    }
  });

  createEffect(on(swapId, id => {
    setSeedSwap(existing => existing?.swap_id === id ? existing : null);
    swap.stopPolling();
    swap.clearError();

    if (id) {
      void swap.startPolling(id).catch(() => undefined);
    }
  }));

  onMount(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => window.clearInterval(timer));
  });

  onCleanup(() => {
    swap.stopPolling();
    qrRequest += 1;
    if (copiedFieldTimer !== undefined) {
      window.clearTimeout(copiedFieldTimer);
    }
  });

  const pageData = createMemo<SwapPageData | null>(() => {
    const initial = seedSwap();
    const current = activeSwap();
    return initial || current ? mergeDefinedFields(initial ?? {}, current ?? {}) : null;
  });

  const resolveCurrency = (ticker?: string, network?: string) => {
    if (!ticker) {
      return null;
    }

    const normalizedTicker = ticker.toLowerCase();
    const normalizedNetwork = network?.toLowerCase();
    return currencies().find(currency =>
      currency.ticker.toLowerCase() === normalizedTicker &&
      (!normalizedNetwork || currency.network.toLowerCase() === normalizedNetwork)
    ) ?? currencies().find(currency => currency.ticker.toLowerCase() === normalizedTicker) ?? null;
  };

  const sendCurrency = createMemo(() => resolveCurrency(pageData()?.from, pageData()?.network_from));
  const receiveCurrency = createMemo(() => resolveCurrency(pageData()?.to, pageData()?.network_to));
  const sendAmount = createMemo(() => pageData()?.deposit_amount ?? pageData()?.amount ?? null);
  const receiveAmount = createMemo(() => pageData()?.actual_receive ?? pageData()?.estimated_receive ?? null);
  const sendIcon = createMemo(() => sendCurrency()?.image || fallbackCurrencyIcon(pageData()?.from));
  const receiveIcon = createMemo(() => receiveCurrency()?.image || fallbackCurrencyIcon(pageData()?.to));
  const statusTone = createMemo(() => getStatusTone(pageData()?.status));
  const paymentUri = createMemo(() => nativePaymentUri(
    pageData()?.from,
    pageData()?.network_from,
    pageData()?.deposit_address,
    sendAmount(),
  ));
  const qrPayload = createMemo(() =>
    qrMode() === 'payment' && paymentUri()
      ? paymentUri()!
      : pageData()?.deposit_address ?? ''
  );

  createEffect(() => {
    if (!paymentUri() && qrMode() === 'payment') {
      setQrMode('address');
    }
  });

  createEffect(() => {
    const open = qrOpen();
    const payload = qrPayload();
    const request = ++qrRequest;

    if (!open || !payload) {
      setQrDataUrl('');
      setQrError(null);
      return;
    }

    setQrLoading(true);
    setQrError(null);
    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 420,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(url => {
      if (request === qrRequest) {
        setQrDataUrl(url);
      }
    }).catch(() => {
      if (request === qrRequest) {
        setQrError('QR generation failed. Copy the address instead.');
      }
    }).finally(() => {
      if (request === qrRequest) {
        setQrLoading(false);
      }
    });
  });

  const writeToClipboard = async (value: string): Promise<boolean> => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
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
      if (!await writeToClipboard(value)) {
        return;
      }

      setCopiedField(field);
      if (copiedFieldTimer !== undefined) {
        window.clearTimeout(copiedFieldTimer);
      }
      copiedFieldTimer = window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // The visible value remains available for manual copying.
    }
  };

  const refreshStatus = async () => {
    if (!swapId()) {
      return;
    }

    setRefreshing(true);
    try {
      swap.stopPolling();
      await swap.startPolling(swapId());
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main class="swap-status-page">
      <Title>{`${t('status.pageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="swap-status-page__shell">
        <div class="swap-status-page__intro">
          <div>
            <div class="swap-status-page__eyebrow">{t('status.eyebrow')}</div>
            <h1 class="swap-status-page__title">Deposit once. Track every step.</h1>
            <p class="swap-status-page__copy">Keep this page open until the payout is complete.</p>
          </div>
          <Show when={swapId()}>
            <button
              class="swap-status-page__id"
              type="button"
              onClick={() => void copyFieldValue('header-id', swapId())}
            >
              <span>Assetar ID</span>
              <code>{swapId()}</code>
              <strong>{copiedField() === 'header-id' ? 'Copied' : 'Copy'}</strong>
            </button>
          </Show>
        </div>

        <Show when={pageData()} fallback={
          <div class="swap-status-card swap-status-card--empty">
            <div class="swap-status-card__section-title">{t('status.transactionLookup')}</div>
            <p class="swap-status-card__message">
              {swap.error() ?? (swapId() ? t('status.loadingDetails') : t('status.noSwapId'))}
            </p>
            <Show when={swapId()}>
              <button class="swap-status-card__refresh" disabled={refreshing()} onClick={() => void refreshStatus()} type="button">
                {refreshing() ? t('status.refreshing') : t('status.retryStatus')}
              </button>
            </Show>
          </div>
        }>
          {detail => (
            <div class="swap-status-page__layout">
              <div class="swap-status-page__main-column">
                <section class="swap-status-card swap-status-card--provider">
                  <div class="swap-status-card__provider-identity">
                    <Show
                      when={providerLogo(detail().provider)}
                      fallback={<div class="swap-status-card__provider-fallback">{detail().provider?.slice(0, 2).toUpperCase() ?? 'EX'}</div>}
                    >
                      <img src={providerLogo(detail().provider)} alt="" />
                    </Show>
                    <div>
                      <div class="swap-status-card__eyebrow">{t('status.chosenProvider')}</div>
                      <div class="swap-status-card__provider">{detail().provider ?? t('status.pendingProvider')}</div>
                    </div>
                  </div>
                  <div class={`swap-status-card__status swap-status-card__status--${statusTone()}`}>
                    {detail().status ? STATUS_LABELS[detail().status] : t('status.checkingStatus')}
                  </div>
                </section>

                <section class="swap-status-card swap-status-card--checkout">
                  <div class="swap-status-card__route">
                    <div class="swap-status-card__asset-row">
                      <div class="swap-status-card__asset-copy">
                        <span>{t('status.sendAmount')}</span>
                        <strong>{sendAmount() === null ? '—' : format.number(sendAmount()!, 8)}</strong>
                      </div>
                      <div class="swap-status-card__asset">
                        <Show when={sendIcon()}><img src={sendIcon()} alt="" /></Show>
                        <div>
                          <strong>{detail().from_name ?? sendCurrency()?.name ?? detail().from ?? 'Unknown asset'}</strong>
                          <span>{detail().from?.toUpperCase()} · {detail().network_from ?? sendCurrency()?.network ?? 'Network unavailable'}</span>
                        </div>
                      </div>
                    </div>

                    <div class="swap-status-card__route-divider"><span>to</span></div>

                    <div class="swap-status-card__asset-row">
                      <div class="swap-status-card__asset-copy">
                        <span>{detail().actual_receive ? t('status.receivedAmount') : 'Expected receive'}</span>
                        <strong>{receiveAmount() === null ? '—' : format.number(receiveAmount()!, 8)}</strong>
                      </div>
                      <div class="swap-status-card__asset">
                        <Show when={receiveIcon()}><img src={receiveIcon()} alt="" /></Show>
                        <div>
                          <strong>{detail().to_name ?? receiveCurrency()?.name ?? detail().to ?? 'Unknown asset'}</strong>
                          <span>{detail().to?.toUpperCase()} · {detail().network_to ?? receiveCurrency()?.network ?? 'Network unavailable'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="swap-status-card__deposit">
                    <div class="swap-status-card__deposit-heading">
                      <span>Transfer exactly</span>
                      <strong>{sendAmount() === null ? '—' : format.currency(sendAmount()!, detail().from ?? '')}</strong>
                      <span>on {detail().network_from ?? sendCurrency()?.network ?? 'the selected network'}</span>
                    </div>
                    <p>Send one transaction to this deposit address. Do not send a different asset or network.</p>

                    <div class="swap-status-card__address-block">
                      <div class="swap-status-card__field-head">
                        <span class="swap-status-card__field-label">{t('status.depositAddress')}</span>
                        <div class="swap-status-card__field-actions">
                          <button type="button" onClick={() => void copyFieldValue('deposit-address', detail().deposit_address)}>
                            {copiedField() === 'deposit-address' ? 'Copied' : 'Copy'}
                          </button>
                          <button type="button" onClick={() => setQrOpen(value => !value)}>
                            {qrOpen() ? 'Hide QR' : 'Show QR'}
                          </button>
                        </div>
                      </div>
                      <code>{detail().deposit_address ?? t('status.unavailable')}</code>
                    </div>

                    <Show when={detail().deposit_extra_id}>
                      <div class="swap-status-card__memo-block">
                        <div>
                          <span>{t('status.depositMemo')}</span>
                          <strong>Required with your transfer</strong>
                        </div>
                        <code>{detail().deposit_extra_id}</code>
                        <button type="button" onClick={() => void copyFieldValue('deposit-memo', detail().deposit_extra_id)}>
                          {copiedField() === 'deposit-memo' ? 'Copied' : 'Copy memo'}
                        </button>
                      </div>
                    </Show>

                    <Show when={qrOpen()}>
                      <div class="swap-status-card__qr-panel">
                        <div class="swap-status-card__qr-tabs" role="tablist" aria-label="QR content">
                          <button classList={{ active: qrMode() === 'address' }} type="button" onClick={() => setQrMode('address')}>Address only</button>
                          <Show when={paymentUri()}>
                            <button classList={{ active: qrMode() === 'payment' }} type="button" onClick={() => setQrMode('payment')}>URI with amount</button>
                          </Show>
                        </div>
                        <div class="swap-status-card__qr-canvas" aria-live="polite">
                          <Show when={qrLoading()}><div class="swap-status-card__qr-loading">Generating secure QR…</div></Show>
                          <Show when={!qrLoading() && qrDataUrl()}>
                            <img src={qrDataUrl()} alt={qrMode() === 'payment' ? 'Payment QR code with deposit amount' : 'Deposit address QR code'} />
                          </Show>
                          <Show when={qrError()}><div class="swap-status-card__error">{qrError()}</div></Show>
                        </div>
                        <div class="swap-status-card__qr-caption">
                          <span>{qrMode() === 'payment' ? 'Includes address and amount' : 'Address only'}</span>
                          <Show when={qrMode() === 'payment' && paymentUri()}>
                            <a href={paymentUri()!}>Open wallet</a>
                          </Show>
                        </div>
                      </div>
                    </Show>
                  </div>

                  <div class="swap-status-card__warning">{t('status.warning')}</div>

                  <div class="swap-status-card__recipient">
                    <div>
                      <span>{t('status.recipientAddress')}</span>
                      <strong>{detail().to?.toUpperCase()} on {detail().network_to ?? receiveCurrency()?.network ?? 'selected network'}</strong>
                    </div>
                    <button type="button" onClick={() => void copyFieldValue('recipient-address', detail().recipient_address)}>
                      <code>{detail().recipient_address ?? t('status.unavailable')}</code>
                      <span>{copiedField() === 'recipient-address' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div class="swap-status-card__live-status" aria-live="polite">
                    <Show when={!isTerminalStatus(detail().status)}><div class="swap-status-card__spinner" /></Show>
                    <div>
                      <span>Live transaction status</span>
                      <strong>{detail().status ? STATUS_LABELS[detail().status] : t('status.checkingStatus')}</strong>
                      <p>{detail().status ? STATUS_MESSAGES[detail().status] : t('status.loadingLatest')}</p>
                    </div>
                  </div>

                  <Show when={detail().error}>
                    <div class="swap-status-card__error">{detail().error}</div>
                  </Show>

                  <div class="swap-status-card__actions">
                    <button class="swap-status-card__refresh" disabled={refreshing()} onClick={() => void refreshStatus()} type="button">
                      {refreshing() ? t('status.refreshing') : t('status.refreshTransaction')}
                    </button>
                    <Show when={swap.polling()}><span class="swap-status-card__polling">Automatic updates are on</span></Show>
                  </div>
                </section>
              </div>

              <aside class="swap-status-page__sidebar">
                <section class="swap-status-card swap-status-card--timing">
                  <div class="swap-status-card__section-head">
                    <div>
                      <span class="swap-status-card__eyebrow">Deposit window</span>
                      <div class="swap-status-card__section-title">Checkout expiration</div>
                    </div>
                    <strong class="swap-status-card__countdown">{formatCountdown(detail().expires_at, now())}</strong>
                  </div>
                  <div class="swap-status-card__table">
                    <div class="swap-status-card__table-row"><span>{t('status.created')}</span><strong>{formatTimestamp(detail().created_at)}</strong></div>
                    <div class="swap-status-card__table-row"><span>{t('status.currentTime')}</span><strong>{formatTimestamp(new Date(now()).toISOString())}</strong></div>
                    <div class="swap-status-card__table-row"><span>{t('status.expires')}</span><strong>{formatTimestamp(detail().expires_at)}</strong></div>
                  </div>
                  <p class="swap-status-card__timing-note">Send promptly and use an appropriate network fee so the provider sees the deposit before expiry.</p>
                </section>

                <section class="swap-status-card">
                  <div class="swap-status-card__section-title">Contact support</div>
                  <p class="swap-status-card__message">Keep the Assetar ID and provider ID when asking for help.</p>
                  <div class="swap-status-card__support-list">
                    <Show when={providerSupport(detail().provider)}>
                      <a href={providerSupport(detail().provider)} target="_blank" rel="noreferrer"><span>{detail().provider} support</span><strong>Open website</strong></a>
                    </Show>
                    <a href="https://t.me/AssetarSupportBot" target="_blank" rel="noreferrer"><span>Assetar support</span><strong>@AssetarSupportBot</strong></a>
                    <a href="mailto:support@assetar.app"><span>Email</span><strong>support@assetar.app</strong></a>
                  </div>
                </section>

                <section class="swap-status-card">
                  <div class="swap-status-card__section-title">{t('status.details')}</div>
                  <div class="swap-status-card__table">
                    <button class="swap-status-card__table-row swap-status-card__table-row--button" type="button" onClick={() => void copyFieldValue('assetar-id', detail().swap_id)}>
                      <span>{t('status.assetarId')}</span><strong>{copiedField() === 'assetar-id' ? 'Copied' : detail().swap_id ?? '—'}</strong>
                    </button>
                    <div class="swap-status-card__table-row"><span>{t('status.exchange')}</span><strong>{detail().provider ?? '—'}</strong></div>
                    <div class="swap-status-card__table-row"><span>{t('status.rateType')}</span><strong>{detail().rate_type ?? '—'}</strong></div>
                    <div class="swap-status-card__table-row"><span>{t('status.status')}</span><strong>{detail().status ? STATUS_LABELS[detail().status] : '—'}</strong></div>
                    <Show when={detail().provider_swap_id}>
                      <button class="swap-status-card__table-row swap-status-card__table-row--button" type="button" onClick={() => void copyFieldValue('provider-id', detail().provider_swap_id)}>
                        <span>{t('status.providerId')}</span><strong>{copiedField() === 'provider-id' ? 'Copied' : detail().provider_swap_id}</strong>
                      </button>
                    </Show>
                    <Show when={detail().tx_hash_in}><div class="swap-status-card__table-row swap-status-card__table-row--full"><span>{t('status.depositTx')}</span><code>{detail().tx_hash_in}</code></div></Show>
                    <Show when={detail().tx_hash_out}><div class="swap-status-card__table-row swap-status-card__table-row--full"><span>{t('status.payoutTx')}</span><code>{detail().tx_hash_out}</code></div></Show>
                  </div>
                  <p class="swap-status-card__counterparty">The selected provider is the counterparty for this trade. Assetar routes and monitors the transaction but does not custody your funds.</p>
                </section>
              </aside>
            </div>
          )}
        </Show>
      </section>

      <SiteFooter />
    </main>
  );
}
