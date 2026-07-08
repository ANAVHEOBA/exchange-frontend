import { Title } from '@solidjs/meta';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
} from 'solid-js';
import Header from '../../components/Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { giftcardsApi } from '../../api/endpoints/giftcards';
import CurrencySelector from '../../features/currencies/ui/CurrencySelector/CurrencySelector';
import {
  COUNTRY_OPTIONS,
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  buildGiftcardRangeNote,
  countryCodeToFlagEmoji,
  formatGiftcardAmount,
  formatGiftcardAmountRange,
  formatGiftcardFiatAmount,
  getGiftcardCurrencyCode,
  getCountryName,
  normalizeDenominations,
  normalizeGiftcardValue,
  resolveCategoryValue,
  resolveCountryCode,
} from '../../config/giftcards';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useLocale } from '../../i18n/locale';
import type { Currency } from '../../types/currency';
import type { GiftCardProduct } from '../../types/giftcard';
import { getCurrencyIconFallback, getCurrencyIconSrc } from '../../utils/currencyIcon';
import '../giftcards.css';

const GiftcardIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 512 512">
    <path d="M190.5 68.8 225.3 128H224 152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H438.4c6.1-12 9.6-25.6 9.6-40 0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0H152C103.4 0 64 39.4 64 88zm336 0c0 22.1-17.9 40-40 40H288h-1.3l34.8-59.2C329.1 55.9 342.9 48 357.8 48H360c22.1 0 40 17.9 40 40zM32 288V464c0 26.5 21.5 48 48 48H224V288H32zM288 512H432c26.5 0 48-21.5 48-48V288H288V512z" />
  </svg>
);

const SearchIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 512 512">
    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
  </svg>
);

const ChevronIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 320 512">
    <path
      fill="currentColor"
      d="M182.6 374.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128z"
    />
  </svg>
);

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const resolveDefaultCurrency = (currencies: Currency[]): Currency | null => {
  return (
    currencies.find(currency => {
      return (
        currency.ticker.toLowerCase() === 'xmr' &&
        currency.network.toLowerCase() === 'mainnet'
      );
    }) ??
    currencies.find(currency => currency.ticker.toLowerCase() === 'xmr') ??
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

const readSearchParam = (value?: string | string[]): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

const getCountryFlagSrc = (code?: string | null): string | null => {
  if (!code || code.trim().length !== 2) {
    return null;
  }

  return `/country_flags/${code.trim().toLowerCase()}.svg`;
};

const CountryFlag = (props: { code?: string | null; class?: string }) => {
  const src = createMemo(() => getCountryFlagSrc(props.code));

  return (
    <span class={props.class}>
      <Show when={src()} fallback={countryCodeToFlagEmoji(props.code)}>
        {resolved => <img src={resolved()} alt="" loading="lazy" />}
      </Show>
    </span>
  );
};

export default function GiftCardsCatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLocale();
  const { currencies } = useCurrencies();
  const countryParam = readSearchParam(searchParams.country);
  const categoryParam = readSearchParam(searchParams.category);
  const searchParam = readSearchParam(searchParams.search);
  const qParam = readSearchParam(searchParams.q);

  const [requestedCountry, setRequestedCountry] = createSignal(resolveCountryCode(countryParam));
  const [country, setCountry] = createSignal(requestedCountry());
  const [category, setCategory] = createSignal(resolveCategoryValue(categoryParam));
  const [search, setSearch] = createSignal(searchParam?.trim() ?? qParam?.trim() ?? '');
  const [openMenu, setOpenMenu] = createSignal<'country' | 'category' | null>(null);
  const [cachedCards, setCachedCards] = createSignal<GiftCardProduct[]>([]);
  const [failedImages, setFailedImages] = createSignal<Record<string, boolean>>({});
  const [selectedProductId, setSelectedProductId] = createSignal<string | null>(null);
  const [productModalOpen, setProductModalOpen] = createSignal(false);
  const [pendingProductNavigation, setPendingProductNavigation] = createSignal<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = createSignal<Currency | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = createSignal(false);
  const [amountMenuOpen, setAmountMenuOpen] = createSignal(false);
  const [email, setEmail] = createSignal('');
  const [amountInput, setAmountInput] = createSignal('');
  const [configuredProductId, setConfiguredProductId] = createSignal<string | null>(null);
  const [submitting, setSubmitting] = createSignal(false);
  const [submitError, setSubmitError] = createSignal<string | null>(null);
  const deepLinkedProductId = createMemo(() => {
    return decodeURIComponent(readSearchParam(searchParams.product) ?? '').trim() || null;
  });

  const [catalog, { refetch }] = createResource(requestedCountry, selectedCountry =>
    giftcardsApi.getCatalog({ country: selectedCountry }),
  );

  createEffect(() => {
    const nextCards = catalog()?.cards;
    if (nextCards) {
      setCachedCards(nextCards);
      setCountry(requestedCountry());
    }
  });

  createEffect(() => {
    const availableCurrencies = currencies();
    if (availableCurrencies.length === 0 || selectedCurrency()) {
      return;
    }

    setSelectedCurrency(resolveDefaultCurrency(availableCurrencies));
  });

  const catalogCards = createMemo(() => cachedCards());

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
    if (!derivedCategories().some(option => option === category())) {
      setCategory(DEFAULT_CATEGORY);
    }
  });

  const buildCatalogHref = (productId?: string | null) => {
    const params = new URLSearchParams({ country: requestedCountry() });
    const currentCategory = category();
    const searchValue = search().trim();

    if (currentCategory !== DEFAULT_CATEGORY) {
      params.set('category', currentCategory);
    }

    if (searchValue) {
      params.set('search', searchValue);
    }

    if (productId) {
      params.set('product', productId);
    }

    return `/giftcards/?${params.toString()}`;
  };

  const filteredCards = createMemo(() => {
    const selectedCategory = category();
    const searchTerm = normalizeGiftcardValue(search());

    return catalogCards()
      .filter(card => {
        if (selectedCategory === DEFAULT_CATEGORY) {
          return true;
        }

        return normalizeGiftcardValue(card.category ?? '') === normalizeGiftcardValue(selectedCategory);
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
          .map(normalizeGiftcardValue)
          .join(' ');

        return haystack.includes(searchTerm);
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  });

  const activeProduct = createMemo(() => {
    const productId = selectedProductId();
    if (!productId) {
      return null;
    }

    return catalogCards().find(card => card.product_id === productId) ?? null;
  });
  const modalProduct = createMemo(() => (productModalOpen() ? activeProduct() : null));
  const activeDenominationOptions = createMemo(() => normalizeDenominations(modalProduct()));
  const selectedCardCurrencyCode = createMemo(() => getGiftcardCurrencyCode(modalProduct(), country()));

  createEffect(() => {
    const productId = deepLinkedProductId();

    if (!productId) {
      if (!pendingProductNavigation() && productModalOpen()) {
        setSelectedProductId(null);
        setProductModalOpen(false);
        setCurrencyPickerOpen(false);
        setAmountMenuOpen(false);
      }
      return;
    }

    setPendingProductNavigation(null);

    if (catalogCards().length === 0) {
      setSelectedProductId(productId);
      setProductModalOpen(true);
      setCurrencyPickerOpen(false);
      setAmountMenuOpen(false);
      setSubmitError(null);
      return;
    }

    const matchedProduct = catalogCards().find(card => card.product_id === productId);
    if (!matchedProduct) {
      return;
    }

    if (selectedProductId() === productId && productModalOpen()) {
      return;
    }

    setSelectedProductId(productId);
    setProductModalOpen(true);
    setCurrencyPickerOpen(false);
    setSubmitError(null);
  });

  createEffect(() => {
    if (!selectedProductId() || catalogCards().length === 0) {
      return;
    }

    if (!activeProduct()) {
      setSelectedProductId(null);
      setProductModalOpen(false);
      setCurrencyPickerOpen(false);
      setAmountMenuOpen(false);
    }
  });

  createEffect(() => {
    if (productModalOpen()) {
      return;
    }

    setCurrencyPickerOpen(false);
  });

  createEffect(() => {
    const product = activeProduct();
    const productId = product?.product_id ?? null;

    if (configuredProductId() === productId) {
      return;
    }

    setConfiguredProductId(productId);
    setSubmitError(null);

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

  createEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    if (!productModalOpen() && !currencyPickerOpen()) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (currencyPickerOpen()) {
        setCurrencyPickerOpen(false);
        return;
      }

      if (amountMenuOpen()) {
        setAmountMenuOpen(false);
        return;
      }

      closeProductModal();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    onCleanup(() => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    });
  });

  const selectedCountryName = createMemo(() => getCountryName(country()));
  const requestedCountryName = createMemo(() => getCountryName(requestedCountry()));
  const selectedCategoryTitle = createMemo(() => {
    return category() === DEFAULT_CATEGORY ? t('giftcards.allCategories') : category();
  });
  const resultsCopy = createMemo(() => `${filteredCards().length} ${t('giftcards.results')}`);
  const paymentCurrencyLabel = createMemo(() => {
    const currency = selectedCurrency();
    if (!currency) {
      return '—';
    }

    return `${currency.name} • ${currency.network}`;
  });
  const selectedAmount = createMemo(() => {
    const normalizedValue = amountInput().replaceAll(',', '.').trim();
    if (!normalizedValue) {
      return null;
    }

    const parsed = Number(normalizedValue);
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
      return `${t('giftcards.minValuePrefix')} ${formatGiftcardFiatAmount(product.min_amount, getGiftcardCurrencyCode(product))}.`;
    }

    if (product.max_amount !== undefined && product.max_amount !== null && amount > product.max_amount) {
      return `${t('giftcards.maxValuePrefix')} ${formatGiftcardFiatAmount(product.max_amount, getGiftcardCurrencyCode(product))}.`;
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

  const openProductModal = (productId: string) => {
    setPendingProductNavigation(productId);
    setSelectedProductId(productId);
    setProductModalOpen(true);
    setCurrencyPickerOpen(false);
    setAmountMenuOpen(false);
    setSubmitError(null);
    void navigate(buildCatalogHref(productId));
  };

  const closeProductModal = () => {
    setPendingProductNavigation(null);
    setProductModalOpen(false);
    setCurrencyPickerOpen(false);
    setAmountMenuOpen(false);
    void navigate(buildCatalogHref(), { replace: true });
  };

  const handleCreateCheckout = async () => {
    if (submitting()) {
      return;
    }

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
    setAmountMenuOpen(false);
    const currencyCode = getGiftcardCurrencyCode(product, country());

    try {
      const order = await giftcardsApi.createOrder({
        product_id: product.product_id,
        ticker_from: payCurrency.ticker,
        network_from: payCurrency.network,
        amount,
        email: email().trim(),
        currency_code: currencyCode,
      });

      const orderRef = order.trade_id || order.order_id;
      const orderQuery = new URLSearchParams({
        product: product.name,
        currency: currencyCode,
        value: amount.toFixed(2),
      });

      if (product.card_image_url) {
        orderQuery.set('image', product.card_image_url);
      }

      void navigate(`/giftcards/orders/${encodeURIComponent(orderRef)}?${orderQuery.toString()}`);
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
    <main class="giftcards-page giftcards-page--catalog">
      <Title>{`${t('giftcards.pageTitle')} | ASSETAR`}</Title>
      <Header />

      <section class="giftcards-page__hero">
        <div class="giftcards-page__shell">
          <div class="giftcards-page__hero-layout">
            <div class="giftcards-page__intro giftcards-page__intro--catalog">
              <div class="giftcards-page__eyebrow giftcards-page__eyebrow--catalog">
                {t('giftcards.eyebrow')}
              </div>
              <h1 class="giftcards-page__title giftcards-page__title--catalog">{t('giftcards.title')}</h1>
              <p class="giftcards-page__copy giftcards-page__copy--catalog">{t('giftcards.introCopy')}</p>
              <div class="giftcards-page__mode-switch">
                <A
                  class="giftcards-page__mode-pill giftcards-page__mode-pill--active"
                  href="/giftcards/"
                >
                  {t('giftcards.buyMode')}
                </A>
                <A class="giftcards-page__mode-pill" href="/giftcards/sell">
                  {t('giftcards.sellMode')}
                </A>
              </div>
              <p class="giftcards-page__limit">{t('giftcards.limit')}</p>
            </div>

            <div class="giftcards-page__hero-panel">
              <GiftcardIcon />

              <div class="giftcards-page__hero-panel-field">
                <span class="giftcards-page__hero-panel-label">{t('giftcards.countryLabel')}</span>
                <div class="giftcards-page__select-shell">
                  <button
                    id="giftcards-country"
                    class="giftcards-page__select-trigger"
                    type="button"
                    aria-expanded={openMenu() === 'country'}
                    onClick={() => setOpenMenu(openMenu() === 'country' ? null : 'country')}
                  >
                    <CountryFlag class="giftcards-page__select-flag" code={requestedCountry()} />
                    <span class="giftcards-page__select-value">{requestedCountryName()}</span>
                    <span class="giftcards-page__select-chevron">
                      <ChevronIcon />
                    </span>
                  </button>

                  <Show when={openMenu() === 'country'}>
                    <>
                      <button
                        class="giftcards-page__select-overlay"
                        type="button"
                        aria-label={`Close ${t('giftcards.countryLabel')}`}
                        onClick={() => setOpenMenu(null)}
                      />
                      <div class="giftcards-page__select-panel">
                        <div class="giftcards-page__select-panel-header">
                          <span>{t('giftcards.countryLabel')}</span>
                          <button type="button" onClick={() => setOpenMenu(null)}>
                            ×
                          </button>
                        </div>

                        <For each={COUNTRY_OPTIONS}>
                          {option => (
                            <button
                              class="giftcards-page__select-option"
                              classList={{ 'is-active': option.code === requestedCountry() }}
                              type="button"
                        onClick={() => {
                          setRequestedCountry(option.code);
                          setOpenMenu(null);
                          setAmountMenuOpen(false);
                          closeProductModal();
                          setSelectedProductId(null);
                        }}
                            >
                              <CountryFlag class="giftcards-page__select-flag" code={option.code} />
                              <span class="giftcards-page__select-value">{option.name}</span>
                            </button>
                          )}
                        </For>
                      </div>
                    </>
                  </Show>
                </div>
              </div>

              <div class="giftcards-page__hero-panel-field">
                <span class="giftcards-page__hero-panel-label">{t('giftcards.categoryLabel')}</span>
                <div class="giftcards-page__select-shell">
                  <button
                    id="giftcards-category"
                    class="giftcards-page__select-trigger giftcards-page__select-trigger--category"
                    type="button"
                    aria-expanded={openMenu() === 'category'}
                    onClick={() => setOpenMenu(openMenu() === 'category' ? null : 'category')}
                  >
                    <span class="giftcards-page__select-value giftcards-page__select-value--center">
                      {selectedCategoryTitle()}
                    </span>
                    <span class="giftcards-page__select-chevron">
                      <ChevronIcon />
                    </span>
                  </button>

                  <Show when={openMenu() === 'category'}>
                    <>
                      <button
                        class="giftcards-page__select-overlay"
                        type="button"
                        aria-label={`Close ${t('giftcards.categoryLabel')}`}
                        onClick={() => setOpenMenu(null)}
                      />
                      <div class="giftcards-page__select-panel">
                        <div class="giftcards-page__select-panel-header">
                          <span>{t('giftcards.categoryLabel')}</span>
                          <button type="button" onClick={() => setOpenMenu(null)}>
                            ×
                          </button>
                        </div>

                        <For each={derivedCategories()}>
                          {option => (
                            <button
                              class="giftcards-page__select-option giftcards-page__select-option--category"
                              classList={{ 'is-active': option === category() }}
                              type="button"
                              onClick={() => {
                                setCategory(option);
                                setOpenMenu(null);
                                setAmountMenuOpen(false);
                                closeProductModal();
                                setSelectedProductId(null);
                              }}
                            >
                              <span class="giftcards-page__select-value giftcards-page__select-value--center">
                                {option}
                              </span>
                            </button>
                          )}
                        </For>
                      </div>
                    </>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="giftcards-page__utility giftcards-page__utility--catalog">
        <div class="giftcards-page__shell">
          <div class="giftcards-page__utility-grid giftcards-page__utility-grid--catalog">
            <div class="giftcards-page__country-box giftcards-page__country-box--catalog">
              <div class="giftcards-page__country-box-copy">{t('giftcards.showingCardsAvailableFor')}</div>
              <div class="giftcards-page__country-box-row">
                <CountryFlag class="giftcards-page__country-flag" code={country()} />
                <span>{selectedCountryName()}</span>
              </div>
            </div>

            <label class="giftcards-page__search-card giftcards-page__search-card--catalog">
              <SearchIcon />
              <input
                type="search"
                value={search()}
                onInput={event => setSearch(event.currentTarget.value)}
                placeholder={t('giftcards.searchProduct')}
                aria-label={t('giftcards.searchProduct')}
              />
            </label>
          </div>
        </div>
      </section>

      <section class="giftcards-page__catalog-section">
        <div class="giftcards-page__shell">
          <div class="giftcards-page__catalog-title giftcards-page__catalog-title--catalog">
            <h2>{selectedCategoryTitle()}</h2>
            <p>{resultsCopy()}</p>
          </div>

          <Switch>
            <Match when={catalog.loading && catalogCards().length === 0}>
              <div class="giftcards-page__feedback giftcards-page__feedback--catalog">
                {t('giftcards.loading')}
              </div>
            </Match>

            <Match when={catalog.error && catalogCards().length === 0}>
              <div class="giftcards-page__feedback giftcards-page__feedback--catalog giftcards-page__feedback--error">
                <div>{t('giftcards.failed')}</div>
                <button type="button" onClick={() => void refetch()}>
                  {t('giftcards.retry')}
                </button>
              </div>
            </Match>

            <Match when={filteredCards().length === 0}>
              <div class="giftcards-page__feedback giftcards-page__feedback--catalog">
                {t('giftcards.empty')}
              </div>
            </Match>

            <Match when={filteredCards().length > 0}>
              <div class="giftcards-page__grid">
                <For each={filteredCards()}>
                  {card => (
                    <button
                      class="giftcards-page__product-card"
                      type="button"
                      onClick={() => openProductModal(card.product_id)}
                    >
                      <div class="giftcards-page__product-card-inner">
                        <div class="giftcards-page__product-image-wrap">
                          <Show
                            when={card.card_image_url && !failedImages()[card.product_id]}
                            fallback={
                              <div class="giftcards-page__product-image-fallback">
                                {card.name.slice(0, 1).toUpperCase()}
                              </div>
                            }
                          >
                            <img
                              class="giftcards-page__product-image"
                              src={card.card_image_url || ''}
                              alt={card.name}
                              loading="lazy"
                              onError={() =>
                                setFailedImages(current => ({ ...current, [card.product_id]: true }))
                              }
                            />
                          </Show>
                        </div>
                        <div class="giftcards-page__product-name">{card.name}</div>
                        <div class="giftcards-page__product-range">{formatGiftcardAmountRange(card)}</div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </Match>
          </Switch>
        </div>
      </section>

      <Show when={modalProduct()}>
        {product => (
            <div class="giftcards-page__product-modal" role="dialog" aria-modal="true" aria-labelledby="giftcards-product-modal-title">
              <button
                class="giftcards-page__product-modal-backdrop"
                type="button"
                onClick={closeProductModal}
                aria-label={t('giftcards.backToCards')}
              />

              <div class="giftcards-page__product-modal-shell">
                <div class="giftcards-page__product-modal-head">
                  <div>
                    <div class="giftcards-page__product-modal-kicker">
                      {product().category || DEFAULT_CATEGORY}
                    </div>
                    <h2 id="giftcards-product-modal-title">{product().name}</h2>
                    <p>{getCountryName(product().country || country())}</p>
                  </div>

                  <button class="giftcards-page__product-modal-close" type="button" onClick={closeProductModal}>
                    <span>{t('giftcards.backToCards')}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <div class="giftcards-page__product-modal-body">
                  <div class="giftcards-page__product-modal-layout">
                    <div class="giftcard-product-page__info-card giftcards-page__product-modal-panel giftcards-page__product-modal-panel--info">
                      <div class="giftcards-page__product-modal-art">
                        <Show
                          when={product().card_image_url && !failedImages()[product().product_id]}
                          fallback={
                            <div class="giftcards-page__product-image-fallback">
                              {product().name.slice(0, 1).toUpperCase()}
                            </div>
                          }
                        >
                          <img
                            class="giftcard-product-page__image"
                            src={product().card_image_url || ''}
                            alt={product().name}
                            onError={() =>
                              setFailedImages(current => ({ ...current, [product().product_id]: true }))
                            }
                          />
                        </Show>
                      </div>

                      <Show when={product().description}>
                        <p class="giftcard-product-page__description">{product().description}</p>
                      </Show>

                      <Show when={product().terms_and_conditions}>
                        <section class="giftcard-product-page__detail-block">
                          <h2>{t('giftcards.terms')}</h2>
                          <p>{product().terms_and_conditions}</p>
                        </section>
                      </Show>

                      <Show when={product().how_to_use}>
                        <section class="giftcard-product-page__detail-block">
                          <h2>{t('giftcards.howToUse')}</h2>
                          <p>{product().how_to_use}</p>
                        </section>
                      </Show>

                      <Show when={product().expiry_and_validity}>
                        <section class="giftcard-product-page__detail-block">
                          <h2>{t('giftcards.validity')}</h2>
                          <p>{product().expiry_and_validity}</p>
                        </section>
                      </Show>

                      <div class="giftcard-product-page__country-note">
                        {getCountryName(product().country || country())}
                      </div>
                    </div>

                    <div class="giftcard-product-page__form-card giftcards-page__product-modal-panel giftcards-page__product-modal-panel--checkout">
                      <svg
                        class="giftcard-product-page__icon"
                        fill="currentColor"
                        viewBox="0 0 512 512"
                        aria-hidden="true"
                      >
                        <path d="M190.5 68.8L225.3 128H224 152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H438.4c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0H152C103.4 0 64 39.4 64 88zm336 0c0 22.1-17.9 40-40 40H288h-1.3l34.8-59.2C329.1 55.9 342.9 48 357.8 48H360c22.1 0 40 17.9 40 40zM32 288V464c0 26.5 21.5 48 48 48H224V288H32zM288 512H432c26.5 0 48-21.5 48-48V288H288V512z" />
                      </svg>

                      <div class="giftcard-product-page__label">{t('giftcards.chooseAmount')}</div>
                      <div class="giftcard-product-page__range-note">{buildGiftcardRangeNote(product())}</div>

                      <Show
                        when={activeDenominationOptions().length > 0}
                        fallback={
                          <div class="giftcards-page__amount-input-wrap">
                            <input
                              class="giftcard-product-page__input giftcards-page__amount-input"
                              type="number"
                              min={product().min_amount ?? undefined}
                              max={product().max_amount ?? undefined}
                              step="0.01"
                              value={amountInput()}
                              onInput={event => {
                                setAmountInput(event.currentTarget.value);
                                setSubmitError(null);
                              }}
                              placeholder={t('giftcards.cardValue')}
                            />
                            <span>{selectedCardCurrencyCode()}</span>
                          </div>
                        }
                      >
                        <div class="giftcards-page__amount-select">
                          <button
                            class="giftcards-page__amount-trigger"
                            type="button"
                            aria-expanded={amountMenuOpen()}
                            onClick={() => {
                              setCurrencyPickerOpen(false);
                              setAmountMenuOpen(value => !value);
                            }}
                          >
                            <span>
                              {formatGiftcardFiatAmount(selectedAmount(), selectedCardCurrencyCode(), {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span class="giftcards-page__select-chevron">
                              <ChevronIcon />
                            </span>
                          </button>

                          <Show when={amountMenuOpen()}>
                            <>
                              <button
                                class="giftcards-page__select-overlay"
                                type="button"
                                aria-label={`Close ${t('giftcards.chooseAmount')}`}
                                onClick={() => setAmountMenuOpen(false)}
                              />
                              <div class="giftcards-page__amount-panel">
                                <div class="giftcards-page__select-panel-header">
                                  <span>{t('giftcards.chooseAmount')}</span>
                                  <button type="button" onClick={() => setAmountMenuOpen(false)}>
                                    ×
                                  </button>
                                </div>

                                <For each={activeDenominationOptions()}>
                                  {value => (
                                    <button
                                      type="button"
                                      class="giftcards-page__amount-option"
                                      classList={{ 'is-active': selectedAmount() === value }}
                                      onClick={() => {
                                        setAmountInput(String(value));
                                        setAmountMenuOpen(false);
                                        setSubmitError(null);
                                      }}
                                    >
                                      {formatGiftcardFiatAmount(value, selectedCardCurrencyCode(), {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 2,
                                      })}
                                    </button>
                                  )}
                                </For>
                              </div>
                            </>
                          </Show>
                        </div>
                      </Show>

                      <Show when={activeDenominationOptions().length > 0}>
                        <div class="giftcards-page__field-note">
                          {t('giftcards.availableValues')}: {activeDenominationOptions().map(value => formatGiftcardFiatAmount(value, selectedCardCurrencyCode())).join(', ')}
                        </div>
                      </Show>

                      <Show when={activeDenominationOptions().length === 0}>
                        <div class="giftcards-page__field-note">
                          {t('giftcards.allowedRange')}: {formatGiftcardAmountRange(product())}
                        </div>
                      </Show>

                      <Show when={amountError()}>
                        <div class="giftcard-product-page__error">{amountError()}</div>
                      </Show>

                      <div class="giftcard-product-page__label">{t('giftcards.paymentMethod')}</div>
                      <div class="giftcards-page__currency-select">
                        <button
                          class="giftcard-product-page__currency-trigger"
                          type="button"
                          aria-expanded={currencyPickerOpen()}
                          onClick={() => {
                            setAmountMenuOpen(false);
                            setCurrencyPickerOpen(value => !value);
                          }}
                        >
                          <Show when={selectedCurrency()} fallback={<span>{t('giftcards.chooseCurrency')}</span>}>
                            {currency => (
                              <>
                                <img
                                  class="giftcard-product-page__currency-icon"
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

                        <Show when={currencyPickerOpen()}>
                          <div class="giftcards-page__currency-panel">
                            <div class="giftcards-page__select-panel-header">
                              <span>{t('giftcards.chooseCurrency')}</span>
                              <button type="button" onClick={() => setCurrencyPickerOpen(false)}>
                                ×
                              </button>
                            </div>
                            <CurrencySelector
                              onSelect={currency => {
                                setSelectedCurrency(currency);
                                setCurrencyPickerOpen(false);
                                setSubmitError(null);
                              }}
                              selectedCurrency={selectedCurrency()}
                            />
                          </div>
                        </Show>
                      </div>

                      <div class="giftcard-product-page__label">{t('giftcards.deliveryEmailLabel')}</div>
                      <input
                        class="giftcard-product-page__input"
                        type="email"
                        value={email()}
                        onInput={event => {
                          setEmail(event.currentTarget.value);
                          setSubmitError(null);
                        }}
                        placeholder={t('giftcards.deliveryEmail')}
                      />

                      <p class="giftcard-product-page__terms-note">{t('giftcards.agreeTerms')}</p>

                      <Show when={submitError()}>
                        <div class="giftcard-product-page__error">{submitError()}</div>
                      </Show>

                      <button
                        class="giftcard-product-page__submit"
                        type="button"
                        disabled={!canCreateCheckout()}
                        onClick={() => void handleCreateCheckout()}
                      >
                        {submitting() ? t('giftcards.creatingCheckout') : t('giftcards.buyCard')}
                      </button>

                      <Show when={submitting()}>
                        <div class="giftcards-page__creating-overlay" aria-live="assertive">
                          <div class="giftcards-page__creating-card">
                            <div class="giftcards-page__creating-spinner" />
                            <strong>{t('giftcards.creatingCheckout')}</strong>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </Show>

      <SiteFooter />
    </main>
  );
}
