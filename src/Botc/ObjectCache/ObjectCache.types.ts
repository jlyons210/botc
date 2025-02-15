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
