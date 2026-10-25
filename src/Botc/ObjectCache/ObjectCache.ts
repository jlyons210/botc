import type { CacheConfig, CacheEntry } from "./index.ts";
import type {
  ConfigurationSettings,
  OpenAICacheLoggingSettings,
} from "../Configuration/index.ts";
import { Logger } from "../Logger/index.ts";

/**
 * Multi-purpose key-value cache
 */
export class ObjectCache {
  private readonly cached: CacheEntry = new Map();
  private readonly logger = new Logger();
  private ttlConfig: ConfigurationSettings;
  private logConfig: OpenAICacheLoggingSettings;
  private readonly expirationInterval = setInterval(
    () => this.clearExpired(),
    60000,
  );

  /**
   * New object cache
   * @param ttlConfig - Cache TTL configuration
   * @param logConfig - Cache logging configuration
   */
  constructor(
    ttlConfig: ConfigurationSettings,
    logConfig: OpenAICacheLoggingSettings,
  ) {
    this.ttlConfig = ttlConfig;
    this.logConfig = logConfig;
  }

  /**
   * Clears expired cache entries
   */
  private clearExpired(): void {
    for (const [key, entry] of this.cached) {
      if (entry.expiresAt < Date.now()) {
        this.cached.delete(key);

        if (this.logConfig.logCachePurges.value.toString() === "true") {
          this.logger.log(
            `ObjectCache.clearExpired: Removing expired entry ${key}`,
            "INFO",
          );
        }
      }
    }
  }

  /**
   * Check if key is cached
   * @param key - Entry key
   * @returns true if cached
   */
  public contains(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Clear the expiration interval to allow shutdown
   */
  public destroy(): void {
    clearInterval(this.expirationInterval);
    this.logger.log(`ObjectCache.destroy: Object cache destroyed`, "DEBUG");
  }

  /**
   * Retrieve cached value from key
   * @param key - Entry key
   * @returns Cached value or undefined if not found
   */
  public get(key: string): string | undefined {
    const entry = this.cached.get(key);

    if (entry) {
      if (this.logConfig.logCacheHits.value.toString() === "true") {
        this.logger.log(`ObjectCache.getValue: Cache hit for ${key}`, "INFO");
      }

      return entry.value;
    } else {
      if (this.logConfig.logCacheMisses.value.toString() === "true") {
        this.logger.log(`ObjectCache.getValue: Cache miss for ${key}`, "INFO");
      }

      return undefined;
    }
  }

  /**
   * Cache the provided entry
   * @param entry - Entry to be cached
   */
  public put(entry: CacheConfig): void {
    this.cached.set(entry.key, {
      value: entry.value,
      expiresAt: Date.now() + (this.ttlConfig.value as number) * 60 * 60 * 1000,
    });

    if (this.logConfig.logCacheEntries.value.toString() === "true") {
      this.logger.log(`ObjectCache.cache: Cached ${entry.key}`, "INFO");
    }
  }

  /**
   * Get number of cache entries
   * @returns Number of cache entries
   */
  public get count(): number {
    return this.cached.size;
  }
}
