# Campus Connect

A full-stack social media and academic platform designed for college students — WhatsApp + Facebook + Discord + LinkedIn combined.

---

## Tech Stack

- **Next.js 14** (`14.2.25`) — App Router, Route Handlers, Edge Middleware
- **React 18** (`18.3.1`) + **TypeScript 5** — Strict mode with zero type errors
- **Tailwind CSS 3** — Custom Meta/Facebook design system (see `meta/DESIGN.md`)
- **Radix UI** — Accessible component primitives (dialogs, dropdowns, tooltips, tabs)
- **TipTap + KaTeX** — Rich text editor with LaTeX math formula rendering and code blocks
- **Supabase** — PostgreSQL database (37 tables, 119 RLS policies), SSR Auth, Storage, and Realtime
- **TanStack React Query 5** — Declarative server-state caching and synchronization
- **Zustand 5** — Client-side UI state management
- **Zod 4** — Runtime request and form validation
- **Sentry & PostHog** — Error monitoring and telemetry

---

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Fill in your Supabase project credentials in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests & Diagnostics

```bash
# Run unit & component test suite (426 tests)
npm test

# Typecheck codebase
npm run type-check

# Run linter
npm run lint
```

---

## Project Structure

```
src/
  app/
    api/              # 167 API Route Handlers (113 active, 54 stubs)
    (auth)/           # Authentication pages (Sign-In, Sign-Up)
    (onboarding)/     # 3-step profile onboarding wizard
    (dashboard)/      # 26 Dashboard sub-features (Feed, Chat, Events, Jobs, Q&A, etc.)
  components/
    ui/               # Accessible Radix primitives
    posts/            # PostCard, PostComposer, CommentList, ReactionPicker, PollCard
    feed/             # FeedContainer, VirtualizedFeed, InfiniteScrollTrigger
    messages/         # ChatWindow, ChatInput, MessageBubble, TypingIndicator
    communities/      # CommunityCard, InviteMemberModal
    profile/          # ProfileHeader, SkillsManager, FollowersList
    navigation/       # DesktopSidebar, MobileBottomNav, MobileNav
  hooks/              # Custom hooks (useRealtimeMessages, useRealtimeFeed, useHeartbeat, useWebRTC)
  lib/
    supabase/         # Supabase clients (client, server, middleware, admin)
    api.ts            # Typed frontend API query/mutation client
    validations.ts    # Zod validation schemas
  server/
    db/               # 13 Server-only database modules interfacing with Supabase
```

---

## Documentation

- [`AUDIT.md`](./AUDIT.md) — Comprehensive forensic audit report (~78% completion status)
- [`PROJECT_PROFILE.md`](./PROJECT_PROFILE.md) — Architectural overview and stack profile
- [`meta/DESIGN.md`](./meta/DESIGN.md) — Design system specification and token dictionary
- [`docs/FEATURES.md`](./docs/FEATURES.md) — Feature catalog with verified statuses
- [`docs/PLAN.md`](./docs/PLAN.md) — Technical plan and phase roadmap
- [`docs/TASKS.md`](./docs/TASKS.md) — Granular implementation task checklist
- [`docs/TRACKER.md`](./docs/TRACKER.md) — Progress tracking and feature breakdown
