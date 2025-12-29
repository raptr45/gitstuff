import { CacheEntry, CacheManager as ICacheManager } from "./types";

/**
 * In-memory cache manager with timestamp-based expiration
 */
export class CacheManager implements ICacheManager {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };
    this.cache.set(key, entry);
  }

  /**
   * Retrieve data from cache if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(key)) {
      this.clear(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return true;
    }

    return Date.now() > entry.expiresAt;
  }

  /**
   * Remove entry from cache
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
