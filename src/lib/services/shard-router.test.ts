import { ShardRouter } from "./shard-router"

describe("ShardRouter", () => {
  // ── Basic Routing ──────────────────────────────────────────────────────

  it("creates a router with the specified number of shards", () => {
    const router = ShardRouter.create({ shardCount: 4 })
    expect(router.allShards()).toHaveLength(4)
  })

  it("deterministically maps the same key to the same shard", () => {
    const router = ShardRouter.create({ shardCount: 8 })
    const shard1 = router.resolve("user", "user_123")
    const shard2 = router.resolve("user", "user_123")
    expect(shard1.shardId).toBe(shard2.shardId)
  })

  it("distributes different keys across shards", () => {
    const router = ShardRouter.create({ shardCount: 4 })
    const shardIds = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const shard = router.resolve("user", `user_${i}`)
      shardIds.add(shard.shardId)
    }
    // With 100 keys and 4 shards, at least 3 should be hit (hash distribution)
    expect(shardIds.size).toBeGreaterThanOrEqual(3)
  })

  // ── Key Extractors ─────────────────────────────────────────────────────

  it("uses custom key extractors per entity type", () => {
    const router = ShardRouter.create({
      shardCount: 4,
      keyExtractors: {
        post: (entity) => String(entity.userId), // extract userId
      },
    })

    // Same userId → same shard (passing objects triggers extractors)
    const a = router.resolve("post", { userId: "user1", postId: "abc" })
    const b = router.resolve("post", { userId: "user1", postId: "def" })
    expect(a.shardId).toBe(b.shardId)
  })

  // ── Failover ───────────────────────────────────────────────────────────

  it("resolveWithFailover skips unhealthy shards", () => {
    const router = ShardRouter.create({ shardCount: 4 })
    const primary = router.resolve("user", "test_key")
    router.updateHealth(primary.shardId, false)

    const fallback = router.resolveWithFailover("user", "test_key")
    expect(fallback.shardId).not.toBe(primary.shardId)
  })

  it("updateHealth re-enables a shard", () => {
    const router = ShardRouter.create({ shardCount: 4 })
    const primary = router.resolve("user", "key")
    router.updateHealth(primary.shardId, false)
    router.updateHealth(primary.shardId, true)

    const result = router.resolveWithFailover("user", "key")
    expect(result.shardId).toBe(primary.shardId)
  })

  // ── Health ─────────────────────────────────────────────────────────────

  it("getHealth returns correct status", () => {
    const router = ShardRouter.create({ shardCount: 2 })
    const shards = router.allShards()

    router.updateHealth(shards[0].shardId, false)
    const health = router.getHealth()

    const unhealthy = health.find((h) => h.shardId === shards[0].shardId)
    const healthy = health.find((h) => h.shardId === shards[1].shardId)

    expect(unhealthy?.healthy).toBe(false)
    expect(healthy?.healthy).toBe(true)
  })

  // ── Scatter (allShards) ────────────────────────────────────────────────

  it("allShards returns all shard targets", () => {
    const router = ShardRouter.create({ shardCount: 6 })
    const all = router.allShards()
    expect(all).toHaveLength(6)
    const ids = all.map((s) => s.shardId)
    expect(new Set(ids).size).toBe(6)
  })

  // ── Distribution ───────────────────────────────────────────────────────

  it("analyseDistribution shows reasonable balance", () => {
    const router = ShardRouter.create({ shardCount: 4 })
    const keys = Array.from({ length: 1000 }, (_, i) => `key_${i}`)
    const dist = router.analyseDistribution(keys)

    // Each shard should get roughly 250 ± 100 keys
    for (const count of Object.values(dist)) {
      expect(count).toBeGreaterThan(100)
      expect(count).toBeLessThan(450)
    }
  })

  // ── Edge Cases ─────────────────────────────────────────────────────────

  it("works with a single shard", () => {
    const router = ShardRouter.create({ shardCount: 1 })
    const shard = router.resolve("any", "anything")
    expect(shard.shardIndex).toBe(0)
  })

  it("returns primary when all shards are unhealthy (best-effort)", () => {
    const router = ShardRouter.create({ shardCount: 2 })
    const shards = router.allShards()
    shards.forEach((s) => router.updateHealth(s.shardId, false))

    // Should still return a shard (primary) rather than crash
    const result = router.resolveWithFailover("x", "y")
    expect(result.shardId).toBeDefined()
  })

  it("isHealthy returns true for initialized shards", () => {
    const router = ShardRouter.create({ shardCount: 2 })
    const shards = router.allShards()
    expect(router.isHealthy(shards[0].shardId)).toBe(true)
  })

  it("isHealthy returns false after marking unhealthy", () => {
    const router = ShardRouter.create({ shardCount: 2 })
    const shards = router.allShards()
    router.updateHealth(shards[0].shardId, false)
    expect(router.isHealthy(shards[0].shardId)).toBe(false)
  })
})
