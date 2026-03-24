/**
 * Memory Cache Service
 * In-memory cache with TTL support
 */

import { CACHE_CONFIG } from '../../config/cache';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Export singleton instances for different data types
export const rateCache = new MemoryCache(CACHE_CONFIG.maxSize.rates);
export const estimateCache = new MemoryCache(CACHE_CONFIG.maxSize.estimate);
export const currencyCache = new MemoryCache(CACHE_CONFIG.maxSize.currencies);
export const providerCache = new MemoryCache(CACHE_CONFIG.maxSize.providers);
export const pairCache = new MemoryCache(CACHE_CONFIG.maxSize.pairs);
export const swapCache = new MemoryCache(CACHE_CONFIG.maxSize.swaps);
