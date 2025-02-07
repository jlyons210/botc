import { CacheConfig, CacheEntry } from './index.js';
import { OpenAICacheSettings } from '../../../Botc/Configuration/Configuration.types.js';

/**
 * Multi-purpose key-value cache
 */
export class ObjectCache {
  private cached: CacheEntry = {};

  /**
   * New object cache
   * @param {OpenAICacheSettings} config Cache settings
   */
  constructor(private config: OpenAICacheSettings) {
    setInterval(() => this.clearExpired(), 60000);
  }

  /**
   * Cache the provided entry
   * @param {CacheConfig} entry Entry to be cached
   */
  public cache(entry: CacheConfig): void {
    this.cached[entry.key] = {
      value: entry.value,
      expiresAt: Date.now() + (this.config.describeImageCacheTtlHours.value as number) * 60 * 60 * 1000,
    };

    if (this.config.logCacheEntries.value.toString() === 'true') {
      console.log(`ObjectCache.cache: Cached ${entry.key}`);
    }
  }

  /**
   * Clears expired cache entries
   */
  private clearExpired(): void {
    for (const key in this.cached) {
      if (this.cached[key].expiresAt < Date.now()) {
        delete this.cached[key];

        if (this.config.logCachePurges.value.toString() === 'true') {
          console.log(`ObjectCache.clearExpired: Removing expired entry ${key}`);
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

    if (entry) {
      if (this.config.logCacheHits.value.toString() === 'true') {
        console.log(`ObjectCache.getValue: Cache hit for ${key}`);
      }

      return entry.value;
    }
    else {
      if (this.config.logCacheMisses.value.toString() === 'true') {
        console.log(`ObjectCache.getValue: Cache miss for ${key}`);
      }

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
