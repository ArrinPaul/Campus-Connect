# CAMPUS CONNECT — PHASE 2 BASELINE REPORT

**Phase:** Phase 2 (Foundation Stabilization, Database Integrity & Runtime Verification)  
**Execution Date:** August 27, 2026  
**Baseline State (Prior to Phase 2 Fixes):**

---

## 1. Initial State Inventory

| Metric / Dimension | Phase 1 Baseline Status | Root Cause / Context |
| :--- | :---: | :--- |
| **Git Branch / Status** | `main` / Clean | All Phase 1 documentation was committed. |
| **TypeScript Health** | **PASS** (0 errors) | `npx tsc --noEmit` exited 0. |
| **ESLint Health** | **PASS** (0 errors, 2 warnings) | 2 `<img>` warnings in chat components. |
| **Production Build** | **PASS** (204/204 routes) | `npm run build` compiled all routes. |
| **Jest Test Suite** | **FAIL** (425 passed, 1 failed) | `main-layout.test.tsx` failed asserting outdated padding class `md:px-6` vs `md:px-8`. |
| **Database Schema Status** | **3 Blockers** | 1. Missing `calls` table in migration.<br>2. Missing `questions.is_resolved` column.<br>3. `events-jobs.ts` queried `employment_type` instead of `type`. |
| **Security Findings** | **1 P0 Blocker** | Hardcoded database connection URL with password in `setup-realtime.js:L3`. |
| **Migration Runner** | **BROKEN** | `run-migration.js` pointed to non-existent `supabase/migration.sql`. |
| **Runtime Connectivity** | **UNVERIFIED (Phase 1)** | Database, Storage, and Realtime runtime connectivity unverified. |

---

## 2. Phase 2 Scope & Targeted Fixes

1. **Database Schema Repair**:
   - Add Table 38 (`calls`) with foreign keys, indexes, and RLS policies to `supabase/migrations/20240101000000_init.sql`.
   - Add column `is_resolved BOOLEAN DEFAULT FALSE` to `questions` table in migration.
   - Fix `src/server/db/events-jobs.ts` query to use column `type`.
2. **Security Hardening**:
   - Eliminate hardcoded database password in `setup-realtime.js` and use `process.env.DATABASE_URL`.
   - Audit `SUPABASE_SERVICE_ROLE_KEY` usage to ensure server-only boundary.
3. **Migration Tooling Fix**:
   - Update `run-migration.js` to point to `supabase/migrations/20240101000000_init.sql`.
4. **Test & CI Stabilization**:
   - Update `main-layout.test.tsx` to match responsive padding `md:px-8`.
   - Add `tests/phase2-foundation.test.ts` (10 new unit test assertions).
   - Achieve 100% passing tests (436/436 passing).
5. **Runtime Verification**:
   - Verify live Supabase database connectivity.
   - Verify Supabase Storage buckets (`media`, `avatars`).
