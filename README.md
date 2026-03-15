# Campus Connect

A next-generation academic social platform built with Next.js 14, Clerk, Convex, Neo4j, and Redis.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Add your Clerk, Convex, Neo4j, and Redis API keys
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Clerk** - Authentication
- **Convex** - Real-time database
- **Neo4j** - Graph relationships for suggestions/recommendations
- **Redis (Upstash)** - Caching recommendation and suggestion payloads

## Graph Recommendation APIs

The recommendation and suggestion paths are now exposed through authenticated Next.js API routes backed by Neo4j + Redis cache:

- `GET /api/graph/suggestions?limit=5`
- `POST /api/graph/suggestions/dismiss`
- `POST /api/graph/suggestions/refresh`
- `GET /api/graph/recommendations?limit=10`
- `POST /api/graph/follows`

### Graph Sync Endpoint

Use `POST /api/graph/sync` to upsert users/follows/posts/interactions into Neo4j from background jobs or webhooks.

Set `GRAPH_SYNC_TOKEN` and send it as:

`Authorization: Bearer <GRAPH_SYNC_TOKEN>`
