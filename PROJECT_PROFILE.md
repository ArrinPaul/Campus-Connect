# Campus Connect — Project Profile

This document outlines the stack, architecture, and current state of the **Campus Connect** project.

---

## 1. Stack Profile

*   **Framework**: Next.js 14 (App Router, React 18, TypeScript)
*   **Database & Auth**: Supabase PostgreSQL + Supabase SSR Auth (`@supabase/ssr` / `@supabase/supabase-js`)
*   **Realtime Services**: Supabase Realtime Channels (used for messaging, notifications, and feed presence)
*   **State Management**:
    *   *Server State*: TanStack React Query (`@tanstack/react-query`)
    *   *Client/UI State*: Zustand (`zustand`)
*   **Styling (CSS)**: Tailwind CSS following a customized Meta/Facebook design system (tokens defined in `DESIGN.md` and configured in `tailwind.config.ts`)
*   **UI Primitives**: Radix UI (21 component primitives) and TipTap for rich text editing
*   **Ratelimiting/Redis**: Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`) - package.json retains these, though some database references have been moved to Supabase.
*   **Monitoring & Analytics**: Sentry (`@sentry/nextjs`) and PostHog (`posthog-js`)

---

## 2. Architecture & Directory Structure

```
campus-connect/
├── public/                 # Static assets (icons, manifest)
├── supabase/               # Supabase database config & migrations
│   └── migrations/         # Init SQL migration defining tables, triggers, and RLS policies
├── src/
│   ├── app/                # App Router Pages & API Routes
│   │   ├── (auth)/         # Authentication flow pages (Sign in, Sign up)
│   │   ├── (dashboard)/    # Dashboard layout and 26 feature subpages
│   │   ├── (onboarding)/   # Multi-step profile setup wizard
│   │   ├── api/            # API endpoints (interacting with Supabase server)
│   │   └── globals.css     # Global CSS styles and design tokens
│   ├── components/         # React Component Library
│   │   ├── ui/             # Radix-based accessible UI primitives
│   │   ├── posts/          # Post cards, creation modals, reposts, bookmarks
│   │   ├── feed/           # Virtualized feed, main feed containers
│   │   ├── messages/       # Chat overlays, conversation thread views
│   │   ├── profile/        # Skills managers, profile headers
│   │   └── navigation/     # Global and mobile navigation bars
│   ├── hooks/              # Custom React hooks (realtime subscriptions, auth context)
│   ├── lib/                # Shared utilities & configurations
│   │   ├── supabase/       # Supabase client instantiation (client, server, middleware)
│   │   ├── api.ts          # Typed client API client
│   │   ├── validations.ts  # Zod runtime schemas
│   │   └── utils.ts        # Helper functions
│   ├── server/             # Backend operations
│   │   └── db/             # Data access layer using Supabase clients
│   └── types/              # Global TypeScript declarations
```

---

## 3. Purpose & Domain

**Campus Connect** is a unified social platform designed for college students, merging WhatsApp (DMs, group chats, realtime online presence), Facebook (feed posts, comments, reactions, campus communities/events, marketplace), Discord (channels, member roles), and LinkedIn (professional profiles, skills management, job postings, academic papers/resources).

---

## 4. Data Layer & Auth

*   **Database Schema**: A comprehensive PostgreSQL schema managed in Supabase containing tables for users, follows, posts, comments, reactions, conversations, messages, community members, events, jobs, stories, notifications, bookmarks, and academic papers/study resources.
*   **Auth Strategy**: Supabase SSR Authentication integrated with cookies. The session is managed securely via middleware (`src/lib/supabase/middleware.ts`) which intercepts incoming requests to manage session refreshing.
*   **Environment Variables (`.env.local`)**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: The API URL for your Supabase project.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous client key for public browser access.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Secret service role API key to bypass RLS in background/admin tasks.
    *   `NEXT_PUBLIC_API_URL`: Root URL of the app API (usually `http://localhost:3000`).
    *   `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` (Optional - analytics).
    *   `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` (Optional - error reporting).
    *   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (Optional - web push).

---

## 5. Conventions & Styling

*   **Naming conventions**: PascalCase for UI components; camelCase for variables, client side files, utility functions, and hooks; snake_case for database fields.
*   **Styling Strategy**: Tailwind CSS with class name merges (`clsx` + `tailwind-merge` via `cn`). Custom brand-aligned colors:
    *   Primary: `cobalt` (#0064e0)
    *   Accent shapes: Pill buttons and rounded cards.
*   **State Management**: React Query handles all server interactions and synchronization, while local/UI states (e.g. sidebar collapsed, active conversation) use Zustand stores.

---

## 6. Runtime & Diagnostic Test Run

*   **TypeScript Health**: `tsc --noEmit` runs successfully with **0 compilation errors**.
*   **Test Suite Status**: Running `npm run test` reveals **36 passed suites** and **3 failing suites** (with 4 individual failing test cases out of 423 total tests).
    *   **failing 1 (Mobile Nav)**: `src/components/navigation/mobile-nav.test.tsx` (Menu overlay element assertion failed).
    *   **failing 2 (Repost Modal)**: `src/components/posts/RepostModal.test.tsx` (Character count styling mismatch: expected class `text-destructive` but got `text-critical`).
    *   **failing 3 (Post Card)**: `src/components/posts/PostCard.test.tsx` (Invalid component type exception during deletion dropdown click, possibly due to a missing component export/import in dropdown elements).
