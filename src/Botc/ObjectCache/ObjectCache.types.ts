export type CacheEntry = Map<string, CacheValue>;

/** A cached value and its expiration time. */
export type CacheValue = {
  /** Value stored in the cache. */
  value: string;
  /** Unix timestamp in milliseconds when the entry expires. */
  expiresAt: number;
};
