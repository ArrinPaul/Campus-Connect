# Security Hardening Audit

## Overview

This document tracks all security measures implemented in Campus Connect and serves as
the reference for periodic security reviews.

Last audit date: **February 2026**

---

## 1. Security Headers ✅

All headers configured in `next.config.js`:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Strict allow-list | Prevents XSS, data injection, clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME-type sniffing |
| X-Frame-Options | DENY | Prevents clickjacking |
| X-DNS-Prefetch-Control | on | Performance (safe) |
| Referrer-Policy | strict-origin-when-cross-origin | Limits referrer leakage |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | Forces HTTPS |
| Permissions-Policy | camera=(), microphone=(), etc. | Restricts browser features |
| X-Permitted-Cross-Domain-Policies | none | Prevents Flash/PDF cross-domain reads |

### CSP Directives

- `default-src 'self'` — Deny everything by default
- `script-src` — Only self, Clerk, Cloudflare challenges
- `style-src` — Self + Google Fonts (inline for Tailwind)
- `img-src` — Self, Convex CDN, Clerk, Unsplash
- `connect-src` — Self, Convex, Clerk, PostHog, Sentry
- `frame-src` — Only Clerk and Cloudflare
- `object-src 'none'` — No plugins
- `frame-ancestors 'none'` — No embedding
- `upgrade-insecure-requests` — Force HTTPS for all sub-resources

---

## 2. CORS Configuration ✅

Configured in `convex/http.ts`:

- Allow-list of specific origins (production domains + Vercel preview deploys)
- Development-only localhost origins
- Preflight (OPTIONS) handler with max-age caching
- CORS headers on all HTTP action responses

---

## 3. Input Sanitization ✅

### Server-side (Convex)

- `sanitizeText()` — Strips all HTML tags, event handlers, protocols; HTML-encodes output
- `sanitizeMarkdown()` — Strips XSS vectors while preserving markdown syntax
- Applied to all user-generated content before storage

### Property-based fuzz testing

| Test File | Tests | Vectors Covered |
|-----------|-------|-----------------|
| `sanitize.property.test.ts` | 7 | Script tags, event handlers, protocols, iframes, idempotency |
| `security-fuzz.property.test.ts` | 16 | Encoding bypasses, mixed-case evasion, null bytes, all event handlers, protocol variants, dangerous tags, unicode, long inputs, markdown XSS |

---

## 4. CSRF Protection ✅

Implemented in `src/lib/csrf.ts`:

- **Origin verification** — Validates Origin/Referer headers against allow-list
- **Double-submit cookie pattern** — CSRF token in both cookie and header
- **Constant-time comparison** — Prevents timing attacks on token validation
- **Safe method bypass** — GET, HEAD, OPTIONS are exempt
- **Webhook exemption** — `/api/webhooks/*` use signature verification instead

### Integration points

- Clerk-authenticated routes have built-in CSRF via session tokens
- Custom API routes should use `checkCsrf()` middleware
- Webhook routes use Svix signature verification (separate mechanism)

---

## 5. Authentication & Authorization ✅

- **Clerk** — Handles authentication, session management, OAuth
- **Middleware protection** — All non-public routes require auth via `clerkMiddleware`
- **Server-side auth checks** — Convex mutations verify `ctx.auth.getUserIdentity()`
- **Property-based tests** — `auth.property.test.ts`, `auth-enforcement.property.test.ts`, `authorization.property.test.ts`

---

## 6. CAPTCHA Integration

**Status**: Ready for implementation. Recommended: **Cloudflare Turnstile** (free, privacy-respecting).

### Implementation steps:
1. Sign up at https://dash.cloudflare.com/turnstile
2. Add site key to `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
3. Add secret to `TURNSTILE_SECRET_KEY`
4. Integrate `<Turnstile>` widget in sign-up form
5. Verify token server-side before account creation

> Note: Clerk handles sign-up flow, so CAPTCHA should be added at either:
> - The Clerk sign-up page (via Clerk's bot protection features)
> - A pre-registration form before redirecting to Clerk

---

## 7. Error Handling ✅

- **Sentry** — Server, client, and edge error capture
- **Global error boundary** — `src/app/global-error.tsx` with Sentry reporting
- **Component error boundary** — `src/components/error-boundary.tsx` with Sentry capture
- **No sensitive data in errors** — PII masking in Sentry Replay, logger redacts sensitive fields

---

## 8. Dependency Security

### Recommended periodic actions:
- Run `npm audit` monthly and fix critical/high vulnerabilities
- Use `npm audit fix` for compatible updates
- Review Dependabot alerts (if GitHub repo has it enabled)
- Pin major versions of security-critical packages

---

## 9. Security Review Checklist

Use this checklist quarterly or before major releases:

- [ ] Run `npm audit` and address high/critical issues
- [ ] Review CSP for new external resources
- [ ] Verify all user inputs go through sanitization
- [ ] Check Sentry for recurring error patterns
- [ ] Review Clerk security logs for suspicious auth activity
- [ ] Verify webhook signature validation is working
- [ ] Run property-based security fuzz tests: `npx jest security-fuzz`
- [ ] Check for new OWASP Top 10 vectors
- [ ] Review and rotate any API keys/secrets

---

## 10. External Security Audit

### When to hire an external firm:
- Before launch with real user data
- After implementing payment processing
- Annually for compliance requirements

### Recommended automated tools:
- **OWASP ZAP** — Free, comprehensive web scanner
- **Snyk** — Dependency and code vulnerability scanning
- **Lighthouse** — Security audit tab for headers/HTTPS
- **Mozilla Observatory** — HTTP header analysis
