# Branch Protection Rules

Apply these rules to the `main` branch in **Settings → Branches → Branch protection rules**.

## Required Settings

### Require a pull request before merging
- [x] Require approvals — **minimum 1**
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require review from Code Owners (once `CODEOWNERS` is added)

### Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- Required checks:
  - `build` (Next.js build)
  - `test` (Jest test suite)
  - `lint` (ESLint)
  - `typecheck` (TypeScript `tsc --noEmit`)

### Additional protections
- [x] Require signed commits — *optional, recommended*
- [x] Require linear history (enforces rebase/squash merges)
- [x] Do not allow bypassing the above settings (applies to admins too)
- [x] Restrict who can push to matching branches — only release bots / admins

---

## Setup via GitHub CLI

```bash
# Authenticate first
gh auth login

# Apply branch protection (adjust org/repo as needed)
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build", "test", "lint", "typecheck"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

## CODEOWNERS (optional)

Create `.github/CODEOWNERS` to assign automatic reviewers:

```
# Default owners for everything
*       @your-team

# Backend
/convex/ @backend-team

# Frontend
/src/    @frontend-team
```
