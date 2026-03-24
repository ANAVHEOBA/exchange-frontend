import { For, Match, Show, Switch, createMemo, createSignal } from 'solid-js';
import { CURATED_CURRENCY_SECTIONS, type CuratedCurrencyDefinition } from '../../model/curatedCurrencySections';
import { useCurrencySelector } from '../../model';
import type { Currency } from '../../../../types/currency';
import './CurrencySelector.css';

export interface CurrencySelectorProps {
  onSelect?: (currency: Currency) => void;
  showSearch?: boolean;
  emptyMessage?: string;
  selectedCurrency?: Currency | null;
}

interface ResolvedCurrencySection {
  title: string;
  items: Currency[];
}

const normalize = (value: string): string => value.trim().toLowerCase();

const buildCurrencyKey = (currency: Currency): string => {
  return `${normalize(currency.ticker)}|${normalize(currency.network)}|${normalize(currency.name)}`;
};

const resolveCuratedCurrency = (
  definition: CuratedCurrencyDefinition,
  currenciesByName: Map<string, Currency>,
  currenciesByTicker: Map<string, Currency[]>,
): Currency | null => {
  const namesToTry = [definition.name, ...(definition.aliases ?? [])];

  for (const name of namesToTry) {
    const match = currenciesByName.get(normalize(name));
    if (match) {
      return match;
    }
  }

  const tickerMatches = currenciesByTicker.get(normalize(definition.ticker)) ?? [];
  if (tickerMatches.length === 1) {
    return tickerMatches[0];
  }

  return tickerMatches.find(currency => {
    const candidateName = normalize(currency.name);
    return namesToTry.some(name => candidateName.includes(normalize(name)));
  }) ?? null;
};

const renderCurrencyItem = (
  currency: Currency,
  selected: boolean,
  onSelect: (currency: Currency) => void,
) => {
  return (
    <button
      type="button"
      class="currency-selector__item"
      classList={{ 'currency-selector__item--selected': selected }}
      onClick={() => onSelect(currency)}
    >
      <img
        src={currency.image}
        alt={currency.name}
        class="currency-selector__icon"
        onError={event => {
          (event.currentTarget as HTMLImageElement).src = '/favicon.ico';
        }}
      />
      <div class="currency-selector__info">
        <div class="currency-selector__name">{currency.name}</div>
        <div class="currency-selector__ticker">
          {currency.ticker.toUpperCase()} • {currency.network}
        </div>
      </div>
      <div class="currency-selector__limits">
        <div>Min: {currency.minimum}</div>
        <div>Max: {currency.maximum}</div>
      </div>
    </button>
  );
};

export default function CurrencySelector(props: CurrencySelectorProps) {
  const {
    currencies,
    loading,
    error,
  } = useCurrencySelector();

  const [localSearch, setLocalSearch] = createSignal('');

  const normalizedSearch = createMemo(() => normalize(localSearch()));

  const currenciesByName = createMemo(() => {
    const index = new Map<string, Currency>();

    currencies().forEach(currency => {
      index.set(normalize(currency.name), currency);
    });

    return index;
  });

  const currenciesByTicker = createMemo(() => {
    const index = new Map<string, Currency[]>();

    currencies().forEach(currency => {
      const ticker = normalize(currency.ticker);
      const current = index.get(ticker);

      if (current) {
        current.push(currency);
      } else {
        index.set(ticker, [currency]);
      }
    });

    return index;
  });

  const curatedSections = createMemo<ResolvedCurrencySection[]>(() => {
    return CURATED_CURRENCY_SECTIONS.map(section => {
      const resolved = section.items
        .map(item => resolveCuratedCurrency(item, currenciesByName(), currenciesByTicker()))
        .filter((currency): currency is Currency => Boolean(currency));

      const deduped = Array.from(
        new Map(resolved.map(currency => [buildCurrencyKey(currency), currency])).values(),
      );

      return {
        title: section.title,
        items: deduped,
      };
    }).filter(section => section.items.length > 0);
  });

  const curatedKeys = createMemo(() => {
    const keys = new Set<string>();

    curatedSections().forEach(section => {
      section.items.forEach(currency => {
        keys.add(buildCurrencyKey(currency));
      });
    });

    return keys;
  });

  const searchableCurrencies = createMemo(() => {
    return currencies().map(currency => ({
      currency,
      searchText: [
        currency.ticker,
        currency.name,
        currency.network,
      ].map(normalize).join(' '),
      curated: curatedKeys().has(buildCurrencyKey(currency)),
    }));
  });

  const filteredCurrencies = createMemo(() => {
    const search = normalizedSearch();

    if (!search) {
      return [];
    }

    return searchableCurrencies()
      .map(entry => {
        const ticker = normalize(entry.currency.ticker);
        const name = normalize(entry.currency.name);
        const network = normalize(entry.currency.network);

        let score = 0;

        if (ticker === search) score += 100;
        if (name === search) score += 90;
        if (ticker.startsWith(search)) score += 70;
        if (name.startsWith(search)) score += 50;
        if (network.startsWith(search)) score += 30;
        if (entry.searchText.includes(search)) score += 10;
        if (entry.curated) score += 5;

        return { currency: entry.currency, score };
      })
      .filter(entry => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.currency.name.localeCompare(right.currency.name);
      })
      .slice(0, 120)
      .map(entry => entry.currency);
  });

  const handleSearch = (event: Event) => {
    setLocalSearch((event.currentTarget as HTMLInputElement).value);
  };

  const handleSelect = (currency: Currency) => {
    props.onSelect?.(currency);
  };

  const isSelected = (currency: Currency) => {
    const selected = props.selectedCurrency;

    return Boolean(
      selected &&
      selected.ticker === currency.ticker &&
      selected.network === currency.network
    );
  };

  return (
    <div class="currency-selector">
      <Show when={props.showSearch !== false}>
        <div class="currency-selector__search">
          <input
            type="text"
            placeholder="Type a currency or ticker"
            value={localSearch()}
            onInput={handleSearch}
            class="currency-selector__search-input"
          />
        </div>
      </Show>

      <Switch>
        <Match when={loading()}>
          <div class="currency-selector__state">Loading currencies...</div>
        </Match>

        <Match when={error()}>
          <div class="currency-selector__state currency-selector__state--error">
            Failed to load currencies. Please try again.
          </div>
        </Match>

        <Match when={normalizedSearch() && filteredCurrencies().length === 0}>
          <div class="currency-selector__state">
            {props.emptyMessage ?? 'No currencies found.'}
          </div>
        </Match>

        <Match when={normalizedSearch() && filteredCurrencies().length > 0}>
          <div class="currency-selector__scroll">
            <div class="currency-selector__section">
              <div class="currency-selector__section-title">Search Results</div>
              <div class="currency-selector__items">
                <For each={filteredCurrencies()}>
                  {currency => (
                    renderCurrencyItem(currency, isSelected(currency), handleSelect)
                  )}
                </For>
              </div>
            </div>
          </div>
        </Match>

        <Match when={!normalizedSearch()}>
          <div class="currency-selector__scroll">
            <For each={curatedSections()}>
              {section => (
                <div class="currency-selector__section">
                  <div class="currency-selector__section-title">{section.title}</div>
                  <div class="currency-selector__items">
                    <For each={section.items}>
                      {currency => (
                        renderCurrencyItem(currency, isSelected(currency), handleSelect)
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>

            <div class="currency-selector__more-options">
              Use our search bar for more options!
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
