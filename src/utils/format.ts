/**
 * Format Utilities
 * Number and currency formatting helpers
 */

export const format = {
  /**
   * Format number with decimals
   */
  number(value: number, decimals: number = 8): string {
    return value.toFixed(decimals).replace(/\.?0+$/, '');
  },

  /**
   * Format currency amount
   */
  currency(value: number, ticker: string, decimals: number = 8): string {
    return `${format.number(value, decimals)} ${ticker.toUpperCase()}`;
  },

  /**
   * Format large numbers with K, M, B suffixes
   */
  compact(value: number): string {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
  },
};
