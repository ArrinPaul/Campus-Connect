# CAMPUS CONNECT — PHASE 7 FORENSIC PRE-FLIGHT AUDIT

**Audit Date:** August 27, 2026  
**Audited Baseline:** 56 Jest Suites | 516 Tests (100% PASS) | 0 TS Errors | 0 ESLint Errors/Warnings | 209 Routes  
**Audit Objective:** Complete pre-implementation discovery for Phase 7 (Observability, Recommendations, Vector Search, Performance, Caching & Production Hardening).

---

## 1. Codebase Architecture & Integrity Inventory

| Subsystem | Verified Baseline | Phase 7 Action |
|---|---|---|
| **Observability** | `src/lib/logger.ts` structured logger with basic Sentry scope tagging | Add sensitive-data scrubber, correlation IDs, and unified `src/lib/analytics.ts` abstraction. |
| **Error Monitoring** | Sentry client/server hooks | Ensure graceful fallback when `NEXT_PUBLIC_SENTRY_DSN` is omitted; scrub auth headers and PII. |
| **Product Analytics** | `posthog-js` dependency installed; `PostHogPageView` component | Implement typed event tracking abstraction covering full student journey. |
| **Recommendations & AI** | `src/app/api/matching/` and `/matching/score` were scaffolded 501 stubs | Implement pgvector migration `20240104000000_vector_and_recommendations.sql`, `EmbeddingProvider` abstraction with fallback, semantic research search, and multi-factor study buddy / project matching engine. |
| **Caching & Performance** | In-memory & Upstash Redis rate limiter | Add multi-tier caching abstraction (`src/lib/cache.ts`) for leaderboards, hashtags, and public queries with bounded TTLs. |
| **Health Checks** | None currently under `/api/health` | Implement `/api/health` and `/api/health/ready` with DB/storage/Redis status probes without exposing secrets. |
| **Security & RLS** | 42 tables configured in `supabase/migrations/` | Perform full database security audit; verify all foreign keys, uniqueness, and RLS policies. |

---

## 2. API Routes Audit (Targeting Phase 7 Hardening)

1. **`src/app/api/matching/route.ts`**: Upgraded to multi-factor student partner recommendation engine (skills, interests, university overlap).
2. **`src/app/api/matching/score/route.ts`**: Upgraded to calculate deterministic compatibility score between two academic profiles.
3. **`src/app/api/research/search/route.ts`**: Upgraded to support hybrid semantic vector similarity search + keyword fallback.
4. **`src/app/api/health/route.ts`**: New production readiness & liveness health check probes.

---

## 3. Migration Plan (Phase 7)
- `supabase/migrations/20240104000000_vector_and_recommendations.sql`:
  - Enables `vector` extension if available (`CREATE EXTENSION IF NOT EXISTS vector`).
  - Creates table 43: `research_embeddings` (`id UUID PRIMARY KEY`, `paper_id UUID REFERENCES research_papers(id)`, `embedding vector(1536)` or JSONB fallback, `updated_at TIMESTAMPTZ`).
  - Creates table 44: `user_interest_embeddings` (`id UUID PRIMARY KEY`, `user_id UUID REFERENCES users(id)`, `embedding vector(1536)`, `tags TEXT[]`, `updated_at TIMESTAMPTZ`).
  - RLS policies and indexes on embedding tables.
