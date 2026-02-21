# Backup Strategy Documentation

## Overview
Automated daily backups of the Convex database using GitHub Actions, with 30-day retention and manual trigger capability.

## Setup Instructions

### 1. Generate Convex Deploy Key

1. Navigate to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project (Campus Connect)
3. Go to **Settings** → **Deploy Keys**
4. Click **Generate Deploy Key**
5. Copy the generated key (starts with `prod:`)

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CONVEX_DEPLOY_KEY`
5. Value: Paste the deploy key from step 1
6. Click **Add secret**

### 3. Enable Workflow

The workflow is already committed to `.github/workflows/backup.yml` and will:
- Run automatically at 2 AM UTC daily
- Can be triggered manually from the Actions tab

## Backup Schedule

- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Storage**: GitHub Actions Artifacts
- **File Format**: ZIP archive containing JSON exports of all tables

## Manual Backup

### Via GitHub Actions UI

1. Go to **Actions** tab in GitHub
2. Select **Database Backup** workflow
3. Click **Run workflow** dropdown
4. Click **Run workflow** button

### Via Command Line (Local)

```bash
# Export from production
npx convex export

# Output: backup.zip in current directory
```

To export from development:
```bash
npx convex export --path ./backup-dev-$(date +%Y%m%d).zip
```

## Restoring from Backup

### 1. Download Backup

**From GitHub:**
1. Go to **Actions** → **Database Backup** → Select a workflow run
2. Download the artifact ZIP file
3. Extract the backup ZIP inside

**From Local:**
Use the exported ZIP file directly

### 2. Import Data

⚠️ **WARNING: This will overwrite existing data!**

```bash
# Preview what will be imported (dry run)
npx convex import --dry-run --path ./backup-20240101.zip

# Import to development
npx convex import --path ./backup-20240101.zip

# Import to production (requires confirmation)
npx convex import --prod --path ./backup-20240101.zip
```

### 3. Verify Import

```bash
# Check table counts
npx convex run users:count
npx convex run posts:count
npx convex run comments:count
```

## Backup Contents

Each backup includes JSON exports of all tables:
- `users` - User profiles and authentication data
- `posts` - All posts with content and media references
- `comments` - Comment threads
- `reactions` - Likes and other reactions
- `bookmarks` - Saved posts
- `follows` - Follow relationships
- `messages` - Direct messages and group chats
- `conversations` - Conversation metadata
- `notifications` - User notifications
- `stories` - Temporary stories
- `polls` - Poll data and votes
- `communities` - Community data and memberships
- `events` - Event listings and RSVPs
- `marketplace` - Marketplace listings
- `jobs` - Job postings
- `papers` - Research papers
- `resources` - Study resources
- `questions` - Q&A forum questions
- All other application tables

## Storage Media References

⚠️ **Important**: Backups contain references (storage IDs) to media files, not the actual files themselves.

### Media Backup Strategy

Media files are stored in Convex File Storage and are:
1. **Automatically replicated** across multiple availability zones
2. **Permanently stored** with 99.999999999% durability
3. **Accessible via storage IDs** in the database backup

If you need to backup actual media files:

```bash
# List all storage files
npx convex run _storage:list

# Download individual files (requires custom script)
# See: https://docs.convex.dev/file-storage/serve-files
```

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

1. Identify the last good backup (check GitHub Actions artifacts)
2. Download the backup
3. Import to a **development** environment first for verification
4. After verification, import to production

**Timeline**: ~15-30 minutes

### Scenario 2: Complete Database Loss

1. Deploy fresh Convex project
2. Update environment variables
3. Import latest backup
4. Verify all critical tables and counts
5. Test authentication and core features

**Timeline**: ~1-2 hours

### Scenario 3: Partial Data Corruption

1. Export current state for comparison
2. Download last known good backup
3. Import to temporary environment
4. Use Convex CLI to selectively move data
5. Verify integrity before production deployment

**Timeline**: ~2-4 hours

## Monitoring

### Check Backup Status

1. Go to GitHub Actions tab
2. View **Database Backup** workflow runs
3. Green checkmark = successful backup
4. Red X = failed backup (check logs)

### Backup Success Indicators

- ✅ Workflow completes without errors
- ✅ Artifact uploaded successfully
- ✅ Backup file size > 0 bytes
- ✅ File size is within expected range (grows with data)

### Alert Setup (Optional)

**GitHub Actions email notifications:**
1. Go to **Settings** → **Notifications**
2. Enable **Actions** notifications
3. You'll receive email if backup fails

**Slack integration:**
Add to `.github/workflows/backup.yml`:
```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "❌ Database backup failed!",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Database backup failed. Check <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|workflow logs>."
            }
          }
        ]
      }
```

## Cost Analysis

### GitHub Actions

- **Free tier**: 2,000 minutes/month
- **Backup duration**: ~2-5 minutes
- **Daily runs**: 30 minutes/month
- **Cost**: $0 (well within free tier)

### Artifact Storage

- **Free tier**: 500 MB
- **Estimated backup size**: 5-50 MB (depending on data volume)
- **30-day retention** x **daily backups** = 150-1,500 MB total
- **Cost**: $0 for first 500 MB, then $0.008/GB/month

**Projected monthly cost at 10K users**: ~$0-2

## Compliance

### GDPR

✅ Backups support GDPR compliance:
- User data can be deleted and excluded from future backups
- Exports can be provided to users (see GDPR tools)
- Retention policy (30 days) is documented

### Data Protection

- Backups stored in GitHub (US/EU)
- Encrypted in transit (HTTPS)
- Encrypted at rest (GitHub encryption)
- Access controlled via GitHub permissions

## Testing Backups

**Quarterly verification recommended:**

```bash
# 1. Trigger manual backup
# (via GitHub Actions UI)

# 2. Download latest backup

# 3. Import to dev environment
npx convex import --path ./backup-latest.zip

# 4. Query random samples
npx convex run users:list --limit 10
npx convex run posts:list --limit 10

# 5. Verify counts match production
```

## Troubleshooting

### Backup Fails with "Authentication Error"

**Cause**: Invalid or expired `CONVEX_DEPLOY_KEY`

**Solution**:
1. Generate new deploy key in Convex Dashboard
2. Update GitHub secret
3. Re-run workflow

### Backup File Size is 0 Bytes

**Cause**: Export command failed silently

**Solution**:
1. Check workflow logs for errors
2. Verify Convex CLI is installed correctly
3. Confirm deploy key has export permissions

### Import Fails with Schema Mismatch

**Cause**: Backup from older schema version

**Solution**:
Use migration scripts or selective import:
```bash
# Import only specific tables
npx convex import --tables users,posts --path ./backup.zip
```

### Cannot Download Artifact

**Cause**: Artifact expired (>30 days)

**Solution**:
1. Trigger new manual backup
2. If critical, contact Convex support for assistance
3. Consider increasing retention days in workflow

## Future Enhancements

**Phase 2 (10K-100K users):**
- [ ] Upload backups to S3/Google Cloud Storage
- [ ] Implement point-in-time recovery
- [ ] Add backup encryption with AWS KMS
- [ ] Set up automated restore testing
- [ ] Create backup dashboard/monitoring

**Phase 3 (100K+ users):**
- [ ] Multi-region backup replication
- [ ] Incremental backups
- [ ] Backup compression optimization
- [ ] Compliance audit logs

## Resources

- [Convex Export Documentation](https://docs.convex.dev/production/cli#export)
- [Convex Import Documentation](https://docs.convex.dev/production/cli#import)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Deploy Keys](https://docs.convex.dev/production/hosting/deploy-keys)

## Support

**Questions?**
- Convex Discord: https://convex.dev/community
- GitHub Issues: [Create issue](../../issues/new)
- Email: support@yourapp.com
