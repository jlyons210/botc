export type CacheEntry = Map<string, CacheValue>;

/** A cached value and its expiration time. */
export type CacheValue = {
  /** Value stored in the cache. */
  value: string;
  /** Unix timestamp in milliseconds when the entry expires. */
  expiresAt: number;
};

/** Input used to add a value to the cache. */
export interface CacheConfig {
  /** Key used to retrieve the value. */
  key: string;
  /** Value to store. */
  value: string;
}
