# DEVELOPMENT GUIDE

## 1. Local Environment Setup

### Prerequisites
- Node.js (v18.17.0 or higher)
- npm (v9.x or higher)
- Git
- Docker Desktop (Required for local Supabase stack)
- Supabase CLI (
pm install -g supabase-cli)

### Installation Steps
1. **Clone the repository:**
   \\\ash
   git clone <repo-url>
   cd campus-connect
   \\\
2. **Install dependencies:**
   \\\ash
   npm install
   \\\
3. **Environment Configuration:**
   Copy the example environment file:
   \\\ash
   cp .env.example .env.local
   \\\
   *Note: Never commit .env.local. Obtain development keys from the team password manager.*

## 2. Local Database (Supabase)
To run the full backend locally without affecting production:
1. Start the local Supabase stack:
   \\\ash
   supabase start
   \\\
2. Apply migrations (if any are pending):
   \\\ash
   supabase migration up
   \\\
3. Seed the database with mock data:
   \\\ash
   supabase db reset
   \\\

## 3. Starting the Application
Run the Next.js development server:
\\\ash
npm run dev
\\\
The app will be available at http://localhost:3000.

## 4. Testing & Quality Assurance
Campus Connect enforces strict quality gates.

### Unit & Integration Tests (Jest)
Run the test suite (63 suites, 547 tests):
\\\ash
npm run test
# Run in watch mode during development
npm run test:watch 
\\\

### End-to-End Tests (Playwright)
Run browser tests:
\\\ash
npx playwright test
# View UI report
npx playwright show-report
\\\

### Static Analysis
Ensure there are zero type or linting errors before pushing:
\\\ash
npm run type-check
npm run lint
\\\

## 5. Development Workflow & Git Standards
- **Branch Naming:** Use eature/<name>, ugfix/<name>, or chore/<name>.
- **Commits:** Follow conventional commits (e.g., eat: add realtime chat, ix: resolve RLS policy bug).
- **PRs:** All Pull Requests must pass the GitHub Actions CI pipeline. Reviewers will check for test coverage and RLS security.

## 6. Common Troubleshooting
- **Realtime not working locally?** Run supabase status to ensure the Realtime container is healthy. Check your NEXT_PUBLIC_SUPABASE_URL in .env.local.
- **Stripe Webhooks failing?** Use the Stripe CLI to forward events to your localhost: stripe listen --forward-to localhost:3000/api/subscriptions/webhook.
- **Type errors after DB changes?** Regenerate the Supabase types: 
pm run update-types.
