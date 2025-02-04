import {
  CacheConfig,
  CacheEntry,
  ObjectCacheConfig,
} from './index.js';

/**
 * Multi-purpose key-value cache
 */
export class ObjectCache {
  private cached: CacheEntry = {};

  /**
   * New object cache
   * @param {ObjectCacheConfig} config configuration
   */
  constructor(private config: ObjectCacheConfig) {
    setInterval(() => this.clearExpired(), 60000);
  }

  /**
   * Cache the provided entry
   * @param {CacheConfig} entry Entry to be cached
   */
  public cache(entry: CacheConfig): void {
    this.cached[entry.key] = {
      value: entry.value,
      expiresAt: Date.now() + this.config.ttlHours * 60 * 60 * 1000,
    };

    if (this.config.logging?.logCacheEntries) {
      console.debug(`ObjectCache.cache: Cached ${entry.key}`);
    }
  }

  /**
   * Clears expired cache entries
   */
  private clearExpired(): void {
    for (const key in this.cached) {
      if (this.cached[key].expiresAt < Date.now()) {
        delete this.cached[key];

        if (this.config.logging?.logCachePurges) {
          console.debug(`ObjectCache.clearExpired: Removing expired entry ${key}`);
        }
      }
    }
  }

  /**
   * Retrieve cached value from key
   * @param {string} key Entry key
   * @returns {string | undefined} Cached value or undefined if not found
   */
  public getValue(key: string): string | undefined {
    const entry = this.cached[key];

    if (entry && this.config.logging?.logCacheHits) {
      console.debug(`ObjectCache.getValue: Cache hit for ${key}`);
      return entry.value;
    }

    if (!entry && this.config.logging?.logCacheMisses) {
      console.debug(`ObjectCache.getValue: Cache miss for ${key}`);
      return undefined;
    }
  }

  /**
   * Check if key is cached
   * @param {string} key Entry key
   * @returns {boolean} true if cached
   */
  public isCached(key: string): boolean {
    return (this.getValue(key) !== undefined);
  }
}
