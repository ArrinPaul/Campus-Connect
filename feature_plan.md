# Campus Connect — Future Scaling Plan (1M+ Users)

> Long-term architecture and feature roadmap for scaling to 1 million+ concurrent users.
> This document is for **planning only** — DO NOT implement any of these changes yet.
> Prerequisites: All items in `improvements.md` must be completed first.
> Generated: February 2026

---

## Table of Contents

1. [Architecture Redesign](#1-architecture-redesign)
2. [Feed Scaling](#2-feed-scaling)
3. [Distributed Systems](#3-distributed-systems)
4. [Queue & Event-Driven Systems](#4-queue--event-driven-systems)
5. [CDN Strategies](#5-cdn-strategies)
6. [Messaging Scaling](#6-messaging-scaling)
7. [Search Infrastructure](#7-search-infrastructure)
8. [Database Migration](#8-database-migration)
9. [Observability at Scale](#9-observability-at-scale)
10. [Cost Projections](#10-cost-projections)

---

## 1. Architecture Redesign

### Current State
- **Monolith**: Next.js 14 (App Router) with Convex BaaS handling all backend logic
- **Single deployment**: Vercel serverless
- **Single database**: Convex (reactive document store)
- **No caching layer**: Every read hits the database
- **No message queue**: Synchronous mutation chains

### Target State (1M+ Users)

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   CDN Edge  │────▶│  Next.js App │────▶│  API Gateway   │
│  (Vercel /  │     │  (Frontend)  │     │  (Rate Limit)  │
│  CloudFront)│     └──────────────┘     └───────┬────────┘
└─────────────┘                                  │
                                    ┌────────────┼────────────┐
                                    ▼            ▼            ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │   Feed   │ │ Messaging│ │  Search  │
                              │ Service  │ │ Service  │ │ Service  │
                              └────┬─────┘ └────┬─────┘ └────┬─────┘
                                   │             │            │
                              ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
                              │PostgreSQL│ │PostgreSQL│ │Typesense │
                              │ (Feed)   │ │ (Msgs)   │ │/Algolia  │
                              └──────────┘ └──────────┘ └──────────┘
                                        ▲          ▲
                                        │          │
                                   ┌────┴──────────┴────┐
                                   │    Redis Cluster    │
                                   │  (Cache + Pub/Sub)  │
                                   └─────────────────────┘
                                            ▲
                                            │
                                   ┌────────┴────────┐
                                   │  Message Queue   │
                                   │ (QStash / SQS)   │
                                   └─────────────────┘
```

### Migration Strategy
1. **Phase A**: Keep Convex as primary but add Redis caching layer + external search
2. **Phase B**: Extract messaging into independent service with its own database
3. **Phase C**: Extract feed computation into independent service  
4. **Phase D**: Evaluate full database migration from Convex to self-managed PostgreSQL

### Key Principles
- Extract services **only when Convex limits are proven** (execution time, throughput, query complexity)
- Each extracted service owns its data store — no shared databases
- Use event-driven communication between services (not synchronous RPC)
- Maintain a single deployment artifact for the frontend

---

## 2. Feed Scaling

### Current Problem
Feed is computed at **read time** (pull model):
- `getRankedFeed` fetches 200 posts, loads reactions/comments for each, scores in-memory
- At 1M users with 100+ posts/day each, this becomes computationally infeasible
- Each feed load triggers O(200 × 200) database reads in the worst case

### Solution: Fan-Out-On-Write

**Model**: When a user creates a post, the system pushes the post reference to the feed of every follower (Instagram/Twitter model).

```
User creates post ──▶ Message Queue ──▶ Fan-Out Worker
                                           │
                           ┌───────────────┼───────────────┐
                           ▼               ▼               ▼
                     Follower A's     Follower B's     Follower C's
                     Feed Table       Feed Table       Feed Table
```

### Implementation Plan
1. Create `userFeedItems` table: `{ userId, postId, score, createdAt }`
2. On post creation, dispatch an async fan-out job
3. Fan-out worker iterates follower list, inserts feed items with pre-computed scores
4. Feed query reads from `userFeedItems` (indexed by `userId + score`)
5. Periodic cron re-ranks stale feed items

### Hybrid Approach (Recommended)
- **Active users** (< 5000 followers): Fan-out-on-write
- **Celebrity users** (5000+ followers): Fan-out-on-read (pull at query time)
- This avoids the "celebrity problem" where a single post triggers millions of writes

### Scoring Algorithm (Preserved)
Keep the existing multi-factor scoring from `feed-ranking.ts`:
- Recency (35%), Relevance (20%), Engagement (25%), Relationship (20%)
- Pre-compute at fan-out time, re-rank periodically

---

## 3. Distributed Systems

### 3.1 Service Boundaries

| Service | Responsibility | Data Store | Communication |
|---------|---------------|------------|---------------|
| **Auth** | Authentication, user profiles | Clerk + PostgreSQL | Sync (HTTP) |
| **Posts** | Post CRUD, reactions, comments | PostgreSQL | Events (Queue) |
| **Feed** | Feed computation, ranking | PostgreSQL + Redis | Events (Queue) |
| **Messaging** | DMs, group chat, typing indicators | PostgreSQL + Redis pub/sub | WebSocket + Events |
| **Search** | Full-text search, fuzzy matching | Typesense/Algolia | Sync (HTTP) |
| **Notifications** | Push/email/in-app notifications | PostgreSQL + Redis | Events (Queue) |
| **Media** | Upload, processing, CDN | S3 + CloudFront | Async (Queue) |

### 3.2 Consistency Model
- **Feed**: Eventually consistent (seconds delay acceptable)
- **Messaging**: Strongly consistent (messages must arrive in order)
- **Notifications**: Eventually consistent (seconds delay acceptable)
- **Search**: Eventually consistent (indexing lag of 1-5 seconds acceptable)
- **Profiles/Auth**: Strongly consistent (immediate visibility)

### 3.3 Failure Isolation
- Each service has independent health checks
- Circuit breaker pattern for inter-service calls
- Dead letter queues for failed async jobs
- Graceful degradation: if search is down, feed still works

---

## 4. Queue & Event-Driven Systems

### 4.1 Event Types

| Event | Producer | Consumers | Priority |
|-------|----------|-----------|----------|
| `post.created` | Posts Service | Feed (fan-out), Search (index), Notifications | High |
| `post.deleted` | Posts Service | Feed (remove), Search (deindex) | High |
| `user.followed` | Posts Service | Feed (update), Suggestions (recompute) | Medium |
| `reaction.added` | Posts Service | Notifications, Feed (re-score) | Medium |
| `comment.created` | Posts Service | Notifications, Search (index) | Medium |
| `message.sent` | Messaging | Notifications (push) | High |
| `media.uploaded` | Media | Posts (attach URL), Media (process/resize) | Medium |

### 4.2 Queue Technology Recommendation

**For Vercel/Serverless**: Upstash QStash
- HTTP-based message queue built for serverless
- Automatic retries with exponential backoff
- Dead letter queues
- Already compatible with existing Upstash account

**For Self-Hosted**: BullMQ + Redis
- Full-featured job queue with priorities, concurrency control, rate limiting
- Dashboard for monitoring (Bull Board)
- Requires self-managed Redis instance

### 4.3 Event Schema

```typescript
interface DomainEvent {
  id: string             // UUID
  type: string           // e.g., "post.created"
  timestamp: number      // Unix ms
  version: number        // Schema version for backward compat
  source: string         // Service name
  data: Record<string, unknown>
  metadata: {
    userId: string       // Actor
    traceId: string      // Distributed tracing
    correlationId: string
  }
}
```

---

## 5. CDN Strategies

### 5.1 Static Assets (Current — Good)
- Vercel Edge Network handles `/_next/static/*` with immutable cache headers
- 30-day cache TTL on images, fonts, icons
- AVIF/WebP format negotiation via Next.js `<Image>`

### 5.2 User-Generated Media (Improvement Needed)

**Current**: Images stored on Convex storage, served via `*.convex.cloud`
**Target**: Dedicated media pipeline

```
Upload ──▶ Signed URL (S3/R2) ──▶ Processing Queue
                                       │
                               ┌───────┼──────┐
                               ▼       ▼      ▼
                            Resize   Strip   Convert
                           (thumb,  metadata  to WebP
                            medium,  (EXIF)   /AVIF
                            large)
                               │
                               ▼
                         CDN (CloudFront/
                         Cloudflare R2)
```

**Recommended Service**: Cloudflare R2 + Images
- No egress fees (Cloudflare R2 vs S3)
- Built-in image transformation at edge
- Global CDN included
- Estimated cost: $0.015/GB stored + $0.50/million requests

### 5.3 API Response Caching
- Cache public feed responses at edge (30s TTL, stale-while-revalidate)
- Cache user profile responses (60s TTL)
- Cache trending hashtags (5 min TTL)
- Use `Cache-Control` headers + Vercel Edge cache or CloudFront

---

## 6. Messaging Scaling

### 6.1 Current Limitations
- Messages stored in Convex with real-time subscriptions
- Convex handles WebSocket-like reactivity natively
- No message delivery guarantees beyond Convex's built-in
- No end-to-end encryption

### 6.2 Scaling Plan

**Phase 1 — 100K Users (Keep Convex)**
- Add Redis pub/sub for typing indicators (remove from database)
- Add message delivery receipts (delivered/read status)
- Implement client-side message queue for offline support

**Phase 2 — 500K Users (Extract Service)**
- Dedicated messaging service with its own PostgreSQL
- WebSocket server (Socket.io or ws) for real-time delivery
- Redis pub/sub for cross-server message routing
- Message storage: PostgreSQL with time-based partitioning

**Phase 3 — 1M+ Users**
- Horizontal scaling via WebSocket server cluster
- Sticky sessions via consistent hashing on `conversationId`
- Message archival: hot storage (PostgreSQL) + cold storage (S3)
- End-to-end encryption using Signal Protocol

### 6.3 Data Model at Scale

```sql
-- Partitioned by month for efficient archival
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT,
  content_encrypted BYTEA,  -- E2E encrypted payload
  message_type VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PARTITION BY RANGE (created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE messages_2026_01 PARTITION OF messages
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## 7. Search Infrastructure

### 7.1 Current Limitations
- In-memory fuzzy matching on `.take(500)` records
- Custom Levenshtein implementation (well-written but not scalable)
- No full-text index, no stemming, no language support

### 7.2 Recommended: Typesense (Self-Hosted) or Algolia (Managed)

**Typesense** (Recommended for cost)
- Open-source, self-hosted search engine
- Typo tolerance, faceting, geo-search built-in
- Sub-10ms search latency
- Cost: Free (self-hosted on a $20/mo VM)

**Algolia** (Recommended for simplicity)
- Managed search-as-a-service
- 10K records free tier, then $1/1K records/month
- Client-side search SDK (InstantSearch)

### 7.3 Search Index Schema

```json
{
  "posts": {
    "fields": ["content", "author_name", "hashtags"],
    "sortBy": ["created_at:desc", "engagement_score:desc"],
    "facets": ["media_type", "community_id"]
  },
  "users": {
    "fields": ["name", "username", "bio", "skills", "university"],
    "sortBy": ["follower_count:desc"],
    "facets": ["role", "experience_level"]
  },
  "hashtags": {
    "fields": ["tag"],
    "sortBy": ["post_count:desc", "trending_score:desc"]
  }
}
```

### 7.4 Sync Strategy
- On post/user/hashtag mutation → dispatch `search.index` event to queue
- Consumer processes events and upserts into Typesense/Algolia
- Expected indexing latency: 1-5 seconds
- Full reindex cron: weekly (for consistency)

---

## 8. Database Migration

### 8.1 When to Migrate Away from Convex
Convex is excellent for rapid development but has limits at scale:

| Limit | Convex | PostgreSQL |
|-------|--------|------------|
| Query complexity | Limited (no JOINs, no aggregations) | Full SQL |
| Execution time | Hard timeout per function | Configurable |
| Indexing | Limited compound indexes | Arbitrary indexes, partial indexes, GIN |
| Sharding | Not user-controlled | Foreign Data Wrappers, Citus |
| Data export | Full export available | Native pg_dump |
| Cost at 1M users | UNKNOWN — pricing may change | Predictable |

**Migration Trigger**: Any of these scenarios:
1. Convex execution time limits cause user-facing errors
2. Query patterns require JOINs or aggregations that can't be denormalized
3. Cost exceeds self-managed PostgreSQL by >3x
4. Need for multi-region replication

### 8.2 Migration Strategy (If Needed)
1. **Dual-write phase**: Write to both Convex and PostgreSQL simultaneously
2. **Shadow-read phase**: Read from PostgreSQL but validate against Convex
3. **Cutover**: Switch reads to PostgreSQL, stop Convex writes
4. **Cleanup**: Remove Convex dependencies

### 8.3 Recommended Database: Neon PostgreSQL
- Serverless PostgreSQL (scales to zero)
- Branch-per-PR for preview environments
- Automatic scaling
- Compatible with Prisma ORM

---

## 9. Observability at Scale

### 9.1 Current State (Good for 10K)
- Sentry: Error tracking (client + server + edge)
- PostHog: Product analytics
- Vercel Analytics: Performance metrics
- Structured logging: JSON format with scopes

### 9.2 Additions for 1M+

| Tool | Purpose | When to Add |
|------|---------|-------------|
| **Datadog/Grafana Cloud** | Infrastructure metrics, custom dashboards | 100K+ users |
| **OpenTelemetry** | Distributed tracing across services | When extracting services |
| **PagerDuty/OpsGenie** | On-call alerting | Before 100K users |
| **Checkly/Betteruptime** | Synthetic monitoring, uptime checks | Immediately |
| **k6/Artillery** | Load testing scripts | Before scale events |

### 9.3 Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API p95 latency | < 200ms | > 500ms |
| Error rate | < 0.1% | > 1% |
| Feed load time | < 300ms | > 1s |
| Message delivery | < 500ms | > 2s |
| Search latency | < 100ms | > 500ms |
| Database query time | < 50ms | > 200ms |
| Uptime | 99.9% | Any downtime > 5min |

---

## 10. Cost Projections

### 10K Users (Current Target)
| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Convex | $25 (Pro) |
| Clerk | $25 (Pro) |
| Upstash Redis | $10 |
| Sentry | Free tier |
| PostHog | Free tier |
| **Total** | **~$80/month** |

### 100K Users
| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 + usage |
| Convex | $50-100 |
| Clerk | $99 |
| Upstash Redis | $30 |
| Typesense VM | $20 |
| Sentry Team | $26 |
| PostHog | Free tier |
| **Total** | **~$300-400/month** |

### 1M Users
| Service | Monthly Cost |
|---------|-------------|
| Vercel Enterprise / Self-hosted | $500-2000 |
| PostgreSQL (Neon/RDS) | $200-500 |
| Redis Cluster | $100-300 |
| Typesense Cluster | $60-200 |
| Message Queue | $50-100 |
| CDN (Cloudflare) | $50-200 |
| Monitoring stack | $200-500 |
| **Total** | **$1,500-4,000/month** |

---

## Summary

This document outlines the trajectory from 10K → 1M+ users. Key takeaways:

1. **Don't over-engineer now** — Convex + Vercel handles 10K-50K users well
2. **Redis is the first scaling multiplier** — caching, rate limiting, pub/sub
3. **Search extraction is the first service boundary** — when in-memory fuzzy matching breaks
4. **Feed fan-out is the biggest architecture change** — plan early, implement when read latency degrades
5. **Database migration is the nuclear option** — only when Convex limits are proven
6. **Keep the frontend monolith** — Next.js App Router handles code splitting automatically

**Do not implement any of this until the 10K target improvements in `improvements.md` are complete and validated.**
