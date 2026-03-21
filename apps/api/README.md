# Campus Connect API

Standalone backend server for Campus Connect. Handles authentication, Neo4j database operations, and API routes.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example` and fill in your Neo4j credentials):
```bash
cp .env.example .env
```

3. Set your Neo4j Aura credentials:
```
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j
AUTH_SECRET=your-secret-key
```

## Development

Run in development mode:
```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Running with Frontend

From the root directory, run both frontend and backend together:
```bash
npm run dev
```

This uses `concurrently` to start both:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Architecture

- **Singleton Neo4j Driver**: Initialized once at startup and reused across all requests
- **Session-based Operations**: Each query/mutation opens a pooled session
- **Express Routes**: RESTful API endpoints at `/api/*`

## Key Files

- `src/index.ts` - Main Express server entry point
- `src/db/neo4j.ts` - Neo4j singleton driver and utilities
- `src/db/users.ts` - User database operations (onboarding, etc)
- `src/routes/` - API route handlers
- `src/lib/session.ts` - Session token creation and verification

## API Routes

- `GET /health` - Health check
- `GET /api/auth/session` - Check current session
- `POST /api/auth/sign-out` - Sign out
- `POST /api/users/onboarding` - Complete user onboarding
- `GET /api/users/me` - Get current user

## Environment Variables

See `.env.example` for all available variables.
