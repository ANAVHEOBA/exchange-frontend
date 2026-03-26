import type { Currency } from '../../../types/currency';

export type RecipientExtraIdKind = 'destination_tag' | 'memo';

export interface RecipientExtraIdDescriptor {
  kind: RecipientExtraIdKind;
  label: string;
}

type ExtraIdCurrency = Pick<Currency, 'ticker' | 'network' | 'memo' | 'extra_id_name'>;

const DESTINATION_TAG_LABEL = 'destination tag';
const U32_MAX = 4_294_967_295;

const normalizeLabel = (label?: string): string => {
  const trimmed = label?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Memo / Extra ID';
};

export const normalizeRecipientExtraId = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const describeRecipientExtraId = (
  currency: ExtraIdCurrency | null | undefined,
): RecipientExtraIdDescriptor | null => {
  if (!currency?.memo) {
    return null;
  }

  const label = normalizeLabel(currency.extra_id_name);
  const kind = label.toLowerCase() === DESTINATION_TAG_LABEL ? 'destination_tag' : 'memo';

  return { kind, label };
};

export const validateRecipientExtraId = (
  currency: ExtraIdCurrency | null | undefined,
  value: string,
  required: boolean,
): string | null => {
  const descriptor = describeRecipientExtraId(currency);
  const normalized = normalizeRecipientExtraId(value);

  if (!descriptor || !currency) {
    return null;
  }

  if (!normalized) {
    if (!required) {
      return null;
    }

    return `${currency.ticker} on ${currency.network} requires a ${descriptor.label.toLowerCase()}`;
  }

  if (descriptor.kind !== 'destination_tag') {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    return `Invalid destination tag for ${currency.ticker} on ${currency.network}: expected a 32-bit unsigned integer`;
  }

  try {
    const parsed = Number(normalized);
    if (!Number.isInteger(parsed) || parsed > U32_MAX) {
      return `Invalid destination tag for ${currency.ticker} on ${currency.network}: expected a 32-bit unsigned integer`;
    }
  } catch {
    return `Invalid destination tag for ${currency.ticker} on ${currency.network}: expected a 32-bit unsigned integer`;
  }

  return null;
};
