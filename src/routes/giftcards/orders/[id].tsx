import { Title } from '@solidjs/meta';
import { useParams, useSearchParams } from '@solidjs/router';
import { Show, createMemo, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import Header from '../../../components/Header/Header';
import SiteFooter from '../../../components/SiteFooter/SiteFooter';
import { giftcardsApi } from '../../../api/endpoints/giftcards';
import { useLocale } from '../../../i18n/locale';
import type { GiftCardOrderResponse } from '../../../types/giftcard';
import './order-status.css';

const formatTimestamp = (value?: string | null): string => {
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

const titleCase = (value?: string | null): string => {
  if (!value) {
    return 'Checking';
  }

  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
};

const getStatusTone = (value?: string | null): 'neutral' | 'warning' | 'success' | 'danger' => {
  const normalized = value?.trim().toLowerCase() ?? '';

  if (
    normalized.includes('complete') ||
    normalized.includes('deliver') ||
    normalized.includes('redeem') ||
    normalized.includes('sent')
  ) {
    return 'success';
  }

  if (
    normalized.includes('fail') ||
    normalized.includes('expired') ||
    normalized.includes('refund') ||
    normalized.includes('cancel')
  ) {
    return 'danger';
  }

  if (
    normalized.includes('wait') ||
    normalized.includes('confirm') ||
    normalized.includes('queue') ||
    normalized.includes('pending')
  ) {
    return 'warning';
  }

  return 'neutral';
};

const shouldStopPolling = (order?: GiftCardOrderResponse | null): boolean => {
  if (!order) {
    return false;
  }

  const normalized = order.status.trim().toLowerCase();
  return (
    normalized.includes('complete') ||
    normalized.includes('deliver') ||
    normalized.includes('redeem') ||
    normalized.includes('fail') ||
    normalized.includes('expired') ||
    normalized.includes('refund') ||
    normalized.includes('cancel')
  );
};

export default function GiftCardOrderStatusPage() {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLocale();
  const [refreshing, setRefreshing] = createSignal(false);
  const [copiedField, setCopiedField] = createSignal<string | null>(null);

  const orderRef = createMemo(() => decodeURIComponent(params.id ?? '').trim());
  const productLabel = createMemo(() => {
    const value = searchParams.product?.trim();
    return value ? decodeURIComponent(value) : null;
  });

  const [order, { refetch }] = createResource(orderRef, giftcardsApi.getOrderStatus);

  let pollTimer: number | undefined;
  let copiedTimer: number | undefined;

  const refreshOrder = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const copyValue = async (key: string, value?: string | null) => {
    if (!value || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedField(key);

    if (copiedTimer) {
      window.clearTimeout(copiedTimer);
    }

    copiedTimer = window.setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  onMount(() => {
    pollTimer = window.setInterval(() => {
      if (!shouldStopPolling(order())) {
        void refetch();
      }
    }, 12000);
  });

  onCleanup(() => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
    }

    if (copiedTimer) {
      window.clearTimeout(copiedTimer);
    }
  });

  const statusTone = createMemo(() => getStatusTone(order()?.status));
  const deliverablesReady = createMemo(() => {
    const details = order()?.details;
    return Boolean(details?.activation_link || details?.redeem_code);
  });

  return (
    <main class="giftcard-order-page">
      <Title>{`${t('giftcards.statusPageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="giftcard-order-page__hero">
        <div class="giftcard-order-page__shell">
          <div class="giftcard-order-page__eyebrow">{t('giftcards.statusEyebrow')}</div>
          <h1 class="giftcard-order-page__title">{t('giftcards.statusTitle')}</h1>
          <p class="giftcard-order-page__copy">{t('giftcards.statusCopy')}</p>
        </div>
      </section>

      <section class="giftcard-order-page__content">
        <div class="giftcard-order-page__shell">
          <Show
            when={orderRef()}
            fallback={<div class="giftcard-order-card giftcard-order-card--empty">{t('giftcards.lookupMissing')}</div>}
          >
            <Show
              when={!order.loading || order()}
              fallback={<div class="giftcard-order-card giftcard-order-card--empty">{t('giftcards.loadingOrder')}</div>}
            >
              <Show
                when={order()}
                fallback={
                  <div class="giftcard-order-card giftcard-order-card--empty giftcard-order-card--error">
                    {String(order.error?.message ?? t('giftcards.loadingOrder'))}
                  </div>
                }
              >
                {record => (
                  <div class="giftcard-order-page__layout">
                    <div class="giftcard-order-card giftcard-order-card--primary">
                      <div class="giftcard-order-card__header">
                        <div>
                          <div class="giftcard-order-card__kicker">{t('giftcards.orderSummary')}</div>
                          <h2 class="giftcard-order-card__title">
                            {productLabel() || record().product_id || record().provider || t('giftcards.statusPageTitle')}
                          </h2>
                          <p class="giftcard-order-card__provider">
                            {record().provider || 'Assetar'} • {titleCase(record().status)}
                          </p>
                        </div>
                        <div class={`giftcard-order-card__status giftcard-order-card__status--${statusTone()}`}>
                          {titleCase(record().status)}
                        </div>
                      </div>

                      <div class="giftcard-order-card__summary-grid">
                        <div class="giftcard-order-card__summary-box">
                          <span>{t('giftcards.sendAmount')}</span>
                          <strong>{record().amount_from} {record().ticker_from.toUpperCase()}</strong>
                          <small>{record().network_from}</small>
                        </div>

                        <div class="giftcard-order-card__summary-box">
                          <span>{t('giftcards.deliveryValue')}</span>
                          <strong>{record().details?.value || '—'}</strong>
                          <small>{productLabel() || record().product_id || record().order_kind}</small>
                        </div>
                      </div>

                      <div class="giftcard-order-card__field-grid">
                        <div class="giftcard-order-card__field">
                          <span>{t('giftcards.orderReference')}</span>
                          <code>{record().order_id}</code>
                        </div>

                        <Show when={record().trade_id}>
                          <div class="giftcard-order-card__field">
                            <span>{t('giftcards.providerTradeId')}</span>
                            <code>{record().trade_id}</code>
                          </div>
                        </Show>
                      </div>

                      <Show when={record().last_error}>
                        <div class="giftcard-order-card__alert giftcard-order-card__alert--danger">
                          <strong>{t('giftcards.lastError')}:</strong> {record().last_error}
                        </div>
                      </Show>

                      <Show when={record().queued}>
                        <div class="giftcard-order-card__alert giftcard-order-card__alert--warning">
                          <strong>{t('giftcards.queueState')}:</strong> {record().retryable ? t('giftcards.yes') : t('giftcards.no')}
                        </div>
                      </Show>
                    </div>

                    <div class="giftcard-order-page__sidebar">
                      <div class="giftcard-order-card">
                        <h3 class="giftcard-order-card__section-title">{t('giftcards.paymentInstructions')}</h3>

                        <div class="giftcard-order-card__field-stack">
                          <div class="giftcard-order-card__field">
                            <div class="giftcard-order-card__field-head">
                              <span>{t('giftcards.payTo')}</span>
                              <button type="button" onClick={() => void copyValue('deposit', record().deposit_address)}>
                                {copiedField() === 'deposit' ? t('giftcards.copied') : t('giftcards.copy')}
                              </button>
                            </div>
                            <code>{record().deposit_address || '—'}</code>
                          </div>

                          <Show when={record().deposit_extra_id}>
                            <div class="giftcard-order-card__field">
                              <div class="giftcard-order-card__field-head">
                                <span>{t('giftcards.depositMemo')}</span>
                                <button type="button" onClick={() => void copyValue('memo', record().deposit_extra_id)}>
                                  {copiedField() === 'memo' ? t('giftcards.copied') : t('giftcards.copy')}
                                </button>
                              </div>
                              <code>{record().deposit_extra_id}</code>
                            </div>
                          </Show>
                        </div>
                      </div>

                      <div class="giftcard-order-card">
                        <h3 class="giftcard-order-card__section-title">{t('giftcards.deliveryDetails')}</h3>

                        <div class="giftcard-order-card__field-stack">
                          <Show when={record().details?.email}>
                            <div class="giftcard-order-card__field">
                              <span>{t('giftcards.deliveryEmail')}</span>
                              <code>{record().details?.email}</code>
                            </div>
                          </Show>

                          <Show when={record().details?.redeem_code}>
                            <div class="giftcard-order-card__field">
                              <div class="giftcard-order-card__field-head">
                                <span>{t('giftcards.redeemCode')}</span>
                                <button type="button" onClick={() => void copyValue('redeem', record().details?.redeem_code)}>
                                  {copiedField() === 'redeem' ? t('giftcards.copied') : t('giftcards.copy')}
                                </button>
                              </div>
                              <code>{record().details?.redeem_code}</code>
                            </div>
                          </Show>

                          <Show when={record().details?.activation_link}>
                            <div class="giftcard-order-card__field">
                              <div class="giftcard-order-card__field-head">
                                <span>{t('giftcards.activationLink')}</span>
                                <button type="button" onClick={() => void copyValue('activation', record().details?.activation_link)}>
                                  {copiedField() === 'activation' ? t('giftcards.copied') : t('giftcards.copy')}
                                </button>
                              </div>
                              <a href={record().details?.activation_link || '#'} target="_blank" rel="noreferrer">
                                {record().details?.activation_link}
                              </a>
                            </div>
                          </Show>

                          <Show when={record().provider_password}>
                            <div class="giftcard-order-card__field">
                              <div class="giftcard-order-card__field-head">
                                <span>{t('giftcards.providerPassword')}</span>
                                <button type="button" onClick={() => void copyValue('password', record().provider_password)}>
                                  {copiedField() === 'password' ? t('giftcards.copied') : t('giftcards.copy')}
                                </button>
                              </div>
                              <code>{record().provider_password}</code>
                            </div>
                          </Show>
                        </div>

                        <Show when={deliverablesReady()}>
                          <div class="giftcard-order-card__alert giftcard-order-card__alert--success">
                            {t('giftcards.terminalNote')}
                          </div>
                        </Show>
                      </div>

                      <div class="giftcard-order-card">
                        <h3 class="giftcard-order-card__section-title">Timing</h3>
                        <div class="giftcard-order-card__meta">
                          <div>
                            <span>{t('giftcards.created')}</span>
                            <strong>{formatTimestamp(record().created_at)}</strong>
                          </div>
                          <div>
                            <span>{t('giftcards.updated')}</span>
                            <strong>{formatTimestamp(record().updated_at)}</strong>
                          </div>
                          <div>
                            <span>{t('giftcards.completed')}</span>
                            <strong>{formatTimestamp(record().completed_at)}</strong>
                          </div>
                          <div>
                            <span>{t('giftcards.retryable')}</span>
                            <strong>{record().retryable ? t('giftcards.yes') : t('giftcards.no')}</strong>
                          </div>
                        </div>

                        <button
                          class="giftcard-order-card__refresh"
                          disabled={refreshing()}
                          onClick={() => void refreshOrder()}
                          type="button"
                        >
                          {refreshing() ? t('giftcards.refreshing') : t('giftcards.refresh')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Show>
            </Show>
          </Show>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
