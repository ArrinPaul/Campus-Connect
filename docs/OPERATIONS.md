# PRODUCTION OPERATIONS & RUNBOOK

## 1. Production Topology
- **Frontend Hosting:** Vercel (Edge Network)
- **Database:** Supabase Managed PostgreSQL 15 (AWS / specific region)
- **Caching:** Upstash Redis (Serverless)
- **Media Storage:** Supabase Storage (S3 backend)

## 2. Deployment Procedures
- deployments are **fully automated** via GitHub Actions.
- Merging to the main branch triggers a production build on Vercel.
- Database migrations are automatically applied during the CI/CD pipeline via the Supabase GitHub Action before the Vercel build finalizes.

## 3. Rollbacks & Disaster Recovery

### Frontend Rollbacks
If a production UI bug is detected:
1. Navigate to the Vercel Dashboard.
2. Go to the **Deployments** tab.
3. Locate the previous stable deployment.
4. Click **Instant Rollback**. (This takes < 2 seconds).

### Database Rollbacks (PITR)
If a destructive database mutation occurs:
1. Campus Connect utilizes Supabase Point-in-Time Recovery (PITR).
2. Navigate to the Supabase Dashboard -> Database -> Backups -> PITR.
3. Select the exact minute before the destructive event occurred and initiate a restore.

## 4. Incident Response & Troubleshooting

### Scenario: Upstash Redis Outage (Rate Limiting Fails)
- **Impact:** High traffic APIs may be overwhelmed.
- **Fallback:** The application is configured to fall back to in-memory Next.js rate limiting if the Redis connection times out. 
- **Action:** Monitor Vercel logs. No manual intervention is typically required unless the fallback also fails, in which case Vercel Edge caching can be aggressively bumped.

### Scenario: Stripe Webhook Failures
- **Impact:** User subscriptions/payments are processed by Stripe but not reflected in the DB.
- **Action:** 
  1. Open the Stripe Dashboard -> Developers -> Webhooks.
  2. Filter by Failed.
  3. Click **Resend**. The endpoints are fully idempotent and will process the missed event safely.

### Scenario: Unhandled Exceptions Spiking
- **Impact:** Users experiencing crashes.
- **Action:** 
  1. Open Sentry Dashboard.
  2. Identify the exact commit that introduced the spike.
  3. Perform a Vercel Instant Rollback (see Section 3).

## 5. Security & Access Management
- **Secret Rotation:** Production .env variables (Stripe keys, OpenAI keys) must be rotated every 90 days. Update them simultaneously in Vercel and the Supabase Dashboard.
- **Production Access:** Direct database access is restricted via IP allow-listing and requires MFA authentication through the Supabase Admin interface.
