/**
 * Cache entry object
 */
export type CacheEntry = {
  [key: string]: CacheValue;
};

/**
 * Cache value object
 * @property {string} value Cache value
 * @property {number} expiresAt Cache expiration timestamp
 */
export type CacheValue = {
  value: string;
  expiresAt: number;
};

/**
 * Cache configuration object
 * @property {string} key Cache key
 * @property {string} value Cache value
 */
export interface CacheConfig {
  key: string;
  value: string;
}
