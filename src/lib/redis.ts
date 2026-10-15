import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

// ============================================================================
// Types & Configuration Interface
// ============================================================================

export interface RedisRuntimeConfig {
  is_enabled: boolean;
  configured: boolean;
  url: string | null;
  token: string | null;
  default_ttl: number;
  cache_navigation: boolean;
  cache_catalog: boolean;
  loadedAt: number;
}

export interface CacheOptions {
  ttlSeconds: number;
  tags?: string[];
  swr?: boolean;
}

// ============================================================================
// Upstash Redis Client State & Dynamic Singleton
// ============================================================================

let redisInstance: Redis | null = null;
let currentConfig: RedisRuntimeConfig | null = null;
let configPromise: Promise<Redis | null> | null = null;
let lastLogTime = 0;

const CONFIG_CACHE_TTL_MS = 60 * 1000; // Recheck database configuration every 60s

/**
 * Fetch dynamic Redis configuration securely from the backend API.
 * Falls back to environment variables (UPSTASH_REDIS_REST_URL / TOKEN) if the backend is unreachable.
 */
async function loadServerRedisConfig(): Promise<RedisRuntimeConfig> {
  // Never run on client browser
  if (typeof window !== "undefined") {
    return {
      is_enabled: false,
      configured: false,
      url: null,
      token: null,
      default_ttl: 3600,
      cache_navigation: true,
      cache_catalog: true,
      loadedAt: Date.now(),
    };
  }

  const backendUrl = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api"
  ).replace(/\/+$/, "");

  const apiKey =
    process.env.SENIOR_API_KEY ||
    process.env.INTERNAL_API_KEY ||
    "inh_live_7a8f9c2d1e4b6093f8e12a4b8c9d0e1f3a5b7c9e";

  try {
    const res = await fetch(`${backendUrl}/system/redis-config`, {
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      // Short timeout to guarantee non-blocking storefront boots
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        is_enabled: Boolean(data.is_enabled),
        configured: Boolean(data.configured),
        url: data.url || null,
        token: data.token || null,
        default_ttl: Number(data.default_ttl) || 3600,
        cache_navigation: data.cache_navigation !== false,
        cache_catalog: data.cache_catalog !== false,
        loadedAt: Date.now(),
      };
    }
  } catch (err: any) {
    // Only log once every 5 minutes to avoid log spam when backend is down
    const now = Date.now();
    if (now - lastLogTime > 300000 && process.env.NODE_ENV !== "production") {
      console.warn("ℹ️ [Redis] Backend redis-config endpoint unreachable, checking environment variables.");
      lastLogTime = now;
    }
  }

  // Fallback to static environment variables
  const envUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const envToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  return {
    is_enabled: Boolean(envUrl && envToken),
    configured: Boolean(envUrl && envToken),
    url: envUrl || null,
    token: envToken || null,
    default_ttl: 3600,
    cache_navigation: true,
    cache_catalog: true,
    loadedAt: Date.now(),
  };
}

/**
 * Asynchronously ensures the Redis client is initialized with the active database or env credentials.
 */
export async function getRedisClientAsync(): Promise<Redis | null> {
  if (typeof window !== "undefined") {
    return null; // Redis caching is strictly server-side
  }

  const now = Date.now();

  // If we already have a fresh configuration, return existing instance
  if (currentConfig && now - currentConfig.loadedAt < CONFIG_CACHE_TTL_MS) {
    return redisInstance;
  }

  // Deduplicate in-flight configuration fetch
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      const newConfig = await loadServerRedisConfig();

      // Check if credentials or state changed
      const configChanged =
        !currentConfig ||
        currentConfig.is_enabled !== newConfig.is_enabled ||
        currentConfig.url !== newConfig.url ||
        currentConfig.token !== newConfig.token;

      if (configChanged) {
        if (newConfig.is_enabled && newConfig.url && newConfig.token) {
          try {
            redisInstance = new Redis({
              url: newConfig.url,
              token: newConfig.token,
            });
            if (process.env.NODE_ENV !== "production") {
              console.log("⚡ [Redis] Dynamic Upstash Redis client initialized from backend credentials.");
            }
          } catch (initErr) {
            console.warn("⚠️ [Redis] Failed to initialize Upstash client from credentials:", initErr);
            redisInstance = null;
          }
        } else {
          redisInstance = null;
        }
      }

      currentConfig = newConfig;
      return redisInstance;
    } finally {
      configPromise = null;
    }
  })();

  return configPromise;
}

/**
 * Synchronous getter for Redis client.
 * Returns the currently active instance, or initializes synchronously from env vars if available.
 */
export function getRedisClient(): Redis | null {
  if (typeof window !== "undefined") return null;

  if (redisInstance) {
    return redisInstance;
  }

  // If not yet loaded from backend, check env vars synchronously as fallback
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token && !currentConfig) {
    try {
      redisInstance = new Redis({ url, token });
      currentConfig = {
        is_enabled: true,
        configured: true,
        url,
        token,
        default_ttl: 3600,
        cache_navigation: true,
        cache_catalog: true,
        loadedAt: Date.now(),
      };
      return redisInstance;
    } catch {
      return null;
    }
  }

  // Trigger background async load for next request
  getRedisClientAsync().catch(() => {});
  return null;
}

/**
 * Force refresh the Redis client configuration from the backend.
 * Called when credentials are saved or toggled in the Admin Panel.
 */
export async function revalidateRedisClient(): Promise<boolean> {
  currentConfig = null;
  const client = await getRedisClientAsync();
  return client !== null;
}

/**
 * Test connectivity against an Upstash Redis REST endpoint.
 */
export async function testUpstashConnection(
  url: string,
  token: string
): Promise<{ success: boolean; message: string; latency_ms: number }> {
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const cleanToken = token.trim();

  if (!cleanUrl || !cleanToken) {
    return {
      success: false,
      message: "Upstash REST URL and REST Token are both required.",
      latency_ms: 0,
    };
  }

  if (!cleanUrl.startsWith("https://") && !cleanUrl.startsWith("http://")) {
    return {
      success: false,
      message: "Invalid Upstash REST URL format. Must start with https://",
      latency_ms: 0,
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${cleanUrl}/ping`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    const latency = Date.now() - start;

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const result = String(data.result || "").toUpperCase();
      return {
        success: true,
        message: result === "PONG"
          ? `Upstash Redis connected successfully: PONG received (${latency}ms)`
          : `Upstash Redis ping 200 OK (${latency}ms)`,
        latency_ms: latency,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: `Upstash authentication failed (${res.status} Unauthorized). Check your REST token.`,
        latency_ms: latency,
      };
    }

    const text = await res.text().catch(() => "");
    return {
      success: false,
      message: `Upstash returned HTTP ${res.status}: ${text.slice(0, 100) || res.statusText}`,
      latency_ms: latency,
    };
  } catch (err: any) {
    const latency = Date.now() - start;
    return {
      success: false,
      message: `Connection failed: ${err.message || "Network timeout / unreachable host"}`,
      latency_ms: latency,
    };
  }
}

export function isRedisAvailable(): boolean {
  return getRedisClient() !== null;
}

// ============================================================================
// Singleflight In-Flight Promise Map (Thundering Herd Protection)
// ============================================================================
const inFlightRequests = new Map<string, Promise<any>>();

// ============================================================================
// Deterministic Query Hash Generator
// ============================================================================
export function createDeterministicHash(
  params: Record<string, any> | URLSearchParams | undefined | null
): string {
  if (!params) return "default";

  const entries: [string, string][] = [];

  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => {
      if (value !== undefined && value !== null && value !== "") {
        entries.push([key, value]);
      }
    });
  } else if (typeof params === "object") {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          entries.push([key, [...value].map(String).sort().join(",")]);
        } else {
          entries.push([key, String(value)]);
        }
      }
    }
  }

  if (entries.length === 0) return "default";

  // Sort alphabetically by key, then value
  entries.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  const normalized = entries.map(([k, v]) => `${k}=${v}`).join("&");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

// ============================================================================
// Tag-Key Registration (For Tag-Based Invalidation)
// ============================================================================
async function registerKeyWithTags(redis: Redis, key: string, tags?: string[]) {
  if (!tags || tags.length === 0) return;
  try {
    const pipeline = redis.pipeline();
    for (const tag of tags) {
      pipeline.sadd(`aether:tag:${tag}`, key);
      pipeline.expire(`aether:tag:${tag}`, 60 * 60 * 48); // 48 hours
    }
    await pipeline.exec();
  } catch (err) {
    console.warn(`⚠️ [Redis] Error registering tag index for key ${key}:`, err);
  }
}

// ============================================================================
// Core cachedFetch Helper (Cache-Aside Pattern)
// ============================================================================

/**
 * Fetch data with Redis caching and singleflight request deduplication.
 * If Redis is unavailable, disabled, or throws an error, gracefully falls open to direct fetcher.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const redis = await getRedisClientAsync();

  // If Redis is not enabled or available, bypass caching gracefully (fail-open)
  if (!redis) {
    return fetcher();
  }

  // 1. Try reading from Redis
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (err) {
    console.warn(`⚠️ [Redis] Error reading key "${key}", falling open:`, err);
  }

  // 2. Cache miss -> Singleflight deduplication to protect backend from stampede
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const freshData = await fetcher();

      // Only cache valid, non-null data
      if (freshData !== null && freshData !== undefined) {
        try {
          await redis.set(key, freshData, { ex: options.ttlSeconds });
          if (options.tags && options.tags.length > 0) {
            registerKeyWithTags(redis, key, options.tags).catch(() => {});
          }
        } catch (setErr) {
          console.warn(`⚠️ [Redis] Error writing key "${key}":`, setErr);
        }
      }

      return freshData;
    } finally {
      setTimeout(() => {
        inFlightRequests.delete(key);
      }, 100);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

// ============================================================================
// Cache Invalidation Utilities
// ============================================================================

/**
 * Invalidate all keys matching a specific tag (e.g., 'products', 'categories', 'navigation', 'theme')
 */
export async function purgeCacheByTags(tags: string[]): Promise<number> {
  const redis = await getRedisClientAsync();
  if (!redis || tags.length === 0) return 0;

  let totalDeleted = 0;
  try {
    for (const tag of tags) {
      if (tag === "all" || tag === "*") {
        return purgeCacheByPattern("aether:*");
      }

      const tagKey = `aether:tag:${tag}`;
      const keys = await redis.smembers<string[]>(tagKey);

      if (keys && keys.length > 0) {
        const pipeline = redis.pipeline();
        for (const k of keys) {
          pipeline.del(k);
        }
        pipeline.del(tagKey);
        await pipeline.exec();
        totalDeleted += keys.length;
      }
    }
  } catch (err) {
    console.warn("⚠️ [Redis] Error in purgeCacheByTags:", err);
  }

  return totalDeleted;
}

/**
 * Invalidate all keys matching a glob pattern (e.g., 'aether:product:*')
 */
export async function purgeCacheByPattern(pattern: string): Promise<number> {
  const redis = await getRedisClientAsync();
  if (!redis) return 0;

  let deletedCount = 0;
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      for (let i = 0; i < keys.length; i += 50) {
        const batch = keys.slice(i, i + 50);
        await redis.del(...batch);
        deletedCount += batch.length;
      }
    }
  } catch (err) {
    console.warn(`⚠️ [Redis] Error in purgeCacheByPattern("${pattern}"):`, err);
  }

  return deletedCount;
}

/**
 * Invalidate specific key(s)
 */
export async function purgeKeys(...keys: string[]): Promise<number> {
  const redis = await getRedisClientAsync();
  if (!redis || keys.length === 0) return 0;

  try {
    return await redis.del(...keys);
  } catch (err) {
    console.warn("⚠️ [Redis] Error in purgeKeys:", err);
    return 0;
  }
}
