import type {
  ConfigurationSettings,
  OpenAICacheLoggingSettings,
} from "../Configuration/index.ts";
import { describe, expect, it, vi } from "vitest";
import { ObjectCache } from "./ObjectCache.ts";

const setting = (value: string | number | boolean): ConfigurationSettings => ({
  environmentVariable: "TEST_SETTING",
  value,
});

const logging: OpenAICacheLoggingSettings = {
  logCacheEntries: setting(false),
  logCacheHits: setting(false),
  logCacheMisses: setting(false),
  logCachePurges: setting(false),
};

function createCache(ttlHours = 1, maxEntries = 1000): ObjectCache {
  return new ObjectCache(setting(ttlHours), logging, maxEntries);
}

describe("ObjectCache", () => {
  it("shares an in-flight value for concurrent requests with the same key", async () => {
    const cache = createCache();
    let createCount = 0;
    const createValue = async (): Promise<string> => {
      createCount += 1;
      await Promise.resolve();
      return "shared value";
    };

    const results = await Promise.all([
      cache.getOrCreate("shared-key", createValue),
      cache.getOrCreate("shared-key", createValue),
    ]);

    expect(results).toEqual(["shared value", "shared value"]);
    expect(createCount).toBe(1);
  });

  it("evicts the least recently used entry when at capacity", async () => {
    const cache = createCache(1, 2);
    const createFirst = vi.fn(async () => "1");
    const createSecond = vi.fn(async () => "2");
    await cache.getOrCreate("first", createFirst);
    await cache.getOrCreate("second", createSecond);
    await cache.getOrCreate("first", createFirst);

    await cache.getOrCreate("third", async () => "3");

    expect(await cache.getOrCreate("first", createFirst)).toBe("1");
    expect(createFirst).toHaveBeenCalledTimes(1);
    expect(await cache.getOrCreate("second", createSecond)).toBe("2");
    expect(createSecond).toHaveBeenCalledTimes(2);
  });

  it("recreates expired entries on access", async () => {
    const cache = createCache(0);
    const createValue = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("stale")
      .mockResolvedValueOnce("fresh");

    expect(await cache.getOrCreate("expired", createValue)).toBe("stale");
    expect(await cache.getOrCreate("expired", createValue)).toBe("fresh");
    expect(createValue).toHaveBeenCalledTimes(2);
  });

  it("allows retry after the producer rejects", async () => {
    const cache = createCache();
    const createValue = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce("recovered");

    await expect(cache.getOrCreate("retry-key", createValue)).rejects.toThrow(
      "temporary failure",
    );
    await expect(cache.getOrCreate("retry-key", createValue)).resolves.toBe(
      "recovered",
    );
    expect(createValue).toHaveBeenCalledTimes(2);
  });
});
