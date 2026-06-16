interface CurrencyIconLike {
  image?: string | null;
  ticker?: string | null;
}

const LOCAL_ICON_TICKERS = new Set(['btc', 'xmr']);

const buildTickerBadge = (ticker: string): string => {
  const label = ticker.trim().toUpperCase().slice(0, 4) || '?';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="assetarTickerBadge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff6ff" />
          <stop offset="100%" stop-color="#dbeafe" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="32" fill="url(#assetarTickerBadge)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="#bfdbfe" stroke-width="2" />
      <text
        x="32"
        y="36"
        text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${label.length > 3 ? 15 : 18}"
        font-weight="700"
        fill="#1d4ed8"
      >
        ${label}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getCurrencyIconFallback = (ticker?: string | null): string => {
  const normalizedTicker = ticker?.trim().toLowerCase() ?? '';

  if (normalizedTicker && LOCAL_ICON_TICKERS.has(normalizedTicker)) {
    return `/country/icons/${normalizedTicker}.svg`;
  }

  return buildTickerBadge(ticker ?? '?');
};

export const getCurrencyIconSrc = (
  currency?: CurrencyIconLike | null,
  fallbackTicker?: string,
): string => {
  if (currency?.image) {
    return currency.image;
  }

  return getCurrencyIconFallback(currency?.ticker ?? fallbackTicker);
};
