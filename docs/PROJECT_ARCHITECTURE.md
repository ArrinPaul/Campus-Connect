# CAMPUS CONNECT — ACTUAL PROJECT ARCHITECTURE

**Document Version:** 1.0.0 (Phase 1 Baseline)  
**System Type:** Multi-Tier Academic & Social Application  
**Runtime Environment:** Next.js 14 App Router on Node.js / Serverless Edge  

---

## 1. System Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Next.js React 18 UI Components (Radix UI + Tailwind + TipTap Editor)  │  │
│  │ TanStack React Query 5 (API Client @/lib/api.ts)                      │  │
│  │ Zustand Stores (UI state, Active conversation, Sidebar toggle)        │  │
│  │ Supabase Browser Client (Auth listeners, WebRTC broadcast channels)   │  │
│  │ Service Worker (PWA manifest, offline caching, push notifications)    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                     NEXT.JS 14 APPLICATION SERVER                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Edge Middleware (src/middleware.ts)                                   │  │
│  │  - Sliding Window In-Memory Rate Limiter (120 req/min)                │  │
│  │  - Cookie Session Refresh & Route Access Guard                        │  │
│  │  - Soft-Delete Cache Check (users.deleted_at with 5min TTL)           │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Route Handlers (src/app/api/**) [167 Routes]                          │  │
│  │  - 113 Active Verified Functional Handlers                            │  │
│  │  - 54 Scaffolded 501 Stubs                                            │  │
│  │  - DOMPurify HTML Sanitization + Zod Runtime Validation               │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Data Access Layer (src/server/db/**) [13 Modules]                     │  │
│  │  - Isolated with 'server-only'                                        │  │
│  │  - Server Supabase Client (@supabase/ssr createServerClient)          │  │
│  │  - Admin Client (@supabase/ssr createAdminClient for notifications)   │  │
│  │  - In-Memory Feed Ranking Algorithm (Affinity + Log10 + Time Decay)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       │ REST / PostgreSQL             │ Cache-Aside
┌──────────────────────▼──────────────┐ ┌──────────────▼──────────────────────┐
│         SUPABASE INFRASTRUCTURE     │ │            CACHING LAYER            │
│  ┌───────────────────────────────┐  │ │  ┌───────────────────────────────┐  │
│  │ PostgreSQL 15 Database        │  │ │  │ Upstash Redis REST Client     │  │
│  │  - 37 Relational Tables       │  │ │  │  - User Profile (300s TTL)    │  │
│  │  - 27 Performance Indexes     │  │ │  │  - Follow States (600s TTL)   │  │
│  │  - 119 Row-Level Security     │  │ │  │ In-Memory Map Fallback        │  │
│  │  - 3 Functions, 9 Triggers    │  │ │  └───────────────────────────────┘  │
│  ├───────────────────────────────┤  │ └─────────────────────────────────────┘
│  │ Supabase SSR Authentication   │  │
│  │ Supabase Realtime Channels    │  │
│  │ Supabase Storage Buckets      │  │
│  │  - 'media' (50MB)             │  │
│  │  - 'avatars' (5MB)            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 2. Technology Stack Breakdown

| Subsystem | Selected Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `14.2.25` | Hybrid SSR, static generation, API routes, middleware |
| **Language** | TypeScript | `5.x` | Strict typing (`strict: true`, `noImplicitAny: true`) |
| **UI Library** | React | `18.3.1` | Concurrent rendering, Client/Server component model |
| **Styling** | Tailwind CSS | `3.4.1` | Meta/Facebook design tokens (`meta/DESIGN.md`) |
| **Component Primitives** | Radix UI | 21 packages | Accessible headless primitives (Dialog, Tabs, Avatar) |
| **Rich Text Editor** | TipTap | `2.11.5` | WYSIWYG editor with KaTeX math and Code highlighting |
| **Math Renderer** | KaTeX | `0.16.11` | LaTeX formula compilation in posts |
| **Database** | PostgreSQL via Supabase | `15` | Relational data store, RLS policies, triggers |
| **Authentication** | `@supabase/ssr` | `0.12.0` | Cookie-based session management across edge & server |
| **Realtime** | Supabase Realtime | `@supabase/supabase-js 2.110.2` | WebSocket `postgres_changes`, `presence`, `broadcast` |
| **Server State** | TanStack React Query | `5.90.21` | Request deduplication, caching, optimistic updates |
| **Client State** | Zustand | `5.0.11` | Lightweight UI state stores |
| **Validation** | Zod | `4.3.6` | Request schema validation & input boundary checks |
| **Sanitization** | DOMPurify | `3.2.4` | XSS attack prevention on post HTML markup |
| **Caching** | Upstash Redis | `@upstash/redis 1.34.4` | Cache-aside for user profiles and social graphs |
| **Monitoring** | Sentry | `10.56.0` | Client, server, and edge error capturing |
| **Analytics** | PostHog | `1.352.0` | Product analytics & pageview tracking |
| **Testing** | Jest + Testing Library | `30.2.0` | Unit, component, and property-based test runner |

---

## 3. Directory Layout & Module Responsibilities

```
campus-connect/
├── .github/workflows/ci.yml # GitHub Actions CI: npm ci -> test -> lint -> tsc
├── public/                  # Static assets, web manifest, service worker (sw.js)
├── supabase/
│   └── migrations/          # 20240101000000_init.sql (37 tables, 119 RLS policies)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth route group: sign-in, sign-up, isolated layout
│   │   ├── (dashboard)/     # Authenticated route group: 26 subpages + MainLayout
│   │   ├── (onboarding)/    # 3-step onboarding wizard
│   │   ├── api/             # 167 Route Handlers across 25 domain subdirectories
│   │   ├── layout.tsx       # Root HTML layout with providers (Theme, Query, PostHog, Toast)
│   │   └── globals.css      # CSS variables & Meta design tokens
│   ├── components/
│   │   ├── ui/              # 21 Radix UI primitive wrappers
│   │   ├── posts/           # PostCard, PostComposer, CommentList, ReactionPicker, PollCard
│   │   ├── feed/            # VirtualizedFeed, FeedContainer, InfiniteScrollTrigger
│   │   ├── messages/        # ChatArea, ChatWindow, MessageComposer, TypingIndicator
│   │   ├── profile/         # ProfileHeader, ProfileForm, SkillsManager, FollowersList
│   │   ├── navigation/      # DesktopSidebar, MobileBottomNav, MobileNav, GlobalNav
│   │   └── accessibility/   # SkipLink, LiveRegion, KeyboardShortcutsModal
│   ├── hooks/               # Custom hooks (useRealtimeMessages, useRealtimeFeed, useHeartbeat)
│   ├── lib/
│   │   ├── supabase/        # Browser, Server, Middleware, and Admin client factories
│   │   ├── api.ts           # Unified TanStack Query API client
│   │   ├── validations.ts   # Zod validation schemas
│   │   ├── logger.ts        # Structured logger with dev console and Sentry delivery
│   │   └── redis.ts         # Upstash Redis wrapper with memory fallback
│   ├── server/
│   │   └── db/              # 13 'server-only' database access modules
│   └── types/               # TypeScript interfaces (Post, User, Reaction, FeedItem)
```

---

## 4. End-to-End Data Flow Architecture

### 4.1 Mutation Lifecycle (Example: Post Creation)
1. **User Interaction**: User types rich text in `PostComposer.tsx` and clicks "Post".
2. **Client Mutation**: `useMutation(api.posts.create)` dispatches `POST /api/posts` via `fetch()`.
3. **Edge Middleware**: `src/middleware.ts` verifies rate limit counter (<120 req/min) and refreshes session cookie.
4. **Route Handler**: `src/app/api/posts/route.ts` extracts authenticated user ID via `supabase.auth.getUser()`, validates content with Zod schema (`POST_MAX_LENGTH`), and sanitizes HTML via `DOMPurify.sanitize()`.
5. **Database Access**: Calls `createPost()` in `src/server/db/posts.ts` using `createServerClient()`.
6. **PostgreSQL Persistence**: Inserts record into `public.posts` table respecting RLS policy (`auth.uid() = author_id`).
7. **Side Effects**: `hashtags.linkPostToHashtags()` extracts `#tags` and updates `post_hashtags`.
8. **Realtime Broadcast**: Supabase broadcasts `postgres_changes` event on `public:posts` channel.
9. **UI Reaction**: Client TanStack Query cache invalidates `posts.feed`, prepending newly created post.

### 4.2 Query Lifecycle (Example: Ranked Feed Retrieval)
1. **Component Render**: `FeedContainer.tsx` mounts and invokes `useQuery(api.posts.getFeedPosts, { limit: 20 })`.
2. **Route Handler**: `src/app/api/posts/feed/route.ts` parses query parameters.
3. **Database Access**: `getFeedPosts(userId)` in `src/server/db/posts.ts`:
   - Queries `follows` table for accounts followed by user.
   - Fetches recent candidate posts within 7-day window.
   - Computes dynamic ranking score:
     $$\text{Score} = (\text{Affinity Multiplier}) \times \frac{1 + \log_{10}(1 + \text{likes} + 2\cdot\text{comments} + 3\cdot\text{shares})}{(1 + \Delta t_{\text{hours}})^{1.5}}$$
   - Sorts candidate posts descending by score.
4. **Response**: Returns sorted `DbPost[]` with author join relations.
