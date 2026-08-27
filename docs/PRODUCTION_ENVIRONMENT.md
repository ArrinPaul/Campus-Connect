# CAMPUS CONNECT — PRODUCTION ENVIRONMENT SPECIFICATION

**Version:** 1.0.0 (Phase 7 Certified)

---

## 1. Environment Variable Matrix

| Variable | Scope | Required in Prod | Description |
|---|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | **YES** | Supabase Project API Gateway URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | **YES** | Supabase Anonymous Client Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **YES** | Admin service role key for atomic server operations |
| `DATABASE_URL` | Server Only | **YES** | PostgreSQL pooled connection string for migrations |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public / Client | **YES** | Web Push VAPID public application server key |
| `VAPID_PRIVATE_KEY` | Server Only | **YES** | Web Push VAPID private signing key |
| `VAPID_SUBJECT` | Server Only | **YES** | Mailto or URL identity for push service |
| `STRIPE_SECRET_KEY` | Server Only | Optional | Stripe Live Secret Key (defaults to Mock in dev/test) |
| `STRIPE_WEBHOOK_SECRET` | Server Only | Optional | Stripe Webhook signing secret (`whsec_...`) |
| `UPSTASH_REDIS_REST_URL` | Server Only | Optional | Upstash Redis REST URL (falls back to memory if unset) |
| `UPSTASH_REDIS_REST_TOKEN` | Server Only | Optional | Upstash Redis REST Token |
| `OPENAI_API_KEY` | Server Only | Optional | OpenAI API key for live vector embeddings |
| `NEXT_PUBLIC_SENTRY_DSN` | Public / Client | Optional | Sentry DSN for production error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public / Client | Optional | PostHog project API key for product analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public / Client | Optional | PostHog ingest URL (default: `https://app.posthog.com`) |

---

## 2. Secrets & Security Guarantees
- Zero secrets committed to git or printed in logs.
- Private keys (`VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) must never be prefixed with `NEXT_PUBLIC_`.
- Sensitive fields in logs are recursively sanitized via `scrubSensitiveData`.
