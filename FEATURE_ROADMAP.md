# Campus Connect — Feature Roadmap & Scaling Plan

> Comprehensive plan to evolve Campus Connect from an academic social platform into a full-scale social ecosystem.
> Features referenced from: **Facebook, WhatsApp, LinkedIn, Reddit, Discord, Twitter/X**
> Generated: February 2026

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Phase 1 — Core Social Expansion](#2-phase-1--core-social-expansion-weeks-1-6)
3. [Phase 2 — Real-Time Communication](#3-phase-2--real-time-communication-weeks-7-12)
4. [Phase 3 — Content & Media Platform](#4-phase-3--content--media-platform-weeks-13-18)
5. [Phase 4 — Recommendation & AI Engines](#5-phase-4--recommendation--ai-engines-weeks-19-24)
6. [Phase 5 — Community & Groups](#6-phase-5--community--groups-weeks-25-30)
7. [Phase 6 — Professional & Academic Tools](#7-phase-6--professional--academic-tools-weeks-31-36)
8. [Phase 7 — Monetization & Growth](#8-phase-7--monetization--growth-weeks-37-42)
9. [Scaling Architecture](#9-scaling-architecture)
10. [Database Schema Additions](#10-database-schema-additions)
11. [Priority Matrix](#11-priority-matrix)

---

## 1. Current State Summary

### What Already Exists

| Area | Features |
|------|----------|
| **Auth** | Clerk-based sign-up/sign-in, OAuth-ready, webhook sync, middleware route protection |
| **Profiles** | Name, bio, avatar upload, university, role (Student/Scholar/Faculty), experience level, skills, social links, follower/following counts |
| **Posts** | Create, delete (cascade), text content (5000 chars), like/unlike with optimistic UI |
| **Comments** | Create, delete (own), threaded under posts with inline expansion |
| **Follows** | Follow/unfollow with counts, optimistic UI, follower/following lists |
| **Feed** | Reverse-chronological, cursor-based pagination, infinite scroll, real-time updates from followed users |
| **Discovery** | User search by name, filter by role & skills |
| **Settings** | Theme toggle (dark/light/system), profile editing |
| **UI/UX** | Full dark mode, responsive design, mobile nav, loading skeletons, error boundaries, XSS protection |

### What's Missing (addressed in this roadmap)

- No media attachments on posts (images, videos, files)
- No direct messaging or real-time chat
- No notification system
- No groups/communities/channels
- No stories/temporary content
- No recommendation or suggestion engines
- No reactions beyond likes
- No bookmarks/saves
- No hashtags or trending topics
- No events or scheduling
- No polls or surveys
- No rich text or markdown in posts
- No content moderation tools
- No analytics or insights
- No API rate limiting or abuse prevention

---

## 2. Phase 1 — Core Social Expansion (Weeks 1-6)

### 2.1 Reactions System *(inspired by: Facebook, LinkedIn, Discord)*

Replace the binary like/unlike with expressive reactions.

**Features:**
- 6 reaction types: 👍 Like, ❤️ Love, 😂 Laugh, 😮 Wow, 😢 Sad, 🎓 Scholarly (campus-specific)
- Animated reaction picker on hover/long-press
- Reaction summary bar showing top 3 emoji + total count
- Per-reaction breakdown on click (modal showing who reacted with what)
- Reactions on comments too (not just posts)

**Schema Addition:**
```typescript
reactions: defineTable({
  userId: v.id("users"),
  targetId: v.string(),        // postId or commentId
  targetType: v.union(v.literal("post"), v.literal("comment")),
  type: v.union(
    v.literal("like"), v.literal("love"), v.literal("laugh"),
    v.literal("wow"), v.literal("sad"), v.literal("scholarly")
  ),
  createdAt: v.number(),
})
  .index("by_target", ["targetId", "targetType"])
  .index("by_user_target", ["userId", "targetId", "targetType"])
```

**Inspiration Mapping:**
| Platform | Feature | Our Adaptation |
|----------|---------|----------------|
| Facebook | 6 emoji reactions | Same concept + "Scholarly" for academic context |
| LinkedIn | Like, Celebrate, Support, Funny, Love, Insightful | We use "Scholarly" instead of "Insightful" |
| Discord | Custom emoji reactions | Phase 6 — custom community reactions |

---

### 2.2 Bookmarks / Save Posts *(inspired by: Twitter, Reddit, Instagram)*

**Features:**
- Save any post to personal collection
- Bookmarks page accessible from sidebar nav
- Organize bookmarks into collections/folders (e.g., "Research Ideas", "Study Resources")
- Bookmark count visible to post author (not public)
- Remove from bookmarks

**Schema Addition:**
```typescript
bookmarks: defineTable({
  userId: v.id("users"),
  postId: v.id("posts"),
  collectionName: v.optional(v.string()),  // default: "Saved"
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_post", ["userId", "postId"])
  .index("by_user_and_collection", ["userId", "collectionName"])
```

---

### 2.3 Hashtags & Trending Topics *(inspired by: Twitter, Instagram, LinkedIn)*

**Features:**
- Auto-detect `#hashtag` in post content and convert to clickable links
- Hashtag pages showing all posts with that tag
- **Trending section** — top 10 hashtags in the last 24h, weighted by engagement
- Campus-specific trending (filtered by user's university)
- Suggested hashtags while composing (autocomplete from existing tags)

**Schema Addition:**
```typescript
hashtags: defineTable({
  tag: v.string(),           // lowercase, normalized
  postCount: v.number(),
  lastUsedAt: v.number(),
})
  .index("by_tag", ["tag"])
  .index("by_post_count", ["postCount"])

postHashtags: defineTable({
  postId: v.id("posts"),
  hashtagId: v.id("hashtags"),
})
  .index("by_post", ["postId"])
  .index("by_hashtag", ["hashtagId"])
```

---

### 2.4 Notification System *(inspired by: Facebook, Twitter, LinkedIn, Discord)*

**Features:**
- Real-time notifications via Convex reactive queries
- Notification types:
  - Someone liked/reacted to your post
  - Someone commented on your post
  - Someone followed you
  - Someone mentioned you (`@username`)
  - Post from someone you follow (configurable)
  - Someone shared your post
- Notification bell icon in navbar with unread badge count
- Notification dropdown with mark-as-read
- Full notifications page with filters (All / Mentions / Reactions / Follows)
- Notification preferences in settings (toggle each type on/off)
- Push notifications (via Web Push API — Phase 7)

**Schema Addition:**
```typescript
notifications: defineTable({
  recipientId: v.id("users"),
  actorId: v.id("users"),
  type: v.union(
    v.literal("like"), v.literal("comment"), v.literal("follow"),
    v.literal("mention"), v.literal("share"), v.literal("post")
  ),
  referenceId: v.optional(v.string()),  // postId, commentId, etc.
  message: v.string(),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index("by_recipient", ["recipientId", "createdAt"])
  .index("by_recipient_unread", ["recipientId", "isRead"])
```

---

### 2.5 Mentions & Tagging *(inspired by: Twitter, Facebook, Discord)*

**Features:**
- `@username` mentions in posts and comments
- Autocomplete dropdown when typing `@` (search users by name)
- Clickable mention links → navigate to profile
- Mentioned users receive a notification
- Highlight mentions in distinct color (blue)

---

### 2.6 Share / Repost *(inspired by: Twitter Retweet, LinkedIn Repost)*

**Features:**
- **Repost** — share someone's post to your own feed (with attribution)
- **Quote Post** — repost with your own commentary added
- Share count displayed on post card
- Share to external platforms (copy link, share via native Web Share API)

**Schema Addition:**
```typescript
reposts: defineTable({
  userId: v.id("users"),
  originalPostId: v.id("posts"),
  quoteContent: v.optional(v.string()),  // null = plain repost
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_original_post", ["originalPostId"])
```

---

## 3. Phase 2 — Real-Time Communication (Weeks 7-12)

### 3.1 Direct Messaging *(inspired by: WhatsApp, Facebook Messenger, Instagram DMs)*

**Features:**
- One-on-one private messaging
- Conversation list with last message preview, timestamp, unread badge
- Real-time message delivery via Convex subscriptions
- Message types: text, image, file attachment
- Message status indicators: sent ✓, delivered ✓✓, read (blue ✓✓)
- Typing indicator ("User is typing...")
- Online/offline presence indicator (green dot)
- Delete message (for me / for everyone)
- Reply to specific message (quoted reply)
- Search within conversation
- Message reactions (quick emoji)
- Link previews with Open Graph metadata

**Schema Addition:**
```typescript
conversations: defineTable({
  participantIds: v.array(v.id("users")),  // sorted for consistent lookup
  lastMessageId: v.optional(v.id("messages")),
  lastMessageAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_last_message", ["lastMessageAt"])

messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  content: v.string(),
  messageType: v.union(
    v.literal("text"), v.literal("image"), v.literal("file"), v.literal("system")
  ),
  attachmentUrl: v.optional(v.string()),
  attachmentName: v.optional(v.string()),
  replyToId: v.optional(v.id("messages")),
  status: v.union(
    v.literal("sent"), v.literal("delivered"), v.literal("read")
  ),
  isDeleted: v.boolean(),
  createdAt: v.number(),
})
  .index("by_conversation", ["conversationId", "createdAt"])
  .index("by_sender", ["senderId"])

conversationParticipants: defineTable({
  conversationId: v.id("conversations"),
  userId: v.id("users"),
  lastReadMessageId: v.optional(v.id("messages")),
  isMuted: v.boolean(),
  joinedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_conversation", ["conversationId"])
```

---

### 3.2 Group Chat *(inspired by: WhatsApp Groups, Discord Channels)*

**Features:**
- Create group with name, avatar, description
- Add/remove members (admin permission)
- Admin roles: owner, admin, member
- Group info panel (members list, shared media)
- Pin messages
- Group message same features as DMs (replies, reactions, media)
- Leave group / mute notifications
- Maximum 256 members per group (initial limit)

---

### 3.3 Presence & Activity Status *(inspired by: Discord, WhatsApp, Facebook)*

**Features:**
- Online / Away / Do Not Disturb / Invisible statuses
- "Last seen" timestamp (privacy-configurable)
- Active now indicator on user cards and chat
- Custom status message ("📚 Studying for finals", "🔬 In the lab")

**Schema Addition:**
```typescript
// Add to users table:
status: v.optional(v.union(
  v.literal("online"), v.literal("away"), v.literal("dnd"), v.literal("invisible")
)),
customStatus: v.optional(v.string()),
lastSeenAt: v.optional(v.number()),
```

---

### 3.4 Voice & Video Calls *(inspired by: WhatsApp, Discord, Google Meet)*

> Phase 2 stretch goal — requires WebRTC integration

**Features:**
- One-on-one voice calls
- One-on-one video calls
- Call history (missed, received, outgoing)
- In-call controls: mute, camera toggle, screen share, end call
- Integration: Use **WebRTC** with a TURN/STUN server (e.g., Twilio, LiveKit)

---

## 4. Phase 3 — Content & Media Platform (Weeks 13-18)

### 4.1 Rich Media Posts *(inspired by: Facebook, Twitter, LinkedIn, Instagram)*

**Features:**
- **Image attachments** — up to 10 images per post, grid gallery layout
- **Video uploads** — with thumbnail generation, inline player
- **File/document sharing** — PDFs, slides, research papers (max 25MB)
- **Link previews** — auto-fetch Open Graph metadata (title, image, description)
- **Code snippets** — syntax-highlighted code blocks (for CS students)
- **LaTeX rendering** — for math/science content (KaTeX integration)
- Image lightbox viewer (click to expand, swipe through gallery)
- Video player with playback speed control
- Drag-and-drop upload support
- Image compression before upload

**Schema update to posts table:**
```typescript
// Add to posts table:
mediaUrls: v.optional(v.array(v.string())),
mediaType: v.optional(v.union(
  v.literal("image"), v.literal("video"), v.literal("file"), v.literal("link")
)),
linkPreview: v.optional(v.object({
  url: v.string(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
})),
```

---

### 4.2 Stories / Ephemeral Content *(inspired by: Instagram Stories, Facebook Stories, WhatsApp Status)*

**Features:**
- 24-hour disappearing image/text stories
- Story viewer with tap-to-advance, swipe to skip user
- Story ring around profile avatar (blue ring = unseen stories)
- Story reactions (quick emoji replies → sends DM)
- View count visible to author
- Close friends list for private stories
- Text-on-image stories with background color picker
- Auto-cleanup: scheduled function deletes expired stories

**Schema Addition:**
```typescript
stories: defineTable({
  authorId: v.id("users"),
  content: v.optional(v.string()),
  mediaUrl: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  expiresAt: v.number(),  // createdAt + 24 hours
  viewCount: v.number(),
  createdAt: v.number(),
})
  .index("by_author", ["authorId", "createdAt"])
  .index("by_expiry", ["expiresAt"])

storyViews: defineTable({
  storyId: v.id("stories"),
  viewerId: v.id("users"),
  viewedAt: v.number(),
})
  .index("by_story", ["storyId"])
  .index("by_viewer", ["viewerId"])
```

---

### 4.3 Polls & Surveys *(inspired by: Twitter Polls, Reddit Polls, LinkedIn Polls)*

**Features:**
- Create poll with 2-6 options
- Poll duration: 1 hour, 6 hours, 1 day, 3 days, 7 days
- Vote once (can change vote before poll ends)
- Live results with animated progress bars
- Show total votes and time remaining
- Poll results visible after voting or after poll ends (configurable)
- Academic survey polls with optional anonymity

**Schema Addition:**
```typescript
polls: defineTable({
  postId: v.id("posts"),
  options: v.array(v.object({
    id: v.string(),
    text: v.string(),
    voteCount: v.number(),
  })),
  totalVotes: v.number(),
  endsAt: v.number(),
  isAnonymous: v.boolean(),
  createdAt: v.number(),
})
  .index("by_post", ["postId"])

pollVotes: defineTable({
  pollId: v.id("polls"),
  userId: v.id("users"),
  optionId: v.string(),
  createdAt: v.number(),
})
  .index("by_poll", ["pollId"])
  .index("by_user_poll", ["userId", "pollId"])
```

---

### 4.4 Markdown & Rich Text Editor *(inspired by: Reddit, Discord, GitHub)*

**Features:**
- WYSIWYG editor with toolbar (bold, italic, lists, headings, links, code blocks)
- Markdown syntax support with live preview toggle
- Syntax highlighting for code blocks (using Prism.js or Shiki)
- LaTeX math rendering inline ($...$) and block ($$...$$)
- Embedded YouTube/Vimeo link auto-embed
- Auto-link URLs in plain text

---

## 5. Phase 4 — Recommendation & AI Engines (Weeks 19-24)

### 5.1 Friend / Connection Suggestion Engine *(inspired by: Facebook "People You May Know", LinkedIn "People Also Viewed")*

**Algorithm layers (combined scoring):**

```
Score = w1 × MutualFollows + w2 × SharedSkills + w3 × SameUniversity
      + w4 × SameRole + w5 × InteractionHistory + w6 × SkillComplementarity
```

| Signal | Weight | Description |
|--------|--------|-------------|
| **Mutual follows** | 0.30 | Users followed by people you follow but you don't follow yet |
| **Shared skills** | 0.20 | Jaccard similarity of skill arrays |
| **Same university** | 0.15 | Same institution = likely to know each other |
| **Same role** | 0.05 | Student↔Student, Faculty↔Faculty affinity |
| **Interaction history** | 0.20 | Users whose posts you liked/commented on but haven't followed |
| **Skill complementarity** | 0.10 | Suggest experts in skills you don't have (mentorship possibility) |

**Features:**
- "Suggested for You" sidebar widget (3-5 suggestions)
- Full suggestions page with "Why suggested" explanation
- Quick follow button on suggestion card
- Dismiss / "Not interested" with negative feedback loop
- Refresh suggestions manually
- Scheduled batch computation (every 6 hours via Convex cron)

**Implementation approach:**
```
Convex Cron Job (every 6h)
  → For each active user:
    → Compute candidate pool (2nd-degree follows, same university, etc.)
    → Score each candidate
    → Store top 20 in `suggestions` table
    → Mark stale suggestions as expired

User opens Discover page
  → Read from pre-computed `suggestions` table
  → Real-time Convex subscription for live updates
```

**Schema Addition:**
```typescript
suggestions: defineTable({
  userId: v.id("users"),
  suggestedUserId: v.id("users"),
  score: v.number(),
  reasons: v.array(v.string()),  // ["3 mutual connections", "Same university"]
  isDismissed: v.boolean(),
  computedAt: v.number(),
})
  .index("by_user", ["userId", "score"])
  .index("by_user_dismissed", ["userId", "isDismissed"])
```

---

### 5.2 Feed Ranking Algorithm *(inspired by: Facebook News Feed, Twitter "For You", LinkedIn Feed)*

Replace pure reverse-chronological with intelligent ranking.

**Ranking formula:**
```
FeedScore = Recency × Relevance × Engagement × Relationship

Where:
  Recency     = decay(hoursSincePost)              // exponential decay
  Relevance   = skillOverlap(author, viewer)        // content relevance
  Engagement  = log(likes + 2×comments + 3×shares)  // engagement signal
  Relationship = followStrength(viewer, author)      // interaction frequency
```

**Features:**
- **"For You" feed** — algorithmically ranked (default)
- **"Following" feed** — pure chronological (user toggleable, like Twitter)
- **"Trending" feed** — hot posts across campus
- Feed algorithm transparency: "Why am I seeing this?" tooltip
- Time decay to prevent old viral posts from dominating
- Diversity injection — ensure variety of authors (no single person flooding feed)
- Cold-start handling — new users see popular content until follow graph develops

---

### 5.3 Content Recommendation *(inspired by: Reddit "Because you visited r/...", YouTube recommended)*

**Features:**
- "Posts you might like" section after scrolling through feed
- "More from [Author]" suggestions after reading a post
- Topic-based recommendations using hashtag affinity
- "Popular in your university" section
- "Trending in [Skill]" — posts trending in your skill areas
- Collaborative filtering: "Users who liked X also liked Y"

**Algorithm:**
```
ContentScore = TopicAffinity × AuthorAffinity × FreshnessBoost × EngagementQuality

TopicAffinity    = cosineSimilarity(user.likedHashtags, post.hashtags)
AuthorAffinity   = interactionCount(user, post.author) / totalInteractions
FreshnessBoost   = 1.0 + (0.5 if post < 6h old)
EngagementQuality = commentCount / likeCount   // higher = more discussion
```

---

### 5.4 Search Upgrades *(inspired by: Twitter Search, LinkedIn Search, Reddit Search)*

**Features:**
- **Universal search bar** — search across users, posts, hashtags, groups
- **Post search** — full-text search on post content
- **Search filters** — by date range, author, content type, engagement threshold
- **Search history** — recent searches with quick re-search
- **Autocomplete** — suggest users, hashtags, and past searches while typing
- **Search results tabs** — Users | Posts | Hashtags | Groups
- **Convex full-text search index** on post content and user bios

---

### 5.5 Skill-Based Matching *(inspired by: LinkedIn Skills, GitHub profile matching)*

**Features:**
- **Skill endorsements** — other users can endorse your skills (like LinkedIn)
- **Skill assessment quiz** — verify claimed skill level (optional)
- **"Find experts" feature** — search for users by specific skill + experience level
- **Study partner matching** — find students with complementary skills for projects
- **Mentor matching** — pair beginners with experts in requested skills

**Schema Addition:**
```typescript
skillEndorsements: defineTable({
  skillName: v.string(),
  userId: v.id("users"),         // person being endorsed
  endorserId: v.id("users"),     // person endorsing
  createdAt: v.number(),
})
  .index("by_user_skill", ["userId", "skillName"])
  .index("by_endorser", ["endorserId"])
```

---

## 6. Phase 5 — Community & Groups (Weeks 25-30)

### 6.1 Communities / Groups *(inspired by: Reddit Subreddits, Facebook Groups, Discord Servers)*

**Features:**
- Create community with name, description, avatar, banner image
- Community types: **Public** (anyone can join), **Private** (request to join), **Secret** (invite-only)
- Community roles: Owner, Admin, Moderator, Member
- Community rules (displayed in sidebar)
- Community-specific feed (posts within that community)
- Join/leave community
- Member list with role badges
- Community search and discovery
- Community categories: Academic, Research, Social, Sports, Clubs, Department-specific
- Post flair/tags within communities
- Pinned posts (admins can pin important announcements)
- Community analytics for admins (member growth, activity, top posts)

**Schema Addition:**
```typescript
communities: defineTable({
  name: v.string(),
  slug: v.string(),          // URL-friendly name
  description: v.string(),
  avatar: v.optional(v.string()),
  banner: v.optional(v.string()),
  type: v.union(v.literal("public"), v.literal("private"), v.literal("secret")),
  category: v.string(),
  rules: v.array(v.string()),
  memberCount: v.number(),
  createdBy: v.id("users"),
  createdAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_category", ["category"])
  .index("by_member_count", ["memberCount"])

communityMembers: defineTable({
  communityId: v.id("communities"),
  userId: v.id("users"),
  role: v.union(
    v.literal("owner"), v.literal("admin"),
    v.literal("moderator"), v.literal("member")
  ),
  joinedAt: v.number(),
})
  .index("by_community", ["communityId"])
  .index("by_user", ["userId"])
  .index("by_community_user", ["communityId", "userId"])
```

---

### 6.2 Discussion Threads *(inspired by: Reddit threads, Discord forum channels)*

**Features:**
- Nested comment threads (multi-level replies, not just flat comments)
- Thread depth limit (5 levels) with "Continue this thread →" link
- Collapse/expand thread branches
- Sort threads by: Best, New, Old, Controversial
- OP (original poster) badge in thread
- Threaded reply notifications

**Schema update:**
```typescript
// Add to comments table:
parentCommentId: v.optional(v.id("comments")),  // null = top-level
depth: v.number(),            // 0 = top-level, 1 = reply, etc.
replyCount: v.number(),
```

---

### 6.3 Events & Scheduling *(inspired by: Facebook Events, LinkedIn Events, Meetup)*

**Features:**
- Create event with title, description, date/time, location (physical or virtual link)
- RSVP: Going / Maybe / Not Going
- Event types: Lecture, Workshop, Seminar, Hackathon, Study Group, Social
- Campus map integration for physical locations
- Recurring events (weekly study group, etc.)
- Event reminders (24h before, 1h before)
- Attendee list
- Event discussion thread
- Calendar view (monthly/weekly)
- Integration with Google Calendar / iCal export

**Schema Addition:**
```typescript
events: defineTable({
  title: v.string(),
  description: v.string(),
  organizerId: v.id("users"),
  communityId: v.optional(v.id("communities")),
  eventType: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  location: v.optional(v.string()),
  virtualLink: v.optional(v.string()),
  isRecurring: v.boolean(),
  maxAttendees: v.optional(v.number()),
  attendeeCount: v.number(),
  createdAt: v.number(),
})
  .index("by_start_date", ["startDate"])
  .index("by_organizer", ["organizerId"])
  .index("by_community", ["communityId"])

eventRSVPs: defineTable({
  eventId: v.id("events"),
  userId: v.id("users"),
  status: v.union(v.literal("going"), v.literal("maybe"), v.literal("not_going")),
  createdAt: v.number(),
})
  .index("by_event", ["eventId"])
  .index("by_user", ["userId"])
```

---

## 7. Phase 6 — Professional & Academic Tools (Weeks 31-36)

### 7.1 Research Collaboration Hub *(inspired by: ResearchGate, Google Scholar profiles)*

**Features:**
- Research paper uploads with metadata (title, abstract, authors, DOI)
- Citation tracking and citation graph visualization
- Research interest tags on profiles
- "Looking for collaborators" flag on projects
- Collaborative document links (Google Docs, Overleaf)
- Research timeline / publication history
- Lab/research group pages

---

### 7.2 Academic Portfolio *(inspired by: LinkedIn profile, GitHub contribution graph)*

**Features:**
- Project showcase with description, tech stack, links, screenshots
- Academic timeline (courses completed, certifications, publications)
- Contribution/activity heatmap (GitHub-style grid showing daily activity)
- Downloadable academic resume (auto-generated PDF)
- GPA/grades section (private, optionally shared)
- Course reviews and professor ratings

---

### 7.3 Job / Internship Board *(inspired by: LinkedIn Jobs, Indeed)*

**Features:**
- Post job/internship listings (Faculty and verified recruiters)
- Apply with profile (one-click apply)
- Job search with filters (role, location, duration, skills required)
- "Easy Apply" with pre-filled profile data
- Application tracking (Applied, Viewed, Shortlisted, Rejected)
- Job alerts for matching positions
- Company/organization pages

---

### 7.4 Study Resources & Knowledge Base *(inspired by: Stack Overflow, Notion, Course Hero)*

**Features:**
- Upload study materials (notes, slides, past papers) tagged by course/subject
- Q&A section with upvote/downvote, accepted answers
- Course-specific resource collections
- Flashcard creation and spaced-repetition study mode
- Collaborative note-taking for shared courses
- Resource rating and review system

---

### 7.5 Achievement & Gamification System *(inspired by: Reddit karma, Discord levels, Stack Overflow reputation)*

**Features:**
- **Reputation points** earned from posts, comments, endorsements, helpful answers
- **Achievement badges**:
  - 🌱 Newcomer (complete profile)
  - 💬 Conversationalist (50 comments)
  - ⭐ Rising Star (100 followers)
  - 🎓 Scholar (10 endorsed skills)
  - 🔬 Researcher (share 5 papers)
  - 🏆 Campus Legend (1000 reputation)
- Leaderboard (weekly/monthly/all-time, by university)
- Level system (Level 1-50 based on cumulative points)
- Weekly XP challenges ("Post 3 times", "Comment on 5 posts")

**Schema Addition:**
```typescript
achievements: defineTable({
  userId: v.id("users"),
  badge: v.string(),
  name: v.string(),
  description: v.string(),
  earnedAt: v.number(),
})
  .index("by_user", ["userId"])

// Add to users table:
reputation: v.number(),
level: v.number(),
```

---

## 8. Phase 7 — Monetization & Growth (Weeks 37-42)

### 8.1 Premium Features (Campus Connect Pro)

- Verification badge (✓) for verified students/faculty
- Analytics dashboard (who viewed your profile, post reach)
- Advanced search filters
- Priority in suggestion algorithms
- Custom profile themes
- Larger file uploads (100MB vs 25MB)
- Ad-free experience

### 8.2 Advertising Platform *(inspired by: Facebook Ads, LinkedIn Sponsored Content)*

- Sponsored posts in feed (marked as "Sponsored")
- Targeted ads based on university, role, skills, interests
- Campus event promotions
- Department/organization promoted content
- Self-serve ad creation tool

### 8.3 Campus Marketplace *(inspired by: Facebook Marketplace)*

- Buy/sell textbooks, equipment, furniture
- Category filters (Books, Electronics, Furniture, Services)
- Price negotiation via DMs
- Item condition ratings
- Pickup location coordination
- Listing expiration (auto-expire after 30 days)

### 8.4 Push Notifications & Email Digests

- Web Push Notifications (via Service Worker + Push API)
- Daily/weekly email digest of activity
- Smart notification batching (group multiple likes into one notification)
- Notification sound preferences

---

## 9. Scaling Architecture

### 9.1 Current Architecture (works up to ~10K users)

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Next.js  │────▶│  Clerk  │     │ Convex  │
│ Frontend │     │  Auth   │     │ Backend │
│ (Vercel) │────▶│         │────▶│  (DB +  │
│          │     │ Webhooks│     │ Funcs)  │
└─────────┘     └─────────┘     └─────────┘
```

### 9.2 Scaled Architecture (10K - 1M+ users)

```
                        ┌──────────────┐
                        │   CDN Edge   │
                        │ (Vercel/CF)  │
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────┴─────┐       ┌──────┴──────┐
              │  Next.js   │       │  Next.js    │
              │ Instance 1 │  ...  │ Instance N  │
              └─────┬─────┘       └──────┬──────┘
                    │                     │
          ┌────────┴─────────────────────┴────────┐
          │              API Gateway              │
          │         (Rate Limit + Auth)           │
          └──┬────────┬────────┬────────┬────────┘
             │        │        │        │
    ┌────────┴──┐ ┌───┴───┐ ┌─┴──────┐ ┌┴─────────┐
    │  Convex   │ │ Redis │ │ Object │ │   Search  │
    │ (Primary  │ │ Cache │ │Storage │ │  (Typesense│
    │  DB +     │ │(Upstash│ │ (R2/  │ │  or Meil- │
    │  Realtime)│ │  )     │ │  S3)  │ │  isearch) │
    └───────────┘ └───────┘ └───────┘ └──────────┘
             │
    ┌────────┴──────────┐
    │  Background Jobs  │
    │  (Convex Crons +  │
    │   Inngest/Trigger)│
    └───────────────────┘
             │
    ┌────────┴──────────┐
    │  Recommendation   │
    │    Engine         │
    │  (Python/ML or    │
    │   Convex actions) │
    └───────────────────┘
```

### 9.3 Scaling Strategies by Component

| Component | Current | Scaled Solution |
|-----------|---------|-----------------|
| **Database** | Convex (managed) | Convex handles horizontal scaling automatically. For extreme scale: shard by university |
| **Auth** | Clerk (managed) | Clerk scales automatically. Add rate limiting on auth endpoints |
| **File Storage** | Convex file storage | Move to Cloudflare R2 / AWS S3 for large media (videos, documents) |
| **Search** | Client-side filter | Add Typesense or Meilisearch for full-text search with typo tolerance |
| **Cache** | None | Add Upstash Redis for: session cache, trending computation cache, feed cache |
| **Real-time** | Convex subscriptions | Convex handles WebSocket scaling. For chat: consider dedicated WebSocket service at extreme scale |
| **CDN** | Vercel Edge | Cloudflare or Vercel Edge for static assets, image optimization, edge caching |
| **Background Jobs** | Convex crons | Convex scheduled functions for recommendations, cleanup, digests. Inngest for complex workflows |
| **Monitoring** | None | Add Sentry (errors), Vercel Analytics (performance), PostHog (product analytics) |
| **CI/CD** | Manual | GitHub Actions → Vercel preview deployments → production promotion |

### 9.4 Performance Optimizations

| Optimization | Details |
|-------------|---------|
| **Image optimization** | Next.js `<Image>` with `next/image` (already using). Add Cloudflare Image Resizing for user uploads |
| **Code splitting** | Dynamic `import()` for heavy components (rich text editor, video player, charts) |
| **Virtualized lists** | `react-window` or `@tanstack/virtual` for long feeds, member lists, chat histories |
| **Debounced search** | Already implemented (300ms). Extend to all real-time inputs |
| **Pagination** | Cursor-based (already implemented). Ensure consistent page sizes |
| **Selective subscriptions** | Only subscribe to data the user is viewing (already doing with `"skip"` on comments) |
| **Service Worker** | Cache shell, precache critical routes, offline fallback page |
| **Database indexes** | Add compound indexes for common query patterns (see schema additions above) |
| **Bundle analysis** | `@next/bundle-analyzer` to identify and tree-shake large dependencies |
| **ISR / SSG** | Statically generate landing page, about page, help pages. ISR for public profiles |

### 9.5 Infrastructure Scaling Milestones

| Users | Infrastructure Changes Needed |
|-------|------------------------------|
| **< 1K** | Current stack is fine. No changes needed. |
| **1K - 10K** | Add Redis cache for trending/suggestions. Set up monitoring (Sentry). Add rate limiting. |
| **10K - 50K** | External search service (Typesense). Migrate large media to S3/R2. Add CDN rules. Background job queue for recommendations. |
| **50K - 200K** | Dedicated recommendation computation pipeline. Database read replicas if needed. WebSocket connection pooling for chat. Email service (Resend/SendGrid) for digests. |
| **200K - 1M** | Microservice extraction for chat and notifications. Event-driven architecture (Kafka/Inngest). ML model serving for recommendations. Geographic distribution (multi-region). |
| **1M+** | Full microservices. Dedicated ML infrastructure. Data warehouse for analytics. Multiple database shards. Global CDN with edge functions. |

---

## 10. Database Schema Additions

### Complete New Tables Summary

| Table | Phase | Purpose |
|-------|-------|---------|
| `reactions` | 1 | Multi-emoji reactions on posts and comments |
| `bookmarks` | 1 | Save posts to collections |
| `hashtags` | 1 | Tag registry with post counts |
| `postHashtags` | 1 | Many-to-many post↔hashtag |
| `notifications` | 1 | In-app notification system |
| `reposts` | 1 | Repost/quote post functionality |
| `conversations` | 2 | DM and group chat containers |
| `messages` | 2 | Chat messages |
| `conversationParticipants` | 2 | Per-user conversation state |
| `suggestions` | 4 | Pre-computed friend suggestions |
| `skillEndorsements` | 4 | Skill endorsement tracking |
| `communities` | 5 | Group/community definitions |
| `communityMembers` | 5 | Membership and roles |
| `events` | 5 | Campus events |
| `eventRSVPs` | 5 | Event attendance |
| `achievements` | 6 | Gamification badges |
| `stories` | 3 | Ephemeral 24h content |
| `storyViews` | 3 | Story view tracking |
| `polls` | 3 | Poll definitions |
| `pollVotes` | 3 | Poll vote tracking |

### Existing Table Modifications

| Table | Fields to Add | Phase |
|-------|--------------|-------|
| `users` | `reputation`, `level`, `status`, `customStatus`, `lastSeenAt`, `notificationPreferences` | 2-6 |
| `posts` | `communityId`, `mediaUrls`, `mediaType`, `linkPreview`, `shareCount`, `repostOfId`, `flair` | 1-5 |
| `comments` | `parentCommentId`, `depth`, `replyCount`, `likeCount` | 5 |

---

## 11. Priority Matrix

### Impact vs Effort Analysis

```
HIGH IMPACT
    │
    │  ★ Notifications        ★ DMs / Chat
    │  ★ Friend Suggestions   ★ Rich Media Posts
    │  ★ Feed Ranking         ★ Communities
    │
    │  ◆ Hashtags/Trending    ◆ Reactions
    │  ◆ Bookmarks            ◆ Search Upgrade
    │  ◆ Mentions             ◆ Stories
    │
    │  ○ Polls                ○ Events
    │  ○ Achievements         ○ Markdown Editor
    │
    │  △ Voice/Video          △ Marketplace
    │  △ Job Board            △ Research Hub
    │
LOW ├──────────────────────────────────── HIGH EFFORT
IMPACT
```

**Legend:** ★ = Do first | ◆ = High value, moderate effort | ○ = Nice to have | △ = Long-term

### Recommended Build Order

| # | Feature | Effort | Impact | Dependencies |
|---|---------|--------|--------|-------------|
| 1 | Notification System | Medium | Critical | None |
| 2 | Reactions (replace likes) | Low | High | None |
| 3 | Bookmarks | Low | High | None |
| 4 | Hashtags & Trending | Medium | High | None |
| 5 | Mentions (@user) | Medium | High | Notifications |
| 6 | Share / Repost | Medium | Medium | None |
| 7 | Friend Suggestion Engine | High | Critical | Follow graph data |
| 8 | Feed Ranking Algorithm | High | Critical | Engagement data |
| 9 | Rich Media Posts | High | High | File storage |
| 10 | Direct Messaging | Very High | Critical | Notifications |
| 11 | Nested Comment Threads | Medium | Medium | None |
| 12 | Communities / Groups | Very High | High | None |
| 13 | Stories | Medium | Medium | File storage |
| 14 | Polls | Low | Medium | None |
| 15 | Events | Medium | Medium | Communities (optional) |
| 16 | Search Upgrade | High | High | None |
| 17 | Skill Endorsements | Low | Medium | None |
| 18 | Achievements / Gamification | Medium | Medium | Reputation system |
| 19 | Content Recommendations | High | High | Feed ranking + engagement data |
| 20 | Group Chat | High | Medium | DMs |
| 21 | Academic Portfolio | Medium | Medium | None |
| 22 | Job Board | High | Medium | Company pages |
| 23 | Study Resources / Q&A | High | Medium | Communities |
| 24 | Voice / Video Calls | Very High | Medium | DMs + WebRTC |
| 25 | Marketplace | High | Low | DMs |

---

## Quick Reference: Platform Inspiration Map

| Our Feature | Facebook | WhatsApp | LinkedIn | Reddit | Discord | Twitter/X |
|-------------|----------|----------|----------|--------|---------|-----------|
| Reactions | ✅ 6 emoji | — | ✅ 6 reactions | ✅ Upvote/Down | ✅ Custom emoji | ✅ Like |
| Stories | ✅ Stories | ✅ Status | ✅ Stories | — | — | ✅ Fleets (RIP) |
| DMs | ✅ Messenger | ✅ Core | ✅ InMail | ✅ Chat | ✅ Core | ✅ DMs |
| Groups | ✅ Groups | ✅ Groups | ✅ Groups | ✅ Subreddits | ✅ Servers | ✅ Communities |
| Events | ✅ Events | — | ✅ Events | — | ✅ Events | — |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trending | ✅ | — | ✅ | ✅ r/popular | — | ✅ Trends |
| Bookmarks | ✅ Saved | — | ✅ Saved | ✅ Saved | ✅ Pins | ✅ Bookmarks |
| Polls | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mentions | ✅ | ✅ | ✅ | ✅ u/user | ✅ @user | ✅ @user |
| Rich Media | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Repost/Share | ✅ Share | ✅ Forward | ✅ Repost | ✅ Crosspost | — | ✅ Retweet |
| Friend Suggest | ✅ PYMK | — | ✅ PYMK | ✅ Similar | ✅ Mutual | ✅ Suggested |
| Feed Ranking | ✅ ML | — | ✅ ML | ✅ Hot/Best | — | ✅ For You |
| Endorsements | — | — | ✅ Skills | — | — | — |
| Voice/Video | ✅ | ✅ | — | — | ✅ | ✅ Spaces |
| Marketplace | ✅ | — | — | — | — | — |
| Jobs | — | — | ✅ Jobs | — | — | — |

---

*This document should be treated as a living roadmap. Prioritize based on user feedback and campus-specific needs. Each phase can be parallelized across team members — features within a phase are mostly independent.*
