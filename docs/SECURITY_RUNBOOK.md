# CAMPUS CONNECT — SECURITY RUNBOOK

---

## 1. Authentication & Session Validation
- All private routes under `/api/` enforce `const { data: { user } } = await supabase.auth.getUser()`.
- Client-supplied `user_id` or `author_id` in request bodies are ignored in favor of the authenticated `user.id`.

---

## 2. Distributed Rate Limiting
- Configured with Upstash Redis with local in-memory fallback.
- Enforces sliding-window limits and responds with HTTP 429 and `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.

---

## 3. Row Level Security (RLS)
- 100% of tables (44/44) have RLS enabled.
- User data mutations restricted to resource owners.

---

## 4. Payment Security & Webhook Idempotency
- Stripe webhook signature verification with replay prevention.
- Processed event IDs recorded in table `subscription_events` to ensure strict once-only execution.
