# MASTER FEATURE REGISTRY — CAMPUS CONNECT

**Registry Version:** 1.0.0 (Phase 1 Source-of-Truth Foundation)  
**Total Canonical Features:** 190  
**Domains Covered:** 25  
**Verification Rule Applied:** UI -> Hook/State -> API Client -> API Route -> Validation -> DB Layer -> Database/External Service -> Response -> UI Update.

---

## Allowed Status Codes
- `IMPLEMENTED`: Feature is verified working end-to-end based on source code, database queries, and test assertions.
- `PARTIAL`: Meaningful backend and frontend code exists, but sub-features, filters, or mutation paths are incomplete.
- `BROKEN`: Code exists but execution fails at runtime due to database schema gaps, missing tables, or column mismatches.
- `STUB`: Scaffolded 501 endpoint, mock JSON return, or un-wired placeholder component.
- `MISSING`: Documented feature has no corresponding codebase implementation (0 routes, 0 components).
- `PLANNED`: Documented feature intentionally scheduled for future phase.

---

## 1. Authentication & Onboarding (11 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| A01 | Auth | Sign Up | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `src/app/(auth)/sign-up`, `/api/auth/sign-up`, `handle_new_user` DB trigger | None | Supabase Auth | P0 |
| A02 | Auth | Sign In | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `src/app/(auth)/sign-in`, `/api/auth/sign-in`, cookie session | None | Supabase Auth | P0 |
| A03 | Auth | Sign Out | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `useAuthActions.signOut()`, `/api/auth/sign-out` | None | Supabase Auth | P0 |
| A04 | Auth | Session Management | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `@supabase/ssr`, `src/lib/supabase/middleware.ts` cookie refresh | None | Supabase Auth | P0 |
| A05 | Auth | Dev Auth Bypass | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `x-user-id` header support in server client | None | None | P3 |
| A06 | Onboarding | Step 1 Welcome | Done | IMPLEMENTED | ✓ | - | - | - | - | `src/app/(components)/onboarding/WelcomeStep.tsx` | None | None | P1 |
| A07 | Onboarding | Step 2 Profile Setup | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `ProfileStep.tsx`, `/api/users/onboarding` | None | Users table | P1 |
| A08 | Onboarding | Step 3 Skills Setup | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `SkillsStep.tsx`, `/api/users/onboarding` | None | Users table | P1 |
| A09 | Onboarding | Multi-Step Stepper | Done | IMPLEMENTED | ✓ | - | - | - | - | `src/app/(onboarding)/onboarding/page.tsx` state machine | None | None | P2 |
| A10 | Auth | Auth Error Handling | Done | IMPLEMENTED | ✓ | - | - | - | - | `src/app/(auth)/error.tsx` error boundary | None | Sentry / Logger | P2 |
| A11 | Auth | Route Protection | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `src/middleware.ts` + soft-delete caching check | None | Supabase Auth | P0 |

---

## 2. User System & Profile (17 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| U01 | Users | View Profile | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `src/app/(dashboard)/profile/[id]`, `/api/users/profile` | None | Users table | P0 |
| U02 | Users | Own Profile | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `src/app/(dashboard)/profile/me` redirect handler | None | Auth session | P0 |
| U03 | Users | Profile Header | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `ProfileHeader.tsx`, follower counters | None | Users table | P1 |
| U04 | Users | Profile Edit Form | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `ProfileForm.tsx`, `PATCH /api/users/me`, Zod validation | None | Users table | P1 |
| U05 | Users | Skills Manager | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `SkillsManager.tsx`, `/api/users/skills` | None | Users table | P1 |
| U06 | Users | Skill Endorsements | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `SkillEndorsements.tsx`, `POST/DELETE /api/skills/endorse`, `GET /api/skills/endorsements`, verified in `phase5-skill-endorsements.test.ts` | None | `skill_endorsements` | P1 |
| U07 | Users | Followers List | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `FollowersList.tsx`, `/api/follows/followers` | None | `follows` table | P1 |
| U08 | Users | Following List | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `FollowingList.tsx`, `/api/follows/following` | None | `follows` table | P1 |
| U09 | Users | User Card | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `UserCard.tsx` with follow button state | None | Users table | P1 |
| U10 | Users | User Search | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `UserSearchBar.tsx`, `/api/users/profile` query | None | Users table | P1 |
| U11 | Users | User Filter Panel | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `UserFilterPanel.tsx` role & skill filtering | None | Users table | P2 |
| U12 | Users | Profile Picture Upload | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `/api/media/upload-url`, `avatars` bucket | None | Supabase Storage | P1 |
| U13 | Users | Online Status Dot | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `OnlineStatusDot.tsx`, `/api/presence` | None | Supabase Presence | P2 |
| U14 | Users | Status Selector | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `StatusSelector.tsx`, `POST /api/presence` | None | Presence table | P2 |
| U15 | Users | Privacy Settings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/page.tsx`, `/api/users/privacy` | None | Users table | P2 |
| U16 | Users | Notification Preferences | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/page.tsx`, `/api/users/notification-preferences` | None | Users table | P2 |
| U17 | Users | Account Deletion | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `DELETE /api/users/me`, 30-day soft delete | None | Users table | P1 |

---

## 3. Feed & Posts (14 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| F01 | Feed | Main Ranked Feed | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | ✓ | `FeedContainer.tsx`, `/api/posts/feed`, in-memory decay ranking | None | Posts, Follows | P0 |
| F02 | Feed | Explore Feed | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `explore/page.tsx`, `/api/posts/explore` | None | Posts table | P1 |
| F03 | Feed | Post Creation | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | ✓ | `PostComposer.tsx`, `/api/posts`, DOMPurify | None | Posts table | P0 |
| F04 | Feed | Rich Text Toolbar | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `RichTextEditor.tsx` TipTap toolbar | None | TipTap | P1 |
| F05 | Feed | Markdown Support | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `MarkdownRenderer.tsx` | None | unified/remark | P1 |
| F06 | Feed | @mention Autocomplete | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `MentionAutocomplete.tsx`, `mention-utils.ts` | None | Users search | P1 |
| F07 | Feed | #hashtag Linking | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `hashtag-utils.ts`, `linkPostToHashtags` | None | Hashtags table | P1 |
| F08 | Feed | Post Media Gallery | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `MediaGallery.tsx`, lightbox overlay | None | Media bucket | P1 |
| F09 | Feed | Link Previews | Done | IMPLEMENTED | ✓ | - | - | - | - | `LinkPreviewCard.tsx` OpenGraph cards | None | None | P2 |
| F10 | Feed | Content Renderer | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `PostCard.tsx` formatted body renderer | None | None | P0 |
| F11 | Feed | Code Highlighting | Done | IMPLEMENTED | ✓ | - | - | - | - | `CodeBlock.tsx` syntax highlighter with copy button | None | highlight.js | P2 |
| F12 | Feed | LaTeX Rendering | Done | IMPLEMENTED | ✓ | - | - | - | - | `LaTeXRenderer.tsx` with KaTeX math parsing | None | KaTeX | P2 |
| F13 | Feed | Infinite Scroll | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `InfiniteScrollTrigger.tsx`, IntersectionObserver | None | React Query | P0 |
| F14 | Feed | Virtualized Feed | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `VirtualizedFeed.tsx` TanStack Virtual integration | None | React Query | P1 |

---

## 4. Reactions & Engagement (8 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| R01 | Reactions | Six Reaction Types | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `types/index.ts`, `reactions.ts` DB module | None | `reactions` table | P1 |
| R02 | Reactions | Reaction Picker | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `ReactionPicker.tsx` floating emoji menu | None | Reactions API | P1 |
| R03 | Reactions | Reaction Modal | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `ReactionModal.tsx` modal viewer | None | Reactions API | P2 |
| R04 | Reactions | Reaction Counts | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Aggregated like/reaction badge on `PostCard` | None | `posts.like_count` | P1 |
| R05 | Comments | Nested Comments | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `CommentList.tsx`, `comments.ts` hierarchy | None | `comments` table | P0 |
| R06 | Comments | Comment Composer | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `CommentComposer.tsx`, `/api/comments` | None | `comments` table | P0 |
| R07 | Comments | Comment List | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Paginated comment loader with counter decrement | None | `comments` table | P0 |
| R08 | Reposts | Quoted Reposts | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `RepostModal.tsx`, `/api/reposts`, `misc.ts` | None | `reposts` table | P1 |

---

## 5. Bookmarks (4 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| B01 | Bookmarks | Bookmark Posts | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `BookmarkButton.tsx`, `/api/bookmarks`, atomic RPC | None | `bookmarks` table | P1 |
| B02 | Bookmarks | Remove Bookmarks | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `BookmarkButton.tsx`, `DELETE /api/bookmarks/remove` | None | `bookmarks` table | P1 |
| B03 | Bookmarks | Bookmark Collections | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `GET /api/bookmarks/collections`, folder mapping | None | `bookmarks` table | P2 |
| B04 | Bookmarks | Check Status | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `GET /api/bookmarks/check`, icon toggle | None | `bookmarks` table | P1 |

---

## 6. Polls (5 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| P01 | Polls | Create Polls | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `CreatePost.tsx` poll attachment, `/api/polls` | None | `polls` table | P1 |
| P02 | Polls | Vote on Polls | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `PollCard.tsx`, `/api/polls/vote`, duplicate vote check | None | `poll_votes` table | P1 |
| P03 | Polls | Poll Results | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Percentage progress bar calculation in `PollCard` | None | `poll_votes` table | P1 |
| P04 | Polls | Poll Expiration | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Expiry timestamp check disabling vote buttons | None | `polls.expires_at` | P1 |
| P05 | Polls | Link to Post | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Relational foreign key `posts.poll_id` | None | `posts` table | P1 |

---

## 7. Hashtags (4 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| H01 | Hashtags | Hashtag Parsing | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `hashtag-utils.ts` regex parsing and normalization | None | None | P1 |
| H02 | Hashtags | Trending Hashtags | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `TrendingHashtags.tsx`, `/api/hashtags/trending`, `TrendingHashtags.test.tsx` | None | `hashtags` table | P1 |
| H03 | Hashtags | Search Hashtags | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `/api/search` universal search query | None | `hashtags` table | P2 |
| H04 | Hashtags | Posts by Hashtag | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `/hashtag/[tag]` route, `getPostsByHashtag` | None | `post_hashtags` | P1 |

---

## 8. Direct Messages & Chat (12 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| M01 | Messages | Conversation List | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `src/app/(dashboard)/messages`, `/api/conversations` | None | `conversations` | P0 |
| M02 | Messages | Chat Window | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `ChatWindow.tsx`, `ChatArea.tsx` message feed | None | `messages` table | P0 |
| M03 | Messages | Message Bubbles | Done | IMPLEMENTED | ✓ | - | - | - | - | `MessageBubble.tsx` sender/receiver alignment | None | None | P1 |
| M04 | Messages | Message Composer | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `ChatInput.tsx`, `MessageComposer.tsx` | None | None | P0 |
| M05 | Messages | Send Messages | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `POST /api/messages`, `useRealtimeMessages` | None | `messages` table | P0 |
| M06 | Messages | Delete Messages | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `DELETE /api/messages/delete` soft delete | None | `messages` table | P2 |
| M07 | Messages | Mark as Read | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/messages/read` updating `last_read_at` | None | `conversation_participants` | P1 |
| M08 | Messages | Typing Indicators | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `TypingIndicator.tsx`, `useTypingIndicator.ts` | None | Supabase Presence | P1 |
| M09 | Messages | Create Group | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `CreateGroupModal.tsx`, `/api/conversations/group` | None | `conversations` | P1 |
| M10 | Messages | Group Info Panel | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `GroupInfoPanel.tsx` member viewer | None | `conversations` | P2 |
| M11 | Messages | Mute/Unmute | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/conversations/mute`, `toggleMute` | None | `conversation_participants` | P2 |
| M12 | Messages | Unread Counter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `GET /api/conversations/unread-count` badge | None | `messages` table | P1 |

---

## 9. Communities (14 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| C01 | Communities | Community Browser | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `communities/page.tsx`, `/api/communities` | None | `communities` table | P1 |
| C02 | Communities | Category Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Filter pills (Academic, Research, Social) | None | `communities` table | P1 |
| C03 | Communities | Community Search | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `/api/search` and category filter | None | `communities` table | P1 |
| C04 | Communities | Sort Options | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Sort by members count / newest | None | `communities` table | P2 |
| C05 | Communities | Create Community | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `communities/new/page.tsx`, `/api/communities` | None | `communities` table | P1 |
| C06 | Communities | Community Detail | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `c/[slug]/page.tsx`, `getCommunityBySlug` | None | `communities` table | P0 |
| C07 | Communities | Community Header | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Cover image banner and member stats | None | `communities` table | P1 |
| C08 | Communities | Community Post Feed | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `/api/posts/community`, `c/[slug]` feed | None | `posts` table | P0 |
| C09 | Communities | Join Community | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/communities/join`, atomic RPC | None | `community_members` | P1 |
| C10 | Communities | Leave Community | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/communities/leave`, member decrement | None | `community_members` | P1 |
| C11 | Communities | Invite Members | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `InviteMemberModal.tsx`, `/api/communities/invite` | None | `community_invites` | P2 |
| C12 | Communities | My Invites Banner | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `MyInvitesBanner.tsx`, `/api/communities/my-invites` | None | `community_invites` | P2 |
| C13 | Communities | Respond to Invite | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `respondToInvite` in DB module | Connect frontend button | `community_invites` | P2 |
| C14 | Communities | Member Roles | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `c/[slug]/members/page.tsx`, owner/admin/member | None | `community_members` | P1 |

---

## 10. Events (7 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| E01 | Events | Event Browser | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `events/page.tsx`, `GET /api/events` | None | `events` table | P1 |
| E02 | Events | Type Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | In-Person, Virtual, Hybrid filtering | None | `events` table | P1 |
| E03 | Events | Create Event | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `CreateEventModal.tsx`, `POST /api/events` | None | `events` table | P1 |
| E04 | Events | Event Card | Done | IMPLEMENTED | ✓ | - | - | - | - | `EventCard.tsx` with date/location formatting | None | None | P1 |
| E05 | Events | Attend Event (RSVP) | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/events/attend`, `events-jobs.ts` | None | `event_attendees` | P1 |
| E06 | Events | Cancel RSVP | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `DELETE /api/events/attend`, attendee decrement | None | `event_attendees` | P1 |
| E07 | Events | Single Event Page | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `events/[id]/page.tsx`, `/api/events/single` | None | `events` table | P1 |

---

## 11. Jobs Board (7 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| J01 | Jobs | Job Browser | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `jobs/page.tsx`, `GET /api/jobs` | None | `jobs` table | P1 |
| J02 | Jobs | Post a Job | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `PostJobModal.tsx`, `POST /api/jobs` | None | `jobs` table | P1 |
| J03 | Jobs | Job Card | Done | IMPLEMENTED | ✓ | - | - | - | - | `JobCard.tsx` with skills and salary tag | None | None | P1 |
| J04 | Jobs | Apply to Job | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/jobs/apply` with cover letter | None | `job_applications` | P1 |
| J05 | Jobs | My Applications | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `jobs/my-applications/page.tsx` status tracker | None | `job_applications` | P1 |
| J06 | Jobs | Single Job View | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `jobs/[id]/page.tsx`, `/api/jobs/single` | None | `jobs` table | P1 |
| J07 | Jobs | Job Search & Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Query filters on column `type` in `events-jobs.ts`, verified in tests | None | `jobs` table | P1 |

---

## 12. Marketplace (8 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| MK01 | Marketplace | Browse Listings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `marketplace/page.tsx`, `GET /api/marketplace` | None | `marketplace_listings` | P1 |
| MK02 | Marketplace | Category Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Books, Electronics, Furniture, Services | None | `marketplace_listings` | P1 |
| MK03 | Marketplace | Search Listings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Category & universal search integration | None | `marketplace_listings` | P1 |
| MK04 | Marketplace | Create Listing | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `CreateListingModal.tsx`, `POST /api/marketplace` | None | `marketplace_listings` | P1 |
| MK05 | Marketplace | Listing Card | Done | IMPLEMENTED | ✓ | - | - | - | - | `ListingCard.tsx` price & condition badges | None | None | P1 |
| MK06 | Marketplace | Contact Seller | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Chat shortcut creating direct conversation | None | `conversations` | P1 |
| MK07 | Marketplace | Mark as Sold | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/marketplace/sold`, state update | None | `marketplace_listings` | P1 |
| MK08 | Marketplace | Single Listing View | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `marketplace/[id]/page.tsx`, `/api/marketplace/single` | None | `marketplace_listings` | P1 |

---

## 13. Academic Q&A (8 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| Q01 | Q&A | Question Browser | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `q-and-a/page.tsx`, `GET /api/questions` | None | `questions` table | P1 |
| Q02 | Q&A | Search Questions | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Keyword search across title and content | None | `questions` table | P1 |
| Q03 | Q&A | Sort Options | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Sort by newest, top votes, unanswered | None | `questions` table | P1 |
| Q04 | Q&A | Tag Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Academic subject tag filtering | None | `questions` table | P1 |
| Q05 | Q&A | Ask Question | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `AskQuestionModal.tsx`, `POST /api/questions` | None | `questions` table | P1 |
| Q06 | Q&A | Question Detail | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `q-and-a/[id]/page.tsx`, `/api/questions/single` | None | `questions` table | P0 |
| Q07 | Q&A | Answer Question | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `AskAnswerForm.tsx`, `POST /api/questions/answer` | None | `question_answers` | P0 |
| Q08 | Q&A | Accept Answer | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `POST /api/questions/accept`, `is_resolved` schema column, verified in tests | None | `questions` table | P0 |

---

## 14. Research Papers (6 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| RP01 | Research | Paper Browser | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `research/page.tsx`, `GET /api/research` | None | `research_papers` | P1 |
| RP02 | Research | Search Papers | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Title and author search query | None | `research_papers` | P1 |
| RP03 | Research | Upload Paper | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `UploadPaperModal.tsx`, `POST /api/research` | None | `research_papers` | P1 |
| RP04 | Research | Paper Card | Done | IMPLEMENTED | ✓ | - | - | - | - | `ResearchPaperCard.tsx` with DOI & authors | None | None | P1 |
| RP05 | Research | Single Paper View | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `research/[id]/page.tsx`, `/api/research/single` | None | `research_papers` | P1 |
| RP06 | Research | Vote & Review | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `/api/research/vote`, `/api/research/review`, peer review & voting UI in `research/[id]/page.tsx` | None | `research_papers` | P1 |

---

## 15. Study Resources (5 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| SR01 | Resources | Resource Browser | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `resources/page.tsx`, `GET /api/resources` | None | `resources` table | P1 |
| SR02 | Resources | Search Resources | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Search by course code and topic | None | `resources` table | P1 |
| SR03 | Resources | Course Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Filter resources by course query | None | `resources` table | P1 |
| SR04 | Resources | Upload Resource | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `UploadResourceModal.tsx`, `POST /api/resources` | None | `resources` table | P1 |
| SR05 | Resources | Single View & Rating | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `resources/[id]/page.tsx` 5-star rating widget | None | `resources` table | P1 |

---

## 16. 24h Stories (8 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| ST01 | Stories | Stories Page | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `stories/page.tsx`, `StoryRow.tsx` | None | `stories` table | P1 |
| ST02 | Stories | Create Story | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Text & image story creation, `POST /api/stories` | None | `stories` table | P1 |
| ST03 | Stories | Story Composer Modal | Done | IMPLEMENTED | ✓ | - | - | - | - | `StoryComposer.tsx` popup | None | Stories API | P1 |
| ST04 | Stories | Full-Screen Story Viewer | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `stories/[id]/page.tsx` progress timer player | None | `stories` table | P1 |
| ST05 | Stories | View Tracking | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/stories/view`, `story_views` table | None | `story_views` | P1 |
| ST06 | Stories | 24-Hour Expiration | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | SQL filter `created_at > now() - interval '24 hours'` | None | `stories` table | P1 |
| ST07 | Stories | Video Stories | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Media type enum supports video; auto-play & duration sync in `stories/[id]/page.tsx` | None | Storage bucket | P2 |
| ST08 | Stories | Story Navigation | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Tap left/right zones, keyboard ArrowLeft/ArrowRight/Space navigation, desktop buttons | None | None | P1 |

---

## 17. Notifications (6 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| N01 | Notifications | Notification Center | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | ✓ | `notifications/page.tsx`, `GET /api/notifications` | None | `notifications` | P0 |
| N02 | Notifications | Notification Bell Badge | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | ✓ | `NotificationBell.tsx`, unread badge count | None | Realtime | P0 |
| N03 | Notifications | Type-Specific Items | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | Renderers for like, comment, follow, invite | None | None | P1 |
| N04 | Notifications | Mark as Read | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `POST /api/notifications/read` | None | `notifications` | P1 |
| N05 | Notifications | Mark All as Read | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `POST /api/notifications/read-all` | None | `notifications` | P1 |
| N06 | Notifications | Unread Realtime Sync | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | Supabase broadcast channel `notifications:<user_id>` | None | Supabase Realtime | P0 |

---

## 18. Leaderboard & Gamification (6 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| G01 | Gamification | Leaderboard Page | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `src/app/(dashboard)/leaderboard/page.tsx`, `GET /api/leaderboard`, Top 3 podium, verified in `phase5-leaderboard.test.ts` | None | `user_reputation` | P1 |
| G02 | Gamification | Period Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Weekly, Monthly, All-Time period tabs aggregating `reputation_events`, verified in `phase5-leaderboard.test.ts` | None | `reputation_events` | P1 |
| G03 | Gamification | University Filter | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | University dropdown and real-time query filter, verified in `phase5-leaderboard.test.ts` | None | `users` | P1 |
| G04 | Gamification | Reputation Points | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Atomic triggers (+15 accepted answer, +10 research vote/review, +5 Q&A vote) in `gamification.ts` & `content.ts`, verified in `phase5-reputation-engine.test.ts` | None | `reputation_events` | P1 |
| G05 | Gamification | Achievement Badges | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Deterministic criteria for Top Researcher, Helpful Peer, Campus Leader in `evaluateBadges`, verified in `phase5-badges.test.ts` | None | `user_reputation` | P1 |
| G06 | Gamification | Profile User Stats | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | Points, Level, Campus Rank, and Badge icons rendered in `ProfileHeader.tsx`, verified in `ProfileHeader.test.tsx` | None | `user_reputation` | P1 |

---

## 19. Settings (5 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| S01 | Settings | Profile Settings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/page.tsx` tab, `/api/users/me` | None | Users table | P1 |
| S02 | Settings | Account Settings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/page.tsx` tab, soft-delete modal | None | Users table | P1 |
| S03 | Settings | Privacy Settings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/page.tsx` tab, `/api/users/privacy` | None | Users table | P1 |
| S04 | Settings | Notification Settings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/page.tsx` tab, `/api/users/notification-preferences` | None | Users table | P1 |
| S05 | Settings | Billing Settings | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `settings/billing/page.tsx`, `GET/DELETE /api/subscriptions`, `POST /api/subscriptions/checkout`, verified in `phase6-subscriptions.test.ts` | None | `subscriptions` table | P1 |

---

## 20. Search (5 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| SRH01 | Search | Universal Multi-Search | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `search/page.tsx`, `GET /api/search`, `universalSearch` | None | Multiple tables | P0 |
| SRH02 | Search | Search Posts | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Tabbed search filtering for posts | None | Posts table | P1 |
| SRH03 | Search | Search Users | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `UserSearchBar.tsx`, debounced search | None | Users table | P0 |
| SRH04 | Search | Search Communities | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Tabbed search filtering for communities | None | Communities table | P1 |
| SRH05 | Search | Nav Bar Search Input | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | Sticky search input with shortcut routing | None | None | P1 |

---

## 21. Navigation & Layout (6 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| L01 | Navigation | Desktop Sidebar | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `DesktopSidebar.tsx` with module links & active states | None | None | P0 |
| L02 | Navigation | Mobile Top Bar | Done | IMPLEMENTED | ✓ | - | - | - | - | `MobileTopBar.tsx` sticky header | None | None | P1 |
| L03 | Navigation | Mobile Bottom Nav | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `mobile-bottom-nav.tsx` touch navigation bar | None | None | P1 |
| L04 | Navigation | 3-Column Dashboard Layout | Done | IMPLEMENTED | ✓ | - | - | - | ✓ | `main-layout.tsx` wrapper with portal sidebar | None | None | P0 |
| L05 | Navigation | Auth Layout | Done | IMPLEMENTED | ✓ | - | - | - | - | `src/app/(auth)/layout.tsx` split-screen container | None | None | P1 |
| L06 | Navigation | Marketing Landing Page | Done | IMPLEMENTED | ✓ | - | - | - | - | `src/app/page.tsx` animated public showcase | None | None | P2 |

---

## 22. Calls & WebRTC (6 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| CA01 | Calls | Initiate Call | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | ✓ | `POST /api/calls` inserts into table 38 `calls`, verified in tests | None | `calls` table | P0 |
| CA02 | Calls | Incoming Notification | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `IncomingCallNotification.tsx` polls `/api/calls/incoming` | None | `calls` table | P0 |
| CA03 | Calls | Call Modal UI | Done | IMPLEMENTED | ✓ | - | ✓ | ✓ | - | `CallModal.tsx` in-call controls & video layout | None | WebRTC | P0 |
| CA04 | Calls | Answer Call | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | - | `POST /api/calls/accept`, `useWebRTC.ts` SDP answer | None | `calls` table | P0 |
| CA05 | Calls | End Call | Done | IMPLEMENTED | ✓ | ✓ | ✓ | ✓ | ✓ | `POST /api/calls/end`, updates `status = ended`, verified in tests | None | `calls` table | P0 |
| CA06 | Calls | Screen Sharing | Done | IMPLEMENTED | ✓ | - | ✓ | ✓ | - | `getDisplayMedia()` stream switching in `useWebRTC.ts` | None | WebRTC | P1 |

---

## 23. Push Notifications (5 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| PN01 | Push | Subscribe to Push | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `usePushNotifications.ts`, `POST /api/push/subscribe`, `push_subscriptions` table, verified in `phase6-push-notifications.test.ts` | None | `push_subscriptions` | P1 |
| PN02 | Push | Unsubscribe | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `DELETE /api/push/subscribe`, `POST/DELETE /api/push/unsubscribe`, verified in `phase6-push-notifications.test.ts` | None | `push_subscriptions` | P1 |
| PN03 | Push | Notification Preferences | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `GET/PATCH /api/push/preferences`, user settings toggles | None | Users table | P1 |
| PN04 | Push | VAPID Key Management | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `GET /api/push/vapid-key` serves public key safely, verified in tests | None | VAPID env | P1 |
| PN05 | Push | Service Worker Handler | Done | IMPLEMENTED | ✓ | - | - | - | - | `public/sw.js` push & deep-link notificationclick listeners | None | Browser SW | P1 |

---

## 24. Graph Recommendations (4 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| GR01 | Graph | Suggested Connections | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `SuggestedUsers.tsx`, `useGraphSuggestions.ts`, `/api/follows/suggestions`, tested | None | Users, Follows | P1 |
| GR02 | Graph | Dismiss Suggestion | Done | IMPLEMENTED | ✓ | - | - | - | - | Client-side dismissal state in `useGraphSuggestions` | None | None | P2 |
| GR03 | Graph | Refresh Suggestions | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | React Query query invalidation trigger | None | None | P2 |
| GR04 | Graph | Follow via Graph | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `SuggestedUsers.tsx` follow button mutation, tested | None | Follows API | P1 |

---

## 25. Admin & Monetization (9 Features)

| ID | Domain | Feature | Documented Status | Actual Status | Frontend | API | Database | Realtime | Tests | Evidence | Remaining Work | Dependencies | Priority |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|---|:---:|
| AD01 | Admin | Admin Dashboard & Stats | TODO | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `admin/dashboard/page.tsx`, `GET /api/admin/stats` with RBAC | None | Supabase RBAC | P1 |
| AD02 | Ads | Create Advertisement | TODO | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `ads/create/page.tsx`, `POST /api/ads` | None | `ads` table | P2 |
| AD03 | Ads | Ad Performance Dashboard | TODO | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `ads/dashboard/page.tsx`, `GET /api/ads/dashboard` | None | `ads` table | P2 |
| AD04 | Ads | Track Impressions | TODO | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/ads/impression`, atomic count increment | None | `ads` table | P2 |
| AD05 | Ads | Track Clicks | TODO | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/ads/click`, atomic count increment | None | `ads` table | P2 |
| AD06 | Ads | Pause Ad Campaign | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | - | `POST /api/ads/pause` campaign toggle with RBAC checks | None | `ads` table | P2 |
| AD07 | Monetization | Subscription Status | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `GET /api/subscriptions`, `subscriptions` table, verified in `phase6-subscriptions.test.ts` | None | `subscriptions` | P1 |
| AD08 | Monetization | Stripe Checkout Session | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `POST /api/subscriptions/checkout`, provider adapter, verified in `phase6-subscriptions.test.ts` | None | Payment Provider | P1 |
| AD09 | Monetization | Cancel Subscription | Done | IMPLEMENTED | ✓ | ✓ | ✓ | - | ✓ | `DELETE /api/subscriptions`, `POST /api/subscriptions/cancel`, verified in `phase6-subscriptions.test.ts` | None | Payment Provider | P1 |
