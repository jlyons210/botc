export type CacheEntry = {
  [key: string]: CacheValue;
};

export type CacheValue = {
  value: string;
  expiresAt: number;
};

export interface CacheConfig {
  key: string;
  value: string;
}

export interface ObjectCacheConfig {
  /**
   * Cache time-to-live in hours
   * @type {number}
   */
  logging?: {
    logCacheEntries?: boolean;
    logCacheHits?: boolean;
    logCacheMisses?: boolean;
    logCachePurges?: boolean;
  }
  ttlHours: number;
}
