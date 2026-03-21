/**
 * Currency List Component
 * Displays list of currencies with search and selection
 */

import { For, Show, createSignal } from 'solid-js';
import { useCurrencies } from '../../hooks/useCurrencies';
import './CurrencyList.css';

interface CurrencyListProps {
  onSelect?: (currency: any) => void;
  showSearch?: boolean;
}

function CurrencyList(props: CurrencyListProps) {
  const {
    filteredCurrencies,
    loading,
    error,
    search,
    select,
    searchTerm,
  } = useCurrencies();

  const [localSearch, setLocalSearch] = createSignal('');

  const handleSearch = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setLocalSearch(value);
    search(value);
  };

  const handleSelect = (currency: any) => {
    select(currency);
    if (props.onSelect) {
      props.onSelect(currency);
    }
  };

  return (
    <div class="currency-list">
      <Show when={props.showSearch !== false}>
        <div class="search-box">
          <input
            type="text"
            placeholder="Search currencies..."
            value={localSearch()}
            onInput={handleSearch}
            class="search-input"
          />
        </div>
      </Show>

      <Show when={loading}>
        <div class="loading">Loading currencies...</div>
      </Show>

      <Show when={error}>
        <div class="error">
          Failed to load currencies. Please try again.
        </div>
      </Show>

      <Show when={!loading && !error}>
        <div class="currency-items">
          <For each={filteredCurrencies()}>
            {(currency) => (
              <div
                class="currency-item"
                onClick={() => handleSelect(currency)}
              >
                <img
                  src={currency.image}
                  alt={currency.name}
                  class="currency-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.ico';
                  }}
                />
                <div class="currency-info">
                  <div class="currency-name">{currency.name}</div>
                  <div class="currency-ticker">
                    {currency.ticker} • {currency.network}
                  </div>
                </div>
                <div class="currency-limits">
                  <div class="limit-label">Min: {currency.minimum}</div>
                  <div class="limit-label">Max: {currency.maximum}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default CurrencyList;
