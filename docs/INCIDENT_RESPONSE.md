# CAMPUS CONNECT — INCIDENT RESPONSE & DISASTER RECOVERY

---

## 1. Severity Levels
- **SEV-1 (Critical)**: Application down, auth unavailable, database inaccessible.
- **SEV-2 (High)**: Core features impaired (feed posting failing, WebRTC calls broken, payments failing).
- **SEV-3 (Medium)**: Optional features degraded (push notifications failing, analytics latency).
- **SEV-4 (Low)**: Minor cosmetic issues, single non-critical endpoint returning 500.

---

## 2. Emergency Recovery Steps
1. **Database Probe**: Check `GET /api/health/ready` for connection status.
2. **Rollback**: In Vercel / CI, redeploy previous green commit tag if regression detected.
3. **Database Restore**: Restore latest point-in-time backup from Supabase dashboard.
4. **Cache Flush**: Call `appCache.clear()` or flush Upstash Redis keys if corrupt cache entries occur.
