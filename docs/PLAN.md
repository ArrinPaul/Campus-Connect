# Campus Connect — Plan

## What Is This?

A social media app for college students. Think WhatsApp + Facebook + Discord + LinkedIn combined.

- **WhatsApp part**: Direct messages, group chats, typing indicators, online status
- **Facebook part**: Feed, posts, comments, reactions, communities, events, marketplace
- **Discord part**: Community channels, roles, real-time presence
- **LinkedIn part**: Professional profiles, skills, job board, research papers, endorsements

---

## Tech Stack

```
Frontend:  Next.js 14 + React 18 + TypeScript + Tailwind CSS
Design:    DESIGN.md (Meta/Facebook design system) — THE source of truth
UI:        Radix UI (21 components) + TipTap editor
State:     TanStack React Query + Zustand
Backend:   Next.js API routes (100+ endpoints)
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth (email + social logins)
Storage:   Supabase Storage (images, videos, files)
Realtime:  Supabase Realtime (live chat, typing indicators)
Monitoring: Sentry (errors) + PostHog (analytics)
```

### Design System

**DESIGN.md is the single source of truth for all frontend design.** It defines:
- Colors (cobalt primary #0064e0, ink-button black, semantic colors)
- Typography (Optimistic VF with fallbacks to Montserrat/Helvetica)
- Spacing (4px base unit, 12 tokens from xxs to hero)
- Border radius (xs to full/circle — pill buttons are a brand signature)
- Components (buttons, cards, inputs, badges, navigation patterns)
- Responsive breakpoints and collapsing strategy
- Do's and Don'ts for every component

The `tailwind.config.ts` mirrors these tokens exactly. If you need a new token, add it to DESIGN.md first, then mirror it in tailwind.config.ts.

**Deleted (old stack):** Neo4j, Express.js server, custom auth, Upstash Redis

---

## Current State

The app has **lots of UI built** but the **backend is disconnected**. Here's the situation:

### What WORKS (UI is built, just needs backend connection)
- Feed with posts, comments, reactions, reposts, polls, bookmarks
- Rich text editor with markdown, mentions, code blocks
- Direct messages and group conversations
- Communities (create, join, invite, member management)
- Events (create, attend, in-person/virtual/hybrid)
- Jobs board (post, apply)
- Marketplace (buy/sell listings)
- Q&A section
- Research papers and study resources
- Stories (text + image)
- User profiles with skills, bio, university
- Follow/unfollow system
- Notifications
- Settings (profile, account, privacy, notifications)
- Leaderboard and gamification
- Theme system (dark/light)
- Accessibility (skip links, live regions)

### What's BROKEN (imports reference deleted files)
- **All 100+ API routes** — they import from `@/server/db/*` and `@/lib/auth/server` which were deleted
- **Middleware** — imports deleted rate limiter
- **Database layer** — deleted (was Neo4j, replacing with Supabase PostgreSQL)

### What's MISSING (never built)
- Real-time messaging (currently polling-based)
- Video stories
- Job search/filters
- Community settings/moderation
- Admin dashboard (placeholder only)
- Media upload (returns null)
- Video/voice calls (UI stub only)
- Find Experts page (placeholder)
- Find Partners page (placeholder)

---

## The Plan

### Phase 0: Cleanup ✅ DONE
Deleted all unrequired files. Created this plan.

### Phase 1: Foundation (NEXT — biggest phase)
**Goal: Get the app running with Supabase**

1. Create Supabase project + database tables
2. Replace auth with Supabase Auth
3. Rewrite database layer with Supabase queries
4. Rewrite all 100+ API routes
5. Integrate media upload (Supabase Storage)
6. Fix TypeScript strictness
7. Type the API client properly

### Phase 2: Core Features
**Goal: Make the app feel complete**

1. Rebuild navigation (user avatar, notification badge, mobile nav)
2. Rebuild landing page (real content, not placeholder boxes)
3. Complete stories (video support, navigation)
4. Complete jobs (search, filters)
5. Enhance profiles (portfolio, activity)

### Phase 3: Real-time
**Goal: Make it feel alive**

1. Live messaging (Supabase Realtime)
2. Live feed updates
3. Push notifications
4. Video/voice calls

### Phase 4: Monetization
**Goal: Business features**

1. Admin dashboard
2. Ads system
3. Premium subscriptions (Stripe)

### Phase 5: Launch
**Goal: Production-ready**

1. Tests
2. Performance
3. SEO
4. CI/CD

---

## Database Tables (PostgreSQL)

```
users           — profiles, skills, university, role
follows         — who follows whom
posts           — content, media, community/poll refs
comments        — nested replies
reactions       — like/love/laugh/wow/sad/scholarly
conversations   — DM or group
messages        — chat messages
community_members — roles (admin/moderator/member)
communities     — name, slug, category
events          — title, type, time, location
jobs            — company, salary, skills, deadline
stories         — text/image, 24hr expiry
notifications   — type, read status
bookmarks       — saved posts with collections
hashtags        — trending tags
polls           — question, options, votes
questions       — Q&A with tags
resources       — study materials
research_papers — academic papers
marketplace_listings — buy/sell items
reposts         — shared posts
user_reputation — gamification points/badges
```

All tables have Row Level Security (RLS) — users can only access what they're allowed to.

---

## File Structure

```
campus-connect/
  DESIGN.md              ← Design system (source of truth)
  README.md              ← Project overview
  tailwind.config.ts     ← Mirrors DESIGN.md tokens
  supabase/
    migration.sql        ← Database schema (36 tables, RLS, triggers)
  docs/
    PLAN.md              ← This file
    FEATURES.md          ← All 240 features
    TASKS.md             ← Task breakdown
    TRACKER.md           ← Progress tracking
  src/
    app/
      api/               → All API routes (will be rewritten)
      (auth)/            → Sign in, sign up pages
      (onboarding)/      → Multi-step profile setup
      (dashboard)/       → All feature pages (21 pages)
    components/
      ui/                → 21 Radix components (KEEP)
      posts/             → PostCard, PostComposer, etc. (KEEP)
      feed/              → FeedContainer, VirtualizedFeed (KEEP)
      messages/          → ChatArea, ConversationList (KEEP)
      communities/       → CommunityCard, etc. (KEEP)
      profile/           → ProfileHeader, SkillsManager (KEEP)
      navigation/        → GlobalNav, MobileNav (REBUILD)
      ...etc
    lib/
      supabase/          → NEW: Supabase client setup
      api.ts             → API client (REWRITE types)
      auth/              → Auth hooks (REWRITE for Supabase)
      validations.ts     → Zod schemas (KEEP)
      utils.ts           → Helpers (KEEP)
```
