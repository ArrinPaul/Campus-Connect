# Campus Connect - Frontend/Backend Monorepo

This is now a monorepo with separate frontend (Next.js) and backend (Express) services.

## Quick Start

### 1. Install All Dependencies
```bash
npm install
# This installs root + both apps/api and packages/*
```

### 2. Configure Backend
```bash
# Backend already has .env with Neo4j credentials
# Verify they match your Neo4j Aura instance
cat apps/api/.env
```

### 3. Run Everything
```bash
# From root - starts both frontend and backend
npm run dev
```

Visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Architecture

```
┌─────────────────────────────────────────┐
│       Frontend (Next.js)                 │
│    http://localhost:3000                │
│  ┌──────────────────────────────────┐  │
│  │  Pages, Components, UI, Routing  │  │
│  └──────────────────────────────────┘  │
│           │                              │
│           │ API Calls (NEXT_PUBLIC_     │
│           │     API_URL)                 │
│           ▼                              │
└─────────────────────────────────────────┘
            │
            │ http://localhost:3001
            │
┌─────────────────────────────────────────┐
│       Backend (Express)                  │
│    http://localhost:3001                │
│  ┌──────────────────────────────────┐  │
│  │  Auth, Onboarding, Database Ops  │  │
│  └──────────────────────────────────┘  │
│           │                              │
│           │ Neo4j Driver (Singleton)    │
│           ▼                              │
└─────────────────────────────────────────┘
            │
            │ TCP 7687
            │
    ┌──────────────────┐
    │  Neo4j Aura      │
    │  (Production DB) │
    └──────────────────┘
```

## Key Features

✅ **Singleton Neo4j Connection**: One persistent connection at startup, reused for all requests

✅ **Session Pooling**: Each query opens a lightweight session from the pool

✅ **Server-side Secrets**: Neo4j credentials and auth secrets stay in backend only

✅ **Clean Separation**: Frontend is stateless, backend manages all state

✅ **Incremental Migration**: Add more endpoints to backend as needed

## File Structure

```
.
├── src/                          # Frontend (Next.js app router)
│   ├── app/                      # Pages
│   ├── components/               # React components
│   ├── lib/
│   │   ├── auth/                 # Frontend auth helpers
│   │   └── api.ts                # ⭐ Updated to call backend
│   └── ...
│
├── apps/
│   ├── api/                      # Backend (Express server)
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point, initializes Neo4j
│   │   │   ├── db/
│   │   │   │   ├── neo4j.ts      # ⭐ Singleton driver
│   │   │   │   └── users.ts      # Database operations
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts       # Auth routes
│   │   │   │   └── users.ts      # User routes
│   │   │   └── lib/
│   │   │       └── session.ts    # Token creation
│   │   ├── .env                  # Neo4j credentials
│   │   └── package.json
│   │
│   └── web/                      # (Optional) Frontend workspace marker
│
├── package.json                  # Monorepo root
├── .env.local                    # Frontend env (NEXT_PUBLIC_API_URL)
├── MONOREPO_SETUP.md             # Detailed setup guide
└── README.md                     # This file
```

## Current Features

### Migrated to Backend ✅
- Authentication (sign-up, sign-in, sign-out)
- Onboarding endpoint
- User profile fetch
- Neo4j driver singleton

### Still Using Internal Routes ⏳
- Posts, comments, reactions
- Follows, bookmarks
- Communities, messages
- Tickets, resources, events
- (Migrate incrementally as needed)

## Adding More Backend Routes

### Example: Migrate Posts

1. **Backend - Create route** (`apps/api/src/routes/posts.ts`):
```typescript
router.post("/create", async (req: AuthRequest, res: Response) => {
  const userId = req.headers["x-user-id"] as string
  const { title, content } = req.body
  // Call database function
  const post = await createPost(userId, title, content)
  res.json(post)
})
```

2. **Backend - Create DB function** (`apps/api/src/db/posts.ts`):
```typescript
export async function createPost(userId: string, title: string, content: string) {
  return runWrite(async (session) => {
    // Query Neo4j
  })
}
```

3. **Frontend - Update client** (`src/lib/api.ts`):
```typescript
posts: {
  createPost: ep("/api/posts", "POST"),
}
```

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SENTRY_DSN=...
...
```

### Backend (`apps/api/.env`)
```
NEO4J_URI=neo4j+s://...
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
AUTH_SECRET=...
```

## Troubleshooting

**"Cannot GET /api/..."**
- Endpoint not yet migrated to backend
- Check if route exists in `apps/api/src/routes/`

**Neo4j connection errors**
- Verify credentials in `apps/api/.env`
- Check Neo4j Aura instance is active
- Run test: `cd apps/api && npm run dev`

**Frontend can't reach backend**
- Ensure `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Check backend is running on port 3001
- Check CORS settings in `apps/api/src/index.ts`

**concurrently not found**
- Run `npm install` at root level

## Next Steps

1. ✅ Backend server initialized once at startup
2. ✅ Neo4j driver pooled and reused
3. ⏳ Migrate remaining endpoints incrementally
4. ⏳ Add database caching (Redis)
5. ⏳ Deploy frontend to Vercel, backend to Railway/Heroku
