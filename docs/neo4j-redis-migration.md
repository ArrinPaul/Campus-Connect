# Neo4j + Redis Migration Guide

This project now includes a graph recommendation layer implemented in Next.js API routes.

## What was migrated

- Suggestions (`Who to follow`) now read from Neo4j through `GET /api/graph/suggestions`.
- Feed sidebar suggestions now use graph-backed APIs.
- Suggestion dismiss/refresh now uses graph-backed APIs.
- Follow mutation in suggestion widgets can persist to Neo4j (`POST /api/graph/follows`).
- Redis (Upstash) caches suggestion and recommendation results.

## Required environment variables

Set the following values in `.env.local`:

- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `NEO4J_DATABASE` (optional, defaults to `neo4j`)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GRAPH_SYNC_TOKEN` (for server-to-server sync writes)

## API endpoints

- `GET /api/graph/suggestions?limit=5`
- `POST /api/graph/suggestions/dismiss`
- `POST /api/graph/suggestions/refresh`
- `POST /api/graph/follows`
- `GET /api/graph/recommendations?limit=10`
- `POST /api/graph/sync` (authorized with bearer token)

## Graph sync payloads

Use `POST /api/graph/sync` with `Authorization: Bearer <GRAPH_SYNC_TOKEN>`.

### Upsert user

```json
{
  "type": "user",
  "user": {
    "clerkId": "user_123",
    "convexUserId": "jh7z3...",
    "name": "Alice",
    "skills": ["react", "ml"]
  }
}
```

### Follow/unfollow

```json
{
  "type": "follow",
  "followerClerkId": "user_123",
  "followingClerkId": "user_456",
  "action": "follow"
}
```

### Upsert post

```json
{
  "type": "post",
  "post": {
    "postId": "post_abc",
    "authorClerkId": "user_456",
    "content": "Graph databases are great for recommendations",
    "hashtags": ["graph", "neo4j"],
    "engagementScore": 2.3
  }
}
```

### Record interaction

```json
{
  "type": "interaction",
  "interaction": {
    "viewerClerkId": "user_123",
    "postId": "post_abc",
    "interactionType": "like",
    "weight": 1
  }
}
```

## Notes

- If Redis is not configured, an in-memory fallback cache is used.
- Recommendation quality depends on regular sync writes to Neo4j.
- Existing Convex modules remain active for non-migrated features.
