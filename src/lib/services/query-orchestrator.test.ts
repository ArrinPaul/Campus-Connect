import { QueryOrchestrator } from "./query-orchestrator"
import { ShardRouter } from "./shard-router"
import type { ShardTarget } from "./shard-router"

describe("QueryOrchestrator", () => {
  let router: ShardRouter
  let orchestrator: QueryOrchestrator

  beforeEach(() => {
    router = ShardRouter.create({ shardCount: 4 })
    orchestrator = QueryOrchestrator.create(router)
  })

  // ── Scatter-Gather ─────────────────────────────────────────────────────

  it("fans out query to all shards and concatenates results", async () => {
    const result = await orchestrator.scatter<{ id: string }>({
      queryFn: async (shard) => [{ id: `item_${shard.shardIndex}` }],
    })

    expect(result.data).toHaveLength(4)
    expect(result.shardsQueried).toBe(4)
    expect(result.shardsSucceeded).toBe(4)
    expect(result.shardsFailed).toBe(0)
  })

  it("supports sort merge strategy", async () => {
    const result = await orchestrator.scatter<{ score: number }>({
      queryFn: async (shard) => [
        { score: shard.shardIndex * 10 },
        { score: shard.shardIndex * 10 + 5 },
      ],
      merge: "sort",
      sortKey: "score",
      sortDirection: "desc",
    })

    const scores = result.data.map((d) => d.score)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
    }
  })

  it("supports topN merge strategy with limit", async () => {
    const result = await orchestrator.scatter<{ v: number }>({
      queryFn: async (shard) =>
        Array.from({ length: 10 }, (_, i) => ({ v: shard.shardIndex * 100 + i })),
      merge: "topN",
      sortKey: "v",
      sortDirection: "desc",
      limit: 5,
    })

    expect(result.data).toHaveLength(5)
  })

  it("supports custom merge function", async () => {
    const result = await orchestrator.scatter<number>({
      queryFn: async (shard) => [shard.shardIndex + 1],
      merge: "custom",
      customMerge: (shardResults) => {
        const sum = shardResults.reduce((acc, r) => acc + r.data.reduce((a, b) => a + b, 0), 0)
        return [sum]
      },
    })

    expect(result.data).toEqual([1 + 2 + 3 + 4])
  })

  it("supports aggregate merge function", async () => {
    const result = await orchestrator.scatter<{ total: number }>({
      queryFn: async (shard) => [{ total: shard.shardIndex * 5 }],
      merge: "aggregate",
      aggregateFn: (shardResults) => {
        const grand = shardResults.reduce((sum, r) => sum + r.data[0].total, 0)
        return [{ total: grand }]
      },
    })

    expect(result.data).toEqual([{ total: 0 + 5 + 10 + 15 }])
  })

  // ── Pagination ──────────────────────────────────────────────────────────

  it("applies offset and limit after merge", async () => {
    const result = await orchestrator.scatter<{ idx: number }>({
      queryFn: async (shard) =>
        Array.from({ length: 5 }, (_, i) => ({ idx: shard.shardIndex * 5 + i })),
      offset: 3,
      limit: 4,
    })

    expect(result.data).toHaveLength(4)
    expect(result.totalFromShards).toBe(20) // 4 shards × 5 items
  })

  // ── Partial Failure ────────────────────────────────────────────────────

  it("returns partial results when some shards fail", async () => {
    const result = await orchestrator.scatter<{ ok: boolean }>({
      queryFn: async (shard) => {
        if (shard.shardIndex === 0) throw new Error("shard 0 down")
        return [{ ok: true }]
      },
    })

    expect(result.shardsSucceeded).toBe(3)
    expect(result.shardsFailed).toBe(1)
    expect(result.failedShards).toHaveLength(1)
    expect(result.data).toHaveLength(3)
  })

  it("handles timeout on a slow shard", async () => {
    const result = await orchestrator.scatter<{ val: number }>({
      queryFn: async (shard) => {
        if (shard.shardIndex === 1) {
          await new Promise((r) => setTimeout(r, 500))
        }
        return [{ val: shard.shardIndex }]
      },
      timeoutMs: 50,
    })

    expect(result.shardsFailed).toBeGreaterThanOrEqual(1)
    const timedOut = result.queryPlan.find((q) => q.status === "timeout")
    expect(timedOut).toBeDefined()
  })

  // ── Query Plan ─────────────────────────────────────────────────────────

  it("includes query plan with per-shard details", async () => {
    const result = await orchestrator.scatter({
      queryFn: async (shard) => [shard.shardIndex],
    })

    expect(result.queryPlan).toHaveLength(4)
    result.queryPlan.forEach((entry) => {
      expect(entry.shardId).toBeDefined()
      expect(entry.status).toBe("success")
      expect(entry.resultCount).toBe(1)
      expect(entry.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  // ── Subset Scatter ─────────────────────────────────────────────────────

  it("queries only the specified shards when provided", async () => {
    const all = router.allShards()
    const subset = [all[0], all[2]]

    const result = await orchestrator.scatter({
      queryFn: async () => [1],
      shards: subset,
    })

    expect(result.shardsQueried).toBe(2)
    expect(result.data).toHaveLength(2)
  })

  // ── Point Query ────────────────────────────────────────────────────────

  it("routes a point query to a single shard", async () => {
    const { data, shard } = await orchestrator.point(
      "user",
      "user_42",
      async (s: ShardTarget) => ({ userId: "user_42", shard: s.shardId })
    )

    expect(data.userId).toBe("user_42")
    expect(data.shard).toBe(shard.shardId)
  })

  // ── Duration ───────────────────────────────────────────────────────────

  it("reports total scatter duration", async () => {
    const result = await orchestrator.scatter({
      queryFn: async () => { return [] },
    })

    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
