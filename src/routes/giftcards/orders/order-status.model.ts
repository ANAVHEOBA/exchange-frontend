import type { GiftCardOrderDetails, GiftCardOrderResponse } from '../../../types/giftcard';

export type GiftcardOrderStatusTone = 'neutral' | 'warning' | 'success' | 'danger';
export type GiftcardQrMode = 'address' | 'payment';

const TERMINAL_STATUS_MATCHERS = ['complete', 'deliver', 'redeem', 'fail', 'expired', 'refund', 'cancel'];
const WARNING_STATUS_MATCHERS = ['wait', 'confirm', 'queue', 'pending'];
const EXTRA_FIELD_EXCLUSIONS = new Set([
  'activation_link',
  'email',
  'hashout',
  'id',
  'redeem_code',
  'status',
  'value',
]);

export const getGiftcardOrderStatusTone = (
  value?: string | null,
): GiftcardOrderStatusTone => {
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

  if (WARNING_STATUS_MATCHERS.some(token => normalized.includes(token))) {
    return 'warning';
  }

  return 'neutral';
};

export const shouldStopGiftcardOrderPolling = (
  order?: Pick<GiftCardOrderResponse, 'status'> | null,
): boolean => {
  const normalized = order?.status.trim().toLowerCase() ?? '';
  return TERMINAL_STATUS_MATCHERS.some(token => normalized.includes(token));
};

export const buildGiftcardPaymentUri = (
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
    bch: 'bitcoincash',
    btc: 'bitcoin',
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

const serializeExtraValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : null;
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return null;
};

export const getGiftcardExtraEntries = (
  details?: GiftCardOrderDetails | null,
): Array<[string, string]> => {
  return Object.entries(details?.extra ?? {}).flatMap(([key, value]) => {
    if (EXTRA_FIELD_EXCLUSIONS.has(key)) {
      return [];
    }

    const normalized = serializeExtraValue(value);
    return normalized ? [[key, normalized]] : [];
  });
};

export const formatGiftcardDetailLabel = (key: string): string => {
  return key
    .replaceAll(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
};
