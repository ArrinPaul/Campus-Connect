# Campus Connect — Improvements Plan (10K Users Target)

> Production-readiness improvements for stable deployment supporting 10,000 concurrent users.
> Derived from full system audit — February 2026.
> Scope: Stability, Security, Maintainability, Developer Productivity.

---

## Executive Summary

Campus Connect is a feature-rich academic social platform built on Next.js 14 + Convex + Clerk + Vercel. The codebase demonstrates strong engineering fundamentals — consistent auth enforcement, real-time reactive queries, comprehensive test coverage (unit, integration, property-based), and a solid CI/CD pipeline.

However, several **critical security vulnerabilities** and **scalability bottlenecks** must be resolved before production deployment, even at the 10K user scale. The most urgent issues are:

1. **XSS sanitization is bypassable** — regex-based denylist approach can be circumvented
2. **Message content has zero sanitization** — stored XSS vector in DMs
3. **CORS is overly permissive** — any `*.vercel.app` subdomain is allowed
4. **Rate limiter is ineffective on serverless** — in-memory state resets on cold starts
5. **Unbounded table scans** in search/user queries will cause timeouts at scale

This plan addresses these issues with **minimal, targeted changes** that preserve backward compatibility.

---

## 1. Security Improvements

### 1.1 Replace Regex-Based XSS Sanitization with Allowlist Approach
- **File**: `convex/sanitize.ts`
- **Why**: The current `sanitizeMarkdown()` uses a denylist of HTML tags via regex. This is a known defeated pattern — nested tags (`<scr<script>ipt>`), missing tags (`<a>`, `<div>`, `<span>`), and novel vectors bypass it. `sanitizeMarkdown()` does NOT HTML-encode output, so anything not matched passes through raw.
- **Impact**: 🔴 Critical
- **Effort**: Small (< 1 day)
- **Fix**: Switch to an allowlist approach — strip ALL HTML tags from stored content, preserving only Markdown syntax. The client-side Markdown renderer (react-markdown) already handles rendering safely. DOMPurify (`isomorphic-dompurify` is already in `package.json`) should be used on the client render path.

### 1.2 Add Sanitization to Message Content
- **File**: `convex/messages.ts`
- **Why**: `sendMessage` mutation stores `content` raw without any sanitization call. If the chat UI renders this as Markdown/HTML, attackers can inject scripts via DMs.
- **Impact**: 🔴 Critical
- **Effort**: Small (< 1 hour)
- **Fix**: Apply the same sanitization function used for posts to message content before storage.

### 1.3 Tighten CORS Configuration
- **File**: `convex/http.ts`
- **Why**: `origin.endsWith(".vercel.app")` matches ANY `*.vercel.app` deployment. Any attacker with a Vercel account can make cross-origin requests to the API.
- **Impact**: 🟡 High
- **Effort**: Small (< 30 min)
- **Fix**: Replace wildcard check with exact project domain matching.

### 1.4 Upgrade Rate Limiter to Redis-Backed
- **File**: `src/lib/rate-limit.ts`
- **Why**: On Vercel serverless, each function invocation gets a fresh container. The in-memory rate limiter resets on every cold start, providing zero cross-instance protection. `@upstash/ratelimit` and `@upstash/redis` are already in dependencies but unused.
- **Impact**: 🟡 High
- **Effort**: Small (< 2 hours)
- **Fix**: Replace in-memory store with Upstash Redis. Preserve the same API surface (`checkRateLimit`) and rate limit tiers. Fall back to in-memory gracefully if Redis is unavailable.

### 1.5 Validate Media URLs Protocol
- **File**: `convex/posts.ts`
- **Why**: `mediaUrls` from post creation are stored as-is. Could store `javascript:`, `data:`, or arbitrary protocol URIs that execute code when rendered.
- **Impact**: 🟡 High
- **Effort**: Small (< 1 hour)
- **Fix**: Validate URL protocol against an allowlist (`https://` only) before storage.

### 1.6 Add Search Query Length Limits
- **File**: `convex/search.ts`
- **Why**: No limit on search query string length. Very long queries cause expensive Levenshtein distance calculations across 500+ records.
- **Impact**: 🟢 Medium
- **Effort**: Small (< 30 min)
- **Fix**: Reject queries > 200 characters.

---

## 2. Architecture Improvements

### 2.1 Add Bounded Query Limits
- **Files**: `convex/search.ts`, `convex/users.ts`, `convex/feed-ranking.ts`
- **Why**: Multiple endpoints use `.collect()` without limits or `.take(500)` full-table scans. At 10K users with active posting, these will cause Convex execution timeouts.
- **Impact**: 🟡 High
- **Effort**: Medium (1-2 days)
- **Fix**: Add `.take()` limits to all unbounded `.collect()` calls. Use index-based filtering instead of in-memory filtering where possible.

### 2.2 Fix Mention Resolution Full Table Scan
- **File**: `convex/posts.ts` (lines 227-232)
- **Why**: Unresolved `@mentions` fall back to `ctx.db.query("users").collect()` — O(n) scan of entire users table per unresolved mention. A post with 10 fake mentions = 10 full table scans.
- **Impact**: 🟢 Medium
- **Effort**: Small (< 1 hour)
- **Fix**: Remove the full-table fallback. If the username index lookup fails, skip the mention silently. Users should use valid `@usernames`.

### 2.3 Validate and Sanitize Cursor Parameters
- **Files**: `convex/posts.ts`, `convex/search.ts`, `convex/feed-ranking.ts`
- **Why**: `args.cursor as Id<"posts">` performs an unsafe cast. `parseInt(args.cursor, 10)` in search doesn't handle `NaN`. Malformed cursors cause unhandled errors.
- **Impact**: 🟢 Medium
- **Effort**: Small (< 2 hours)
- **Fix**: Wrap cursor resolution in try/catch. Return empty results for invalid cursors rather than throwing.

---

## 3. Database Improvements

### 3.1 Unify Validation Constants
- **Files**: `lib/validations.ts` (client), `convex/posts.ts`, `convex/users.ts`, `convex/messages.ts` (server)
- **Why**: Validation rules (max content length, bio length, etc.) are defined independently on client and server with potentially divergent values. `commentSchema` allows 2000 chars client-side but may differ server-side.
- **Impact**: 🟡 High
- **Effort**: Small (< 1 day)
- **Fix**: Create a shared `convex/validation-constants.ts` with all limits. Import in both client and server code.

### 3.2 Add Missing Index for Typing Indicator Cleanup
- **Why**: `typingIndicators` table has no TTL cleanup. Stale records accumulate indefinitely.
- **Impact**: 🔵 Low
- **Effort**: Small (< 1 hour)
- **Fix**: Add a cron job to clean up typing indicators older than 30 seconds.

---

## 4. Frontend UX Improvements

### 4.1 Add Toast Notification System
- **Why**: Mutations (bookmark, reaction, comment, error states) provide no visible user feedback. Industry standard (Twitter, LinkedIn, Instagram) uses toast/snackbar for every action.
- **Impact**: 🟡 High
- **Effort**: Small (< 1 day)
- **Fix**: Install `sonner` (2.2KB gzipped) or equivalent. Add `<Toaster>` to root layout. Wire up success/error toasts on key mutations.

### 4.2 Ensure Consistent Optimistic UI
- **Why**: Follows and likes have optimistic UI, but bookmarks and reactions may not. Inconsistent feedback creates UX jank.
- **Impact**: 🟢 Medium
- **Effort**: Medium (2-3 days)
- **Fix**: Audit all mutation-triggering components for optimistic state updates.

---

## 5. Authentication Improvements

### 5.1 Validate Social Link URLs Server-Side
- **File**: `convex/users.ts`
- **Why**: `sanitizeText()` HTML-encodes social link URLs, breaking valid URLs (e.g., `&` → `&amp;`). `isValidUrl()` from `lib/validations.ts` exists but is not imported server-side.
- **Impact**: 🟡 High
- **Effort**: Small (< 1 hour)
- **Fix**: Validate URLs with protocol allowlist (`https://`) and format check. Do NOT run `sanitizeText()` on URLs — use a dedicated URL validator.

---

## 6. DevOps Improvements

### 6.1 Add Dependency Security Scanning to CI
- **File**: `.github/workflows/ci.yml`
- **Why**: No `npm audit` step in CI. Vulnerable dependencies ship silently.
- **Impact**: 🟡 High
- **Effort**: Small (< 30 min)
- **Fix**: Add `npm audit --audit-level=high` step after install.

### 6.2 Add Test Coverage Threshold
- **File**: `.github/workflows/ci.yml`
- **Why**: CI uploads coverage reports but doesn't fail below a threshold. Coverage can silently regress.
- **Impact**: 🟢 Medium
- **Effort**: Small (< 30 min)
- **Fix**: Add `--coverageThreshold` flag to Jest command.

---

## 7. Performance Improvements

### 7.1 Cap All `.take()` and `.collect()` Calls
- **Why**: Even with indexes, unbounded collection is risky. A safety net prevents runaway queries.
- **Impact**: 🟡 High
- **Effort**: Small (< 2 hours)
- **Fix**: Audit all Convex queries. Replace `.collect()` with `.take(MAX)` where appropriate. Add comments documenting the rationale.

---

## 8. Code Quality Improvements

### 8.1 Remove `any` Types in Backend Helpers
- **Files**: `convex/messages.ts` (`getCurrentUser(ctx: any)`), `convex/users.ts` (`updates: any`)
- **Why**: `any` types bypass TypeScript safety, making refactoring risky and hiding bugs.
- **Impact**: 🟢 Medium
- **Effort**: Small (< 2 hours)
- **Fix**: Use proper Convex types: `QueryCtx`, `MutationCtx` from `convex/server`.

### 8.2 Add Log Level Filtering
- **Files**: `convex/logger.ts`, `src/lib/logger.ts`
- **Why**: `debug` logs emit unconditionally in production, potentially exposing internal state. No redaction of sensitive fields.
- **Impact**: 🔵 Low
- **Effort**: Small (< 2 hours)
- **Fix**: Add configurable minimum log level. Skip debug/info logs in production.

---

## Priority Summary

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 2 | XSS sanitization, message sanitization |
| 🟡 High | 7 | CORS, rate limiter, media URLs, query limits, validation unification, URL validation, CI security scanning |
| 🟢 Medium | 5 | Search limits, cursor safety, optimistic UI, `any` types, coverage threshold |
| 🔵 Low | 2 | Typing indicator cleanup, log level filtering |

**Estimated Total Effort**: 5-7 developer days for all improvements.
