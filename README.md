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

- [`docs/SYSTEM_ARCHITECTURE.md`](./docs/SYSTEM_ARCHITECTURE.md) — Single source of truth for technical architecture, database design, and system overview.
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — Developer onboarding, setup instructions, testing workflow, and code quality standards.
- [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) — Production operations, deployment, incident response, and monitoring guides.
- [`docs/PHASE_8_FINAL_REPORT.md`](./docs/PHASE_8_FINAL_REPORT.md) — Final production certification baseline report.
- [`meta/DESIGN.md`](./meta/DESIGN.md) — Design system specification and token dictionary.
