/**
 * Frontend Logger
 * Conditional logging based on debug flag
 */

import { FEATURES } from '../config/features';

export const logger = {
  debug(...args: any[]): void {
    if (FEATURES.debugLogs) {
      console.log('[DEBUG]', ...args);
    }
  },

  info(...args: any[]): void {
    console.info('[INFO]', ...args);
  },

  warn(...args: any[]): void {
    console.warn('[WARN]', ...args);
  },

  error(...args: any[]): void {
    console.error('[ERROR]', ...args);
  },
};
