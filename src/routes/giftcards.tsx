import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import Header from '../components/Header/Header';
import SiteFooter from '../components/SiteFooter/SiteFooter';
import { giftcardsApi } from '../api/endpoints/giftcards';
import CurrencySelector from '../features/currencies/ui/CurrencySelector/CurrencySelector';
import { useCurrencies } from '../hooks/useCurrencies';
import { useLocale } from '../i18n/locale';
import type { Currency } from '../types/currency';
import type { GiftCardProduct } from '../types/giftcard';
import { getCurrencyIconFallback, getCurrencyIconSrc } from '../utils/currencyIcon';
import './giftcards.css';

interface CountryOption {
  code: string;
  name: string;
}

const COUNTRY_OPTIONS: CountryOption[] = [
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

const CATEGORY_OPTIONS = [
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

const DEFAULT_COUNTRY = 'GB';
const DEFAULT_CATEGORY = 'All Gift Cards';

const normalize = (value: string): string => value.trim().toLowerCase();

const formatAmount = (value?: number | null): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
};

const formatAmountRange = (product: GiftCardProduct): string => {
  const denominations = normalizeDenominations(product);
  if (denominations.length > 0) {
    if (denominations.length === 1) {
      return formatAmount(denominations[0]);
    }

    return `${formatAmount(denominations[0])} – ${formatAmount(denominations[denominations.length - 1])}`;
  }

  if (product.min_amount !== undefined && product.max_amount !== undefined) {
    return `${formatAmount(product.min_amount)} – ${formatAmount(product.max_amount)}`;
  }

  if (product.min_amount !== undefined) {
    return `${formatAmount(product.min_amount)}+`;
  }

  if (product.max_amount !== undefined) {
    return `≤ ${formatAmount(product.max_amount)}`;
  }

  return '—';
};

const normalizeDenominations = (product?: GiftCardProduct | null): number[] => {
  const values = product?.denominations ?? [];
  return Array.from(
    new Set(
      values
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
        .map(value => Number(value)),
    ),
  ).sort((left, right) => left - right);
};

const resolveDefaultCurrency = (currencies: Currency[]): Currency | null => {
  return (
    currencies.find(currency => {
      return (
        currency.ticker.toLowerCase() === 'btc' &&
        currency.network.toLowerCase() === 'mainnet'
      );
    }) ??
    currencies.find(currency => currency.ticker.toLowerCase() === 'btc') ??
    currencies[0] ??
    null
  );
};

const getCountryName = (code?: string | null): string => {
  if (!code) {
    return 'Global';
  }

  return COUNTRY_OPTIONS.find(option => option.code === code)?.name ?? code;
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

export default function GiftCardsPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { currencies } = useCurrencies();

  const [country, setCountry] = createSignal(DEFAULT_COUNTRY);
  const [category, setCategory] = createSignal<string>(DEFAULT_CATEGORY);
  const [search, setSearch] = createSignal('');
  const [selectedProductId, setSelectedProductId] = createSignal<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = createSignal<Currency | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = createSignal(false);
  const [email, setEmail] = createSignal('');
  const [amountInput, setAmountInput] = createSignal('');
  const [configuredProductId, setConfiguredProductId] = createSignal<string | null>(null);
  const [submitting, setSubmitting] = createSignal(false);
  const [submitError, setSubmitError] = createSignal<string | null>(null);

  const [catalog, { refetch }] = createResource(
    country,
    selectedCountry => giftcardsApi.getCatalog({ country: selectedCountry }),
  );

  createEffect(() => {
    const list = currencies();
    if (list.length === 0 || selectedCurrency()) {
      return;
    }

    setSelectedCurrency(resolveDefaultCurrency(list));
  });

  const catalogCards = createMemo(() => catalog()?.cards ?? []);

  const filteredCards = createMemo(() => {
    const selectedCategory = category();
    const searchTerm = normalize(search());

    return catalogCards()
      .filter(card => {
        if (selectedCategory === DEFAULT_CATEGORY) {
          return true;
        }

        return normalize(card.category ?? '') === normalize(selectedCategory);
      })
      .filter(card => {
        if (!searchTerm) {
          return true;
        }

        const haystack = [
          card.name,
          card.category ?? '',
          card.description ?? '',
          card.country ?? '',
        ]
          .map(normalize)
          .join(' ');

        return haystack.includes(searchTerm);
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  });

  const derivedCategories = createMemo(() => {
    const available = new Set(
      catalogCards()
        .map(card => card.category?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    return CATEGORY_OPTIONS.filter(option => {
      return option === DEFAULT_CATEGORY || available.has(option);
    });
  });

  createEffect(() => {
    if (!derivedCategories().includes(category())) {
      setCategory(DEFAULT_CATEGORY);
    }
  });

  const activeProduct = createMemo(() => {
    const productId = selectedProductId();
    if (!productId) {
      return null;
    }

    return catalogCards().find(card => card.product_id === productId) ?? null;
  });

  createEffect(() => {
    const cards = filteredCards();
    const current = selectedProductId();

    if (cards.length === 0) {
      setSelectedProductId(null);
      return;
    }

    if (!current || !cards.some(card => card.product_id === current)) {
      setSelectedProductId(cards[0].product_id);
    }
  });

  createEffect(() => {
    const product = activeProduct();
    const productId = product?.product_id ?? null;

    if (configuredProductId() === productId) {
      return;
    }

    setConfiguredProductId(productId);

    if (!product) {
      setAmountInput('');
      return;
    }

    const denominations = normalizeDenominations(product);
    if (denominations.length > 0) {
      setAmountInput(String(denominations[0]));
      return;
    }

    if (product.min_amount !== undefined && product.min_amount !== null) {
      setAmountInput(String(product.min_amount));
      return;
    }

    if (product.max_amount !== undefined && product.max_amount !== null) {
      setAmountInput(String(product.max_amount));
      return;
    }

    setAmountInput('');
  });

  const selectedCountryName = createMemo(() => getCountryName(country()));
  const paymentCurrencyLabel = createMemo(() => {
    const currency = selectedCurrency();
    if (!currency) {
      return '—';
    }

    return `${currency.name} • ${currency.network}`;
  });

  const selectedAmount = createMemo(() => {
    const normalized = amountInput().replaceAll(',', '.').trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const amountError = createMemo(() => {
    const product = activeProduct();
    const amount = selectedAmount();

    if (!product || amount === null) {
      return null;
    }

    const denominations = normalizeDenominations(product);
    if (denominations.length > 0 && !denominations.includes(amount)) {
      return t('giftcards.invalidDenomination');
    }

    if (product.min_amount !== undefined && product.min_amount !== null && amount < product.min_amount) {
      return `${t('giftcards.minValuePrefix')} ${formatAmount(product.min_amount)}.`;
    }

    if (product.max_amount !== undefined && product.max_amount !== null && amount > product.max_amount) {
      return `${t('giftcards.maxValuePrefix')} ${formatAmount(product.max_amount)}.`;
    }

    return null;
  });

  const canCreateCheckout = createMemo(() => {
    return Boolean(
      activeProduct() &&
      selectedCurrency() &&
      selectedAmount() !== null &&
      !amountError() &&
      isValidEmail(email()) &&
      !submitting(),
    );
  });

  const handleCreateCheckout = async () => {
    const product = activeProduct();
    const payCurrency = selectedCurrency();
    const amount = selectedAmount();

    if (!product || !payCurrency || amount === null) {
      return;
    }

    if (!isValidEmail(email())) {
      setSubmitError(t('giftcards.invalidEmail'));
      return;
    }

    if (amountError()) {
      setSubmitError(amountError());
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const order = await giftcardsApi.createOrder({
        product_id: product.product_id,
        ticker_from: payCurrency.ticker,
        network_from: payCurrency.network,
        amount,
        email: email().trim(),
      });

      const orderRef = order.trade_id || order.order_id;
      const productQuery = encodeURIComponent(product.name);
      void navigate(`/giftcards/orders/${encodeURIComponent(orderRef)}?product=${productQuery}`);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message || '')
          : '';
      setSubmitError(message || t('giftcards.createCheckoutFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main class="giftcards-page">
      <Title>{`${t('giftcards.pageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="giftcards-page__hero">
        <div class="giftcards-page__shell">
          <div class="giftcards-page__intro">
            <div class="giftcards-page__eyebrow">{t('giftcards.eyebrow')}</div>
            <h1 class="giftcards-page__title">{t('giftcards.title')}</h1>
            <p class="giftcards-page__copy">{t('giftcards.introCopy')}</p>
            <div class="giftcards-page__limit">{t('giftcards.limit')}</div>
          </div>

          <div class="giftcards-page__filter-card">
            <div class="giftcards-page__filter-grid">
              <label class="giftcards-page__field">
                <span>{t('giftcards.countryLabel')}</span>
                <select value={country()} onInput={event => setCountry(event.currentTarget.value)}>
                  <For each={COUNTRY_OPTIONS}>
                    {option => (
                      <option value={option.code}>
                        {option.name}
                      </option>
                    )}
                  </For>
                </select>
              </label>

              <label class="giftcards-page__field">
                <span>{t('giftcards.categoryLabel')}</span>
                <select value={category()} onInput={event => setCategory(event.currentTarget.value)}>
                  <For each={derivedCategories()}>
                    {option => <option value={option}>{option}</option>}
                  </For>
                </select>
              </label>

              <label class="giftcards-page__field">
                <span>{t('giftcards.searchLabel')}</span>
                <input
                  type="search"
                  value={search()}
                  onInput={event => setSearch(event.currentTarget.value)}
                  placeholder={t('giftcards.searchPlaceholder')}
                />
              </label>
            </div>

            <div class="giftcards-page__selected-country">
              <span>{t('giftcards.selectedCountry')}</span>
              <strong>{selectedCountryName()}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="giftcards-page__content">
        <div class="giftcards-page__shell giftcards-page__layout">
          <div class="giftcards-page__catalog">
            <div class="giftcards-page__catalog-header">
              <div>
                <h2>{category()}</h2>
                <p>{filteredCards().length} {t('giftcards.results')}</p>
              </div>

              <button class="giftcards-page__refresh" onClick={() => void refetch()} type="button">
                {t('giftcards.retry')}
              </button>
            </div>

            <Switch>
              <Match when={catalog.loading}>
                <div class="giftcards-page__feedback">{t('giftcards.loading')}</div>
              </Match>

              <Match when={catalog.error}>
                <div class="giftcards-page__feedback giftcards-page__feedback--error">
                  <div>{t('giftcards.failed')}</div>
                  <button type="button" onClick={() => void refetch()}>
                    {t('giftcards.retry')}
                  </button>
                </div>
              </Match>

              <Match when={filteredCards().length === 0}>
                <div class="giftcards-page__feedback">{t('giftcards.empty')}</div>
              </Match>

              <Match when={filteredCards().length > 0}>
                <div class="giftcards-page__grid">
                  <For each={filteredCards()}>
                    {card => {
                      const selected = createMemo(() => activeProduct()?.product_id === card.product_id);

                      return (
                        <button
                          class="giftcards-page__product"
                          classList={{ 'giftcards-page__product--selected': selected() }}
                          onClick={() => setSelectedProductId(card.product_id)}
                          type="button"
                        >
                          <div class="giftcards-page__product-image-wrap">
                            <Show
                              when={card.card_image_url}
                              fallback={<div class="giftcards-page__product-image-fallback">{card.name.slice(0, 1)}</div>}
                            >
                              <img
                                class="giftcards-page__product-image"
                                src={card.card_image_url || ''}
                                alt={card.name}
                                loading="lazy"
                              />
                            </Show>
                          </div>
                          <div class="giftcards-page__product-body">
                            <div class="giftcards-page__product-name">{card.name}</div>
                            <div class="giftcards-page__product-meta">
                              <span>{card.category || DEFAULT_CATEGORY}</span>
                              <span>{formatAmountRange(card)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </Match>
            </Switch>
          </div>

          <aside class="giftcards-page__checkout">
            <Show
              when={activeProduct()}
              fallback={
                <div class="giftcards-page__checkout-card giftcards-page__checkout-card--empty">
                  <h2>{t('giftcards.chooseCard')}</h2>
                  <p>{t('giftcards.chooseCardCopy')}</p>
                </div>
              }
            >
              {product => {
                const denominationOptions = createMemo(() => normalizeDenominations(product()));

                return (
                  <div class="giftcards-page__checkout-card">
                    <div class="giftcards-page__checkout-head">
                      <div class="giftcards-page__checkout-image-wrap">
                        <Show
                          when={product().card_image_url}
                          fallback={<div class="giftcards-page__product-image-fallback">{product().name.slice(0, 1)}</div>}
                        >
                          <img
                            class="giftcards-page__checkout-image"
                            src={product().card_image_url || ''}
                            alt={product().name}
                          />
                        </Show>
                      </div>

                      <div class="giftcards-page__checkout-copy">
                        <div class="giftcards-page__checkout-category">
                          {product().category || DEFAULT_CATEGORY}
                        </div>
                        <h2>{product().name}</h2>
                        <p>{getCountryName(product().country || country())}</p>
                      </div>
                    </div>

                    <div class="giftcards-page__checkout-stack">
                      <label class="giftcards-page__field">
                        <span>{t('giftcards.cardValue')}</span>
                        <Show
                          when={denominationOptions().length > 0}
                          fallback={
                            <input
                              type="number"
                              min={product().min_amount ?? undefined}
                              max={product().max_amount ?? undefined}
                              step="0.01"
                              value={amountInput()}
                              onInput={event => setAmountInput(event.currentTarget.value)}
                            />
                          }
                        >
                          <div class="giftcards-page__denominations">
                            <For each={denominationOptions()}>
                              {value => (
                                <button
                                  type="button"
                                  class="giftcards-page__denomination"
                                  classList={{ active: selectedAmount() === value }}
                                  onClick={() => setAmountInput(String(value))}
                                >
                                  {formatAmount(value)}
                                </button>
                              )}
                            </For>
                          </div>
                        </Show>
                      </label>

                      <Show when={denominationOptions().length > 0}>
                        <div class="giftcards-page__field-note">
                          {t('giftcards.availableValues')}: {denominationOptions().map(value => formatAmount(value)).join(', ')}
                        </div>
                      </Show>

                      <Show when={denominationOptions().length === 0}>
                        <div class="giftcards-page__field-note">
                          {t('giftcards.allowedRange')}: {formatAmountRange(product())}
                        </div>
                      </Show>

                      <Show when={amountError()}>
                        <div class="giftcards-page__field-error">{amountError()}</div>
                      </Show>

                      <label class="giftcards-page__field">
                        <span>{t('giftcards.deliveryEmail')}</span>
                        <input
                          type="email"
                          value={email()}
                          onInput={event => setEmail(event.currentTarget.value)}
                          placeholder="name@example.com"
                        />
                      </label>

                      <div class="giftcards-page__field">
                        <span>{t('giftcards.payWith')}</span>
                        <button
                          class="giftcards-page__currency-trigger"
                          onClick={() => setCurrencyPickerOpen(true)}
                          type="button"
                        >
                          <Show
                            when={selectedCurrency()}
                            fallback={<span>{t('giftcards.chooseCurrency')}</span>}
                          >
                            {currency => (
                              <>
                                <img
                                  class="giftcards-page__currency-icon"
                                  src={getCurrencyIconSrc(currency())}
                                  alt={currency().name}
                                  onError={event => {
                                    (event.currentTarget as HTMLImageElement).src = getCurrencyIconFallback(currency().ticker);
                                  }}
                                />
                                <span>{paymentCurrencyLabel()}</span>
                              </>
                            )}
                          </Show>
                        </button>
                      </div>

                      <Show when={submitError()}>
                        <div class="giftcards-page__field-error">{submitError()}</div>
                      </Show>

                      <button
                        class="giftcards-page__checkout-button"
                        disabled={!canCreateCheckout()}
                        onClick={handleCreateCheckout}
                        type="button"
                      >
                        {submitting() ? t('giftcards.creatingCheckout') : t('giftcards.createCheckout')}
                      </button>

                      <p class="giftcards-page__checkout-note">{t('giftcards.checkoutNote')}</p>
                    </div>

                    <div class="giftcards-page__details">
                      <h3>{t('giftcards.productDetails')}</h3>

                      <Show when={product().description}>
                        <details open>
                          <summary>Description</summary>
                          <p>{product().description}</p>
                        </details>
                      </Show>

                      <Show when={product().how_to_use}>
                        <details>
                          <summary>{t('giftcards.howToUse')}</summary>
                          <p>{product().how_to_use}</p>
                        </details>
                      </Show>

                      <Show when={product().terms_and_conditions}>
                        <details>
                          <summary>{t('giftcards.terms')}</summary>
                          <p>{product().terms_and_conditions}</p>
                        </details>
                      </Show>

                      <Show when={product().expiry_and_validity}>
                        <details>
                          <summary>{t('giftcards.validity')}</summary>
                          <p>{product().expiry_and_validity}</p>
                        </details>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </Show>
          </aside>
        </div>
      </section>

      <Show when={currencyPickerOpen()}>
        <div class="giftcards-page__modal" role="dialog" aria-modal="true">
          <button
            class="giftcards-page__modal-backdrop"
            onClick={() => setCurrencyPickerOpen(false)}
            type="button"
            aria-label={t('swap.close')}
          />
          <div class="giftcards-page__modal-card">
            <div class="giftcards-page__modal-head">
              <h2>{t('giftcards.chooseCurrency')}</h2>
              <button onClick={() => setCurrencyPickerOpen(false)} type="button">
                ×
              </button>
            </div>
            <CurrencySelector
              selectedCurrency={selectedCurrency()}
              onSelect={currency => {
                setSelectedCurrency(currency);
                setCurrencyPickerOpen(false);
              }}
            />
          </div>
        </div>
      </Show>

      <SiteFooter />
    </main>
  );
}
