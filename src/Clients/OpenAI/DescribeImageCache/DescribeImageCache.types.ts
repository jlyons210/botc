export type CachedUrl = {
  [url: string]: CachedDescription;
};

export type CachedDescription = {
  description: string;
  expiresAt: number;
};

export interface CacheConfig {
  /**
   * Image URL
   * @type {string}
   */
  url: string;

  /**
   * Image description
   * @type {string}
   */
  description: string;
}

export interface DescribeImageCacheConfig {
  /**
   * Cache time-to-live in hours
   * @type {number}
   */
  ttlHours: number;
}
