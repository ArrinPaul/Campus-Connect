# Frontend/Backend Split - Setup Guide

This project has been split into a monorepo with separate frontend and backend.

## Project Structure

```
.
├── apps/
│   ├── api/          # Backend server (Node.js + Express)
│   └── web/          # Frontend (Next.js) - current root moved here
├── packages/         # Shared code (optional)
├── package.json      # Monorepo root
└── .env.local        # Frontend config
```

## Setup Instructions

### 1. Install Backend Dependencies
```bash
cd apps/api
npm install
```

### 2. Create Backend Environment
```bash
cp apps/api/.env.example apps/api/.env
```

Then edit `apps/api/.env` and add your Neo4j credentials:
```
NEO4J_URI=neo4j+s://your-aura-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j
AUTH_SECRET=your-secret-key
```

### 3. Update Frontend Environment
The `.env.local` in the root now points to the backend API:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Run Both Services
From the root directory:
```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:3001`

Or run individually:
```bash
npm run dev:web    # Frontend only
npm run dev:api    # Backend only  
```

## Key Changes

### Frontend
- No longer connects to Neo4j directly
- All database calls go through backend API
- Neo4j client removed from main app
- Session auth moved to backend

### Backend
- Standalone Express server on port 3001
- Neo4j driver initialized once at startup
- All DB operations stay server-side
- Protected routes via `x-user-id` header (development)

## Onboarding Flow (Example)

1. User signs up → receives session token
2. User fills onboarding form → frontend calls backend
3. Backend: `/api/users/onboarding` → Neo4j writes
4. Frontend: Shows success and redirects

## Next Steps

Currently migrated:
- ✅ Auth (sign-up, sign-in, sign-out)
- ✅ Onboarding
- ✅ User profile read

Still using internal Next.js routes (migrate incrementally):
- Posts, comments, reactions
- Follows, bookmarks
- Communities, messages
- All other features

To migrate more endpoints:
1. Add route handler to `apps/api/src/routes/`
2. Update database function in `apps/api/src/db/`
3. Update frontend client call to use backend URL
4. Test both services running together

## Troubleshooting

**Backend won't start**: Check Neo4j credentials in `apps/api/.env`

**Frontend can't reach backend**: Ensure `NEXT_PUBLIC_API_URL` is set correctly

**Onboarding still fails**: Verify Neo4j is accessible by running the test from backend README
