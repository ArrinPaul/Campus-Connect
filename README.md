# Campus Connect

A social media platform for college students — WhatsApp + Facebook + Discord + LinkedIn combined.

## Tech Stack

- **Next.js 14** — App Router, API routes
- **React 18 + TypeScript** — Strict mode
- **Tailwind CSS** — Meta/Facebook design system (see DESIGN.md)
- **Radix UI** — 21 accessible component primitives
- **TipTap** — Rich text editor with markdown, mentions, code blocks
- **Supabase** — PostgreSQL database, auth, storage, realtime
- **TanStack React Query** — Server state management
- **Zustand** — Client state management
- **Zod** — Runtime validation
- **Sentry** — Error monitoring
- **PostHog** — Analytics

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in Supabase keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/
    api/              # API routes (rewriting for Supabase)
    (auth)/           # Sign in, sign up
    (onboarding)/     # Multi-step profile setup
    (dashboard)/      # 26 feature pages
  components/
    ui/               # 21 Radix primitives
    posts/            # PostCard, PostComposer, etc.
    feed/             # FeedContainer, VirtualizedFeed
    messages/         # ChatArea, ConversationList
    communities/      # CommunityCard, etc.
    profile/          # ProfileHeader, SkillsManager
    navigation/       # GlobalNav, MobileNav
    ...etc
  lib/
    supabase/         # Supabase client (NEW)
    api.ts            # Typed API client
    auth/             # Auth hooks
    validations.ts    # Zod schemas
```

## Documentation

- `DESIGN.md` — Design system (source of truth for all UI)
- `docs/PLAN.md` — Project roadmap
- `docs/FEATURES.md` — All 240 features listed
- `docs/TASKS.md` — Task breakdown
- `docs/TRACKER.md` — Progress tracking
