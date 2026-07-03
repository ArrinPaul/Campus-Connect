# Campus Connect — Project Plan

## Vision

A social media platform for college students — a fusion of **WhatsApp** (messaging), **Facebook** (feed, communities, events), **Discord** (groups, real-time), and **LinkedIn** (professional profiles, jobs, research).

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR/SSG, API routes |
| **UI** | React 18 + TypeScript (strict) | Type-safe components |
| **Styling** | Tailwind CSS | Apple-inspired design tokens |
| **Components** | Radix UI | 21 accessible primitives |
| **Rich Text** | TipTap | Markdown, mentions, links, code |
| **State** | TanStack React Query + Zustand | Server + client state |
| **Validation** | Zod | Runtime type checking |
| **Database** | Supabase (PostgreSQL) | Auth + DB + Storage + Realtime |
| **Auth** | Supabase Auth | Email/password + social logins |
| **Storage** | Supabase Storage | Images, videos, files |
| **Realtime** | Supabase Realtime | Live messaging, typing indicators |
| **Monitoring** | Sentry + PostHog | Errors + analytics |
| **Animations** | Framer Motion | UI transitions |
| **Toasts** | Sonner | Notification toasts |

### Removed (Previous Stack)
- ~~Neo4j~~ → PostgreSQL (Supabase)
- ~~Express.js (apps/api)~~ → Next.js API routes
- ~~Custom HMAC auth~~ → Supabase Auth
- ~~Upstash Redis~~ → Supabase Realtime + RLS
- ~~Custom rate limiter~~ → Supabase RLS policies

---

## Architecture

```
campus-connect/
  src/
    app/
      api/                    # All API routes (Next.js)
        auth/                 # Sign up, sign in, sign out, session
        users/                # Profile, search, skills, settings
        posts/                # Feed, CRUD, explore, hashtags
        messages/             # Send, read, typing
        conversations/        # Create, list, group chats
        communities/          # CRUD, members, invites
        events/               # CRUD, attendance
        jobs/                 # CRUD, applications
        stories/              # CRUD, views
        notifications/        # List, mark read
        bookmarks/            # CRUD, collections
        reactions/            # Add, remove, counts
        comments/             # CRUD, replies
        reposts/              # Create, undo
        polls/                # Create, vote
        questions/            # CRUD, answers, votes
        resources/            # Upload, download
        research/             # Upload, review, vote
        marketplace/          # CRUD, contact, sold
        gamification/         # Stats, leaderboard, badges
        calls/                # Initiate, answer, end
        presence/             # Online status
        push/                 # Web push subscriptions
        media/                # Upload URLs, storage
        graph/                # Recommendations, suggestions
        search/               # Universal, posts, users, communities
        cron/                 # Cleanup, digests, sync
        monitoring/           # Error logging
      (auth)/                 # Sign in, sign up pages
      (onboarding)/           # Multi-step onboarding
      (dashboard)/            # All feature pages
        feed/                 # Main feed
        messages/             # Chat interface
        communities/          # Community browser
        c/[slug]/             # Community detail
        events/               # Event browser
        jobs/                 # Job board
        marketplace/          # Buy/sell
        q-and-a/              # Questions & answers
        research/             # Research papers
        resources/            # Study resources
        stories/              # Stories
        explore/              # Explore trending
        leaderboard/          # Gamification
        notifications/        # Notification center
        bookmarks/            # Saved posts
        search/               # Search results
        profile/[id]/         # User profiles
        profile/me/           # Own profile
        settings/             # Account settings
        admin/                # Admin dashboard
        ads/                  # Ad management
    components/
      ui/                     # 21 Radix-based primitives
      posts/                  # PostCard, PostComposer, etc.
      feed/                   # FeedContainer, VirtualizedFeed
      messages/               # ChatArea, ConversationList
      communities/            # CommunityCard, InviteMemberModal
      profile/                # ProfileHeader, SkillsManager
      navigation/             # GlobalNav, MobileNav, SubNav
      calls/                  # CallModal, IncomingCallNotification
      editor/                 # RichTextEditor, MarkdownRenderer
      accessibility/          # SkipLink, LiveRegion
      analytics/              # PostHog pageview
      providers/              # Theme, Query, PostHog providers
      ...etc
    lib/
      supabase/               # Supabase client, server, middleware
      api.ts                  # Typed API client
      auth/                   # Auth hooks (useUser, useAuth, SignIn, SignUp)
      validations.ts          # Zod schemas
      utils.ts                # cn(), helpers
      logger.ts               # Structured logging
      hashtag-utils.ts        # Hashtag parsing
      mention-utils.ts        # Mention parsing
    hooks/                    # useDebounce, usePushNotifications, etc.
    types/                    # TypeScript interfaces
    server/                   # (empty - DB layer moves to Supabase client)
```

---

## Feature List

### Core Social
- [x] User profiles with skills, bio, university, role
- [x] Follow/unfollow system
- [x] Feed with posts, comments, reactions
- [x] Rich text editor with markdown, mentions, code blocks
- [x] Polls on posts
- [x] Repost/share posts
- [x] Bookmarks with collections
- [x] Stories (text + image, 24hr expiry)
- [x] Hashtags and trending
- [x] User search with filters
- [x] Notifications (in-app)
- [x] Theme system (dark/light)

### Messaging (WhatsApp-like)
- [x] Direct messages
- [x] Group conversations
- [x] Typing indicators
- [ ] Real-time messaging (Supabase Realtime)
- [ ] Read receipts
- [ ] Online presence

### Communities (Facebook Groups-like)
- [x] Create/join communities
- [x] Community categories and search
- [x] Invite members
- [x] Community-specific posts/feed
- [ ] Community settings, rules, moderation

### Events (Facebook Events-like)
- [x] Create/browse events
- [x] In-person, virtual, hybrid types
- [x] RSVP/attendance tracking
- [ ] Calendar integration
- [ ] Event reminders

### Jobs (LinkedIn-like)
- [x] Job board with listings
- [x] Post jobs
- [x] Apply to jobs
- [ ] Search and filters
- [ ] Application tracking dashboard
- [ ] Company profiles

### Marketplace (Facebook Marketplace-like)
- [x] Buy/sell listings
- [x] Category filters
- [x] Contact seller
- [x] Mark as sold
- [ ] Image upload for listings

### Academic
- [x] Q&A section (Stack Overflow-like)
- [x] Research paper sharing
- [x] Study resources library
- [x] Skill endorsements
- [ ] Advanced paper filters
- [ ] Citation system

### Gamification
- [x] Reputation points
- [x] Leaderboard
- [x] Badges
- [ ] Achievement system

### Discovery
- [x] Explore/trending feed
- [x] Graph-based recommendations
- [x] Suggested users
- [ ] Find Experts page
- [ ] Find Partners page

### Media
- [ ] Image upload (Supabase Storage)
- [ ] Video upload
- [ ] File attachments
- [ ] Link previews

### Real-time
- [ ] Live messaging (Supabase Realtime)
- [ ] Live feed updates
- [ ] Typing indicators in comments
- [ ] Push notifications (Web Push)
- [ ] Video/voice calls (WebRTC)

### Admin
- [ ] Dashboard with real stats
- [ ] User management
- [ ] Content moderation
- [ ] System health

### Monetization
- [ ] Premium subscriptions (Stripe)
- [ ] Ads system
- [ ] Billing management

---

## Implementation Phases

### Phase 0: Cleanup & Documentation ✅
- Delete unrequired files
- Create PLAN.md, TASKS.md, TRACKER.md

### Phase 1: Foundation (In Progress)
- Set up Supabase project and database
- Replace auth system with Supabase Auth
- Replace database layer with Supabase queries
- Integrate media upload (Supabase Storage)
- Fix TypeScript strictness
- Type the API client

### Phase 2: Core Features
- Rebuild navigation (user avatar, notifications, mobile nav)
- Rebuild landing page
- Complete stories (video, navigation)
- Complete jobs (search, filters)
- Enhance profiles (portfolio, activity)

### Phase 3: Real-time
- Live messaging (Supabase Realtime)
- Live feed updates
- Push notifications
- Video/voice calls

### Phase 4: Monetization & Admin
- Admin dashboard
- Ads system
- Premium subscriptions

### Phase 5: Polish & Launch
- Test coverage
- Performance optimization
- SEO & PWA
- CI/CD pipeline

---

## Design System

Apple-inspired design tokens defined in `tailwind.config.ts` and `DESIGN.md`:
- **Primary**: #0066cc (Action Blue)
- **Surfaces**: White, Parchment (#f5f5f7), Near-Black tiles
- **Typography**: SF Pro Display/Text with negative letter-spacing at display sizes
- **Radius**: Pill (9999px) for CTAs, lg (18px) for cards, sm (8px) for utilities
- **Spacing**: 8px base unit
- **Shadow**: Single product shadow only (`rgba(0,0,0,0.22) 3px 5px 30px`)
