import { createLogger } from "@/lib/logger"

const log = createLogger("Cache")

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class MemoryCacheStore {
  private store = new Map<string, CacheEntry<any>>()
  private maxItems = 500

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxItems) {
      const firstKey = this.store.keys().next().value
      if (firstKey) this.store.delete(firstKey)
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

const localCache = new MemoryCacheStore()

/**
 * Cache wrap helper that gets or computes with bounded TTL.
 */
export async function cacheWrap<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check local cache
  const cached = localCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  try {
    const result = await fetcher()
    if (result !== undefined && result !== null) {
      localCache.set(key, result, ttlSeconds)
    }
    return result
  } catch (err: any) {
    log.error("Cache fetcher failed", { error: err.message, key })
    throw err
  }
}

export const appCache = {
  get: <T>(key: string) => localCache.get<T>(key),
  set: <T>(key: string, value: T, ttlSeconds: number) => localCache.set(key, value, ttlSeconds),
  delete: (key: string) => localCache.delete(key),
  clear: () => localCache.clear(),
  wrap: cacheWrap,
}
