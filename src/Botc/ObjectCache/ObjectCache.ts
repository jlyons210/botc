import type { CacheEntry } from "./ObjectCache.types.ts";
import type {
  ConfigurationSettings,
  OpenAICacheLoggingSettings,
} from "../Configuration/index.ts";
import { Logger } from "../Logger/index.ts";

export class ObjectCache {
  private readonly cached: CacheEntry = new Map();
  private readonly pending = new Map<string, Promise<string>>();
  private readonly logger = new Logger();
  private readonly ttlConfig: ConfigurationSettings;
  private readonly logConfig: OpenAICacheLoggingSettings;
  private readonly maxEntries: number;

  constructor(
    ttlConfig: ConfigurationSettings,
    logConfig: OpenAICacheLoggingSettings,
    maxEntries = 1000,
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError("Cache maximum entries must be a positive integer.");
    }

    this.ttlConfig = ttlConfig;
    this.logConfig = logConfig;
    this.maxEntries = maxEntries;
  }

  private get(key: string): string | undefined {
    const entry = this.cached.get(key);

    if (entry && entry.expiresAt > Date.now()) {
      this.cached.delete(key);
      this.cached.set(key, entry);

      if (this.logConfig.logCacheHits.value.toString() === "true") {
        this.logger.log(`ObjectCache.getValue: Cache hit for ${key}`, "INFO");
      }

      return entry.value;
    }

    if (entry) {
      this.cached.delete(key);
      if (this.logConfig.logCachePurges.value.toString() === "true") {
        this.logger.log(
          `ObjectCache.getValue: Removing expired entry ${key}`,
          "INFO",
        );
      }
    }

    if (this.logConfig.logCacheMisses.value.toString() === "true") {
      this.logger.log(`ObjectCache.getValue: Cache miss for ${key}`, "INFO");
    }

    return undefined;
  }

  public getOrCreate(
    key: string,
    createValue: () => Promise<string>,
  ): Promise<string> {
    const cachedValue = this.get(key);
    if (cachedValue !== undefined) {
      return Promise.resolve(cachedValue);
    }

    const pendingValue = this.pending.get(key);
    if (pendingValue) {
      return pendingValue;
    }

    const valuePromise = Promise.resolve()
      .then(createValue)
      .then((value) => {
        this.put(key, value);
        return value;
      })
      .finally(() => this.pending.delete(key));

    this.pending.set(key, valuePromise);
    return valuePromise;
  }

  private put(key: string, value: string): void {
    this.cached.delete(key);
    while (this.cached.size >= this.maxEntries) {
      const oldestKey = this.cached.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }

      this.cached.delete(oldestKey);
      if (this.logConfig.logCachePurges.value.toString() === "true") {
        this.logger.log(
          `ObjectCache.put: Evicting least-recently-used entry ${oldestKey}`,
          "INFO",
        );
      }
    }

    this.cached.set(key, {
      value,
      expiresAt: Date.now() + (this.ttlConfig.value as number) * 60 * 60 * 1000,
    });

    if (this.logConfig.logCacheEntries.value.toString() === "true") {
      this.logger.log(`ObjectCache.cache: Cached ${key}`, "INFO");
    }
  }
}
