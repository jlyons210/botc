import {
  CacheConfig,
  CachedUrl,
  DescribeImageCacheConfig,
} from './index.js';

/**
 * Cache for described image URLs
 */
export class DescribeImageCache {
  private imageUrls: CachedUrl = {};

  /**
   * New DescribeImageCache
   * @param {DescribeImageCache} config configuration
   */
  constructor(private config: DescribeImageCacheConfig) {
    setInterval(() => this.clearExpired(), 60000);
  }

  /**
   * Cache the provided entry
   * @param {CacheConfig} entry Entry to be cached
   */
  public cache(entry: CacheConfig): void {
    this.imageUrls[entry.url] = {
      description: entry.description,
      expiresAt: Date.now() + this.config.ttlHours * 60 * 60 * 1000,
    };
  }

  /**
   * Clears expired cache entries
   */
  private clearExpired(): void {
    for (const url in this.imageUrls) {
      if (this.imageUrls[url].expiresAt < Date.now()) {
        delete this.imageUrls[url];
        console.debug(`DescribeImageCache.clearExpired: ${url} is expired. Removed.`);
      }
    }
  }

  /**
   * Retrieve cached description
   * @param {string} url Image URL
   * @returns {string} Image description
   */
  public getDescription(url: string): string {
    return (this.imageUrls[url])
      ? this.imageUrls[url].description
      : '';
  }

  /**
   * Check if URL is cached
   * @param {string} url Image URL
   * @returns {boolean} true if cached
   */
  public isCached(url: string): boolean {
    return (this.getDescription(url) !== '');
  }
}
