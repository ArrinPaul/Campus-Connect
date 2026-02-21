# Database Backup & Recovery

## Overview

Campus Connect uses **Convex** as its backend database. Convex provides automatic, managed backups with point-in-time recovery capabilities. This document describes the backup architecture, restoration procedures, and quarterly testing protocol.

---

## 1. Automatic Backups (Enabled by Default)

Convex automatically handles database backups:

- **Continuous backups**: All mutations are logged and replayed for recovery
- **Snapshot backups**: Periodic full snapshots of the database state
- **Retention**: Backups are retained according to your Convex plan (Pro: 30 days, Enterprise: configurable)
- **No configuration required**: Backups are enabled automatically on all Convex deployments

### Verifying Backups

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select the **Campus Connect** project
3. Navigate to **Settings → Backups**
4. Confirm backup status shows "Active"

---

## 2. Backup Restoration Procedure

### When to Restore

- Accidental data deletion (e.g., `deleteUserFromWebhook` called incorrectly)
- Data corruption from a buggy migration
- Rollback after a failed deployment

### Step-by-Step Restoration

#### Option A: Point-in-Time Recovery (Preferred)

1. **Identify the target timestamp**
   - Check logs in Convex Dashboard → **Logs** tab
   - Identify the last known good state (before the issue)

2. **Contact Convex Support** (for Pro/Enterprise plans)
   ```
   Email: support@convex.dev
   Subject: Point-in-Time Recovery Request — Campus Connect
   
   Include:
   - Project ID (from Dashboard → Settings)
   - Deployment name (e.g., "production")
   - Target timestamp (ISO 8601 format, e.g., 2026-02-20T14:30:00Z)
   - Description of the issue
   ```

3. **Verify the restored data**
   - Run key queries to confirm data integrity
   - Check user counts, post counts, message counts
   - Verify recent user registrations are intact

#### Option B: Export & Re-import

1. **Export data from a snapshot**
   ```bash
   # Export all tables from a specific snapshot
   npx convex export --path ./backup-export
   ```

2. **Review the exported data**
   ```bash
   ls ./backup-export/
   # Should contain JSON files for each table
   ```

3. **Import into a new deployment for verification**
   ```bash
   # Create a staging deployment
   npx convex dev --once
   
   # Import the backup data
   npx convex import --path ./backup-export
   ```

4. **Swap deployments** (if verified)
   ```bash
   npx convex deploy
   ```

#### Option C: Manual Data Recovery

For recovering specific records (not full restore):

1. **Query the affected data in the Dashboard**
   - Use the Convex Dashboard → **Data** tab
   - Filter for the affected records

2. **Use a mutation to restore specific records**
   ```typescript
   // Run in Convex Dashboard → Functions → Run mutation
   // Example: Restore a deleted user
   await ctx.db.insert("users", {
     clerkId: "user_xxx",
     email: "user@example.com",
     name: "John Doe",
     // ... other fields from backup
   });
   ```

---

## 3. Point-in-Time Recovery Process

### Prerequisites

- Convex Pro or Enterprise plan
- Access to Convex Dashboard with admin permissions
- Knowledge of the target recovery timestamp

### Process

1. **Stop all writes** (if possible)
   - Put the app in maintenance mode
   - Disable webhook endpoints temporarily
   
2. **Request recovery** through Convex Dashboard or support

3. **Verify data consistency**
   ```bash
   # Run the test suite against the recovered deployment
   npx convex dev --once
   npx jest --testPathPattern=convex
   ```

4. **Resume normal operations**
   - Re-enable webhook endpoints
   - Clear any client-side caches
   - Monitor error rates in Sentry

---

## 4. Quarterly Backup Testing Protocol

### Schedule

| Quarter | Test Date    | Responsible     |
|---------|-------------|-----------------|
| Q1      | March 15    | Lead Developer  |
| Q2      | June 15     | Lead Developer  |
| Q3      | September 15| Lead Developer  |
| Q4      | December 15 | Lead Developer  |

### Test Procedure

1. **Create a test snapshot**
   ```bash
   npx convex export --path ./quarterly-backup-test-$(date +%Y%m%d)
   ```

2. **Verify export integrity**
   - Confirm all expected tables are present
   - Check JSON files are valid and non-empty
   - Verify record counts match production

3. **Test import to staging**
   ```bash
   # Set up a staging deployment
   CONVEX_DEPLOYMENT=staging npx convex import --path ./quarterly-backup-test-*
   ```

4. **Run verification queries**
   - Users table: count matches production
   - Posts table: recent posts are present
   - Messages table: conversation threads are intact
   - Follows table: relationships are preserved

5. **Document results**
   - Record pass/fail status
   - Note any issues encountered
   - Update this document if procedures change

6. **Clean up**
   ```bash
   rm -rf ./quarterly-backup-test-*
   ```

### Test Log

| Date | Status | Notes | Tester |
|------|--------|-------|--------|
| _TBD_ | _Pending_ | _First quarterly test_ | _—_ |

---

## 5. Disaster Recovery Checklist

In case of a major incident:

- [ ] Identify the scope of data loss/corruption
- [ ] Determine the last known good timestamp
- [ ] Notify the team via Slack/Discord
- [ ] Put the app in maintenance mode (update Vercel env)
- [ ] Initiate point-in-time recovery
- [ ] Verify data integrity post-recovery
- [ ] Run full test suite
- [ ] Resume normal operations
- [ ] Write post-mortem report
- [ ] Update backup procedures if needed

---

## 6. Environment-Specific Backup Strategy

| Environment | Backup Frequency | Retention | Recovery SLA |
|-------------|-----------------|-----------|--------------|
| Production  | Continuous      | 30 days   | < 4 hours    |
| Staging     | On-demand       | 7 days    | Best effort  |
| Development | None            | N/A       | N/A          |

---

## Contacts

- **Convex Support**: support@convex.dev
- **Convex Status Page**: https://status.convex.dev
- **Convex Docs (Backup)**: https://docs.convex.dev/database/backup-restore
