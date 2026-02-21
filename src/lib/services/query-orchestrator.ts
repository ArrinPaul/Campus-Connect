/**
 * Cross-Shard Query Orchestrator — Scatter-Gather Pattern
 *
 * When data is distributed across shards, queries that span multiple partitions
 * need to be fanned out (scatter) and the partial results merged (gather).
 *
 * Features:
 *   • Parallel scatter across all targeted shards
 *   • Pluggable merge strategies (concat, sort, aggregate, topN)
 *   • Per-shard timeout with partial-result fallback
 *   • Automatic pagination across shards
 *   • Query plan introspection for debugging
 *
 * Usage:
 *   import { QueryOrchestrator } from "@/lib/services/query-orchestrator"
 *   import { ShardRouter }       from "@/lib/services/shard-router"
 *
 *   const router       = ShardRouter.create({ shardCount: 4 })
 *   const orchestrator = QueryOrchestrator.create(router)
 *
 *   const result = await orchestrator.scatter({
 *     queryFn: async (shard) => fetchPosts(shard.shardIndex),
 *     merge:   "sort",
 *     sortKey: "createdAt",
 *     limit:   20,
 *   })
 */

import { ShardRouter, ShardTarget } from "./shard-router"

// ─── Types ───────────────────────────────────────────────────────────────────

export type MergeStrategy = "concat" | "sort" | "aggregate" | "topN" | "custom"

export interface ScatterQuery<T = unknown> {
  /** Called once per targeted shard. Must return an array of results. */
  queryFn: (shard: ShardTarget) => Promise<T[]>
  /** Which shards to query. Defaults to all. */
  shards?: ShardTarget[]
  /** How to combine partial results (default: "concat"). */
  merge?: MergeStrategy
  /** Sort key (required for "sort" and "topN" strategies). */
  sortKey?: string
  /** Sort direction (default: "desc"). */
  sortDirection?: "asc" | "desc"
  /** Max results returned (applied after merge). */
  limit?: number
  /** Offset for pagination. */
  offset?: number
  /** Per-shard timeout in ms (default: 5000). */
  timeoutMs?: number
  /** Custom merge function (required for "custom" strategy). */
  customMerge?: (shardResults: Array<{ shard: ShardTarget; data: T[] }>) => T[]
  /** Aggregate function (required for "aggregate" strategy). */
  aggregateFn?: (shardResults: Array<{ shard: ShardTarget; data: T[] }>) => T[]
}

export interface ScatterResult<T = unknown> {
  data: T[]
  totalFromShards: number
  shardsQueried: number
  shardsSucceeded: number
  shardsFailed: number
  failedShards: string[]
  durationMs: number
  queryPlan: QueryPlanEntry[]
}

export interface QueryPlanEntry {
  shardId: string
  status: "success" | "timeout" | "error"
  resultCount: number
  durationMs: number
  error?: string
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class QueryOrchestrator {
  private router: ShardRouter

  private constructor(router: ShardRouter) {
    this.router = router
  }

  static create(router: ShardRouter): QueryOrchestrator {
    return new QueryOrchestrator(router)
  }

  // ── Scatter-Gather ──────────────────────────────────────────────────────

  async scatter<T = unknown>(query: ScatterQuery<T>): Promise<ScatterResult<T>> {
    const startMs = Date.now()
    const shards = query.shards ?? this.router.allShards()
    const timeoutMs = query.timeoutMs ?? 5_000
    const merge = query.merge ?? "concat"

    const queryPlan: QueryPlanEntry[] = []
    const shardResults: Array<{ shard: ShardTarget; data: T[] }> = []
    const failedShards: string[] = []

    // Fan out
    const promises = shards.map(async (shard) => {
      const shardStart = Date.now()
      try {
        const data = await withTimeout(query.queryFn(shard), timeoutMs)
        const entry: QueryPlanEntry = {
          shardId: shard.shardId,
          status: "success",
          resultCount: data.length,
          durationMs: Date.now() - shardStart,
        }
        queryPlan.push(entry)
        shardResults.push({ shard, data })
      } catch (err) {
        const isTimeout = err instanceof TimeoutError
        const entry: QueryPlanEntry = {
          shardId: shard.shardId,
          status: isTimeout ? "timeout" : "error",
          resultCount: 0,
          durationMs: Date.now() - shardStart,
          error: err instanceof Error ? err.message : String(err),
        }
        queryPlan.push(entry)
        failedShards.push(shard.shardId)
      }
    })

    await Promise.allSettled(promises)

    // Gather + merge
    let merged = this.mergeResults(shardResults, merge, query)

    // Pagination
    const offset = query.offset ?? 0
    const limit = query.limit
    if (offset > 0 || limit !== undefined) {
      const end = limit !== undefined ? offset + limit : undefined
      merged = merged.slice(offset, end)
    }

    const totalFromShards = shardResults.reduce((sum, r) => sum + r.data.length, 0)

    return {
      data: merged,
      totalFromShards,
      shardsQueried: shards.length,
      shardsSucceeded: shards.length - failedShards.length,
      shardsFailed: failedShards.length,
      failedShards,
      durationMs: Date.now() - startMs,
      queryPlan,
    }
  }

  // ── Point Query ─────────────────────────────────────────────────────────

  /**
   * Route a query to a single shard based on the partition key.
   * Useful for entity lookups that don't need scatter-gather.
   */
  async point<T = unknown>(
    entityType: string,
    key: string,
    queryFn: (shard: ShardTarget) => Promise<T>
  ): Promise<{ data: T; shard: ShardTarget }> {
    const shard = this.router.resolveWithFailover(entityType, key)
    const data = await queryFn(shard)
    return { data, shard }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private mergeResults<T>(
    shardResults: Array<{ shard: ShardTarget; data: T[] }>,
    strategy: MergeStrategy,
    query: ScatterQuery<T>
  ): T[] {
    switch (strategy) {
      case "concat":
        return shardResults.flatMap((r) => r.data)

      case "sort": {
        const all = shardResults.flatMap((r) => r.data)
        const key = query.sortKey
        if (!key) return all
        const dir = query.sortDirection === "asc" ? 1 : -1
        return all.sort((a, b) => {
          const av = (a as Record<string, unknown>)[key]
          const bv = (b as Record<string, unknown>)[key]
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
          return String(av).localeCompare(String(bv)) * dir
        })
      }

      case "topN": {
        // Same as sort but each shard is already individually sorted
        const all = shardResults.flatMap((r) => r.data)
        const key = query.sortKey
        if (!key) return all
        const dir = query.sortDirection === "asc" ? 1 : -1
        return all
          .sort((a, b) => {
            const av = (a as Record<string, unknown>)[key]
            const bv = (b as Record<string, unknown>)[key]
            if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
            return String(av).localeCompare(String(bv)) * dir
          })
          .slice(0, query.limit ?? all.length)
      }

      case "aggregate":
        if (query.aggregateFn) return query.aggregateFn(shardResults)
        return shardResults.flatMap((r) => r.data)

      case "custom":
        if (query.customMerge) return query.customMerge(shardResults)
        return shardResults.flatMap((r) => r.data)

      default:
        return shardResults.flatMap((r) => r.data)
    }
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = "TimeoutError"
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}
