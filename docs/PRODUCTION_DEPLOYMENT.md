# CAMPUS CONNECT — PRODUCTION DEPLOYMENT GUIDE

**Target Environment:** Vercel (Frontend & Edge API) + Supabase (PostgreSQL, Storage, Auth, Realtime) + Upstash Redis (Distributed Rate Limiting) + Stripe (Monetization)

---

## 1. Prerequisites Checklist
1. **Supabase Project**: Provisioned with PostgreSQL 15+, Auth enabled, and Storage buckets (`avatars`, `posts`, `resources`, `research`).
2. **Upstash Redis**: Serverless Redis database with REST URL & Token.
3. **VAPID Keys**: Generated via `npx web-push generate-vapid-keys`.
4. **Stripe Account**: Standard or test account with webhook endpoints registered.
5. **Sentry Project**: DSN configured for Next.js error tracing.
6. **PostHog Project**: Project API key & host configured.

---

## 2. Database Migration Execution
Apply canonical migrations in sequential order:
```bash
# In Supabase SQL Editor or via CLI:
supabase db push
# Or run migrations manually:
node run-migration.js
```
Migrations list:
- `supabase/migrations/20240101000000_init.sql` (Tables 1-39)
- `supabase/migrations/20240103000000_push_and_subscriptions.sql` (Tables 40-42)
- `supabase/migrations/20240104000000_vector_and_recommendations.sql` (Tables 43-44)

---

## 3. Build & Smoke Verification
```bash
npm ci
npx tsc --noEmit
npx next lint
npm test
npm run build
```

---

## 4. Health Probes
- **Liveness Probe**: `GET /api/health` (Returns HTTP 200 `{ status: "ok" }`)
- **Readiness Probe**: `GET /api/health/ready` (Returns HTTP 200 `{ status: "ready", checks: { database: "connected" } }`)
