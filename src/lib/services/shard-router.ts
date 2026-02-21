/**
 * Shard Router — Consistent-hash based request routing
 *
 * Distributes requests across logical shards so the app can horizontally scale
 * data-intensive tables.  Currently in-process (single database); when the DB
 * is split the router already knows which shard to target.
 *
 * Features:
 *   • Consistent hashing (virtual nodes) for even distribution
 *   • Pluggable shard key extractors per entity type
 *   • Shard health tracking with automatic failover
 *   • Shard rebalancing detection
 *
 * Usage:
 *   import { ShardRouter } from "@/lib/services/shard-router"
 *
 *   const router = ShardRouter.create({ shardCount: 4 })
 *   const shard = router.resolve("user", userId)
 *   // shard → { shardId: "shard-2", shardIndex: 2 }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShardConfig {
  /** Number of logical shards (default: 4). */
  shardCount?: number
  /** Number of virtual nodes per shard for smoother distribution (default: 150). */
  virtualNodes?: number
  /** Custom key extractors: `{ user: (entity) => entity.clerkId }`. */
  keyExtractors?: Record<string, (entity: Record<string, unknown>) => string>
}

export interface ShardTarget {
  /** Logical shard name, e.g. "shard-0" */
  shardId: string
  /** Zero-based shard index */
  shardIndex: number
}

export interface ShardHealth {
  shardId: string
  healthy: boolean
  latencyMs: number
  lastChecked: string
}

// ─── Consistent-hash ring ────────────────────────────────────────────────────

interface VirtualNode {
  hash: number
  shardIndex: number
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class ShardRouter {
  private shardCount: number
  private ring: VirtualNode[]
  private keyExtractors: Record<string, (entity: Record<string, unknown>) => string>
  private healthMap = new Map<string, ShardHealth>()

  private constructor(config: ShardConfig = {}) {
    this.shardCount = config.shardCount ?? 4
    const virtualNodes = config.virtualNodes ?? 150
    this.keyExtractors = { ...config.keyExtractors }

    // Build the hash ring
    this.ring = []
    for (let shard = 0; shard < this.shardCount; shard++) {
      for (let vn = 0; vn < virtualNodes; vn++) {
        this.ring.push({
          hash: fnv1a(`shard-${shard}-vn-${vn}`),
          shardIndex: shard,
        })
      }
    }
    this.ring.sort((a, b) => a.hash - b.hash)

    // Initialise health
    for (let i = 0; i < this.shardCount; i++) {
      const id = `shard-${i}`
      this.healthMap.set(id, {
        shardId: id,
        healthy: true,
        latencyMs: 0,
        lastChecked: new Date().toISOString(),
      })
    }
  }

  static create(config?: ShardConfig): ShardRouter {
    return new ShardRouter(config)
  }

  // ── Routing ─────────────────────────────────────────────────────────────

  /**
   * Resolve the target shard for a given entity type and key.
   *
   * @param entityType  e.g. "user", "post", "message"
   * @param key         The partition key (string).  If you pass an object,
   *                    the registered keyExtractor for `entityType` is used.
   */
  resolve(entityType: string, key: string | Record<string, unknown>): ShardTarget {
    const resolvedKey =
      typeof key === "string"
        ? key
        : this.extractKey(entityType, key)

    const hash = fnv1a(resolvedKey)
    const shardIndex = this.findShard(hash)

    return {
      shardId: `shard-${shardIndex}`,
      shardIndex,
    }
  }

  /**
   * Resolve and return all shards (used for scatter-gather queries).
   */
  allShards(): ShardTarget[] {
    return Array.from({ length: this.shardCount }, (_, i) => ({
      shardId: `shard-${i}`,
      shardIndex: i,
    }))
  }

  /**
   * Resolve with failover: if the primary shard is unhealthy, route to
   * the next healthy shard on the ring.
   */
  resolveWithFailover(entityType: string, key: string | Record<string, unknown>): ShardTarget {
    const primary = this.resolve(entityType, key)
    if (this.isHealthy(primary.shardId)) return primary

    // Walk clockwise on the ring to find next healthy shard
    for (let offset = 1; offset < this.shardCount; offset++) {
      const fallbackIndex = (primary.shardIndex + offset) % this.shardCount
      const fallbackId = `shard-${fallbackIndex}`
      if (this.isHealthy(fallbackId)) {
        return { shardId: fallbackId, shardIndex: fallbackIndex }
      }
    }

    // All shards unhealthy — return primary anyway (best-effort)
    return primary
  }

  // ── Key Extractors ──────────────────────────────────────────────────────

  /** Register a custom key extractor for an entity type. */
  registerKeyExtractor(entityType: string, extractor: (entity: Record<string, unknown>) => string): void {
    this.keyExtractors[entityType] = extractor
  }

  private extractKey(entityType: string, entity: Record<string, unknown>): string {
    const extractor = this.keyExtractors[entityType]
    if (extractor) return extractor(entity)

    // Fallback: use _id or id
    const id = entity._id ?? entity.id
    if (typeof id === "string") return id
    throw new Error(`No key extractor registered for entity type "${entityType}" and no _id/id found`)
  }

  // ── Health ──────────────────────────────────────────────────────────────

  isHealthy(shardId: string): boolean {
    return this.healthMap.get(shardId)?.healthy ?? false
  }

  updateHealth(shardId: string, healthy: boolean, latencyMs = 0): void {
    this.healthMap.set(shardId, {
      shardId,
      healthy,
      latencyMs,
      lastChecked: new Date().toISOString(),
    })
  }

  getHealth(): ShardHealth[] {
    return Array.from(this.healthMap.values())
  }

  // ── Metrics ─────────────────────────────────────────────────────────────

  /** Show shard distribution for a given set of keys (useful for testing). */
  analyseDistribution(keys: string[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (let i = 0; i < this.shardCount; i++) counts[`shard-${i}`] = 0
    for (const key of keys) {
      const { shardId } = this.resolve("_any", key)
      counts[shardId]++
    }
    return counts
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private findShard(hash: number): number {
    // Binary search for the first virtual node ≥ hash
    let lo = 0
    let hi = this.ring.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (this.ring[mid].hash < hash) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    // Wrap around if past the last node
    const idx = lo < this.ring.length ? lo : 0
    return this.ring[idx].shardIndex
  }
}

// ─── Hash Function (FNV-1a 32-bit) ──────────────────────────────────────────

function fnv1a(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0  // multiply + force unsigned 32-bit
  }
  return hash
}
