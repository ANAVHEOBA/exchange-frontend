import type { GiftCardProduct } from '../types/giftcard';

export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'GU', name: 'Guam' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

export const CATEGORY_OPTIONS = [
  'All Gift Cards',
  'Apparel',
  'Automobiles',
  'Charity',
  'Ecommerce',
  'Electronics',
  'Entertainment',
  'Experiences',
  'Food',
  'Games',
  'Gifts',
  'Health & Beauty',
  'Home',
  'Music',
  'Pets',
  'Retail',
  'Streaming',
  'Travel',
  'eSIMs',
  'Others',
] as const;

export const DEFAULT_COUNTRY = 'GB';
export const DEFAULT_CATEGORY = 'All Gift Cards';

export const normalizeGiftcardValue = (value: string): string => value.trim().toLowerCase();

export const isKnownCountryCode = (value: string): boolean => {
  return COUNTRY_OPTIONS.some(option => option.code === value.toUpperCase());
};

export const resolveCountryCode = (value?: string | null): string => {
  if (!value) {
    return DEFAULT_COUNTRY;
  }

  const normalized = value.trim().toUpperCase();
  return isKnownCountryCode(normalized) ? normalized : DEFAULT_COUNTRY;
};

export const resolveCategoryValue = (
  value?: string | null,
  available?: readonly string[],
): string => {
  if (!value) {
    return DEFAULT_CATEGORY;
  }

  const decoded = value.trim();
  const knownCategories = available ?? CATEGORY_OPTIONS;

  return knownCategories.includes(decoded) ? decoded : DEFAULT_CATEGORY;
};

export const getCountryName = (code?: string | null): string => {
  if (!code) {
    return 'Global';
  }

  return COUNTRY_OPTIONS.find(option => option.code === code)?.name ?? code;
};

export const formatGiftcardAmount = (value?: number | null): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
};

export const inferGiftcardCurrencyCode = (country?: string | null): string | null => {
  if (!country) {
    return null;
  }

  const normalized = country.trim().toUpperCase().replace(/[-_]+/g, ' ');
  const mapping: Record<string, string> = {
    AE: 'AED',
    ARGENTINA: 'ARS',
    AR: 'ARS',
    AU: 'AUD',
    AUS: 'AUD',
    AUSTRALIA: 'AUD',
    BRAZIL: 'BRL',
    BR: 'BRL',
    CA: 'CAD',
    CANADA: 'CAD',
    CH: 'CHF',
    SWITZERLAND: 'CHF',
    GB: 'GBP',
    'GREAT BRITAIN': 'GBP',
    UK: 'GBP',
    'UNITED KINGDOM': 'GBP',
    GU: 'USD',
    GUAM: 'USD',
    PR: 'USD',
    'PUERTO RICO': 'USD',
    US: 'USD',
    USA: 'USD',
    'UNITED STATES': 'USD',
    IN: 'INR',
    INDIA: 'INR',
    JP: 'JPY',
    JAPAN: 'JPY',
    MX: 'MXN',
    MEXICO: 'MXN',
    NZ: 'NZD',
    'NEW ZEALAND': 'NZD',
    PE: 'PEN',
    PERU: 'PEN',
    PH: 'PHP',
    PHILIPPINES: 'PHP',
    SG: 'SGD',
    SINGAPORE: 'SGD',
    TR: 'TRY',
    TURKEY: 'TRY',
    UAE: 'AED',
    'UNITED ARAB EMIRATES': 'AED',
  };
  const euroCountries = new Set([
    'AT',
    'AUSTRIA',
    'BE',
    'BELGIUM',
    'CY',
    'CYPRUS',
    'DE',
    'GERMANY',
    'EE',
    'ESTONIA',
    'ES',
    'SPAIN',
    'FI',
    'FINLAND',
    'FR',
    'FRANCE',
    'GR',
    'GREECE',
    'HR',
    'CROATIA',
    'HU',
    'HUNGARY',
    'IE',
    'IRELAND',
    'IT',
    'ITALY',
    'LT',
    'LITHUANIA',
    'LU',
    'LUXEMBOURG',
    'LV',
    'LATVIA',
    'MT',
    'MALTA',
    'NL',
    'NETHERLANDS',
    'PL',
    'POLAND',
    'PT',
    'PORTUGAL',
    'RO',
    'ROMANIA',
    'SI',
    'SLOVENIA',
    'SK',
    'SLOVAKIA',
    'SLOVAK REPUBLIC',
  ]);

  return mapping[normalized] ?? (euroCountries.has(normalized) ? 'EUR' : null);
};

export const getGiftcardCurrencyCode = (
  product?: GiftCardProduct | null,
  countryCode?: string | null,
): string => {
  const explicit = product?.currency_code?.trim().toUpperCase();
  if (explicit) {
    return explicit;
  }

  return inferGiftcardCurrencyCode(product?.country ?? countryCode) ?? 'USD';
};

export const formatGiftcardFiatAmount = (
  value?: number | null,
  currencyCode = 'USD',
  options?: Intl.NumberFormatOptions,
): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }

  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);

  return `${formatted} ${currencyCode}`;
};

export const normalizeDenominations = (product?: GiftCardProduct | null): number[] => {
  const values = product?.denominations ?? [];

  return Array.from(
    new Set(
      values
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
        .map(value => Number(value)),
    ),
  ).sort((left, right) => left - right);
};

export const formatGiftcardAmountRange = (product: GiftCardProduct): string => {
  const denominations = normalizeDenominations(product);
  const currencyCode = getGiftcardCurrencyCode(product);
  if (denominations.length > 0) {
    if (denominations.length === 1) {
      return formatGiftcardFiatAmount(denominations[0], currencyCode);
    }

    return `${formatGiftcardAmount(denominations[0])} - ${formatGiftcardFiatAmount(denominations[denominations.length - 1], currencyCode)}`;
  }

  if (product.min_amount !== undefined && product.max_amount !== undefined) {
    return `${formatGiftcardAmount(product.min_amount)} - ${formatGiftcardFiatAmount(product.max_amount, currencyCode)}`;
  }

  if (product.min_amount !== undefined) {
    return `${formatGiftcardFiatAmount(product.min_amount, currencyCode)}+`;
  }

  if (product.max_amount !== undefined) {
    return `<= ${formatGiftcardFiatAmount(product.max_amount, currencyCode)}`;
  }

  return '—';
};

export const buildGiftcardRangeNote = (product: GiftCardProduct): string => {
  const currencyCode = getGiftcardCurrencyCode(product);

  if (product.min_amount !== undefined && product.max_amount !== undefined) {
    return `Min: ${formatGiftcardAmount(product.min_amount)} - Max: ${formatGiftcardFiatAmount(product.max_amount, currencyCode)}`;
  }

  if (product.min_amount !== undefined) {
    return `Min: ${formatGiftcardFiatAmount(product.min_amount, currencyCode)}`;
  }

  if (product.max_amount !== undefined) {
    return `Max: ${formatGiftcardFiatAmount(product.max_amount, currencyCode)}`;
  }

  const denominations = normalizeDenominations(product);
  if (denominations.length > 0) {
    return `Available: ${formatGiftcardAmountRange(product)}`;
  }

  return 'Flexible amount supported';
};

export const countryCodeToFlagEmoji = (code?: string | null): string => {
  if (!code || code.trim().length !== 2) {
    return '🌍';
  }

  return code
    .trim()
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

export const buildGiftcardProductHref = (
  category: string,
  productId: string,
  countryCode: string,
): string => {
  const params = new URLSearchParams({
    country: countryCode,
    product: productId,
  });

  if (category !== DEFAULT_CATEGORY) {
    params.set('category', category);
  }

  return `/giftcards/?${params.toString()}`;
};
