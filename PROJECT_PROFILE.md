# Campus Connect — Project Profile

This document outlines the stack, architecture, and current verified state of the **Campus Connect** project.

---

## 1. Stack Profile

*   **Framework**: Next.js 14.2.25 (App Router, React 18.3.1, TypeScript 5)
*   **Database & Auth**: Supabase PostgreSQL + Supabase SSR Auth (`@supabase/ssr` 0.12.0 / `@supabase/supabase-js` 2.110.2)
*   **Realtime Services**: Supabase Realtime Channels (`postgres_changes`, `broadcast`, and `presence` for chat, feed invalidation, and typing indicators)
*   **State Management**:
    *   *Server State*: TanStack React Query (`@tanstack/react-query` 5.90.21) via `@/lib/api.ts`
    *   *Client/UI State*: Zustand (`zustand` 5.0.11)
*   **Styling (CSS)**: Tailwind CSS 3.4.1 following a customized Meta/Facebook design system (tokens defined in `meta/DESIGN.md` and configured in `tailwind.config.ts`)
*   **UI Primitives**: Radix UI (21 component primitives) and TipTap for rich text editing with KaTeX LaTeX rendering and code syntax highlighting
*   **Ratelimiting/Redis**: Hybrid Upstash Redis client with in-memory TTL Map fallback for zero-latency caching (`user:*`, `is_following:*`) + middleware IP rate limiter (120 req/min)
*   **Validation**: Zod (`zod` 4.3.6) + `react-hook-form` 7.71.1
*   **Monitoring & Analytics**: Sentry (`@sentry/nextjs` 10.56.0) and PostHog (`posthog-js` 1.352.0)
*   **Testing**: Jest 30.2.0, Testing Library, and `fast-check` for property-based testing

---

## 2. Architecture & Directory Structure

```
campus-connect/
├── public/                 # Static assets (icons, PWA manifest, service worker)
├── supabase/               # Supabase database config & migrations
│   └── migrations/         # Init SQL migration (37 tables, 27 indexes, 119 RLS policies)
├── src/
│   ├── app/                # App Router Pages & API Routes
│   │   ├── (auth)/         # Auth flow pages (Sign in, Sign up)
│   │   ├── (dashboard)/    # Dashboard layout and 26 feature subpages
│   │   ├── (onboarding)/   # 3-step profile setup wizard
│   │   ├── api/            # 167 Route Handlers (113 active, 54 stubs)
│   │   └── globals.css     # Global CSS styles and design tokens
│   ├── components/         # React Component Library
│   │   ├── ui/             # Radix-based accessible UI primitives
│   │   ├── posts/          # Post cards, creation composer, reposts, bookmarks, polls
│   │   ├── feed/           # Virtualized feed, main feed containers
│   │   ├── messages/       # Chat window, conversation list, typing indicators
│   │   ├── profile/        # Skills managers, profile headers, endorsements
│   │   └── navigation/     # Desktop sidebar, mobile bottom nav, mobile drawer
│   ├── hooks/              # Custom hooks (useRealtimeMessages, useRealtimeFeed, useHeartbeat, useWebRTC)
│   ├── lib/                # Shared utilities & configurations
│   │   ├── supabase/       # Supabase client instantiation (client, server, middleware, admin)
│   │   ├── api.ts          # Typed client API query/mutation layer
│   │   ├── validations.ts  # Zod runtime schemas
│   │   ├── logger.ts       # Structured logger with Sentry integration
│   │   └── utils.ts        # Helper functions & Tailwind merge
│   ├── server/             # Backend operations
│   │   └── db/             # 13 Data access modules using Supabase server client
│   └── types/              # Global TypeScript declarations
```

---

## 3. Purpose & Domain

**Campus Connect** is a unified social platform designed for college students, merging WhatsApp (DMs, group chats, realtime presence, typing indicators), Facebook (feed posts, comments, reactions, campus communities/events, marketplace), Discord (channels, member roles), and LinkedIn (professional profiles, skills management, job postings, academic papers/study resources).

---

## 4. Data Layer & Auth

*   **Database Schema**: 37 tables in Supabase PostgreSQL spanning users, follows, posts, comments, reactions, conversations, messages, communities, events, jobs, stories, notifications, bookmarks, resources, research papers, and polls.
*   **Auth Strategy**: Supabase SSR Authentication integrated with cookies. The session is refreshed securely via middleware (`src/middleware.ts` + `src/lib/supabase/middleware.ts`) on every request, with soft-delete checks and route guards.
*   **Environment Variables (`.env.local`)**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public browser access key.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Service role API key to bypass RLS in background/admin tasks.
    *   `NEXT_PUBLIC_API_URL`: Root URL of the app API (`http://localhost:3000`).
    *   `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`: Product analytics.
    *   `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`: Error monitoring.
    *   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`: Web push notifications.

---

## 5. Runtime & Diagnostic Health

*   **TypeScript Health**: `tsc --noEmit` runs with **0 compilation errors**.
*   **ESLint Health**: Exits with 0 errors (2 image optimization warnings on chat avatars).
*   **Test Suite Status**: `npm run test` executes **41 test suites** with **426 test cases**:
    *   **40 Passing Suites** (425 passed tests).
    *   **1 Failing Suite** (`src/app/(components)/layouts/main-layout.test.tsx`: expects `md:px-6`, component applies `md:px-8`).
*   **Overall Codebase Completion**: **~78%** verified functional end-to-end.
