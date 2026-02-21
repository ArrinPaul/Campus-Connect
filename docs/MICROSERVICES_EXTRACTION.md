# Microservices Extraction Plan

> **Status**: Planning  
> **Trigger**: 1M+ users, or when any single domain requires independent scaling / deployment  
> **Last reviewed**: 2025

---

## 1. Executive Summary

Campus Connect is currently a modular monolith: a single Next.js application backed by a single Convex project. This document outlines the extraction plan for splitting the monolith into independently deployable microservices when the platform reaches the scale where the monolith becomes a deployment or scaling bottleneck.

---

## 2. Current Monolith Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │   Feed   │ │ Messages │ │  Events  │  ...        │
│  │  Pages   │ │  Pages   │ │  Pages   │             │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │             │            │                   │
│  ┌────┴─────────────┴────────────┴──────────────┐   │
│  │           Convex Backend (43 tables)          │   │
│  │  posts.ts  messages.ts  events.ts  users.ts   │   │
│  │  follows.ts  notifications.ts  search.ts  ... │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Domain boundaries already established

The Convex backend is organized by domain — each file owns one aggregate root:

| Domain Module | Tables | Lines | Coupling |
|--------------|--------|-------|----------|
| `users.ts` | users | ~400 | Core identity — referenced by everything |
| `posts.ts` | posts | ~600 | References users |
| `messages.ts` | messages, conversations, conversationParticipants | ~500 | References users |
| `notifications.ts` | notifications | ~300 | References users, posts, comments |
| `events.ts` | events, eventRegistrations | ~400 | References users, communities |
| `search.ts` | — (reads from multiple) | ~200 | Read-only, fan-out |
| `feedRanking.ts` | — (reads posts, users) | ~300 | Read-only, computation-heavy |
| `recommendations.ts` | — (reads follows, skills) | ~200 | Read-only, ML-adjacent |
| `gamification.ts` | badges, achievements | ~300 | References users |

---

## 3. Extraction Priority

Services are ordered by independence, scaling need, and business value:

| Priority | Service | Why Extract | Trigger |
|----------|---------|-------------|---------|
| **P0** | Chat Service | Real-time WebSocket load, independent scaling pattern, highest write throughput | > 100K concurrent WebSocket connections |
| **P1** | Notification Service | Fan-out write pattern, push delivery SLA, easy to decouple | Notification delivery latency > 5s |
| **P2** | Recommendation Engine | CPU-intensive ML inference, different scaling profile (batch), no user-facing writes | Need for GPU inference nodes |
| **P3** | Search Service | Requires specialized full-text/vector index (Typesense, Meilisearch), read-only | Search latency > 200ms |
| **P4** | Media Service | Large file processing (image resize, video transcode), separate storage costs | Media storage > 500 GB |
| **P5** | Analytics Service | Write-heavy event ingestion, OLAP queries, doesn't need real-time consistency | Analytics queries slow down OLTP |

---

## 4. Service Designs

### 4.1 Chat Service (P0)

**Extracted components**: `messages.ts`, `conversations.ts`, `presence.ts`

```
┌──────────────────────────────────────────┐
│            Chat Service                   │
│  ┌─────────────┐  ┌──────────────────┐   │
│  │  WebSocket   │  │  Convex Project  │   │
│  │  Gateway     │  │  (chat-db)       │   │
│  │  (scaling    │  │  messages         │   │
│  │   target)    │  │  conversations    │   │
│  └──────┬───────┘  │  presence         │   │
│         │          └────────┬─────────┘   │
│         └───────────────────┘             │
└────────────────────┬─────────────────────┘
                     │ events (async)
                     ▼
           ┌──────────────────┐
           │  Event Bus       │
           │  (Upstash Kafka) │
           └──────────────────┘
```

**API contract**:
```typescript
// chat-service/api.ts
POST   /api/chat/conversations           // create conversation
GET    /api/chat/conversations/:id        // get conversation + messages
POST   /api/chat/conversations/:id/send   // send message
WS     /api/chat/ws                       // real-time subscription
DELETE /api/chat/messages/:id             // soft-delete message
```

**Data ownership**: Owns `messages`, `conversations`, `conversationParticipants`, `presence` tables.  
**Dependencies**: Reads user profiles from User Service (cached, 5 min TTL).  
**Events emitted**: `message.sent`, `message.read`, `conversation.created`.

---

### 4.2 Notification Service (P1)

**Extracted components**: `notifications.ts`, `pushNotifications.ts`

```
┌───────────────────────────────────────────┐
│          Notification Service              │
│  ┌─────────────────┐  ┌───────────────┐   │
│  │  Event Consumer  │  │ Push Gateway  │   │
│  │  (processes      │  │ (web-push,    │   │
│  │   domain events) │  │  APNs, FCM)   │   │
│  └────────┬─────────┘  └───────┬───────┘   │
│           │                    │            │
│  ┌────────┴────────────────────┴────────┐  │
│  │  Convex Project (notification-db)     │  │
│  │  notifications, push_subscriptions    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Events consumed**: `post.liked`, `post.commented`, `user.followed`, `message.sent`, `event.created`, `mention.created`.  
**Delivery channels**: In-app (Convex real-time), Web Push, Email digest (via Resend/SendGrid).  
**SLA**: < 2 second delivery for in-app, < 10 seconds for push, daily/weekly for email digest.

---

### 4.3 Recommendation Engine (P2)

**Extracted components**: `recommendations.ts`, `feedRanking.ts`, `matching.ts`

```
┌─────────────────────────────────────────┐
│       Recommendation Engine              │
│  ┌──────────────┐  ┌────────────────┐   │
│  │  Batch Jobs   │  │  API Gateway   │   │
│  │  (nightly     │  │  GET /recs     │   │
│  │   recompute)  │  │  GET /feed     │   │
│  └───────┬───────┘  └───────┬────────┘   │
│          │                  │             │
│  ┌───────┴──────────────────┴──────────┐ │
│  │  Vector DB (Pinecone / pgvector)    │ │
│  │  User embeddings, Content embeddings │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Inputs**: User skills, interaction history (likes, comments, follows), content metadata.  
**Outputs**: Ranked feed, user suggestions, event recommendations, collaborator matching.  
**Refresh cycle**: Nightly batch for embeddings + real-time boost for recent interactions.

---

### 4.4 Search Service (P3)

**Extracted components**: `search.ts`

**Technology**: Typesense or Meilisearch (sub-50ms full-text + faceted search).  
**Indexed entities**: Users, posts, communities, events, papers, resources.  
**Sync mechanism**: CDC from Convex → search index via HTTP actions.  
**Features**: Typo tolerance, faceted filters (university, role, skills), semantic search (vector embeddings).

---

### 4.5 Media Service (P4)

**Extracted components**: `media.ts`

**Responsibilities**:
- Image upload → resize (thumbnail, medium, full) → store in R2/S3
- Video upload → transcode (HLS adaptive) → store in R2/S3
- File metadata management
- CDN cache invalidation

**Technology**: Cloudflare Workers + R2 + Cloudflare Images (or imgproxy).

---

## 5. Communication Patterns

### 5.1 Synchronous (Request-Response)

Used for **user-facing queries** where latency matters:

```
Frontend ──HTTP──► API Gateway ──HTTP──► Service
                                          │
                                          ▼
                                       Response
```

### 5.2 Asynchronous (Event-Driven)

Used for **cross-service side effects**:

```
Service A ──event──► Event Bus ──event──► Service B
                         │
                         └──event──► Service C
```

**Event bus**: Upstash Kafka (serverless, pay-per-message, no infrastructure to manage).

### 5.3 Event Schema

```typescript
interface DomainEvent {
  id: string           // UUIDv7
  type: string         // e.g. "post.created"
  source: string       // e.g. "post-service"
  timestamp: number    // Unix ms
  userId: string       // Actor
  data: Record<string, unknown>
  metadata: {
    correlationId: string
    causationId?: string
    version: number    // Schema version for backward compat
  }
}
```

---

## 6. Extraction Workflow (per service)

### Step 1: Strangle — Add abstraction layer

```typescript
// Before: direct Convex call
const messages = await ctx.db.query("messages").withIndex(...)

// After: domain service abstraction
const messages = await chatService.getMessages(conversationId)
// chatService internally calls Convex — no behavior change
```

### Step 2: Dual-write — Write to both old and new

```typescript
// Write to monolith DB AND new service DB
await Promise.all([
  ctx.db.insert("messages", msg),         // old
  chatServiceClient.sendMessage(msg),      // new
])
```

### Step 3: Migrate reads — Point reads at new service

```typescript
// Reads now go to new service
const messages = await chatServiceClient.getMessages(conversationId)
// Writes still dual-write for safety
```

### Step 4: Cut over — Remove old code path

```typescript
// Only write to new service
await chatServiceClient.sendMessage(msg)
// Old messages table becomes read-only archive
```

### Step 5: Clean up — Remove dead code, archive old tables

---

## 7. Shared Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Gateway** | Vercel Edge Functions / Cloudflare Workers | Routing, auth verification, rate limiting |
| **Event Bus** | Upstash Kafka | Async communication between services |
| **Cache** | Upstash Redis | Shared cache (user profiles, sessions) |
| **Auth** | Clerk | Centralized identity; JWT verification at each service |
| **Observability** | Sentry + Vercel Analytics + PostHog | Distributed tracing, error tracking, product analytics |
| **Secrets** | Vercel Environment Variables | Per-service secret management |

---

## 8. Data Consistency

### Saga pattern for cross-service transactions

Example: "User creates a community event and invites members"

```
1. Event Service: Create event          ──► success
2. Notification Service: Send invites   ──► success
3. Chat Service: Create group chat      ──► failure!
   ──► Compensate: Delete invites (Notification Service)
   ──► Compensate: Cancel event (Event Service)
```

### Eventual consistency guarantees

- Cross-service reads may be stale by up to **5 seconds**.
- User-facing writes are always **strongly consistent** within the owning service.
- Read-your-own-writes is guaranteed by routing the user to the same service instance.

---

## 9. Deployment Strategy

```
┌─────────────────────────────────────────┐
│  Vercel (Next.js frontend)               │
│  ├─ Edge Functions (API routing)         │
│  └─ Serverless Functions (SSR + API)     │
├──────────────────────────────────────────┤
│  Convex Projects (per service)           │
│  ├─ convex-main     (posts, users, ...)  │
│  ├─ convex-chat     (messages, presence) │
│  ├─ convex-notify   (notifications)      │
│  └─ convex-recs     (recommendations)    │
├──────────────────────────────────────────┤
│  Cloudflare Workers                      │
│  └─ media-service   (upload, transcode)  │
├──────────────────────────────────────────┤
│  Upstash                                 │
│  ├─ Redis (cache)                        │
│  └─ Kafka (event bus)                    │
└──────────────────────────────────────────┘
```

Each service has its own CI/CD pipeline (GitHub Actions), but the frontend remains a single deployment.

---

## 10. When NOT to Extract

**Keep in the monolith** if:

- The domain has tight coupling with 3+ other domains (e.g., `posts` depends on users, comments, reactions, reposts, bookmarks).
- The team is < 10 engineers — coordination overhead outweighs benefits.
- The feature is not independently scalable (e.g., `follows` is tightly coupled to `users`).
- Convex's automatic scaling handles the load without intervention.

**Rule of thumb**: Extract only when the pain of keeping it in the monolith exceeds the pain of operating a separate service.

---

## 11. Rollback Plan

Each extraction follows the strangler fig pattern, which means the old code path remains functional:

1. **Revert routing** — Point API gateway back to monolith endpoints.
2. **Replay events** — Any events written to the new service during the extraction window can be replayed to the monolith.
3. **Data reconciliation** — Run consistency check scripts to ensure no data loss.

The monolith remains the source of truth until the new service has been stable for 30 days.
