# CAMPUS CONNECT — OBSERVABILITY & MONITORING RUNBOOK

---

## 1. Structured Logging
Campus Connect emits JSON structured logs on server execution and pretty-printed logs in browser development:
```typescript
import { createLogger } from "@/lib/logger"
const log = createLogger("Messaging")
log.info("Direct message sent", { conversationId: "c-123" })
```
- **Sensitive Data Redaction**: Keys matching `password`, `token`, `secret`, `authorization`, `cookie`, `apiKey`, `service_role`, `card` are replaced with `"[REDACTED]"`.

---

## 2. Error Monitoring (Sentry)
- **Client & Server Exception Capture**: Automatically forwards unhandled exceptions and logger error calls to Sentry.
- **Scope & Tagging**: Errors tagged with `logger.scope` and scrubbed contextual metadata.

---

## 3. Product Analytics (PostHog)
- **Typed Event Tracking**:
```typescript
import { analytics } from "@/lib/analytics"
analytics.track("post_created", { postId: "p-1" })
analytics.identify(userId, { university: "MIT" })
```
- **Fail-safe Operation**: Analytics operations catch and swallow transport errors so core student interactions are never interrupted.
