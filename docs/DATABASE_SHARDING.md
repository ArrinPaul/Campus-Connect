# Database Sharding Strategy

> **Status**: Planning  
> **Trigger**: 1M+ registered users  
> **Last reviewed**: 2025

---

## 1. Executive Summary

Convex manages horizontal scaling, replication, and query routing automatically — there is no manual sharding step. This document captures the **logical partitioning strategy** we will follow if the platform outgrows a single Convex project, plus the data-modelling choices that keep the database shard-friendly from day one.

---

## 2. Current Architecture (< 1M Users)

| Layer | Detail |
|-------|--------|
| **Database** | Single Convex project with 43 tables |
| **Primary partition key** | `users.clerkId` / `users._id` (all content traces back to a user) |
| **Secondary partition** | `users.university` — 90 %+ of social interactions are same-university |
| **Indexing** | Composite indexes on hot paths (e.g. `posts.by_author`, `follows.by_follower`, `messages.by_conversation`) |

### Why we don't need to shard today

- Convex automatically distributes data across its storage layer.
- Queries use indexed reads; full table scans are impossible by design.
- Reactive subscriptions are multiplexed — 100K concurrent users use the same resources as 100K separate queries in traditional databases.

---

## 3. Logical Partition Strategy (1M+ Users)

When a single Convex project becomes the bottleneck, we split into **university-scoped tenants**.

### 3.1 Partition-by-University

```
┌───────────────────────────┐
│   Global Control Plane    │  Shared: auth, user directory, cross-uni search
│   (convex-global)         │
└────────┬──────────────────┘
         │ routes by university
    ┌────┴────┬───────────┐
    ▼         ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Uni-A  │ │ Uni-B  │ │ Uni-C  │   Per-university Convex projects
│ (shard)│ │ (shard)│ │ (shard)│   Own: posts, messages, events, communities
└────────┘ └────────┘ └────────┘
```

**Why university?**
- 90%+ of social graph interactions are intra-university.
- Cross-university features (global search, trending) are read-heavy and tolerant of eventual consistency.
- Regulatory/data-residency requirements may mandate geographic isolation per institution.

### 3.2 Data Classification

| Category | Examples | Shard | Rationale |
|----------|----------|-------|-----------|
| **Tenant-local** | posts, comments, likes, reactions, messages, conversations, stories, polls, events, communities, bookmarks, reposts | University shard | ~95% of reads/writes |
| **Global (read-heavy)** | user directory, follows (cross-uni), trending feed, hashtags, search index | Global project | Queried across shards |
| **Global (write-heavy)** | notifications, push subscriptions, gamification leaderboards | Global project | Must fan-out across tenants |

### 3.3 Shard Routing

```typescript
// Pseudocode — shard routing middleware
function getConvexClient(userId: string): ConvexClient {
  const user = globalDb.query("users").withIndex("by_clerkId", q => q.eq("clerkId", userId)).first()
  const shardId = user.university ?? "default"
  return shardClients.get(shardId) ?? shardClients.get("default")
}
```

The Next.js middleware resolves the shard at the edge and injects the correct Convex deployment URL into the request context.

---

## 4. Index & Query Design for Shard-Readiness

These principles are already applied in our schema:

### 4.1 Always prefix indexes with the partition key

```typescript
// ✅ Good — scoped to a single author (and thus a single university)
posts: defineTable({ ... })
  .index("by_author", ["authorId", "createdAt"])

// ❌ Bad — full table scan across all users
posts: defineTable({ ... })
  .index("by_createdAt", ["createdAt"])
```

### 4.2 Denormalize cross-shard data

When users from different universities interact, store the minimal cross-reference locally:

```typescript
// Cross-university follow — store in BOTH shards
follows: defineTable({
  followerId: v.id("users"),
  followingId: v.id("users"),
  // Denormalized for local reads
  followerUniversity: v.optional(v.string()),
  followingUniversity: v.optional(v.string()),
})
```

### 4.3 Use cursor-based pagination everywhere

All list queries already return `{ items, nextCursor }`. This is shard-agnostic — cursors are opaque strings that work within a single shard.

---

## 5. Migration Playbook

### Phase 1: Prepare (pre-migration)

1. **Audit queries** — Ensure every query uses an index that starts with a user/author/org-scoped field.
2. **Tag data** — Add `university` field to all tables that don't already reference a user (e.g. `communities`, `events`).
3. **Build routing layer** — Create `getShardClient()` utility in Next.js middleware.
4. **Test dual-write** — Write to both global and shard projects for 2 weeks; compare results.

### Phase 2: Split (migration window)

1. **Snapshot global DB** — Use `convex export` for a full backup.
2. **Provision university shards** — One Convex project per university.
3. **Migrate tenant-local data** — Script reads from global, writes to shard (idempotent upserts).
4. **Cut routing** — Update middleware to route by university.
5. **Replicate global tables** — Set up CDC (change-data-capture) from shards to global project for cross-uni search/trending.

### Phase 3: Validate (post-migration)

1. **Consistency check** — Compare row counts, checksums.
2. **Performance benchmark** — Compare p50/p95/p99 latency pre- and post-migration.
3. **Canary traffic** — Route 5% of a single university to the new shard; monitor errors.
4. **Full rollout** — University by university over 2 weeks.

---

## 6. Cross-Shard Queries

| Query Type | Strategy |
|-----------|----------|
| **Global search** | Fan-out to all shards in parallel; merge results client-side; cache with Upstash Redis (60s TTL) |
| **Trending feed** | Each shard computes local trending; global aggregator merges top-N every 5 minutes |
| **Cross-uni follows** | Stored in global project; follower/following counts denormalized on both sides |
| **Notifications** | Global project owns the notification table; shards push events via internal HTTP actions |

---

## 7. Capacity Planning

| Metric | Single Project Limit | Per-Shard Target | Notes |
|--------|---------------------|-------------------|-------|
| Documents | ~100M | ~10M | Convex handles this natively |
| Concurrent subscriptions | ~500K | ~50K | Limited by WebSocket fan-out |
| Write throughput | ~10K txn/s | ~2K txn/s | 5 shards = 10K aggregate |
| Storage | 100 GB | 20 GB | Per-shard budget |

### Shard sizing heuristic

```
shards_needed = ceil(total_universities / 50)
```

Most universities have 10K–50K active users. 50 universities per shard keeps each shard under 500K users.

---

## 8. Monitoring & Alerting

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Shard query latency p99 | > 500ms | Investigate hot partition |
| Cross-shard fan-out time | > 2s | Add Redis cache layer |
| Shard storage utilization | > 80% | Split shard or archive old data |
| Replication lag (shard → global) | > 30s | Check CDC pipeline |

---

## 9. Rollback Plan

If sharding causes regressions:

1. **Immediate** — Revert routing middleware to point all traffic at global project (< 1 min).
2. **Data sync** — Run reverse migration script to merge shard writes back into global project.
3. **Post-mortem** — Document what failed and adjust strategy.

The global project is kept as a warm standby for 90 days post-migration.
