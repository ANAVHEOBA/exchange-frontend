import { Title } from '@solidjs/meta';
import { useParams, useSearchParams } from '@solidjs/router';
import QRCode from 'qrcode';
import { Show, createEffect, createMemo, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import Header from '../../../components/Header/Header';
import SiteFooter from '../../../components/SiteFooter/SiteFooter';
import { giftcardsApi } from '../../../api/endpoints/giftcards';
import {
  buildGiftcardPaymentUri,
  shouldStopGiftcardOrderPolling,
  type GiftcardQrMode,
} from './order-status.model';
import type { GiftCardOrderResponse } from '../../../types/giftcard';
import './order-status.css';

const safeDecode = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readSearchParam = (value?: string | string[]): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

const formatUtcTime = (value?: Date | string | null): string => {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return `${new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date)} UTC`;
};

const addMinutes = (value?: string | null, minutes = 15): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getTime() + minutes * 60_000);
};

const titleCase = (value?: string | null): string => {
  if (!value) {
    return 'Waiting for funds';
  }

  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
};

const formatCryptoValue = (value?: number | null): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 12,
    useGrouping: false,
  }).format(value);
};

const parseNumericAmount = (value?: string | null): number | null => {
  const normalized = value?.trim().replaceAll(',', '') ?? '';
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCardValue = (
  detailsValue?: string | null,
  queryValue?: string | null,
  queryCurrency?: string | null,
): string => {
  const value = queryValue?.trim();
  const currency = queryCurrency?.trim().toUpperCase();
  if (value && currency) {
    const parsed = Number(value);
    const amount = Number.isFinite(parsed) ? parsed.toFixed(2) : value;
    return `${amount} ${currency}`;
  }

  const detail = detailsValue?.trim();
  if (detail) {
    return detail;
  }

  return '—';
};

const nearlyEqual = (left: number, right: number): boolean => {
  return Math.abs(left - right) <= Math.max(0.000001, Math.abs(right) * 0.0001);
};

const hasProviderCryptoAmount = (
  record: GiftCardOrderResponse,
  requestedCardValue?: string | null,
): boolean => {
  const amount = record.amount_from;
  if (!Number.isFinite(amount) || amount <= 0 || !record.deposit_address) {
    return false;
  }

  const requestedAmount = parseNumericAmount(requestedCardValue);
  if (requestedAmount !== null && nearlyEqual(amount, requestedAmount)) {
    return false;
  }

  const detailAmount = parseNumericAmount(record.details?.value);
  if (detailAmount !== null && nearlyEqual(amount, detailAmount)) {
    return false;
  }

  if (record.ticker_from.toLowerCase() === 'xmr' && amount >= 5) {
    return false;
  }

  return true;
};

export default function GiftCardOrderStatusPage() {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [refreshing, setRefreshing] = createSignal(false);
  const [copiedField, setCopiedField] = createSignal<string | null>(null);
  const [qrMode, setQrMode] = createSignal<GiftcardQrMode>('address');
  const [qrDataUrl, setQrDataUrl] = createSignal('');
  const [qrLoading, setQrLoading] = createSignal(false);
  const [qrError, setQrError] = createSignal<string | null>(null);
  const [now, setNow] = createSignal(new Date());
  const [checkoutImageFailed, setCheckoutImageFailed] = createSignal(false);
  const [stableOrder, setStableOrder] = createSignal<GiftCardOrderResponse | null>(null);
  const [stableOrderRef, setStableOrderRef] = createSignal('');
  const [clientReady, setClientReady] = createSignal(false);

  const orderRef = createMemo(() => safeDecode(params.id)?.trim() ?? '');
  const productLabel = createMemo(() => safeDecode(readSearchParam(searchParams.product))?.trim() || null);
  const productImage = createMemo(() => safeDecode(readSearchParam(searchParams.image))?.trim() || null);
  const visibleProductImage = createMemo(() => (checkoutImageFailed() ? null : productImage()));
  const queryCurrency = createMemo(() => safeDecode(readSearchParam(searchParams.currency))?.trim() || null);
  const queryValue = createMemo(() => safeDecode(readSearchParam(searchParams.value))?.trim() || null);
  const fetchableOrderRef = createMemo(() => (clientReady() ? orderRef() || undefined : undefined));

  const [order, { refetch }] = createResource(fetchableOrderRef, async orderId => {
    if (!orderId) {
      throw new Error('Missing gift card order id');
    }

    return giftcardsApi.getOrderStatus(orderId);
  });
  const currentOrder = createMemo(() => {
    const stable = stableOrder();
    if (stable && stableOrderRef() === orderRef()) {
      return stable;
    }

    return order() ?? null;
  });
  const orderPending = createMemo(() => !clientReady() || order.loading);

  createEffect(() => {
    const nextOrder = order();
    if (!nextOrder) {
      return;
    }

    setStableOrder(nextOrder);
    setStableOrderRef(orderRef());
  });

  createEffect(() => {
    productImage();
    setCheckoutImageFailed(false);
  });

  let pollTimer: number | undefined;
  let timeTimer: number | undefined;
  let copiedTimer: number | undefined;
  let qrRequest = 0;

  const refreshOrder = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

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

  const copyValue = async (key: string, value?: string | null) => {
    if (!value) {
      return;
    }

    try {
      if (!await writeToClipboard(value)) {
        return;
      }

      setCopiedField(key);
      if (copiedTimer !== undefined) {
        window.clearTimeout(copiedTimer);
      }
      copiedTimer = window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Keep the text visible for manual copy.
    }
  };

  onMount(() => {
    setClientReady(true);
    pollTimer = window.setInterval(() => {
      if (!shouldStopGiftcardOrderPolling(currentOrder())) {
        void refetch();
      }
    }, 3000);
    timeTimer = window.setInterval(() => setNow(new Date()), 30000);
  });

  onCleanup(() => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
    }

    if (timeTimer) {
      window.clearInterval(timeTimer);
    }

    if (copiedTimer !== undefined) {
      window.clearTimeout(copiedTimer);
    }

    qrRequest += 1;
  });

  const paymentUri = createMemo(() =>
    buildGiftcardPaymentUri(
      currentOrder()?.ticker_from,
      currentOrder()?.network_from,
      currentOrder()?.deposit_address ?? undefined,
      currentOrder()?.amount_from ?? null,
    ),
  );
  const qrPayload = createMemo(() => {
    if (qrMode() === 'payment' && paymentUri()) {
      return paymentUri()!;
    }

    return currentOrder()?.deposit_address ?? '';
  });

  createEffect(() => {
    if (!paymentUri() && qrMode() === 'payment') {
      setQrMode('address');
    }
  });

  createEffect(() => {
    const payload = qrPayload();
    const request = ++qrRequest;

    if (!payload) {
      setQrDataUrl('');
      setQrError(null);
      return;
    }

    setQrLoading(true);
    setQrError(null);
    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 390,
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

  return (
    <main class="giftcard-order-page">
      <Title>Gift Card Checkout | ASSETAR</Title>
      <Header />

      <section class="giftcard-order-page__content">
        <div class="giftcard-order-page__shell">
          <Show
            when={orderRef()}
            fallback={<div class="giftcard-order-card giftcard-order-card--empty">No gift card order id provided.</div>}
          >
            <Show
              when={currentOrder() || !orderPending()}
              fallback={
                <div class="giftcard-order-card giftcard-order-card--empty giftcard-order-card--loading">
                  <div class="assetar-page-loader__spinner" aria-hidden="true" />
                  <span>Loading gift card order...</span>
                </div>
              }
            >
              <Show
                when={currentOrder()}
                fallback={
                  <div class="giftcard-order-card giftcard-order-card--empty giftcard-order-card--error">
                    {String(order.error?.message ?? 'Loading gift card order...')}
                  </div>
                }
              >
                {record => {
                  const cardName = () => productLabel() || record().product_id || 'Gift Card';
                  const cardValue = () =>
                    normalizeCardValue(record().details?.value, queryValue(), record().currency_code || queryCurrency());
                  const coinName = () => record().coin_from || record().ticker_from.toUpperCase();
                  const paymentReady = () => hasProviderCryptoAmount(record(), queryValue());
                  const expiresAt = () => addMinutes(record().created_at);
                  const currentStatus = () => {
                    const normalized = record().status.toLowerCase();
                    if (
                      normalized.includes('wait') ||
                      normalized.includes('new') ||
                      normalized.includes('confirm') ||
                      normalized.includes('queue') ||
                      normalized.includes('creating') ||
                      normalized.includes('pending')
                    ) {
                      return 'Waiting for funds. No deposit confirmation yet on the blockchain. Refresh your transaction status with the button below:';
                    }

                    return `${titleCase(record().status)}. Refresh your transaction status with the button below:`;
                  };

                  return (
                    <div class="giftcard-checkout">
                      <div class="giftcard-checkout__main">
                        <section class="giftcard-order-card giftcard-checkout__review-card">
                          <h1>Review your Purchase:</h1>

                          <div class="giftcard-checkout__review-table">
                            <div>
                              <span>Email:</span>
                              <strong>{record().details?.email || record().recipient_email || '—'}</strong>
                            </div>
                            <div>
                              <span>Gift Card:</span>
                              <strong>{cardName()}</strong>
                            </div>
                            <div>
                              <span>Card Value:</span>
                              <strong>{cardValue()}</strong>
                            </div>
                          </div>

                          <div class="giftcard-checkout__warning">
                            <strong>Warning:</strong>
                            <p>
                              Do NOT use a VPN or Tor when redeeming, or your redeem code may be blocked! Also avoid
                              using AdBlockers or Brave Shield, or you might get errors from the provider.
                            </p>
                          </div>

                          <Show
                            when={paymentReady()}
                            fallback={
                              <div class="giftcard-checkout__pending-payment">
                                <div class="giftcard-checkout__pending-spinner" />
                                <div>
                                  <strong>Preparing payment instructions...</strong>
                                  <p>
                                    Assetar accepted the order and is getting the live deposit address from the provider.
                                    This page refreshes automatically.
                                  </p>
                                </div>
                              </div>
                            }
                          >
                            <p class="giftcard-checkout__transfer-copy">
                              Transfer exactly <strong>{formatCryptoValue(record().amount_from)}</strong> {coinName()} to
                              this address: <span title="Send only the selected asset on the selected network.">ⓘ</span>
                            </p>

                            <div class="giftcard-checkout__address-box">
                              <div class="giftcard-checkout__address-actions">
                                <span>Address</span>
                                <button type="button" onClick={() => void copyValue('address', record().deposit_address)}>
                                  {copiedField() === 'address' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <code>{record().deposit_address}</code>
                            </div>

                            <Show when={record().deposit_extra_id}>
                              <div class="giftcard-checkout__address-box giftcard-checkout__address-box--memo">
                                <div class="giftcard-checkout__address-actions">
                                  <span>Memo / Extra ID</span>
                                  <button type="button" onClick={() => void copyValue('memo', record().deposit_extra_id)}>
                                    {copiedField() === 'memo' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <code>{record().deposit_extra_id}</code>
                              </div>
                            </Show>

                            <div class="giftcard-checkout__qr-panel">
                              <div class="giftcard-checkout__qr-label">QR</div>
                              <div class="giftcard-checkout__qr-canvas" aria-live="polite">
                                <Show when={qrLoading()}>
                                  <div class="giftcard-checkout__qr-loading">Generating QR...</div>
                                </Show>
                                <Show when={!qrLoading() && qrDataUrl()}>
                                  <img
                                    src={qrDataUrl()}
                                    alt={qrMode() === 'payment' ? 'URI with amount QR code' : 'Address QR code'}
                                  />
                                </Show>
                                <Show when={qrError()}>
                                  <div class="giftcard-checkout__qr-error">{qrError()}</div>
                                </Show>
                              </div>
                              <div class="giftcard-checkout__qr-tabs" role="tablist" aria-label="QR content">
                                <button
                                  classList={{ active: qrMode() === 'address' }}
                                  type="button"
                                  onClick={() => setQrMode('address')}
                                >
                                  Address
                                </button>
                                <Show when={paymentUri()}>
                                  <button
                                    classList={{ active: qrMode() === 'payment' }}
                                    type="button"
                                    onClick={() => setQrMode('payment')}
                                  >
                                    URI with Amount
                                  </button>
                                </Show>
                              </div>
                            </div>
                          </Show>

                          <Show when={!shouldStopGiftcardOrderPolling(record())}>
                            <div class="giftcard-checkout__status-spinner" aria-hidden="true" />
                          </Show>

                          <p class="giftcard-checkout__status-copy">
                            <strong>Status:</strong> {currentStatus()}
                          </p>

                          <button
                            class="giftcard-checkout__refresh"
                            disabled={refreshing()}
                            onClick={() => void refreshOrder()}
                            type="button"
                          >
                            {refreshing() ? 'Refreshing...' : 'Refresh Transaction Status'}
                          </button>
                        </section>
                      </div>

                      <aside class="giftcard-checkout__side">
                        <section class="giftcard-order-card giftcard-checkout__expiry-card">
                          <h2>Be aware of your transaction&apos;s Expiration Time:</h2>
                          <div class="giftcard-checkout__time-table">
                            <div>
                              <span>Created at:</span>
                              <strong>{formatUtcTime(record().created_at)}</strong>
                            </div>
                            <div>
                              <span>Current time:</span>
                              <strong>{formatUtcTime(now())}</strong>
                            </div>
                            <div>
                              <span>Expires at:</span>
                              <strong>{formatUtcTime(expiresAt())}</strong>
                            </div>
                          </div>
                          <p>
                            We recommend you set priority to your transfers to avoid the transaction expiring before your
                            deposit is received
                          </p>
                        </section>

                        <section class="giftcard-order-card giftcard-checkout__details-card">
                          <h2>Write down your transaction details:</h2>
                          <div class="giftcard-checkout__time-table">
                            <div>
                              <span>ID at Assetar:</span>
                              <strong>{record().trade_id || record().order_id}</strong>
                            </div>
                            <div>
                              <span>Assetar Support:</span>
                              <strong>@AssetarSupportBot<br />support@assetar.app</strong>
                            </div>
                            <div>
                              <span>Exchange:</span>
                              <strong>{record().provider || 'CakePay'}</strong>
                            </div>
                          </div>
                          <p>
                            <strong>Note:</strong> You are a counterparty to the chosen exchange for this trade.
                            Assetar only provides software for interacting with the swap provider. By trading with them,
                            you agree to their Terms of Service
                          </p>
                        </section>

                        <section class="giftcard-order-card giftcard-checkout__image-card">
                          <Show
                            when={visibleProductImage()}
                            fallback={
                              <div class="giftcard-checkout__image-fallback">
                                {cardName().slice(0, 1).toUpperCase()}
                              </div>
                            }
                          >
                            {image => (
                              <img
                                src={image()}
                                alt={cardName()}
                                onError={() => setCheckoutImageFailed(true)}
                              />
                            )}
                          </Show>
                        </section>
                      </aside>
                    </div>
                  );
                }}
              </Show>
            </Show>
          </Show>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
